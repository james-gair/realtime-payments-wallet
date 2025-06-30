import { Request, Response } from "express";
import sql from "../database/client";
import { authenticateFirebaseToken } from "../middleware/auth"

export async function registerUser(req: Request, res: Response) {
  const { phone, email, dob } = req.body;
  
  try {
    const result = await sql`
      INSERT INTO Account (email, phone, dob, verified)
      VALUES (${email}, ${phone}, ${dob}, false)
      RETURNING *
    `;

    res.status(201).send(result[0]);
    return;
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send({ error: "Failed to add user" });
    return;
  }
}

export async function loginUser(req: Request, res: Response) {

  console.log(req);
  res.json({ message: "login" });
}

export async function logoutUser(req: Request, res: Response) {
  console.log(req);
  console.log("logged out");
  res.json({ message: "logout" });
}
