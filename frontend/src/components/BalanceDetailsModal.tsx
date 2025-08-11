import { XMarkIcon } from "@heroicons/react/24/outline";

interface BalanceData {
  id: number;
  name: string;
  amount: number;
  avatar: string;
  admin: boolean;
}

interface DebtData {
  from: string;
  to: string;
  amount: number;
  reason: string;
}

interface BalanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBalance: BalanceData | null;
  debtsData: { [key: string]: DebtData[] };
}

export default function BalanceDetailsModal({
  isOpen,
  onClose,
  selectedBalance,
  debtsData,
}: BalanceDetailsModalProps) {
  if (!isOpen || !selectedBalance) return null;

  const userDebts = debtsData[selectedBalance.name] || [];

  const getAvatarForUser = (userName: string) => {
    if (userName === "You") return "🫵";
    if (userName === "@Person") return "👤";
    if (userName === "@Pizza") return "🍕";
    if (userName === "@Apple") return "🍎";
    return "👤";
  };

  const handleSettleUp = () => {
    // TODO: Navigate to settle up functionality
    console.log("Settle up with", selectedBalance.name);
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
          <h3 className="text-xl font-bold text-gray-900">
            {selectedBalance.name === "You"
              ? "Your"
              : `${selectedBalance.name}'s`}{" "}
            Balance Details
          </h3>
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
              {selectedBalance.avatar}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {selectedBalance.name}
              </p>
              <p
                className={`text-xl font-bold ${
                  selectedBalance.amount > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ${selectedBalance.amount.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {selectedBalance.amount > 0
              ? "Is owed money"
              : selectedBalance.amount < 0
              ? "Owes money"
              : "All settled up"}
          </p>
        </div>

        {/* Debt Details */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">
            {selectedBalance.amount > 0 ? "Money You're Owed" : "Money You Owe"}
          </h4>

          {userDebts.length > 0 ? (
            <div className="space-y-3">
              {userDebts.map((debt, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                      {getAvatarForUser(debt.from)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {debt.from === selectedBalance.name
                          ? `You owe ${debt.to}`
                          : `${debt.to} owes you`}
                      </p>
                      <p className="text-xs text-gray-500">{debt.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        debt.from === selectedBalance.name
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ${debt.amount.toFixed(2)}
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
          <button
            onClick={handleSettleUp}
            className="flex-1 py-3 bg-black hover:bg-zinc-800 text-white font-semibold rounded-xl transition"
            disabled={selectedBalance.amount === 0}
          >
            Settle Up
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
