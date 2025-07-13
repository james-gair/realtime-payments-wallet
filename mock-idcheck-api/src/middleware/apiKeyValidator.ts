import { Request, Response, NextFunction } from "express";
import { authorizedApiKeys } from "../sampleData";

/**
 * Only authorized server clients can access this API.
 * The token must be in the form: "Bearer <token>"
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns void or a 401/403 response if unauthorized
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!authorizedApiKeys.includes(token)) {
    res.status(403).json({ error: "Invalid token" });
    return;
  }

  next();
}
