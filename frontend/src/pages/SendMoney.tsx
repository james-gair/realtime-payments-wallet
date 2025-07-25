import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { authFetch } from "../services/firebaseFetch";
import type {
  BankAccountForm,
  Card,
  PaymentRequest,
  SentPayment,
} from "../types";

const SendMoney: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState<BankAccountForm>({
    accountName: "",
    bsb: "",
    accountNumber: "",
    description: "",
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // Payment requests functionality
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(
    null
  );

  const paymentRequests: PaymentRequest[] = [
    {
      id: 1,
      recipient: "John Doe",
      amount: 100,
      description: "Payment for services",
    },
    {
      id: 2,
      recipient: "Jane Smith",
      amount: 200,
      description: "Payment for goods",
    },
    {
      id: 3,
      recipient: "Bob Johnson",
      amount: 50,
      description: "Reimbursement",
    },
  ];

  const sentPayments: SentPayment[] = [
    {
      id: 1,
      recipient: "Alice",
      amount: 150,
      description: "Payment for project",
    },
    {
      id: 2,
      recipient: "Charlie",
      amount: 300,
      description: "Payment for consulting",
    },
  ];

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

  const handleInputChange = (field: keyof BankAccountForm, value: string) => {
    setBankAccount((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isFormValid = () => {
    return (
      selectedCard &&
      amount &&
      parseFloat(amount) > 0 &&
      parseFloat(amount) <= selectedCard.balance &&
      bankAccount.accountName.trim() &&
      bankAccount.bsb.trim() &&
      bankAccount.accountNumber.trim()
    );
  };

  const handleSendMoney = async () => {
    if (!isFormValid()) {
      alert(
        "Please fill in all required fields and ensure you have sufficient balance"
      );
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await authFetch(
        "http://localhost:4000/api/payments/send-to-bank",
        {
          method: "POST",
          body: JSON.stringify({
            amount: parseFloat(amount),
            walletId: selectedCard?.id,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to send money.");
      }

      // Simulate successful transaction
      const txId = `TX${Date.now()}`;
      setTransactionId(txId);

      // Update local balance
      if (selectedCard) {
        setSelectedCard({
          ...selectedCard,
          balance: selectedCard.balance - parseFloat(amount),
        });
      }

      setShowSuccessModal(true);

      // Reset form
      setAmount("");
      setBankAccount({
        accountName: "",
        bsb: "",
        accountNumber: "",
        description: "",
      });
    } catch (error: any) {
      console.error("Error sending money:", error);
      alert(error.message || "Failed to send money. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setTransactionId("");
  };

  const handleClickPaymentRequest = (payment: PaymentRequest) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleSubmitPayment = () => {
    if (selectedPayment) {
      alert(`Payment to ${selectedPayment.recipient} settled.`);
      setIsModalOpen(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Send Money</h1>
        <p className="text-gray-600 mt-2">
          Pay friends quickly or send money to any bank account
        </p>
      </div>

      {/* Payment Requests Section */}
      <div className="space-y-6">
        {/* Section: Payment Requests */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Requests from Friends
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <ul role="list" className="divide-y divide-gray-100">
              {paymentRequests.map((payment) => (
                <li
                  key={payment.id}
                  onClick={() => handleClickPaymentRequest(payment)}
                  className="flex justify-between items-center gap-x-6 px-6 py-4 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {payment.recipient}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {payment.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-base font-semibold text-gray-900">
                      ${payment.amount}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section: Recent Sent Payments */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Recent Sent Payments
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <ul role="list" className="divide-y divide-gray-100">
              {sentPayments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex justify-between items-center gap-x-6 px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {payment.recipient}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {payment.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-base font-semibold text-gray-900">
                      ${payment.amount}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bank Transfer Section Header */}
      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Send to Bank Account
        </h2>
        <p className="text-gray-600">
          Transfer money directly to any bank account
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Wallet Selection */}
        <div className="space-y-6">
          {/* Selected Wallet Preview */}
          {selectedCard && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                From Wallet
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
                    Available Balance
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
              Select Source Wallet
            </h3>

            <div className="space-y-3">
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedCard?.id === card.id
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
                          Balance: {card.symbol}
                          {card.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {selectedCard?.id === card.id && (
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

        {/* Right Column - Send Money Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Bank Transfer Details
            </h3>

            <div className="space-y-6">
              {/* Amount Input */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Amount to Send *
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
                    max={selectedCard?.balance || 0}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 text-lg rounded-md bg-white text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black"
                  />
                </div>
                {selectedCard &&
                  amount &&
                  parseFloat(amount) > selectedCard.balance && (
                    <p className="text-red-600 text-sm mt-1">
                      Insufficient balance. Available: {selectedCard.symbol}
                      {selectedCard.balance.toLocaleString()}
                    </p>
                  )}
              </div>

              {/* Recipient Bank Details */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">
                  Recipient Bank Account
                </h4>

                <div>
                  <label
                    htmlFor="accountName"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Account Name *
                  </label>
                  <input
                    id="accountName"
                    name="accountName"
                    type="text"
                    placeholder="John Smith"
                    value={bankAccount.accountName}
                    onChange={(e) =>
                      handleInputChange("accountName", e.target.value)
                    }
                    className="block w-full px-3 py-3 rounded-md bg-white text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bsb"
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      BSB *
                    </label>
                    <input
                      id="bsb"
                      name="bsb"
                      type="text"
                      placeholder="123-456"
                      value={bankAccount.bsb}
                      onChange={(e) => handleInputChange("bsb", e.target.value)}
                      className="block w-full px-3 py-3 rounded-md bg-white text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="accountNumber"
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      Account Number *
                    </label>
                    <input
                      id="accountNumber"
                      name="accountNumber"
                      type="text"
                      placeholder="12345678"
                      value={bankAccount.accountNumber}
                      onChange={(e) =>
                        handleInputChange("accountNumber", e.target.value)
                      }
                      className="block w-full px-3 py-3 rounded-md bg-white text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Payment Description
                  </label>
                  <input
                    id="description"
                    name="description"
                    type="text"
                    placeholder="Optional payment reference"
                    value={bankAccount.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className="block w-full px-3 py-3 rounded-md bg-white text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black"
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Quick Amount
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["50", "100", "500"].map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount)}
                      disabled={
                        !selectedCard ||
                        parseFloat(quickAmount) > selectedCard.balance
                      }
                      className="py-2 px-4 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedCard?.symbol || "$"}
                      {quickAmount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Send Money Button */}
              <button
                onClick={handleSendMoney}
                disabled={!isFormValid() || isLoading}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-black hover:bg-zinc-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold hover:cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing Transfer...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    <span>Send Money</span>
                  </>
                )}
              </button>

              {/* Required Fields Note */}
              <p className="text-xs text-gray-500 text-center">
                * Required fields
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Request Settlement Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
              Settle Payment Request
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">From:</span>{" "}
                {selectedPayment?.recipient}
              </p>
              <p>
                <span className="font-medium">Amount:</span> $
                {selectedPayment?.amount}
              </p>
              <p>
                <span className="font-medium">Description:</span>{" "}
                {selectedPayment?.description}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSubmitPayment}
                className="flex-1 py-3 bg-black hover:bg-zinc-800 text-white font-semibold rounded-xl transition"
              >
                Pay Now
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4"
          onClick={handleCloseSuccessModal}
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
                  <span className="font-medium">Amount:</span>{" "}
                  {selectedCard?.symbol}
                  {amount}
                </p>
                <p>
                  <span className="font-medium">To:</span>{" "}
                  {bankAccount.accountName}
                </p>
                <p>
                  <span className="font-medium">Transaction ID:</span>{" "}
                  {transactionId}
                </p>
              </div>

              <button
                onClick={handleCloseSuccessModal}
                className="w-full py-3 bg-black hover:bg-zinc-800 text-white font-semibold rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendMoney;
