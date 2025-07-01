import { Request, Response } from "express";
import sql from "../database/client";

export async function getUser(req: Request, res: Response) {
    const { phone, email, dob } = req.body;    
}