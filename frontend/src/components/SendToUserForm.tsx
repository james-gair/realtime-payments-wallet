import { useEffect, useState } from "react";
import { authFetch } from "../services/firebaseFetch";
import type { Card } from "../types";

interface SendToUserFormProps {
  cards: Card[];
}

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  recipient: string;
  currency: string;
  currencySymbol: string;
}

function SuccessModal({
  isOpen,
  onClose,
  amount,
  recipient,
  currency,
  currencySymbol,
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Transfer Successful!
          </h3>

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p>
              <span className="font-medium">Amount:</span> {currencySymbol}
              {amount}
            </p>
            <p>
              <span className="font-medium">To:</span> @{recipient}
            </p>
            <p>
              <span className="font-medium">Currency:</span> {currency}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-black hover:bg-zinc-800 text-white font-semibold rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function SendToUserForm({ cards }: SendToUserFormProps) {
  const [transferAmount, setTransferAmount] = useState("");
  const [transferCurrency, setTransferCurrency] = useState("AUD");
  const [recipientUsername, setRecipientUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState({
    amount: "",
    recipient: "",
    currency: "",
    symbol: "",
  });

  const availableCurrencies = [
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  ];

  const userWallets = availableCurrencies
    .map((currency) => ({
      ...currency,
      wallet: cards.find((card) => card.currency === currency.code),
    }))
    .filter((item) => item.wallet);

  const getTransferWallet = () =>
    userWallets.find((w) => w.code === transferCurrency)?.wallet;
  const getTransferSymbol = () =>
    availableCurrencies.find((c) => c.code === transferCurrency)?.symbol || "";

  const formatBalance = (balance: number, currency: string): string => {
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: currency === "JPY" ? 0 : 2,
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    });
  };

  // Set default currency to first available wallet
  useEffect(() => {
    if (userWallets.length > 0 && !transferCurrency) {
      setTransferCurrency(userWallets[0].code);
    }
  }, [userWallets, transferCurrency]);

  const transferMoney = async () => {
    const amount = parseFloat(transferAmount);

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!recipientUsername.trim()) {
      alert("Please enter a recipient username");
      return;
    }

    const wallet = getTransferWallet();
    if (!wallet || amount > wallet.balance) {
      alert("Insufficient balance");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authFetch(
        "http://localhost:4000/api/dashboard/transfer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientUsername: recipientUsername.trim(),
            currencyCode: transferCurrency,
            amount: amount,
          }),
        }
      );

      if (response.ok) {
        // Store success details
        setSuccessDetails({
          amount: transferAmount,
          recipient: recipientUsername,
          currency: transferCurrency,
          symbol: getTransferSymbol(),
        });

        // Reset form
        setTransferAmount("");
        setRecipientUsername("");

        // Show success modal
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        alert(`Transfer failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error transferring money:", error);
      alert("Error transferring money. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessDetails({ amount: "", recipient: "", currency: "", symbol: "" });
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Send to Friend by Username
        </h3>

        <div className="space-y-4">
          {/* Recipient Username */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              To Username *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-lg">@</span>
              </div>
              <input
                type="text"
                value={recipientUsername}
                onChange={(e) => setRecipientUsername(e.target.value)}
                placeholder="username"
                className="block w-full pl-8 pr-3 py-3 rounded-md bg-white text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black"
              />
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Currency *
            </label>
            <select
              value={transferCurrency}
              onChange={(e) => setTransferCurrency(e.target.value)}
              className="block w-full px-3 py-3 rounded-md bg-white text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-black"
            >
              {userWallets.map((wallet) => (
                <option key={wallet.code} value={wallet.code}>
                  {wallet.code} - {wallet.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-lg">
                  {getTransferSymbol()}
                </span>
              </div>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full pl-10 pr-3 py-3 text-lg rounded-md bg-white text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black"
                min="0"
                step="0.01"
                max={getTransferWallet()?.balance || 0}
              />
            </div>

            {/* Balance Display */}
            {getTransferWallet() && (
              <p className="text-sm text-gray-500 mt-1">
                Available Balance: {getTransferSymbol()}
                {formatBalance(getTransferWallet()!.balance, transferCurrency)}
              </p>
            )}

            {/* Insufficient balance warning */}
            {getTransferWallet() &&
              transferAmount &&
              parseFloat(transferAmount) > getTransferWallet()!.balance && (
                <p className="text-red-600 text-sm mt-1">
                  Insufficient balance. Available: {getTransferSymbol()}
                  {formatBalance(
                    getTransferWallet()!.balance,
                    transferCurrency
                  )}
                </p>
              )}
          </div>

          {/* Transfer Button */}
          <button
            onClick={transferMoney}
            disabled={
              !transferAmount ||
              !recipientUsername.trim() ||
              !getTransferWallet() ||
              userWallets.length === 0 ||
              isLoading ||
              (getTransferWallet() &&
                parseFloat(transferAmount) > getTransferWallet()!.balance)
            }
            className="w-full flex items-center justify-center space-x-3 py-4 bg-black hover:bg-zinc-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold hover:cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing Transfer...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span>
                  Send {getTransferSymbol()}
                  {transferAmount || "0"} to @{recipientUsername || "username"}
                </span>
              </>
            )}
          </button>

          {userWallets.length === 0 && (
            <p className="text-sm text-red-500 text-center">
              You need at least one wallet to transfer money
            </p>
          )}

          {/* Required Fields Note */}
          <p className="text-xs text-gray-500 text-center">* Required fields</p>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        amount={successDetails.amount}
        recipient={successDetails.recipient}
        currency={successDetails.currency}
        currencySymbol={successDetails.symbol}
      />
    </>
  );
}
