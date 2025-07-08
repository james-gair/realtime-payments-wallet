import { Request, Response } from "express";
import { ZodIssue } from "zod";
import { kycInput, kycSchema } from "../schemas/kyc.schema";
import FormData from "form-data";
import axios from "axios";
import { KYCVerifyResultResponse } from "../dtos/KYCVerifyResponse";
import sql from "../database/client";

export async function kycHandler(req: Request, res: Response) {
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  const files = req.files as {
    passportPhoto?: Express.Multer.File[];
    driverLicensePhoto?: Express.Multer.File[];
  };

  const passportPhoto = files.passportPhoto?.[0];
  const driverLicensePhoto = files.driverLicensePhoto?.[0];
  const file = passportPhoto || driverLicensePhoto;

  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const parseResult = kycSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.issues as ZodIssue[],
    });
    return;
  }

  const validatedData: kycInput = parseResult.data;
  const form = new FormData();

  form.append("idType", validatedData.idType);
  form.append("fullName", validatedData.fullName);
  form.append("dateOfBirth", validatedData.dateOfBirth.toString());

  if (validatedData.idType === "passport") {
    if (
      !validatedData.passportNumber ||
      !validatedData.countryOfIssue ||
      !validatedData.passportExpiry
    ) {
      res.status(400).json({ error: "Missing passport details" });
      return;
    }
    form.append("passportNumber", validatedData.passportNumber);
    form.append("countryOfIssue", validatedData.countryOfIssue);
    form.append("expiryDate", validatedData.passportExpiry.toString());
  } else {
    if (
      !validatedData.licenseNumber ||
      !validatedData.stateOfIssue ||
      !validatedData.licenseExpiry
    ) {
      res.status(400).json({ error: "Missing license details" });
      return;
    }
    form.append("licenseNumber", validatedData.licenseNumber);
    form.append("stateOfIssue", validatedData.stateOfIssue);
    form.append("expiryDate", validatedData.licenseExpiry.toString());
  }

  form.append("photo", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  // Call mock API to verify the user
  let verificationResult: KYCVerifyResultResponse;
  try {
    const response = await axios.post<KYCVerifyResultResponse>(
      "http://mock-idcheck-api:4001/api/kyc/verify",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.MOCK_KYC_API_TOKEN}`,
        },
      }
    );

    if (response.status === 200 && response.data.result === "verified") {
      verificationResult = response.data;
    } else {
      res.status(400).json({
        error: "Verification failed",
        details: response.data,
      });
      return;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
    const result = await sql`
      UPDATE Account
      SET verified = true
      WHERE firebase_id = ${firebase_id}
    `;

    if (result.count === 0) {
      res.status(404).json({ error: "User not found in database" });
      return;
    }

    res.status(200).json({
      message: "User verified successfully",
      result: verificationResult,
    });
    return;
  } catch (dbError) {
    console.error("Failed to update verification status:", dbError);
    res.status(500).json({ error: "Database update failed" });
    return;
  }
}
