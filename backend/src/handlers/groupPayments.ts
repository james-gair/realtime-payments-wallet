import { Request, Response } from "express";
import sql from "../database/client";
import { getAccountId, getAccountIdByUsername } from "../utils/getAccountId";

// ============================================================================
// GROUP MANAGEMENT
// ============================================================================

export async function getGroups(req: Request, res: Response) {
  try {
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = await getAccountId(firebase_id);

    const groups = await sql`
      SELECT 
        g.id,
        g.name,
        g.icon,
        g.admin_account_id,
        g.created_at,
        gm.balance
      FROM group_members gm
      JOIN groups g ON gm.group_id = g.id
      WHERE gm.account_id = ${accountId}
      ORDER BY g.created_at DESC
    `;

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
}

export async function getGroupById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const group = await sql`
      SELECT * FROM groups WHERE id = ${id}
    `;

    if (group.length === 0) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ error: "Failed to fetch group" });
  }
}

export async function createGroup(req: Request, res: Response) {
  try {
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = await getAccountId(firebase_id);
    const { name, icon, newMembers } = req.body;

    if (!name || !icon || !newMembers) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Create group
    const group = await sql`
      INSERT INTO groups (name, icon, admin_account_id) VALUES (${name}, ${icon}, ${accountId}) RETURNING *
    `;

    const groupId = group[0].id;

    // Add admin as member
    await sql`
      INSERT INTO group_members (group_id, account_id) VALUES (${groupId}, ${accountId})
    `;

    // Add other members
    for (const member of newMembers) {
      const memberAccountId = await getAccountIdByUsername(member);
      await sql`
        INSERT INTO group_members (group_id, account_id) VALUES (${groupId}, ${memberAccountId})
      `;
    }

    // Add group creation activity
    await sql`
      INSERT INTO group_activity (group_id, activity_type, description, details)
      VALUES (${groupId}, 'group_created', 'Group was created', ${`${name} group started`})
    `;

    res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
}

// ============================================================================
// MEMBER BALANCES
// ============================================================================

export async function getGroupBalances(req: Request, res: Response) {
  try {
    const { id: groupId } = req.params;
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = await getAccountId(firebase_id);

    // Verify user is member of the group
    const membership = await sql`
      SELECT 1 FROM group_members 
      WHERE group_id = ${groupId} AND account_id = ${accountId}
    `;

    if (membership.length === 0) {
      res.status(403).json({ error: "Not a member of this group" });
      return;
    }

    const balances = await sql`
      SELECT * FROM get_group_member_balances(${groupId})
    `;

    // Add a flag to indicate which member is the current user
    const balancesWithCurrentUser = balances.map((balance: any) => ({
      ...balance,
      balance: parseFloat(balance.balance),
      is_current_user: balance.account_id.toString() === accountId,
    }));

    // Sort so current user appears first, then by balance descending
    const sortedBalances = balancesWithCurrentUser.sort((a: any, b: any) => {
      // Current user always first
      if (a.is_current_user && !b.is_current_user) return -1;
      if (!a.is_current_user && b.is_current_user) return 1;

      // Then sort by balance (descending)
      return b.balance - a.balance;
    });

    res.status(200).json(sortedBalances);
  } catch (error) {
    console.error("Error fetching group balances:", error);
    res.status(500).json({ error: "Failed to fetch group balances" });
  }
}

// ============================================================================
// EXPENSES
// ============================================================================

export async function getGroupExpenses(req: Request, res: Response) {
  try {
    const { id: groupId } = req.params;
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = await getAccountId(firebase_id);

    // Verify user is member of the group
    const membership = await sql`
      SELECT 1 FROM group_members 
      WHERE group_id = ${groupId} AND account_id = ${accountId}
    `;

    if (membership.length === 0) {
      res.status(403).json({ error: "Not a member of this group" });
      return;
    }

    const expenses = await sql`
      SELECT 
        ge.id,
        ge.amount,
        ge.description,
        ge.created_at,
        a.username as payer_username,
        a.first_name as payer_first_name,
        a.last_name as payer_last_name
      FROM group_expenses ge
      JOIN accounts a ON ge.payer_account_id = a.account_id
      WHERE ge.group_id = ${groupId}
      ORDER BY ge.created_at DESC
    `;

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching group expenses:", error);
    res.status(500).json({ error: "Failed to fetch group expenses" });
  }
}

export async function addGroupExpense(req: Request, res: Response) {
  try {
    const { id: groupId } = req.params;
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = await getAccountId(firebase_id);
    const { description, amount, splits } = req.body;

    if (!description || !amount || !splits) {
      res.status(400).json({
        error: "Missing required fields: description, amount, splits",
      });
      return;
    }

    // Verify user is member of the group
    const membership = await sql`
      SELECT 1 FROM group_members 
      WHERE group_id = ${groupId} AND account_id = ${accountId}
    `;

    if (membership.length === 0) {
      res.status(403).json({ error: "Not a member of this group" });
      return;
    }

    // Add expense using the database function (splits will be automatically converted to JSONB)
    const expenseId = await sql`
      SELECT add_group_expense(${groupId}, ${accountId}, ${amount}, ${description}, ${splits}) as expense_id
    `;

    res.status(201).json({
      success: true,
      expense_id: expenseId[0].expense_id,
      message: "Expense added successfully",
    });
  } catch (error) {
    console.error("Error adding group expense:", error);
    if (error instanceof Error && error.message.includes("Split amounts")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to add expense" });
    }
  }
}

// ============================================================================
// ACTIVITY
// ============================================================================

export async function getGroupActivity(req: Request, res: Response) {
  try {
    const { id: groupId } = req.params;
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = await getAccountId(firebase_id);

    // Verify user is member of the group
    const membership = await sql`
      SELECT 1 FROM group_members 
      WHERE group_id = ${groupId} AND account_id = ${accountId}
    `;

    if (membership.length === 0) {
      res.status(403).json({ error: "Not a member of this group" });
      return;
    }

    const activity = await sql`
      SELECT 
        ga.id,
        ga.activity_type,
        ga.description,
        ga.details,
        ga.amount,
        ga.created_at,
        a.username,
        a.first_name,
        a.last_name
      FROM group_activity ga
      LEFT JOIN accounts a ON ga.account_id = a.account_id
      WHERE ga.group_id = ${groupId}
      ORDER BY ga.created_at DESC
      LIMIT 50
    `;

    res.status(200).json(activity);
  } catch (error) {
    console.error("Error fetching group activity:", error);
    res.status(500).json({ error: "Failed to fetch group activity" });
  }
}

// ============================================================================
// SETTLEMENTS
// ============================================================================

export async function getOptimalSettlements(req: Request, res: Response) {
  try {
    const { id: groupId } = req.params;
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = await getAccountId(firebase_id);

    // Verify user is member of the group
    const membership = await sql`
      SELECT 1 FROM group_members 
      WHERE group_id = ${groupId} AND account_id = ${accountId}
    `;

    if (membership.length === 0) {
      res.status(403).json({ error: "Not a member of this group" });
      return;
    }

    const settlements = await sql`
      SELECT * FROM calculate_optimal_settlements(${groupId})
    `;

    res.status(200).json(settlements);
  } catch (error) {
    console.error("Error calculating settlements:", error);
    res.status(500).json({ error: "Failed to calculate settlements" });
  }
}

export async function processSettlement(req: Request, res: Response) {
  try {
    const { id: groupId } = req.params;
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = await getAccountId(firebase_id);
    const { recipient_account_id, amount, description } = req.body;

    if (!recipient_account_id || !amount) {
      res.status(400).json({
        error: "Missing required fields: recipient_account_id, amount",
      });
      return;
    }

    // Verify user is member of the group
    const membership = await sql`
      SELECT 1 FROM group_members 
      WHERE group_id = ${groupId} AND account_id = ${accountId}
    `;

    if (membership.length === 0) {
      res.status(403).json({ error: "Not a member of this group" });
      return;
    }

    // Process settlement using the database function
    const settlementId = await sql`
      SELECT settle_group_debt(${groupId}, ${accountId}, ${recipient_account_id}, ${amount}, ${
      description || null
    }) as settlement_id
    `;

    res.status(201).json({
      success: true,
      settlement_id: settlementId[0].settlement_id,
      message: "Settlement processed successfully",
    });
  } catch (error) {
    console.error("Error processing settlement:", error);
    res.status(500).json({ error: "Failed to process settlement" });
  }
}
