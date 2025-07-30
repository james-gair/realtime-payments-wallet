import axios from "axios";
import { Request, Response } from "express";
import FormData from "form-data";
import sql from "../database/client";
import { KYCVerifyResultResponse } from "../dtos/KYCVerifyResponse";
import { verifyKyc } from "../services/verifyKyc";
import { constructKycFormData } from "../utils/constructKycFormData";
import { saveVerifiedAccountIdInDb } from "../utils/saveVerifiedAccountIdInDb";
import { updataKycVerificationStatus } from "../utils/updateKycVerificationStatus";

export async function kycHandler(req: Request, res: Response) {
  // get user id
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  // construct the formData sending to the mock API to verify
  let form: FormData;
  try {
    form = constructKycFormData(req);
  } catch (err: any) {
    console.error(err);
    const respondError: { error: string; details?: any } = {
      error: err.message,
    };
    if (err.details) {
      respondError.details = err.details;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  // Call mock API to verify the user
  let verificationResult: KYCVerifyResultResponse;
  try {
    verificationResult = await verifyKyc(form);
    if (verificationResult.result === "rejected") {
      res.status(400).json({
        error: "Verification failed",
        details: verificationResult,
      });
      return;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // i.e. validation error
      if (error.response) {
        console.error("Mock API responded with error:", error.response.data);
        res.status(error.response.status).json({
          error: "Verification failed",
          details: error.response.data,
        });
        return;
      } else {
        console.error("No response from mock API:", error.message);
        res.status(502).json({ error: "Verification service unavailable" });
        return;
      }
    }

    console.error("Unexpected error while calling mock API:", error);
    res
      .status(500)
      .json({ error: "Internal server error during verification" });
    return;
  }

  // Update the database
  try {
    const updated = await updataKycVerificationStatus(firebase_id);
    const saved = await saveVerifiedAccountIdInDb(
      verificationResult.validatedData,
      firebase_id
    );
    if (updated && saved) {
      // ---> NEW LOGIC STARTS HERE <---
      // After local KYC success
      try {
        // 1. Get the user's account details from our DB
        const userResult = await sql`
          SELECT account_id FROM accounts WHERE firebase_id = ${firebase_id}
        `;

        if (userResult.length === 0) {
          throw new Error("Could not find user in database after KYC update.");
        }

        const user = userResult[0];

        const currencyResult =
          await sql`SELECT currency_id FROM currencies WHERE code = 'AUD'`;
        if (currencyResult.length === 0) {
          // This should not happen if the DB is seeded correctly
          throw new Error("AUD currency not found in database.");
        }
        const audCurrencyId = currencyResult[0].currency_id;

        await sql`
          INSERT INTO wallets (account_id, currency_id, balance)
          VALUES (${user.account_id}, ${audCurrencyId}, 0)
        `;
      } catch (walletError: any) {
        // If wallet creation fails, log it but don't fail the entire request.
        // The user is still KYC'd on our end.
        console.error(
          "Critical: Failed to create AUD wallet for a verified user:",
          walletError
        );
      }
      // ---> NEW LOGIC ENDS HERE <---

      res.status(200).json({
        message: "User verified and wallet created successfully",
        result: verificationResult,
      });
      return;
    } else {
      res.status(404).json({
        error: "User not found in database",
      });
      return;
    }
  } catch (dbError) {
    console.error("Failed to update verification status in database:", dbError);
    res.status(500).json({ error: "Database operation failed" });
    return;
  }
}
