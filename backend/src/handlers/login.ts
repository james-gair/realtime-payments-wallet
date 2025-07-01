import { Request, Response } from "express";
import sql from "../database/client";
import { authenticateFirebaseToken } from "../middleware/auth"

export async function registerUser(req: Request, res: Response) {
  const { phone, email, dob } = req.body;
  const auth_id = (req as any).user.uid;
  
  try {
    const result = await sql`
      INSERT INTO Account (firebase_id, email, phone, dob)
      VALUES (${auth_id}, ${email}, ${phone}, ${dob})
      RETURNING *
    `;

    // just for debugging
    res.status(201).send(result[0]);
    return;
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send({ error: "Failed to add user" });
    return;
  }
}

export async function loginUser(req: Request, res: Response) {

  console.log(req.body);
  console.log((req as any).user.uid);
  res.json({ message: "login" });
}

// export async function logoutUser(req: Request, res: Response) {
//   console.log(req);
//   console.log("logged out");
//   res.json({ message: "logout" });
// }
