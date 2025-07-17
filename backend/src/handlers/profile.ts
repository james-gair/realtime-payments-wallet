import { Request, Response } from "express";
import sql from "../database/client";

export async function getUserProfile(req: Request, res: Response) {
  const firebaseId = (req as any).user.uid;
  console.log("firebaseId from token:", firebaseId);


  try {
    const result = await sql`
      SELECT account_id, email, phone, address
      FROM account
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

export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  const firebaseId = (req as any).user.uid;
  const { email, phone, address } = req.body;

  // Collect fields to update
  const fields: string[] = [];
  const values: (string | undefined)[] = [];

  if (email) {
    fields.push("email");
    values.push(email);
  }
  if (phone) {
    fields.push("phone");
    values.push(phone);
  }
  if (address) {
    fields.push("address");
    values.push(address);
  }

  if (fields.length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  
  const setClause = fields
    .map((field, index) => `${field} = $${index + 1}`)
    .join(", ");

  
  const params = [...values, firebaseId];

  const query = `
    UPDATE account
    SET ${setClause}
    WHERE firebase_id = $${params.length}
    RETURNING account_id, email, phone, address
  `;

  try {
    
    const result = await sql.unsafe(query, params);

    if (result.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
}