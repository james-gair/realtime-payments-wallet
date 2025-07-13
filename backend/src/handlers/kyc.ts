import { Request, Response } from "express";
import FormData from "form-data";
import axios from "axios";
import { KYCVerifyResultResponse } from "../dtos/KYCVerifyResponse";
import { verifyKyc } from "../services/verifyKyc";
import { constructKycFormData } from "../utils/constructKycFormData";
import { updataKycVerificationStatus } from "../utils/updateKycVerificationStatus";
import { saveVerifiedAccountIdInDb } from "../utils/saveVerifiedAccountIdInDb";

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
      res.status(200).json({
        message: "User verified successfully",
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
