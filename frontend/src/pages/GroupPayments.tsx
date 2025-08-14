import {
  EllipsisHorizontalIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BalanceDetailsModal from "../components/BalanceDetailsModal";
import Loading from "../components/Loading";
import { SavedContacts } from "../components/SavedContacts";
import {
  addGroupExpense,
  fetchGroupActivity,
  fetchGroupBalances,
  fetchGroupById,
  fetchGroupExpenses,
  fetchOptimalSettlements,
  formatActivityIcon,
  formatCurrency,
  formatRelativeTime,
  getCurrentUserDisplayName,
  parseAmount,
  processSettlement,
} from "../services/groupPayments";
import type {
  Contact,
  ExpenseSplit,
  Group,
  GroupActivity,
  GroupExpense,
  GroupMember,
  GroupSettlement,
} from "../types";

export default function GroupPayments() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "balances" | "expenses" | "activity"
  >("balances");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: string }>(
    {}
  );

  // Core data state
  const [group, setGroup] = useState<Group | null>(null);
  const [balances, setBalances] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [activity, setActivity] = useState<GroupActivity[]>([]);
  const [settlements, setSettlements] = useState<GroupSettlement[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isProcessingSettlement, setIsProcessingSettlement] = useState(false);

  // Balance modal functionality
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<GroupMember | null>(
    null
  );

  // SavedContacts functionality
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactSuccess, setShowContactSuccess] = useState(false);

  // Group members for the form
  const groupMembers = balances.map((member) => member.account_id.toString());

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch all group data in parallel
        const [
          groupData,
          balancesData,
          expensesData,
          activityData,
          settlementsData,
        ] = await Promise.all([
          fetchGroupById(id),
          fetchGroupBalances(id),
          fetchGroupExpenses(id),
          fetchGroupActivity(id),
          fetchOptimalSettlements(id),
        ]);

        console.log("balancesData", balancesData);

        setGroup(groupData);
        setBalances(balancesData);
        setExpenses(expensesData);
        setActivity(activityData);
        setSettlements(settlementsData);
        console.log("settlements", settlementsData);
      } catch (err) {
        console.error("Error fetching group data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load group data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [id]);

  const openModal = () => {
    setIsModalOpen(true);
    // Select all members by default
    setSelectedMembers([...groupMembers]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openBalanceModal = (member: GroupMember) => {
    setSelectedBalance(member);
    setIsBalanceModalOpen(true);
  };

  const closeBalanceModal = () => {
    setIsBalanceModalOpen(false);
    setSelectedBalance(null);
  };

  const toggleMemberSelection = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== memberId));
      // Remove custom amount when deselecting
      const newCustomAmounts = { ...customAmounts };
      delete newCustomAmounts[memberId];
      setCustomAmounts(newCustomAmounts);
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const updateCustomAmount = (memberId: string, amount: string) => {
    if (amount === "0") {
      const newCustomAmounts = { ...customAmounts };
      delete newCustomAmounts[memberId];
      setCustomAmounts(newCustomAmounts);
    } else {
      setCustomAmounts((prev) => ({
        ...prev,
        [memberId]: amount,
      }));
    }
  };

  const calculateSplit = () => {
    if (!expenseAmount || selectedMembers.length === 0) return {};

    const totalAmount = parseFloat(expenseAmount);
    let customTotal = 0;
    const membersWithCustomAmounts: string[] = [];

    // Calculate total of custom amounts
    selectedMembers.forEach((member) => {
      const customAmount = customAmounts[member];
      if (customAmount && parseFloat(customAmount) > 0) {
        customTotal += parseFloat(customAmount);
        membersWithCustomAmounts.push(member);
      }
    });

    // Get members without custom amounts
    const membersWithoutCustom = selectedMembers.filter(
      (member) => !membersWithCustomAmounts.includes(member)
    );

    // Calculate remaining amount to split
    const remainingAmount = totalAmount - customTotal;
    const splitAmount =
      membersWithoutCustom.length > 0
        ? remainingAmount / membersWithoutCustom.length
        : 0;

    // Build result object
    const result: { [key: string]: number } = {};
    selectedMembers.forEach((member) => {
      if (membersWithCustomAmounts.includes(member)) {
        result[member] = parseFloat(customAmounts[member]);
      } else {
        result[member] = splitAmount;
      }
    });

    return result;
  };

  const handleSubmitExpense = async () => {
    if (
      !expenseDescription.trim() ||
      !expenseAmount.trim() ||
      selectedMembers.length === 0 ||
      !id
    ) {
      alert("Please fill in all fields and select at least one member.");
      return;
    }

    try {
      setIsSubmittingExpense(true);

      const splits = calculateSplit();
      const totalAmount = parseFloat(expenseAmount);

      // Convert splits to the format expected by the API (account_id: amount)
      // Initialize all members with a split of 0
      const apiSplits: ExpenseSplit = {};
      balances.forEach((member) => {
        apiSplits[member.account_id.toString()] = 0;
      });

      // Update with calculated splits for selected members
      Object.entries(splits).forEach(([memberId, amount]) => {
        apiSplits[memberId] = amount;
      });

      // Submit expense to backend
      await addGroupExpense(id, expenseDescription, totalAmount, apiSplits);

      // Refresh data after successful submission
      const [balancesData, expensesData, activityData, settlementsData] =
        await Promise.all([
          fetchGroupBalances(id),
          fetchGroupExpenses(id),
          fetchGroupActivity(id),
          fetchOptimalSettlements(id),
        ]);

      setBalances(balancesData);
      setExpenses(expensesData);
      setActivity(activityData);
      setSettlements(settlementsData);
      // Close modal and reset form
      closeModal();
      setExpenseDescription("");
      setExpenseAmount("");
      setSelectedMembers([]);
      setCustomAmounts({});
    } catch (err) {
      console.error("Error adding expense:", err);
      alert(
        err instanceof Error
          ? `Failed to add expense: ${err.message}`
          : "Failed to add expense. Please try again."
      );
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Settlement handler
  const handleSettlement = async (
    recipientAccountId: number,
    amount: number,
    description?: string
  ) => {
    if (!id) return;

    try {
      setIsProcessingSettlement(true);

      // Process settlement
      await processSettlement(id, recipientAccountId, amount, description);

      // Refresh data after successful settlement
      const [balancesData, activityData, settlementsData] = await Promise.all([
        fetchGroupBalances(id),
        fetchGroupActivity(id),
        fetchOptimalSettlements(id),
      ]);

      setBalances(balancesData);
      setActivity(activityData);
      setSettlements(settlementsData);
      // Close balance modal
      closeBalanceModal();
    } catch (err) {
      console.error("Error processing settlement:", err);
      alert(
        err instanceof Error
          ? `Failed to process settlement: ${err.message}`
          : "Failed to process settlement. Please try again."
      );
    } finally {
      setIsProcessingSettlement(false);
    }
  };

  // SavedContacts handlers
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactSuccess(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowContactSuccess(false);
    }, 3000);
  };

  const handleAddNewContact = () => {
    // TODO: Navigate to add contact page
    console.log("Navigate to add contact page");
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading group data</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!id || !group) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Group not found</p>
          <button
            onClick={() => navigate("/group-payments")}
            className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>

        <button className="hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
          <EllipsisHorizontalIcon className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Desktop Container */}
      <div className="">
        {/* Group Icon Section */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center py-12 px-4">
          <span className="text-6xl md:text-7xl">{group.icon}</span>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border border-gray-200 rounded-xl my-4">
          <div className="flex">
            {["Balances", "Expenses", "Activity"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase() as any)}
                className={`flex-1 py-4 px-4 text-sm font-medium transition-colors relative cursor-pointer ${
                  activeTab === tab.toLowerCase()
                    ? "text-gray-900 font-bold underline"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl border border-gray-200">
          {activeTab === "balances" && (
            <div className="px-4 md:px-8 py-6">
              {balances.length > 0 ? (
                <div className="space-y-1">
                  {balances.map((member) => (
                    <div
                      key={member.account_id}
                      onClick={() => openBalanceModal(member)}
                      className="flex items-center justify-between py-4 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                          {member.first_name
                            ? member.first_name[0]
                            : member.username[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getCurrentUserDisplayName(member)}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{member.username}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-base font-semibold ${
                            parseAmount(member.balance) > 0
                              ? "text-green-600"
                              : parseAmount(member.balance) < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {formatCurrency(
                            Math.abs(parseAmount(member.balance))
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {parseAmount(member.balance) > 0
                            ? "owed"
                            : parseAmount(member.balance) < 0
                            ? "owes"
                            : "settled"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-sm">No members found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="px-4 md:px-8 py-6">
              {expenses.length > 0 ? (
                <div className="space-y-1">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between py-4 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                          💰
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {expense.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            Paid by{" "}
                            {expense.payer_first_name && expense.payer_last_name
                              ? `${expense.payer_first_name} ${expense.payer_last_name}`
                              : expense.payer_username}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatRelativeTime(expense.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-sm">No expenses yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Add an expense to get started
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="px-4 md:px-8 py-6">
              {activity.length > 0 ? (
                <div className="space-y-3">
                  {activity.map((activityItem) => (
                    <div
                      key={activityItem.id}
                      className="flex items-start gap-3 py-3 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                        {formatActivityIcon(activityItem.activity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activityItem.username ? (
                            <>
                              {activityItem.first_name && activityItem.last_name
                                ? `${activityItem.first_name} ${activityItem.last_name}`
                                : activityItem.username}{" "}
                              {activityItem.description.toLowerCase()}
                            </>
                          ) : (
                            activityItem.description
                          )}
                        </p>
                        {activityItem.details && (
                          <p className="text-sm text-gray-600 mt-1">
                            {activityItem.details}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(activityItem.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-sm">No activity yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Activity will appear here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={openModal}
          className="w-14 h-14 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        >
          <PencilIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Expense</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Expense Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What was this expense for? *
                </label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="e.g., Dinner, Gas, Movie tickets"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                />
              </div>

              {/* Expense Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How much did it cost? *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-base">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                  />
                </div>
              </div>

              {/* Member Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="block text-sm font-medium text-gray-700">
                    Who should split this expense? *
                  </p>
                  <button
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                    onClick={() => {
                      setSelectedMembers([...groupMembers]);
                      setCustomAmounts({});
                    }}
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-3">
                  {balances.map((member) => {
                    const memberId = member.account_id.toString();
                    return (
                      <div
                        key={member.account_id}
                        onClick={() => toggleMemberSelection(memberId)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer hover:bg-teal-50 ${
                          selectedMembers.includes(memberId)
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                              {member.first_name
                                ? member.first_name[0]
                                : member.username[0]}
                            </div>
                            <span className="text-gray-900 font-medium">
                              {getCurrentUserDisplayName(member)}
                            </span>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                              selectedMembers.includes(memberId)
                                ? "border-teal-500 bg-teal-500"
                                : "border-gray-300"
                            }`}
                            onClick={() => toggleMemberSelection(memberId)}
                          >
                            {selectedMembers.includes(memberId) && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>

                        {selectedMembers.includes(memberId) && (
                          <div className="ml-11">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 whitespace-nowrap">
                                Custom amount:
                              </span>
                              <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                  <span className="text-gray-500 text-sm">
                                    $
                                  </span>
                                </div>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={customAmounts[memberId] || ""}
                                  onChange={(e) =>
                                    updateCustomAmount(memberId, e.target.value)
                                  }
                                  placeholder="Auto-split"
                                  className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedMembers.length > 0 && expenseAmount && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Split Preview:
                    </h4>
                    <div className="space-y-1">
                      {(() => {
                        const splits = calculateSplit();
                        return Object.entries(splits).map(
                          ([member, amount]) => (
                            <div
                              key={member}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                {
                                  balances.find(
                                    (m) => m.account_id.toString() === member
                                  )?.username
                                }
                              </span>
                              <span className="font-medium">
                                ${amount.toFixed(2)}
                              </span>
                            </div>
                          )
                        );
                      })()}
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm font-medium">
                      <span>Total</span>
                      <span>${expenseAmount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleSubmitExpense}
                disabled={
                  !expenseDescription.trim() ||
                  !expenseAmount.trim() ||
                  selectedMembers.length === 0 ||
                  isSubmittingExpense
                }
                className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
              >
                {isSubmittingExpense ? "Adding..." : "Split Expense"}
              </button>
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Details Modal */}
      <BalanceDetailsModal
        isOpen={isBalanceModalOpen}
        onClose={closeBalanceModal}
        selectedBalance={selectedBalance}
        settlements={settlements}
        onSettlement={handleSettlement}
        isProcessingSettlement={isProcessingSettlement}
        isCurrentUser={selectedBalance?.is_current_user || false}
      />

      {/* Saved Contacts Section */}
      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Saved Contacts
        </h2>
        <p className="text-gray-600 mb-4">
          Select a contact to add them to this group
        </p>

        {/* Success Message */}
        {showContactSuccess && selectedContact && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-green-800">
                Contact "{selectedContact.nickname || selectedContact.name}"
                selected for adding to group!
              </span>
            </div>
          </div>
        )}

        <SavedContacts
          onSelect={handleContactSelect}
          onAddNew={handleAddNewContact}
          actionText="Add to Group"
          showEditModal={false}
          allowedTypes={["sendit", "payid", "bank"]}
        />
      </div>
    </div>
  );
}
