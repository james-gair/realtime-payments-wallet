import { NextFunction, Request, Response } from "express";
import multer from "multer";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: "Multer error: " + err.message });
    return;
  } else if (err) {
    res.status(500).json({ error: err.message });
    return;
  }
  next();
}
