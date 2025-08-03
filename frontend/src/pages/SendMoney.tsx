import { useEffect, useState } from "react";
import { SendToBankForm } from "../components/SendToBankForm";
import { SendToUserForm } from "../components/SendToUserForm";
import { SavedContacts } from "../components/SavedContacts";
import { authFetch } from "../services/firebaseFetch";
import type { Card, PaymentRequest, SentPayment, Contact } from "../types";

const MOCK_PAYMENT_REQUESTS: PaymentRequest[] = [
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

const MOCK_SENT_PAYMENTS: SentPayment[] = [
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

const SendMoney: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Payment requests functionality
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(
    null
  );

  // SavedContacts functionality
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactSuccess, setShowContactSuccess] = useState(false);

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
      alert(`Payment to ${selectedPayment.recipient} settled.`);
      setIsModalOpen(false);
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
              {MOCK_PAYMENT_REQUESTS.map((payment) => (
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
              {MOCK_SENT_PAYMENTS.map((payment) => (
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

      {/* Send to User Section Header */}
      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Send to Friend
        </h2>
        <p className="text-gray-600">
          Transfer money instantly to another user by username
        </p>
      </div>

      {/* Send to User Form Component */}
      <SendToUserForm cards={cards} />

      {/* Bank Transfer Section Header */}
      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Send to Bank Account
        </h2>
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

      {/* Saved Contacts Section */}
      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Saved Contacts
        </h2>
        <p className="text-gray-600 mb-4">
          Select a contact to send money to them quickly
        </p>
        
        {/* Success Message */}
        {showContactSuccess && selectedContact && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800">
                Contact "{selectedContact.nickname || selectedContact.name}" selected for sending money!
              </span>
            </div>
          </div>
        )}

                     <SavedContacts
               onSelect={handleContactSelect}
               onAddNew={handleAddNewContact}
               actionText="Send Money"
               showEditModal={false}
             />
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
    </div>
  );
};

export default SendMoney;
