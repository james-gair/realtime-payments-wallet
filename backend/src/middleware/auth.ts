// backend/src/middleware/auth.ts
import admin from "../firebaseAdmin";
import { Request, Response, NextFunction, RequestHandler } from "express";

export async function authenticateFirebaseToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  //////// 🔓🔓🔓🔓 Dev-only bypass token //////
  // This is for development convenience only.
  // It allows you to skip Firebase authenticationm
  // (easier for marking API docs)
  // and use a mock user for testing purposes.
  // The corresponding user is created in the seed.sql file.
  // You can use this token in the Authorization header:
  // `Bearer dev-bypass`
  // It will attach a mock user to the request object.
  // This is not a secure way to handle authentication,
  // and should never be used in production.
  // It is only for development convenience.

  // console.log("NODE_ENV", process.env.NODE_ENV);
  if (
    process.env.NODE_ENV === "development" &&
    authHeader === "Bearer dev-bypass"
  ) {
    (req as any).user = { uid: "mock-user", email: "marker@example.com" };
    return next();
  }
  ////////////////////////////////////////////

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "auth token missing or invalid" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    await admin.auth().verifyIdToken(idToken);
    // attach user info to request, not needed for setup
    // uncomment if need to access user detail in development arises

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "failed auth invalid token" });
  }
}
