import { Request } from "express";
import { KycInput, kycSchema } from "../schemas/kyc.schema";
import { ZodIssue } from "zod";
import FormData from "form-data";

export function constructKycFormData(req: Request): FormData {
  const files = req.files as {
    idPhoto?: Express.Multer.File[];
    selfieWithId?: Express.Multer.File[];
  };
  const file = files.idPhoto?.[0];
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
  const validatedData: KycInput = parseResult.data;
  const form = new FormData();

  form.append("idType", validatedData.idType);
  form.append("fullName", validatedData.fullName);
  form.append("dateOfBirth", validatedData.dateOfBirth.toString());
  form.append("idNumber", validatedData.idNumber);
  form.append("idExpDate", validatedData.idExpDate.toString());
  form.append("placeOfIssue", validatedData.placeOfIssue);
  form.append("idPhoto", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  form.append("selfieWithId", selfieWithIdFile.buffer, {
    filename: selfieWithIdFile.originalname,
    contentType: file.mimetype,
  });

  return form;
}
