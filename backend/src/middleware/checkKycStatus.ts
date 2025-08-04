import { NextFunction, Request, Response } from "express";
import { isUserVerified } from "../utils/kyc";

/**
 * Middleware to ensure the user has completed KYC verification.
 *
 * Use this on routes that require the user's identity to be verified
 * before allowing access to further operations.
 *
 * If the user is not verified, the response will be a 403 with a suggested
 * redirect path to the KYC page.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 * @returns Response with status 403 if not verified, otherwise calls next()
 */
export async function checkKycStatus(
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
    if (!isVerified) {
      res.status(403).json({
        error: "KYC not verified",
        redirectTo: "/kyc",
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
