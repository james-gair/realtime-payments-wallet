import { Request } from "express";
import { kycInput, kycSchema } from "../schemas/kyc.schema";
import { ZodIssue } from "zod";
import FormData from "form-data";

export function constructKycFormData(req: Request): FormData {
  const files = req.files as {
    passportPhoto?: Express.Multer.File[];
    driverLicensePhoto?: Express.Multer.File[];
    selfieWithId?: Express.Multer.File[];
  };

  const passportPhoto = files.passportPhoto?.[0];
  const driverLicensePhoto = files.driverLicensePhoto?.[0];
  const file = passportPhoto || driverLicensePhoto;
  const selfieWithIdFile = files.selfieWithId?.[0];

  if (!file || !selfieWithIdFile) {
    throw new Error("Both the ID and SelfieWithId are required");
  }

  // get the text inputs
  const parseResult = kycSchema.safeParse(req.body);
  if (!parseResult.success) {
    const err = new Error("Validation failed");
    (err as any).details = parseResult.error.issues as ZodIssue[];
    throw err;
  }

  // construct a new formData to send to the mock API
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
      throw new Error("Missing passport details");
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
      throw new Error("Missing license details");
    }
    form.append("licenseNumber", validatedData.licenseNumber);
    form.append("stateOfIssue", validatedData.stateOfIssue);
    form.append("expiryDate", validatedData.licenseExpiry.toString());
  }

  form.append("photo", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  form.append("selfieWithId", selfieWithIdFile.buffer, {
    filename: selfieWithIdFile.originalname,
    contentType: file.mimetype,
  });

  return form;
}
