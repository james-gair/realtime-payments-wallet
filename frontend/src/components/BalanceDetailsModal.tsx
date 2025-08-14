import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import type { GroupMember, GroupSettlement } from "../types";

interface DebtData {
  from: string;
  to: string;
  amount: number;
}

interface BalanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBalance: GroupMember | null;
  onSettlement?: (
    recipientAccountId: number,
    amount: number,
    description?: string
  ) => void;
  isProcessingSettlement?: boolean;
  isCurrentUser?: boolean;
  settlements: GroupSettlement[];
}

export default function BalanceDetailsModal({
  isOpen,
  onClose,
  selectedBalance,
  settlements,
  onSettlement,
  isProcessingSettlement = false,
  isCurrentUser = false,
}: BalanceDetailsModalProps) {
  if (!isOpen || !selectedBalance) return null;

  const [debts, setDebts] = useState<DebtData[]>([]);
  useEffect(() => {
    if (selectedBalance) {
      const selectedUserDebts = settlements.filter(
        (settlement) =>
          settlement.debtor_account_id === selectedBalance.account_id ||
          settlement.creditor_account_id === selectedBalance.account_id
      );
      const transformedDebts = selectedUserDebts.map((settlement) => ({
        from: settlement.debtor_username,
        to: settlement.creditor_username,
        amount: settlement.amount,
      }));
      setDebts(transformedDebts);
    }
  }, [selectedBalance, settlements]);

  // Determine if settlement should be available
  // Only show settlement for current user when they owe money (negative balance)
  const canSettle = isCurrentUser && selectedBalance.balance < 0;

  const handleSettleUp = () => {
    if (onSettlement && canSettle) {
      // For simplicity, settle the full balance
      // In a real app, you might want a more sophisticated UI for partial settlements
      const amount = Math.abs(selectedBalance.balance);
      const recipientAccountId = selectedBalance.account_id;
      onSettlement(
        recipientAccountId,
        amount,
        `Settlement for ${selectedBalance.username}`
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Balance Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Balance Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
              {selectedBalance.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {selectedBalance.username}
              </p>
              <p
                className={`text-xl font-bold ${
                  selectedBalance.balance > 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ${selectedBalance.balance.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {selectedBalance.balance > 0
              ? "Is owed money"
              : selectedBalance.balance < 0
              ? "Owes money"
              : "All settled up"}
          </p>
        </div>

        {/* Debt Details */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Settlements</h4>

          {debts.length > 0 ? (
            <div className="space-y-3">
              {debts.map((debt, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                      {/* {getAvatarForUser(debt.from)} */}
                      {debt.to[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {isCurrentUser && selectedBalance.balance > 0 && (
                          // You are owed money
                          <span>{debt.to} owes you</span>
                        )}
                        {isCurrentUser && selectedBalance.balance == 0 && (
                          // You owe nothing
                          <span>All is settled up</span>
                        )}
                        {isCurrentUser && selectedBalance.balance < 0 && (
                          // You owe money
                          <span>You owe {debt.from}</span>
                        )}
                        {!isCurrentUser && (
                          <span>
                            {debt.to} owes {debt.from}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        debt.from === selectedBalance.username
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ${debt.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No outstanding debts</p>
              <p className="text-gray-400 text-xs mt-1">All settled up!</p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex gap-3">
          {canSettle && (
            <button
              onClick={handleSettleUp}
              className="flex-1 py-3 bg-black hover:bg-zinc-800 text-white font-semibold rounded-xl transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={isProcessingSettlement}
            >
              {isProcessingSettlement ? "Processing..." : "Settle Up"}
            </button>
          )}
          <button
            onClick={onClose}
            className={`${
              canSettle ? "flex-1" : "w-full"
            } py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
