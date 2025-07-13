import { Request, Response } from "express";
import sql from "../database/client";

export async function getUserProfile(req: Request, res: Response) {
  const firebaseId = (req as any).user.uid;
  console.log("firebaseId from token:", firebaseId);

  try {
    const result = await sql`
      SELECT account_id, email, phone, address
      FROM Account
      WHERE firebase_id = ${firebaseId}
    `;
    console.log("Database query result:", result);

    if (result.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
}
