import {
  EllipsisHorizontalIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BalanceDetailsModal from "../components/BalanceDetailsModal";
import { SavedContacts } from "../components/SavedContacts";
import type { Contact } from "../types";
import { MOCK_GROUPS } from "./GroupPaymentsDashboard";

const CONFIG_MOCK_BALANCES = [
  {
    id: 1,
    name: "You",
    amount: 20.0,
    avatar: "🫵",
    admin: true,
  },
  {
    id: 2,
    name: "@Person",
    amount: 5.0,
    avatar: "👤",
    admin: false,
  },
  {
    id: 3,
    name: "@Pizza",
    amount: -15.0,
    avatar: "🍕",
    admin: false,
  },
  {
    id: 4,
    name: "@Apple",
    amount: -10.0,
    avatar: "🍎",
    admin: false,
  },
];

const CONFIG_MOCK_EXPENSES = [
  {
    id: 1,
    description: "Dinner",
    amount: 20.0,
    payer: "You",
  },
  {
    id: 2,
    description: "Gas",
    amount: 5,
    payer: "@Person",
  },
];

const CONFIG_MOCK_ACTIVITY = [
  {
    id: 1,
    type: "expense_added",
    description: "You added an expense",
    details: "Dinner - $20.00",
    timestamp: "2 hours ago",
    user: "You",
    icon: "💰",
  },
  {
    id: 2,
    type: "payment_made",
    description: "@Person paid @Pizza",
    details: "$15.00",
    timestamp: "1 day ago",
    user: "@Person",
    icon: "💸",
  },
  {
    id: 3,
    type: "expense_added",
    description: "@Person added an expense",
    details: "Gas - $5.00",
    timestamp: "2 days ago",
    user: "@Person",
    icon: "💰",
  },
  {
    id: 4,
    type: "member_joined",
    description: "@Apple joined the group",
    details: "",
    timestamp: "3 days ago",
    user: "@Apple",
    icon: "👋",
  },
  {
    id: 5,
    type: "payment_settled",
    description: "You settled up with @Pizza",
    details: "$10.00",
    timestamp: "5 days ago",
    user: "You",
    icon: "✅",
  },
];

const CONFIG_MOCK_DEBTS = {
  You: [
    { from: "@Pizza", to: "You", amount: 15.0, reason: "Dinner expense" },
    { from: "@Apple", to: "You", amount: 10.0, reason: "Gas expense" },
  ],
  "@Person": [
    { from: "You", to: "@Person", amount: 5.0, reason: "Movie tickets" },
  ],
  "@Pizza": [
    { from: "@Pizza", to: "@Person", amount: 8.0, reason: "Grocery shopping" },
  ],
  "@Apple": [
    { from: "@Apple", to: "@Person", amount: 12.0, reason: "Concert tickets" },
  ],
};

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
  const [MOCK_BALANCES, setMOCK_BALANCES] = useState(CONFIG_MOCK_BALANCES);
  const [MOCK_EXPENSES, setMOCK_EXPENSES] = useState(CONFIG_MOCK_EXPENSES);
  const [MOCK_ACTIVITY, setMOCK_ACTIVITY] = useState(CONFIG_MOCK_ACTIVITY);

  // Balance modal functionality
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<
    (typeof CONFIG_MOCK_BALANCES)[0] | null
  >(null);

  // SavedContacts functionality
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactSuccess, setShowContactSuccess] = useState(false);

  // Mock group members - in real app this would come from API
  const groupMembers = MOCK_BALANCES.map((balance) => balance.name);

  const openModal = () => {
    setIsModalOpen(true);
    // Select all members by default
    setSelectedMembers([...groupMembers]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openBalanceModal = (balance: (typeof CONFIG_MOCK_BALANCES)[0]) => {
    setSelectedBalance(balance);
    setIsBalanceModalOpen(true);
  };

  const closeBalanceModal = () => {
    setIsBalanceModalOpen(false);
    setSelectedBalance(null);
  };

  const toggleMemberSelection = (memberName: string) => {
    if (selectedMembers.includes(memberName)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== memberName));
      // Remove custom amount when deselecting
      const newCustomAmounts = { ...customAmounts };
      delete newCustomAmounts[memberName];
      setCustomAmounts(newCustomAmounts);
    } else {
      setSelectedMembers([...selectedMembers, memberName]);
    }
  };

  const updateCustomAmount = (memberName: string, amount: string) => {
    if (amount === "0") {
      const newCustomAmounts = { ...customAmounts };
      delete newCustomAmounts[memberName];
      setCustomAmounts(newCustomAmounts);
    } else {
      setCustomAmounts((prev) => ({
        ...prev,
        [memberName]: amount,
      }));
    }
  };

  const addActivity = (
    type: string,
    description: string,
    details: string,
    user: string
  ) => {
    const icons: { [key: string]: string } = {
      expense_added: "💰",
      payment_made: "💸",
      payment_settled: "✅",
      member_joined: "👋",
      member_left: "👋",
    };

    const newActivity = {
      id: MOCK_ACTIVITY.length + 1,
      type,
      description,
      details,
      timestamp: "Just now",
      user,
      icon: icons[type] || "📝",
    };

    setMOCK_ACTIVITY([newActivity, ...MOCK_ACTIVITY]);
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

  const handleSubmitExpense = () => {
    if (
      expenseDescription.trim() &&
      expenseAmount.trim() &&
      selectedMembers.length > 0
    ) {
      // TODO: Submit expense to backend
      const splits = calculateSplit();
      const totalAmount = parseFloat(expenseAmount);

      // TODO: Get payer name from backend
      const payerName = "You"; // Assuming "You" is the person who paid the expense

      console.log("Expense splits:", splits);
      alert(
        `Expense "${expenseDescription}" for $${expenseAmount} added and split between ${selectedMembers.length} members!`
      );

      // Add the new expense to the expenses list (newest first)
      const newExpense = {
        id: MOCK_EXPENSES.length + 1,
        description: expenseDescription,
        amount: totalAmount,
        payer: payerName,
      };
      setMOCK_EXPENSES([newExpense, ...MOCK_EXPENSES]);

      // Add activity log for the expense
      addActivity(
        "expense_added",
        `${payerName} added an expense`,
        `${expenseDescription} - $${totalAmount.toFixed(2)}`,
        payerName
      );

      // Update balances
      setMOCK_BALANCES(
        MOCK_BALANCES.map((balance) => {
          if (
            balance.name === payerName &&
            selectedMembers.includes(balance.name)
          ) {
            // The payer gets back the total amount minus their own share
            const payerShare = splits[balance.name] || 0;
            const amountToReceive = totalAmount - payerShare;
            return {
              ...balance,
              amount: balance.amount + amountToReceive,
            };
          } else if (selectedMembers.includes(balance.name)) {
            // Other members owe their share
            return {
              ...balance,
              amount: balance.amount - splits[balance.name],
            };
          }
          return balance;
        })
      );
      closeModal();
      // Reset form
      setExpenseDescription("");
      setExpenseAmount("");
      setSelectedMembers([]);
      setCustomAmounts({});
    } else {
      alert("Please fill in all fields and select at least one member.");
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

  if (!id) {
    return <div>Group not found</div>;
  }

  const group = MOCK_GROUPS.find((group) => group.id === parseInt(id));

  if (!group) {
    return <div>Group not found</div>;
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
              <div className="space-y-1">
                {MOCK_BALANCES.map((balance) => (
                  <div
                    key={balance.id}
                    onClick={() => openBalanceModal(balance)}
                    className="flex items-center justify-between py-4 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                        {balance.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {balance.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-base font-semibold ${
                          balance.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ${balance.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="px-4 md:px-8 py-6">
              {MOCK_EXPENSES.length > 0 ? (
                <div className="space-y-1">
                  {MOCK_EXPENSES.map((expense) => (
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
                            Paid by {expense.payer}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-gray-900">
                          ${expense.amount.toFixed(2)}
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
              {MOCK_ACTIVITY.length > 0 ? (
                <div className="space-y-3">
                  {MOCK_ACTIVITY.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 py-3 hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        {activity.details && (
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.details}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.timestamp}
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
                  {MOCK_BALANCES.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => toggleMemberSelection(member.name)}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer hover:bg-teal-50 ${
                        selectedMembers.includes(member.name)
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                            {member.avatar}
                          </div>
                          <span className="text-gray-900 font-medium">
                            {member.name}
                          </span>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                            selectedMembers.includes(member.name)
                              ? "border-teal-500 bg-teal-500"
                              : "border-gray-300"
                          }`}
                          onClick={() => toggleMemberSelection(member.name)}
                        >
                          {selectedMembers.includes(member.name) && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>

                      {selectedMembers.includes(member.name) && (
                        <div className="ml-11">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              Custom amount:
                            </span>
                            <div className="relative flex-1">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">$</span>
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={customAmounts[member.name] || ""}
                                onChange={(e) =>
                                  updateCustomAmount(
                                    member.name,
                                    e.target.value
                                  )
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
                  ))}
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
                              <span className="text-gray-600">{member}</span>
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
                  selectedMembers.length === 0
                }
                className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
              >
                Split Expense
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
        debtsData={CONFIG_MOCK_DEBTS}
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
        />
      </div>
    </div>
  );
}
