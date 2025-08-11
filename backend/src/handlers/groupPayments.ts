import { Request, Response } from "express";
import sql from "../database/client";
import { getAccountId } from "../utils/getAccountId";

export async function getGroups(req: Request, res: Response) {
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  const accountId = await getAccountId(firebase_id);

  const groups = await sql`
    SELECT * FROM group_members WHERE account_id = ${accountId}
  `;

  res.status(200).json(groups);
}

export async function createGroup(req: Request, res: Response) {
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  const accountId = await getAccountId(firebase_id);

  const { name, icon } = req.body;

  const group = await sql`
    INSERT INTO groups (name, icon, admin_account_id) VALUES (${name}, ${icon}, ${accountId})
  `;

  res.status(201).json(group);
}
