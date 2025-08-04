import { NextFunction, Request, Response } from "express";
import { isUserVerified } from "../utils/kyc";
/**
 * !!: For KYC backend route:
 *
 * Middleware to prevent users from attempting KYC verification
 * if they have already completed it.
 *
 * Use this to avoid duplicate submissions.
 *
 * - Returns 401 if the user is not authenticated.
 * - Returns 400 if the user has already been KYC verified.
 * - Calls next() only if the user is authenticated and NOT verified.
 */
export async function preventDupKyc(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const firebase_id = (req as any).user?.uid;
  if (!firebase_id) {
    res.status(401).json({
      error: "User not authenticated.",
    });
    return;
  }
  try {
    const isVerified = await isUserVerified(firebase_id);
    if (isVerified) {
      res.status(400).json({
        error: "KYC already verified",
        redirectTo: "/dashboard",
      });
      return;
    }
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({
      error: "DB error: cannot check if this user is kyc verified.",
    });
    return;
  }

  next();
}
