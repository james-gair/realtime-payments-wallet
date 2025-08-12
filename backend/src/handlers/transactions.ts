import { Request, Response } from "express";
import sql from "../database/client";

interface category {
  id: number;
  text: string;
}

// gets list of all categories
export async function getCategories(req: Request, res: Response) {
    try {        
      const categories : category[] = await sql`
        SELECT category_id, category, parent
        FROM categories
      `;
      res.json({categories});

      return;
    } catch (error) {
      console.error("Error adding user:", error);
      res.status(500).send({ error: "Failed to add user" });
      return;
    }    
}

// deletes the category for a given transaction user
export async function deleteCategory(req: Request, res: Response) {
  try { 
      
      const transactionId = Number(req.params.transactionId);

      if (isNaN(transactionId)) {
        res.status(400).send({ error: "Invalid transaction ID" });
        return;
      }

      const category = req.body.category;

      if (!Array.isArray(category)) {
        res.status(400).json({ message: "Category must be an Array" });
        return;
      }

    // enforces minimum 1 category restriction       
    const categories : category[] = await sql`
      UPDATE transactions
      SET category = (
        SELECT array_agg(elem) 
        FROM unnest(category) elem 
        WHERE elem <> ALL(${category})
      )
      WHERE transaction_id = ${transactionId} 
      AND array_length(category, 1) > 1
      RETURNING category;
    `;
    res.json({categories});

    return;
  } catch (error) {
    console.error("Error removing category:", error);
    res.status(500).send({ error: "Failed to remove category" });
    return;
  }    
}

// adds categories for a given transaction user
export async function addCategory(req: Request, res: Response) {
  try { 
    const transactionId = Number(req.params.transactionId);

    if (isNaN(transactionId)) {
      res.status(400).send({ error: "Invalid transaction ID" });
      return;
    }

    const category = req.body.category;
    
    if (!Array.isArray(category)) {
      res.status(400).json({ message: "Category must be a string" });
      return;
    }
    
    const categories : category[] = await sql`
      UPDATE transactions
      SET category = category || ${category}
      WHERE transaction_id = ${transactionId} 
      AND array_length(category, 1) < 4
      RETURNING category;
    `;

    res.json({categories});

    return;
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send({ error: "Failed to add user" });
    return;
  }    
}
