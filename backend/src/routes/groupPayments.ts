import { Router } from "express";
import {
  addGroupExpense,
  createGroup,
  getGroupActivity,
  getGroupBalances,
  getGroupById,
  getGroupExpenses,
  getGroups,
  getOptimalSettlements,
  processSettlement,
} from "../handlers/groupPayments";
import { authenticateFirebaseToken } from "../middleware/auth";

const router = Router();

// ============================================================================
// GROUP MANAGEMENT ROUTES
// ============================================================================
router.get("/groups", authenticateFirebaseToken as any, getGroups);
router.get("/groups/:id", authenticateFirebaseToken as any, getGroupById);
router.post("/groups", authenticateFirebaseToken as any, createGroup);

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

export default router;
