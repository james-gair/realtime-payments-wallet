import { Request, Response } from "express";
import sql from "../database/client";

// These are example handlers used to test the backend–database connection
// and demonstrate how to query and write data to the database.
// Authentication is handled by the Firebase API.
// Delete this file when actual development begins.

export async function getUsers(req: Request, res: Response) {
  res.send(
    await sql`
    SELECT email FROM Account
  `
  );
}

export async function addUsers(req: Request, res: Response) {
  const { email, phone, pword } = req.body;

  try {
    const result = await sql`
      INSERT INTO Account (email, phone, verified, pword)
      VALUES (${email}, ${phone}, false, ${pword})
      RETURNING *
    `;

    res.status(201).send(result[0]); // return the newly created user
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send({ error: "Failed to add user" });
  }
}

export async function deleteUsers(req: Request, res: Response) {
  const { email } = req.body;

  try {
    const result = await sql`
      DELETE FROM Account
      WHERE email = ${email}
      RETURNING *
    `;

    if (result.length === 0) {
      res.status(404).send({ message: "User not found" });
    } else {
      res.status(200).send({ message: "User deleted", user: result[0] });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send({ error: "Failed to delete user" });
  }
}
