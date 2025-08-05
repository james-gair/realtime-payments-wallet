import { Request, Response } from "express";
import sql from "../database/client";

interface category {
  id: number;
  text: string;
}

export async function getUserCategories(req: Request, res: Response) {
  const auth_id = (req as any).user.uid;

    try {        
      const categories : category[] = await sql`
        SELECT category
        FROM categories
      `;

			// console.log(categories)
      res.json({categories});

      return;
    } catch (error) {
      console.error("Error adding user:", error);
      res.status(500).send({ error: "Failed to add user" });
      return;
    }
    
}

export async function deleteCategory(req: Request, res: Response) {
  const transactionId = req.params.transactionId;
  const category = req.body.category;
  console.log(transactionId);  
  console.log(req.body.category);  

  try {        
    const categories : category[] = await sql`
      UPDATE transactions
      SET category = array_remove(category, ${category})
      WHERE transaction_id = ${transactionId} 
      AND array_length(category, 1) > 1
      RETURNING category;
    `;

		console.log(categories)
    res.json({categories});

    return;
  } catch (error) {
    console.error("Error removing category:", error);
    res.status(500).send({ error: "Failed to remove category" });
    return;
  }

  res.json({});
    
}

export async function addCategory(req: Request, res: Response) {
  const transactionId = req.params.transactionId;
  const category = req.body.category;
  console.log(transactionId);  
  console.log(req.body.category);  

  try {        
    const categories : category[] = await sql`
      UPDATE transactions
      SET category = array_append(category, ${category})
      WHERE transaction_id = ${transactionId} 
      AND array_length(category, 1) < 4
      RETURNING category;
    `;

		console.log(categories)
    res.json({categories});

    return;
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send({ error: "Failed to add user" });
    return;
  }

  res.json({});
    
}
