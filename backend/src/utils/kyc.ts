import { Request } from "express";
import { KycInput, kycSchema } from "../schemas/kyc.schema";
import { ZodIssue } from "zod";
import FormData from "form-data";
import sql from "../database/client";

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

export async function isUserVerified(firebaseId: string): Promise<boolean> {
  const result = await sql`
    SELECT is_verified FROM accounts WHERE firebase_id = ${firebaseId}
  `;

  if (result.length === 0) {
    return false;
  }

  return result[0].is_verified; // This will be a boolean: true or false
}

export async function saveVerifiedAccountIdInDb(
  kyc: KycInput,
  firebase_id: string
) {
  // find the corresponding account_id
  // using account_id instead of firebase_id -> safer option
  const account = await sql`
    SELECT account_id FROM accounts WHERE firebase_id = ${firebase_id}
  `;

  if (account.length === 0) {
    throw new Error("Account not found for this Firebase ID");
  }

  const account_id = account[0].account_id;

  return await sql`
    INSERT INTO account_identities (
      account_id,
      full_name,
      date_of_birth,
      id_type,
      id_number,
      id_expiry_date,
      place_of_issue,
      verified_at
    ) VALUES (
      ${account_id},
      ${kyc.fullName},
      ${kyc.dateOfBirth},
      ${kyc.idType},
      ${kyc.idNumber},
      ${kyc.idExpDate},
      ${kyc.placeOfIssue},
      ${new Date()}
    )
    RETURNING *
  `;
}

export async function updataKycVerificationStatus(firebase_id: string) {
  const result = await sql`
      UPDATE accounts
      SET is_verified = true
      WHERE firebase_id = ${firebase_id}
    `;

  return result.count > 0;
}

export async function createWalletAfterSuccessfulKyc(firebase_id: string) {
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
}
