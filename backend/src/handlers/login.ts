import { Request, Response } from "express";
import sql from "../database/client";
import { zaiService } from "../services/zaiService";

export async function registerUser(req: Request, res: Response) {
  const { first_name, last_name, phone, email, dob, username } = req.body;
  const auth_id = (req as any).user.uid;

  try {
    // First, create the user in our local database
    const result = await sql`
      INSERT INTO Account (firebase_id, username, email, phone, dob, first_name, last_name)
      VALUES (${auth_id}, ${username}, ${email}, ${phone}, ${dob}, ${first_name}, ${last_name})
      RETURNING *
    `;

    const localUser = result[0];

    // Then, create the user in Zai
    try {
      const zaiUser = await zaiService.createUser({
        id: auth_id, // Use Firebase ID as the external ID
        first_name: first_name,
        last_name: last_name,
        email: email,
        mobile: phone,
        dob: dob,
        country: "AU", // Add required country field (Australia)
      });

      // Update our local database with the Zai user ID
      await sql`
        UPDATE Account 
        SET zai_user_id = ${zaiUser.id}
        WHERE firebase_id = ${auth_id}
      `;

      console.log(
        `Successfully created Zai user: ${zaiUser.id} for local user: ${auth_id}`
      );
    } catch (zaiError) {
      console.error(
        "Failed to create Zai user, but local user was created:",
        zaiError
      );
      // Don't fail the registration - user can still use the platform with limited functionality
      // You might want to set a flag to retry Zai user creation later
    }

    // Return the local user data
    res.status(201).send({
      ...localUser,
      message: "User registered successfully",
    });
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
  const username = req.query.username as string;

  // Validate username
  if (!username || username.trim().length < 3) {
    res
      .status(400)
      .send({ error: "Username must be at least 3 characters long" });
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
