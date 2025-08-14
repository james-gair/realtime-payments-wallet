import { Router } from "express";
import {
  addGroupExpense,
  addGroupMember,
  createGroup,
  deleteGroup,
  getGroupActivity,
  getGroupBalances,
  getGroupById,
  getGroupExpenses,
  getGroups,
  getOptimalSettlements,
  leaveGroup,
  processSettlement,
  removeGroupMember,
  updateGroup,
} from "../handlers/groupPayments";
import { authenticateFirebaseToken } from "../middleware/auth";

const router = Router();

// ============================================================================
// GROUP MANAGEMENT ROUTES
// ============================================================================
router.get("/groups", authenticateFirebaseToken as any, getGroups);
router.get("/groups/:id", authenticateFirebaseToken as any, getGroupById);
router.post("/groups", authenticateFirebaseToken as any, createGroup);
router.put("/groups/:id", authenticateFirebaseToken as any, updateGroup);
router.delete("/groups/:id", authenticateFirebaseToken as any, deleteGroup);

// ============================================================================
// GROUP DATA ROUTES
// ============================================================================
router.get(
  "/groups/:id/balances",
  authenticateFirebaseToken as any,
  getGroupBalances
);
router.get(
  "/groups/:id/expenses",
  authenticateFirebaseToken as any,
  getGroupExpenses
);
router.post(
  "/groups/:id/expenses",
  authenticateFirebaseToken as any,
  addGroupExpense
);
router.get(
  "/groups/:id/activity",
  authenticateFirebaseToken as any,
  getGroupActivity
);

// ============================================================================
// SETTLEMENT ROUTES
// ============================================================================
router.get(
  "/groups/:id/settlements",
  authenticateFirebaseToken as any,
  getOptimalSettlements
);
router.post(
  "/groups/:id/settlements",
  authenticateFirebaseToken as any,
  processSettlement
);

// ============================================================================
// MEMBER MANAGEMENT ROUTES
// ============================================================================
router.post(
  "/groups/:id/members",
  authenticateFirebaseToken as any,
  addGroupMember
);
router.delete(
  "/groups/:id/members/:accountId",
  authenticateFirebaseToken as any,
  removeGroupMember
);
router.post("/groups/:id/leave", authenticateFirebaseToken as any, leaveGroup);

export default router;
