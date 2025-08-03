import { useEffect, useState } from "react";
import { SendToBankForm } from "../components/SendToBankForm";
import { SendToUserForm } from "../components/SendToUserForm";
import { authFetch } from "../services/firebaseFetch";
import type { Card, PaymentRequest } from "../types/index";



const SendMoney: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [paymentRequests, setPaymentRequests] =  useState<PaymentRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Payment requests functionality
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(
    null
  );

  const fetchPaymentRequests = async () => {
    try {
      const response = await authFetch("http://localhost:4000/api/payment-requests/received", {
        method: "GET",
      });
      const json = await response.json();
      setPaymentRequests(json.data);
    } catch (error) {
      console.error("Failed to fetch payment requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchCards();
    fetchPaymentRequests();
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
        setSelectedCard(data.wallets[0]);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
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
      alert(`Payment to ${selectedPayment.username_from} settled.`);
      setIsModalOpen(false);
    }
  };

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Requests from Friends
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <ul role="list" className="divide-y divide-gray-100">
            {loadingRequests ? (
              <div className="p-4 text-gray-500">Loading payment requests...</div>
            ) : paymentRequests.length === 0 ? (
              <div className="p-4 text-gray-500">No pending payment requests.</div>
            ) : (
              paymentRequests
                .filter((p) => p.status === "pending")
                .map((payment) => (
                  <li
                    key={payment.id}
                    onClick={() => handleClickPaymentRequest(payment)}
                    className="flex justify-between items-center gap-x-6 px-6 py-4 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {payment.username_from}
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
                ))
            )}
          </ul>
        </div>
      </div>
    </div>

    {/* Send to User Section Header */}
    <div className="pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Send to Friend</h2>
      <p className="text-gray-600">
        Transfer money instantly to another user by username
      </p>
    </div>

    {/* Send to User Form Component */}
    <SendToUserForm cards={cards} />

    {/* Bank Transfer Section Header */}
    <div className="pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Send to Bank Account</h2>
      <p className="text-gray-600">
        Transfer money directly to any bank account
      </p>
    </div>

    {/* Send to Bank Form Component */}
    <SendToBankForm
      cards={cards}
      selectedCard={selectedCard}
      setSelectedCard={setSelectedCard}
    />

    {/* Payment Request Settlement Modal */}
    {isModalOpen && selectedPayment && (
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
              {selectedPayment.username_from}
            </p>
            <p>
              <span className="font-medium">Amount:</span> ${selectedPayment.amount}
            </p>
            <p>
              <span className="font-medium">Description:</span>{" "}
              {selectedPayment.description}
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
  </div>
);
}

 export default SendMoney;