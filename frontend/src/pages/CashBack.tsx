import { useEffect, useState } from "react";
import { authFetch } from "../services/firebaseFetch";
import type { Card } from "../types/index";

interface TransferFormData {
  recipientUsername: string;
  currencyCode: string;
  amount: string;
}

const Cashback: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TransferFormData>({
    recipientUsername: "",
    currencyCode: "",
    amount: "",
  });

  useEffect(() => {
    fetchCards();
  }, []);

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
        setFormData((prev) => ({
          ...prev,
          currencyCode: data.wallets[0].currency,
        }));
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.recipientUsername ||
      !formData.currencyCode ||
      !formData.amount
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      alert("Please enter a positive amount");
      return;
    }

    setLoading(true);

    try {
      const response = await authFetch(
        "http://localhost:4000/api/send-money",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientUsername: formData.recipientUsername,
            currencyCode: formData.currencyCode,
            amount: parseFloat(formData.amount),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Transfer failed");
      }

      alert(
        `Transfer successful! Sent ${formData.amount} ${formData.currencyCode} to ${formData.recipientUsername}`
      );

      setFormData({
        recipientUsername: "",
        currencyCode: cards.length > 0 ? cards[0].currency : "",
        amount: "",
      });

      // must refresh wallets to display updated values
      fetchCards();
    } catch (error: any) {
      console.error("Transfer error:", error);
      alert(error.message || "Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedWallet = cards.find(
    (card) => card.currency === formData.currencyCode
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Send Currency</h1>
        <p className="text-gray-600 mt-2">
          Transfer money to other users by username and currency type
        </p>
      </div>

      {/* Transfer Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Currency Selection */}
          <div>
            <label
              htmlFor="currencyCode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Currency
            </label>
            <select
              id="currencyCode"
              name="currencyCode"
              value={formData.currencyCode}
              onChange={handleInputChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              required
            >
              <option value="">Select a currency</option>
              {cards.map((card) => (
                <option key={card.currency} value={card.currency}>
                  {card.currency} - Balance: {card.balance}
                </option>
              ))}
            </select>
            {selectedWallet && (
              <p className="mt-1 text-sm text-gray-500">
                Available balance: {selectedWallet.balance}{" "}
                {selectedWallet.currency}
              </p>
            )}
          </div>

          {/* Recipient Username */}
          <div>
            <label
              htmlFor="recipientUsername"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Recipient Username
            </label>
            <input
              type="text"
              id="recipientUsername"
              name="recipientUsername"
              value={formData.recipientUsername}
              onChange={handleInputChange}
              placeholder="Enter username"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Amount
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              !selectedWallet ||
              parseFloat(formData.amount) > selectedWallet.balance
            }
            className="w-full bg-black hover:bg-zinc-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            {loading ? "Sending..." : "Send Money"}
          </button>

          {/* Balance Warning */}
          {selectedWallet &&
            parseFloat(formData.amount) > selectedWallet.balance && (
              <p className="text-red-600 text-sm text-center">
                Insufficient balance. You only have {selectedWallet.balance}{" "}
                {selectedWallet.currency}
              </p>
            )}
        </form>
      </div>

      {/* Available Wallets Display */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Wallets
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.currency}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="text-sm font-medium text-gray-900">
                {card.currency}
              </div>
              <div className="text-lg font-bold text-gray-900 mt-1">
                {card.balance}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Cashback Deals */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cashback Deals
        </h3>
        <div className="bg-white border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1">
                Send to nouser
              </div>
              <div className="text-sm text-gray-600">
                Send 10 AUD or more to nouser to receive 2 AUD cashback
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">+2 AUD</div>
              <div className="text-xs text-gray-500">Cashback</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cashback;
