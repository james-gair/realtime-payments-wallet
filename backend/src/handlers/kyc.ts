import { Request, Response } from "express";
import { ZodIssue } from "zod";
import { kycInput, kycSchema } from "../schemas/kyc.schema";
import { issue } from "zod/v4/core/util";
import FormData from "form-data";
import axios, { AxiosRequestConfig } from "axios";

// TODO: database change verification status

export async function kycHandler(req: Request, res: Response) {
  console.log("reached backend");
  console.log(req.body);

  // Get and check the uploaded photo
  const files = req.files as {
    passportPhoto?: Express.Multer.File[];
    driverLicensePhoto?: Express.Multer.File[];
  };

  const passportPhoto = files.passportPhoto?.[0];
  const driverLicensePhoto = files.driverLicensePhoto?.[0];

  const file = passportPhoto || driverLicensePhoto;

  //   If no photo uploaded, return error
  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  // Check the text inputs:
  const parseResult = kycSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation failed",
      issues: parseResult.error.issues as ZodIssue[],
    });
    return;
  }

  const validatedData: kycInput = parseResult.data;
  // Send the form data to the mock API that does the verification:
  const form = new FormData();

  form.append("idType", validatedData.idType);
  form.append("fullName", validatedData.fullName);
  form.append("dateOfBirth", validatedData.dateOfBirth.toString());

  if (validatedData.idType === "passport") {
    if (!validatedData.passportNumber) {
      res.status(400).json({
        error:
          "Passport Number is required when the provided id type is passport.",
      });
      return;
    }
    if (!validatedData.countryOfIssue) {
      res.status(400).json({
        error:
          "Country of Issue is required when the provided id type is passport.",
      });
      return;
    }
    if (!validatedData.passportExpiry) {
      res.status(400).json({
        error:
          "The passport's expiry date is required when the provided id type is passport.",
      });
      return;
    }
    form.append("passportNumber", validatedData.passportNumber);
    form.append("ountryOfIssue", validatedData.countryOfIssue);
    form.append("expiryDate", validatedData.passportExpiry.toString());
  } else if (validatedData.idType === "drivers_license") {
    if (!validatedData.licenseNumber) {
      res.status(400).json({
        error:
          "License Number is required when the provided id type is driver's license.",
      });
      return;
    }
    if (!validatedData.stateOfIssue) {
      res.status(400).json({
        error:
          "State of Issue is required when the provided id type is driver's license.",
      });
      return;
    }
    if (!validatedData.licenseExpiry) {
      res.status(400).json({
        error:
          "The license's expiry date is required when the provided id type is driver's license.",
      });
      return;
    }
    form.append("licenseNumber", validatedData.licenseNumber);
    form.append("stateOfIssue", validatedData.stateOfIssue);
    form.append("expiryDate", validatedData.licenseExpiry.toString());
  }

  // Append the file:
  form.append("photo", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  // axios
  try {
    const apiKey = process.env.MOCK_KYC_API_TOKEN;
    const headers = {
      ...form.getHeaders(),
      Authorization: `Bearer ${apiKey}`,
    };

    const config: AxiosRequestConfig<FormData> = {
      headers,
    };

    /**
     * Why this URL?
     * When the backend tries to call localhost:4001,
     * it’s not using your browser.
     * It's running inside its own Docker container.
     * So what does localhost mean to the backend container?
     * It means “me, the backend container”, not your host machine.
     * But the mock API is running in another container, not inside
     * the backend container. So calling localhost:4001 from inside
     * the backend won't work — because there’s nothing on port 4001
     * inside that same container.
     */
    const response = await axios.post(
      "http://mock-idcheck-api:4001/api/kyc/verify",
      form,
      config
    );

    res.status(200).json({
      message: "Verification sent",
      result: response.data,
    });
    return;
  } catch (error) {
    console.error("Verification API error:", error);
    res.status(500).json({ error: "Failed to verify with mock API" });
    return;
  }

  console.log({
    fieldname: file?.fieldname,
    originalname: file?.originalname,
    mimetype: file?.mimetype,
    size: file?.size,
  });
  res.send({ message: "reached" });
}
