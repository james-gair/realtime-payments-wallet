import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SavedContacts } from "../components/SavedContacts";
import { SendToUserForm } from "../components/SendToUserForm";
import { SendToBankForm } from "../components/SendToBankForm";
import { authFetch } from "../services/firebaseFetch";
import type { Card, PaymentRequest, SentPayment, Contact } from "../types";

type SendStep = 'select-contact' | 'send-details' | 'confirmation';

interface SendFormData {
  currency: string;
  amount: string;
  description: string;
}

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
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<SendStep>('select-contact');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<SendFormData>({
    currency: '',
    amount: '',
    description: ''
  });

  // Payment requests functionality
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "user" | "bank">("requests");

  // Mock user wallets - in real app this would come from API
  const userWallets = [
    { currency: 'AUD', currencyCode: 'AUD' },
    { currency: 'USD', currencyCode: 'USD' },
    { currency: 'EUR', currencyCode: 'EUR' }
  ];

  // Check if we're returning from adding a contact
  useEffect(() => {
    const newContact = (location.state as any)?.newContact;
    if (newContact) {
      // If we have a new contact, automatically select it and go to send details
      setSelectedContact(newContact);
      setCurrentStep('send-details');
      // Clear the state to prevent re-triggering
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const fetchPaymentRequests = async () => {
    try {
      const response = await authFetch("http://localhost:4000/api/payment-request/received", {
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

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setCurrentStep('send-details');
  };

  const handleAddNewContact = () => {
    navigate("/add-contact", { 
      state: { 
        returnTo: "/send-money"
      } 
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitSend = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContact) {
      alert("No contact selected");
      return;
    }

    if (!formData.currency || !formData.amount) {
      alert("Please fill in all required fields");
      return;
    }

    // Go to confirmation step
    setCurrentStep('confirmation');
  };

  const handleConfirmSend = () => {
    if (!selectedContact) {
      alert("No contact selected");
      return;
    }

    // TODO: Submit send to backend
    console.log("Send money:", {
      contact: selectedContact,
      currency: formData.currency,
      amount: formData.amount,
      description: formData.description
    });

    alert(`Payment sent to ${selectedContact.nickname || selectedContact.name} for ${formData.currency} ${formData.amount}`);
    
    // Reset and go back to contact selection
    setCurrentStep('select-contact');
    setSelectedContact(null);
    setFormData({ currency: '', amount: '', description: '' });
  };

  const handleBackToContacts = () => {
    setCurrentStep('select-contact');
    setSelectedContact(null);
    setFormData({ currency: '', amount: '', description: '' });
  };

  const handleBackToDetails = () => {
    setCurrentStep('send-details');
  };

  // Payment request handlers
  const handleClickPaymentRequest = (payment: PaymentRequest) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleSubmitPayment = async () => {
    if (!selectedPayment) return;

    try {
      const response = await authFetch(
        `http://localhost:4000/api/payment-request/${selectedPayment.id}/settle`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to settle payment.");
      }

      alert(`Payment to ${selectedPayment.username_from} settled.`);
      setIsModalOpen(false);
      setSelectedPayment(null);

      // Refresh list
      fetchPaymentRequests();
    } catch (error) {
      console.error("Error settling payment:", error);
      alert("Could not settle payment. Please try again.");
    }
  };

  useEffect(() => {
    fetchCards();
    fetchPaymentRequests();
  }, []);

  const renderContactSelection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Send Money</h1>
        <p className="text-gray-600 mt-2">
          Pay friends quickly or send money to any bank account
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-4 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "requests" ? "border-b-2 border-black text-black" : "text-gray-500"
          }`}
        >
          Settle Payment Requests
        </button>
        <button
          onClick={() => setActiveTab("user")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "user" ? "border-b-2 border-black text-black" : "text-gray-500"
          }`}
        >
          Send to Users
        </button>
        <button
          onClick={() => setActiveTab("bank")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "bank" ? "border-b-2 border-black text-black" : "text-gray-500"
          }`}
        >
          Send to Bank
        </button>
      </div>

      {/* Conditional Content */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2"> Payment Requests from Friends</h2>
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
      )}

      {activeTab === "user" && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Send to Friend</h2>
          <p className="text-gray-600 mb-4">
            Transfer money instantly to another user by username
          </p>
          <SendToUserForm cards={cards} />
        </div>
      )}

      {activeTab === "bank" && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Send to Bank Account</h2>
          <p className="text-gray-600 mb-4">
            Transfer money directly to any bank account
          </p>
          <SendToBankForm
            cards={cards}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
          />
        </div>
      )}

      {/* Send to Contact Section */}
      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Who are you sending to?
        </h2>
        <p className="text-gray-600 mb-4">
          Select a contact to send money to them quickly
        </p>

        <SavedContacts 
          onSelect={handleContactSelect}
          onAddNew={handleAddNewContact}
          actionText="Send Money"
          showEditModal={false}
        />
      </div>
    </div>
  );

  const renderSendDetails = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center mb-4">
          <button
            onClick={handleBackToContacts}
            className="flex items-center text-black hover:text-zinc-700 mr-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="underline">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Send Money Details</h1>
        </div>
        <p className="text-gray-600 mt-2">
          Send money to {selectedContact?.nickname || selectedContact?.name}
        </p>
      </div>

      {/* Send Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmitSend} className="space-y-6">
          {/* Currency Selection */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency *
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              required
            >
              <option value="">Select a currency</option>
              {userWallets.map(wallet => (
                <option key={wallet.currencyCode} value={wallet.currencyCode}>
                  {wallet.currency}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              required
              min="0"
              step="0.01"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-black hover:bg-zinc-800 text-white font-semibold rounded-lg transition-all"
          >
            Continue to Review
          </button>
        </form>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center mb-4">
          <button
            onClick={handleBackToDetails}
            className="flex items-center text-black hover:text-zinc-700 mr-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="underline">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Confirm Payment</h1>
        </div>
        <p className="text-gray-600 mt-2">
          Review your payment details before sending
        </p>
      </div>

      {/* Confirmation Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-gray-600">To:</span>
            <span className="font-semibold">{selectedContact?.nickname || selectedContact?.name}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold">{formData.currency} {formData.amount}</span>
          </div>
          {formData.description && (
            <div className="flex justify-between items-start py-3 border-b border-gray-200">
              <span className="text-gray-600">Description:</span>
              <span className="font-semibold text-right max-w-xs">{formData.description}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600">Contact Type:</span>
            <span className="font-semibold capitalize">{selectedContact?.added_by?.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleConfirmSend}
            className="w-full py-3 bg-black hover:bg-zinc-800 text-white font-semibold rounded-lg transition-all"
          >
            Send Payment
          </button>
          <button
            onClick={handleBackToDetails}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-all"
          >
            Edit Details
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {currentStep === 'select-contact' ? renderContactSelection() : 
       currentStep === 'send-details' ? renderSendDetails() : 
       renderConfirmation()}

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
};

export default SendMoney;