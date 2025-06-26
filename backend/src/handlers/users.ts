import { Request, Response } from "express";
import sql from "../database/client";

export async function getUsers(req: Request, res: Response) {
  res.send(
    await sql`
    SELECT email FROM Account
  `
  );
}
