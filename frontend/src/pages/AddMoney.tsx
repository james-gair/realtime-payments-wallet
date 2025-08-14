import { DocumentDuplicateIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { authFetch } from "../services/firebaseFetch";
import type { Card, PayIdDetails } from "../types";
import { useNavigate } from "react-router-dom";

// TODO: This is only setup for AUD
const quickAmounts = ["50", "100", "500"];

const MOCK_DATA = {
  payId: "username@sendit.com.au",
};

export default function AddMoney() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [isLoading, setIsLoading] = useState(false);
  const [payIdDetails, setPayIdDetails] = useState<PayIdDetails | null>(null);
  const [showPayIdDetails, setShowPayIdDetails] = useState(false);
  const navigate = useNavigate();
  const fetchCards = async () => {
    try {
      const response = await authFetch(
        "http://localhost:4000/api/dashboard/wallet",
        {
          method: "GET",
        }
      );
      const data = await response.json();
      setCards(data.wallets);
      if (data.wallets.length > 0) {
        setSelectedCard(data.wallets[0]);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
  };

  const handleAddMoney = async () => {
    if (paymentMethod !== "bank") {
      if (!selectedCard || !amount || parseFloat(amount) <= 0) {
        alert("Please select a wallet and enter a valid amount");
        return;
      }
      // Handle other payment methods here...
      alert("This payment method is not yet implemented.");
      return;
    }

    // --- Bank Transfer Logic ---
    setIsLoading(true);
    try {
      const response = await authFetch(
        "http://localhost:4000/api/payments/add-money",
        {
          method: "POST",
          body: JSON.stringify({
            amount: parseFloat(amount),
            currency: selectedCard?.currency,
            walletId: selectedCard?.wallet_id,
            paymentMethod: paymentMethod,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        if (errData.redirectTo) {
          navigate(errData.redirectTo);
          return;
        }
        throw new Error(errData.error || "Failed to add money.");
      }

      // TODO: Real world scenario would rely on a webhook to update the balance
      // Optimistically update the selected card and all cards
      setSelectedCard(
        selectedCard
          ? {
              ...selectedCard,
              balance:
                parseFloat(amount) +
                parseFloat(selectedCard.balance.toString()),
            }
          : null
      );

      setCards(
        cards.map((card) =>
          card.wallet_id === selectedCard?.wallet_id
            ? {
                ...card,
                balance: card.balance + parseFloat(amount),
              }
            : card
        )
      );
      setPayIdDetails(MOCK_DATA);
      setShowPayIdDetails(true);
    } catch (error: any) {
      console.error("Error fetching bank details:", error);
      alert(
        error.message || "Failed to get payment instructions. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a small toast notification here for better UX
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Money</h1>
        <p className="text-gray-600 mt-2">Add funds to your currency wallets</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Wallet Selection */}
        <div className="space-y-6">
          {/* Selected Wallet Preview */}
          {selectedCard && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selected Wallet
              </h3>

              <div
                className={`bg-gradient-to-br ${selectedCard.gradient} rounded-2xl p-6 text-white relative overflow-hidden`}
              >
                {/* Card Background Pattern */}
                <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                  <div className="w-full h-full rounded-full border-2 border-white transform translate-x-6 -translate-y-6"></div>
                </div>

                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-white text-opacity-90 font-medium">
                    {selectedCard.currency}
                  </span>
                </div>

                {/* Balance */}
                <div>
                  <div className="text-sm text-white text-opacity-80 mb-2">
                    Current Balance
                  </div>
                  <div className="text-2xl font-bold">
                    {selectedCard.symbol}
                    {selectedCard.balance.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Select Wallet */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Wallet
            </h3>

            <div className="space-y-3">
              {cards.map((card) => (
                <button
                  key={card.wallet_id}
                  onClick={() => setSelectedCard(card)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedCard?.wallet_id === card.wallet_id
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-12 h-8 bg-gradient-to-r ${card.gradient} rounded-md flex items-center justify-center`}
                      >
                        <span className="text-white font-bold text-sm">
                          {card.currency}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {card.currency} Wallet
                        </div>
                        <div className="text-sm text-gray-500">
                          Current: {card.symbol}
                          {card.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {selectedCard?.wallet_id === card.wallet_id && (
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Add Money Form */}
        <div className="space-y-6">
          {showPayIdDetails && payIdDetails ? (
            // --- PAYID DETAILS DISPLAY ---
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                PayID Transfer Instructions
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Use this PayID in your banking app to add money to your wallet
                instantly.
              </p>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-yellow-700 font-semibold">
                      Your unique PayID
                    </div>
                    <div className="font-bold text-lg text-yellow-900">
                      {payIdDetails.payId}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(payIdDetails.payId)}
                    title="Copy"
                    className="text-yellow-500 hover:text-yellow-700 hover:cursor-pointer"
                  >
                    <DocumentDuplicateIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowPayIdDetails(false)}
                className="mt-6 w-full flex items-center justify-center py-3 bg-gray-200 hover:bg-gray-300 text-black rounded-xl transition-all font-semibold"
              >
                Done
              </button>
            </div>
          ) : (
            // --- ADD MONEY FORM ---
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Add Funds
              </h3>

              <div className="space-y-6">
                {/* Quick Amount Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Quick Amount
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {quickAmounts.map((quickAmount) => (
                      <button
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount)}
                        className="py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all hover:cursor-pointer"
                      >
                        {selectedCard?.symbol || "$"}
                        {quickAmount}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Amount Input */}
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-lg">
                        {selectedCard?.symbol || "$"}
                      </span>
                    </div>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 text-lg rounded-md bg-white text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Payment Method
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={paymentMethod === "bank"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-900">
                        Bank Transfer
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-900">
                        Debit/Credit Card
                      </span>
                    </label>
                  </div>
                </div>

                {/* Add Money Button */}
                <button
                  onClick={handleAddMoney}
                  disabled={
                    (paymentMethod !== "bank" &&
                      (!selectedCard || !amount || parseFloat(amount) <= 0)) ||
                    isLoading
                  }
                  className="w-full flex items-center justify-center space-x-3 py-4 bg-black hover:bg-zinc-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold hover:cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-5 h-5" />
                      <span>
                        {paymentMethod === "bank"
                          ? "Get Bank Details"
                          : "Add Money"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
