import type {
  ExpenseSplit,
  Group,
  GroupActivity,
  GroupExpense,
  GroupMember,
  GroupSettlement,
} from "../types";
import { authFetch } from "./firebaseFetch";

const API_BASE_URL = "http://localhost:4000/api";

// ============================================================================
// GROUP MANAGEMENT
// ============================================================================

export async function fetchUserGroups(): Promise<Group[]> {
  const response = await authFetch(`${API_BASE_URL}/groups`);
  if (!response.ok) {
    throw new Error("Failed to fetch groups");
  }
  return response.json();
}

export async function fetchGroupById(groupId: string): Promise<Group> {
  const response = await authFetch(`${API_BASE_URL}/groups/${groupId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch group");
  }
  const groups = await response.json();
  return groups[0]; // Backend returns array, we want first item
}

export async function createGroup(
  name: string,
  icon: string,
  newMembers: string[]
): Promise<Group> {
  const response = await authFetch(`${API_BASE_URL}/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      icon,
      newMembers,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create group");
  }

  const groups = await response.json();
  return groups[0]; // Backend returns array, we want first item
}

// ============================================================================
// GROUP DATA
// ============================================================================

export async function fetchGroupBalances(
  groupId: string
): Promise<GroupMember[]> {
  const response = await authFetch(
    `${API_BASE_URL}/groups/${groupId}/balances`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch group balances");
  }
  return response.json();
}

export async function fetchGroupExpenses(
  groupId: string
): Promise<GroupExpense[]> {
  const response = await authFetch(
    `${API_BASE_URL}/groups/${groupId}/expenses`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch group expenses");
  }
  return response.json();
}

export async function addGroupExpense(
  groupId: string,
  description: string,
  amount: number,
  splits: ExpenseSplit
): Promise<{ success: boolean; expense_id: string; message: string }> {
  const response = await authFetch(
    `${API_BASE_URL}/groups/${groupId}/expenses`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description,
        amount,
        splits,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add expense");
  }

  return response.json();
}

export async function fetchGroupActivity(
  groupId: string
): Promise<GroupActivity[]> {
  const response = await authFetch(
    `${API_BASE_URL}/groups/${groupId}/activity`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch group activity");
  }
  return response.json();
}

// ============================================================================
// SETTLEMENTS
// ============================================================================

export async function fetchOptimalSettlements(
  groupId: string
): Promise<GroupSettlement[]> {
  const response = await authFetch(
    `${API_BASE_URL}/groups/${groupId}/settlements`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch settlements");
  }
  return response.json();
}

export async function processSettlement(
  groupId: string,
  recipientAccountId: number,
  amount: number,
  description?: string
): Promise<{ success: boolean; settlement_id: string; message: string }> {
  const response = await authFetch(
    `${API_BASE_URL}/groups/${groupId}/settlements`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient_account_id: recipientAccountId,
        amount,
        description,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to process settlement");
  }

  return response.json();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function parseAmount(amount: number | string): number {
  return typeof amount === "string" ? parseFloat(amount) : amount;
}

export function formatCurrency(amount: number | string): string {
  return `$${parseAmount(amount).toFixed(2)}`;
}

export function formatActivityIcon(activityType: string): string {
  const icons: { [key: string]: string } = {
    expense_added: "💰",
    payment_made: "💸",
    payment_settled: "✅",
    member_joined: "👋",
    member_left: "👋",
    group_created: "🎉",
  };
  return icons[activityType] || "📝";
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function getCurrentUserDisplayName(member: GroupMember): string {
  // You might want to implement logic to detect current user
  // For now, return formatted name
  return member.first_name && member.last_name
    ? `${member.first_name} ${member.last_name}`
    : member.username;
}
