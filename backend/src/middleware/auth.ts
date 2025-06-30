// backend/src/middleware/auth.ts
import admin from '../firebaseAdmin';
import { Request, Response, NextFunction, RequestHandler } from 'express';

export async function authenticateFirebaseToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'auth token missing or invalid' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    await admin.auth().verifyIdToken(idToken);
    // attach user info to request, not needed for setup
    // uncomment if need to access user detail in development arises

    // const decodedToken = await admin.auth().verifyIdToken(idToken);
    // (req as any).user = decodedToken;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'failed auth invalid token' });
  }
}
