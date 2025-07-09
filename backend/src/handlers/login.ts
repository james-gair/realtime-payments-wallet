import { Request, Response } from "express";
import sql from "../database/client";
import { authenticateFirebaseToken } from "../middleware/auth"

export async function registerUser(req: Request, res: Response) {
  const { phone, email, dob, username } = req.body;
  const auth_id = (req as any).user.uid;
  
  try {
    const result = await sql`
      INSERT INTO Account (firebase_id, username, email, phone, dob)
      VALUES (${auth_id}, ${username}, ${email}, ${phone}, ${dob})
      RETURNING *
    `;

    // just for debugging
    res.status(201).send(result[0]);
  } catch (error: any) {
    console.error("Error adding user:", error);
    res.status(500).send({ error: "Failed to add user" });
  }
}

export async function loginUser(req: Request, res: Response) {
  console.log(req.body);
  console.log((req as any).user.uid);
  res.json({ message: "login" });
}

// Username availability check endpoint
export async function checkUsername(req: Request, res: Response) {
  const username = (req.query.username as string);

  // Validate username
  if (!username || username.trim().length < 3) {
    res.status(400).send({ error: "Username must be at least 3 characters long" });
    return;
  }

  // Check if username already exists
  try {
    const existingUser = await sql`
      SELECT username FROM Account WHERE username = ${username}
    `;
    if (existingUser.length > 0) {
      res.status(409).send({ error: "Username already taken" });
      return;
    }
    res.status(200).send({ available: true });
  } catch (error) {
    console.error("Error checking username:", error);
    res.status(500).send({ error: "Failed to check username availability" });
  }
}

// export async function logoutUser(req: Request, res: Response) {
//   console.log(req);
//   console.log("logged out");
//   res.json({ message: "logout" });
// }
