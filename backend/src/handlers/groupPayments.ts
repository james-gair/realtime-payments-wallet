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

// ============================================================================
// GROUP SETTINGS MANAGEMENT
// ============================================================================

export async function updateGroup(req: Request, res: Response) {
  try {
    const { id: groupId } = req.params;
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = await getAccountId(firebase_id);
    const { name, icon } = req.body;

    if (!name || !icon) {
      res.status(400).json({ error: "Missing required fields: name, icon" });
      return;
    }

    // Verify user is admin of the group
    const group = await sql`
      SELECT admin_account_id FROM groups 
      WHERE id = ${groupId}
    `;

    if (group.length === 0) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    if (group[0].admin_account_id.toString() !== accountId) {
      console.log(group[0].admin_account_id.toString(), typeof accountId);
      res
        .status(403)
        .json({ error: "Only group admin can update group settings" });
      return;
    }

    // Update group
    const updatedGroup = await sql`
      UPDATE groups 
      SET name = ${name}, icon = ${icon}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${groupId}
      RETURNING *
    `;

    // Add activity log
    await sql`
      INSERT INTO group_activity (group_id, account_id, activity_type, description, details)
      VALUES (${groupId}, ${accountId}, 'group_updated', 'Updated group settings', 'Group name and icon updated')
    `;

    res.status(200).json({
      success: true,
      group: updatedGroup[0],
      message: "Group updated successfully",
    });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ error: "Failed to update group" });
  }
}

export async function addGroupMember(req: Request, res: Response) {
  try {
    const { id: groupId } = req.params;
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = await getAccountId(firebase_id);
    const { username } = req.body;

    if (!username) {
      res.status(400).json({ error: "Missing required field: username" });
      return;
    }

    // Verify user is admin of the group
    const group = await sql`
      SELECT admin_account_id FROM groups 
      WHERE id = ${groupId}
    `;

    if (group.length === 0) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    if (group[0].admin_account_id.toString() !== accountId) {
      res.status(403).json({ error: "Only group admin can add members" });
      return;
    }

    // Get the account ID for the username
    const newMemberAccountId = await getAccountIdByUsername(username);

    // Check if user is already a member
    const existingMember = await sql`
      SELECT 1 FROM group_members 
      WHERE group_id = ${groupId} AND account_id = ${newMemberAccountId}
    `;

    if (existingMember.length > 0) {
      res.status(400).json({ error: "User is already a member of this group" });
      return;
    }

    // Add member
    await sql`
      INSERT INTO group_members (group_id, account_id) 
      VALUES (${groupId}, ${newMemberAccountId})
    `;

    // Add activity log
    await sql`
      INSERT INTO group_activity (group_id, account_id, activity_type, description, details)
      VALUES (${groupId}, ${newMemberAccountId}, 'member_joined', 'Joined the group', 'Added by admin')
    `;

    res.status(201).json({
      success: true,
      message: "Member added successfully",
    });
  } catch (error) {
    console.error("Error adding group member:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      res.status(404).json({ error: "User not found" });
    } else {
      res.status(500).json({ error: "Failed to add member" });
    }
  }
}

export async function removeGroupMember(req: Request, res: Response) {
  try {
    const { id: groupId, accountId: memberAccountIdParam } = req.params;
    const memberAccountId = parseInt(memberAccountIdParam);
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = parseInt(await getAccountId(firebase_id));

    // Verify user is admin of the group
    const group = await sql`
      SELECT admin_account_id FROM groups 
      WHERE id = ${groupId}
    `;

    if (group.length === 0) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    if (group[0].admin_account_id !== accountId) {
      res.status(403).json({ error: "Only group admin can remove members" });
      return;
    }

    // Prevent admin from removing themselves
    if (memberAccountId === accountId) {
      res.status(400).json({
        error:
          "Admin cannot remove themselves. Transfer admin rights first or delete the group.",
      });
      return;
    }

    // Check if member exists in group
    const member = await sql`
      SELECT 1 FROM group_members 
      WHERE group_id = ${groupId} AND account_id = ${memberAccountId}
    `;

    if (member.length === 0) {
      res.status(404).json({ error: "Member not found in this group" });
      return;
    }

    // Check if member has outstanding balances
    const memberBalance = await sql`
      SELECT balance FROM group_members 
      WHERE group_id = ${groupId} AND account_id = ${memberAccountId}
    `;

    if (Math.abs(parseFloat(memberBalance[0].balance)) > 0.01) {
      // Allow for small floating point errors
      res.status(400).json({
        error:
          "Cannot remove member with outstanding balance. Please settle debts first.",
        balance: parseFloat(memberBalance[0].balance),
      });
      return;
    }

    // Remove member
    await sql`
      DELETE FROM group_members 
      WHERE group_id = ${groupId} AND account_id = ${memberAccountId}
    `;

    // Add activity log
    await sql`
      INSERT INTO group_activity (group_id, account_id, activity_type, description, details)
      VALUES (${groupId}, ${memberAccountId}, 'member_left', 'Was removed from the group', 'Removed by admin')
    `;

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing group member:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
}

export async function leaveGroup(req: Request, res: Response) {
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
      SELECT gm.balance, g.admin_account_id
      FROM group_members gm
      JOIN groups g ON gm.group_id = g.id
      WHERE gm.group_id = ${groupId} AND gm.account_id = ${accountId}
    `;

    if (membership.length === 0) {
      res.status(404).json({ error: "Not a member of this group" });
      return;
    }

    // Prevent admin from leaving if there are other members
    if (membership[0].admin_account_id === accountId) {
      const otherMembers = await sql`
        SELECT COUNT(*) as count FROM group_members 
        WHERE group_id = ${groupId} AND account_id != ${accountId}
      `;

      if (parseInt(otherMembers[0].count) > 0) {
        res.status(400).json({
          error:
            "Admin cannot leave group with other members. Transfer admin rights first or delete the group.",
        });
        return;
      }
    }

    // Check if member has outstanding balances
    if (Math.abs(parseFloat(membership[0].balance)) > 0.01) {
      // Allow for small floating point errors
      res.status(400).json({
        error:
          "Cannot leave group with outstanding balance. Please settle debts first.",
        balance: parseFloat(membership[0].balance),
      });
      return;
    }

    // Remove member
    await sql`
      DELETE FROM group_members 
      WHERE group_id = ${groupId} AND account_id = ${accountId}
    `;

    // Add activity log
    await sql`
      INSERT INTO group_activity (group_id, account_id, activity_type, description, details)
      VALUES (${groupId}, ${accountId}, 'member_left', 'Left the group', 'Left voluntarily')
    `;

    res.status(200).json({
      success: true,
      message: "Left group successfully",
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({ error: "Failed to leave group" });
  }
}

export async function deleteGroup(req: Request, res: Response) {
  try {
    const { id: groupId } = req.params;
    const firebase_id = (req as any).user?.uid;

    if (!firebase_id) {
      res.status(401).json({ error: "Not authenticated. Please log in." });
      return;
    }

    const accountId = await getAccountId(firebase_id);

    // Verify user is admin of the group
    const group = await sql`
      SELECT admin_account_id FROM groups 
      WHERE id = ${groupId}
    `;

    if (group.length === 0) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    if (group[0].admin_account_id !== accountId) {
      res.status(403).json({ error: "Only group admin can delete the group" });
      return;
    }

    // Check if any member has outstanding balances
    const outstandingBalances = await sql`
      SELECT COUNT(*) as count FROM group_members 
      WHERE group_id = ${groupId} AND ABS(balance) > 0.01
    `;

    if (parseInt(outstandingBalances[0].count) > 0) {
      res.status(400).json({
        error:
          "Cannot delete group with outstanding balances. Please settle all debts first.",
      });
      return;
    }

    // Delete group (cascade will handle related records)
    await sql`
      DELETE FROM groups WHERE id = ${groupId}
    `;

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ error: "Failed to delete group" });
  }
}
