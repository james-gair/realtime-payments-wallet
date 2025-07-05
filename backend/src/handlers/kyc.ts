import { Request, Response } from "express";

export function kycHandler(req: Request, res: Response) {
  console.log(req.body);
}
