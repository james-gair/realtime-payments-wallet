import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SavedContacts } from "../components/SavedContacts";
import { authFetch } from "../services/firebaseFetch";
import type { Card, PaymentRequest, Contact } from "../types";

type SendStep = 'select-contact' | 'send-details' | 'confirmation';

interface SendFormData {
  currency: string;
  amount: string;
  description: string;
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
              <span className="font-medium">To:</span> {recipient}
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
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [activeTab, setActiveTab] = useState<"send" | "requests">("send");

  // Transfer functionality
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState({
    amount: "",
    recipient: "",
    currency: "",
    symbol: "",
  });

  // Check if we're returning from adding a contact
  useEffect(() => {
    const state = (location.state as any) || {};
    const inbound = state.newContact || state.selectedContact;
    if (inbound) {
      setSelectedContact(inbound);
      setCurrentStep('send-details');
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
      // optionally set a default card for display
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

  const getTransferWallet = () => {
    return cards.find((card) => card.currency === formData.currency);
  };

  const getTransferSymbol = () => {
    const wallet = getTransferWallet();
    return wallet?.symbol || "";
  };

  const formatBalance = (balance: number, currency: string): string => {
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: currency === "JPY" ? 0 : 2,
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    });
  };

  const handleSubmitSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContact) {
      alert("No contact selected");
      return;
    }

    if (!formData.currency || !formData.amount) {
      alert("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    const wallet = getTransferWallet();

    if (!wallet || amount > wallet.balance) {
      alert("Insufficient balance");
      return;
    }

    setIsLoading(true);

    try {
      // Build payload based on standardized contact_type
      const basePayload = {
        currencyCode: formData.currency,
        amount: amount,
        description: formData.description,
      } as any;

      let payload: any = { ...basePayload };

      if (selectedContact.contact_type === 'sendit' && selectedContact.username) {
        payload.recipientUsername = selectedContact.username;
      } else if (selectedContact.contact_type === 'payid') {
        if (selectedContact.email) {
          payload.recipientEmail = selectedContact.email;
        } else if (selectedContact.phone) {
          payload.recipientPhone = selectedContact.phone;
        } else {
          throw new Error('Selected PayID contact missing email/phone');
        }
      } else {
        throw new Error('Unsupported contact type for this flow');
      }

      const response = await authFetch(
        "http://localhost:4000/api/send-money",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        // Store success details
        setSuccessDetails({
          amount: formData.amount,
          recipient: selectedContact.nickname || selectedContact.name,
          currency: formData.currency,
          symbol: getTransferSymbol(),
        });

        // Reset form
        setFormData({ currency: '', amount: '', description: '' });
        setSelectedContact(null);
        setCurrentStep('select-contact');

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

  // const handleConfirmSend = () => {
  //   if (!selectedContact) {
  //     alert("No contact selected");
  //     return;
  //   }
  //   setCurrentStep('confirmation');
  // };

  const handleBackToContacts = () => {
    setCurrentStep('select-contact');
    setSelectedContact(null);
    setFormData({ currency: '', amount: '', description: '' });
  };

  const handleBackToDetails = () => {
    setCurrentStep('send-details');
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessDetails({ amount: "", recipient: "", currency: "", symbol: "" });
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
          Pay friends quickly or settle payment requests
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-4 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveTab("send")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "send" ? "border-b-2 border-black text-black" : "text-gray-500"
          }`}
        >
          Send to Someone
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "requests" ? "border-b-2 border-black text-black" : "text-gray-500"
          }`}
        >
          Settle Payment Requests
        </button>
      </div>

      {/* Conditional Content */}
      {activeTab === "send" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Who are you sending to?
            </h2>
            <p className="text-gray-600">
              Select a contact to send money to them quickly
            </p>
          </div>

          <SavedContacts 
            onSelect={handleContactSelect}
            onAddNew={handleAddNewContact}
            actionText="Send Money"
            showEditModal={false}
            allowedTypes={['sendit','payid']}
          />
        </div>
      )}

      {activeTab === "requests" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Requests from Friends</h2>
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
              {cards.map(card => (
                <option key={card.currency} value={card.currency}>
                  {card.currency} ({card.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-lg">
                  {formData.currency === 'AUD' ? 'A$' : 
                   formData.currency === 'USD' ? '$' : 
                   formData.currency === 'EUR' ? '€' : 
                   formData.currency === 'JPY' ? '¥' : ''}
                </span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                required
                min="0"
                step="0.01"
                max={getTransferWallet()?.balance || 0}
              />
            </div>

            {/* Balance Display */}
            {getTransferWallet() && (
              <p className="text-sm text-gray-500 mt-1">
                Available Balance: {getTransferSymbol()}
                {formatBalance(getTransferWallet()!.balance, formData.currency)}
              </p>
            )}

            {/* Insufficient balance warning */}
            {getTransferWallet() &&
              formData.amount &&
              parseFloat(formData.amount) > getTransferWallet()!.balance && (
                <p className="text-red-600 text-sm mt-1">
                  Insufficient balance. Available: {getTransferSymbol()}
                  {formatBalance(
                    getTransferWallet()!.balance,
                    formData.currency
                  )}
                </p>
              )}
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
            disabled={
              !formData.amount ||
              !formData.currency ||
              !selectedContact ||
              isLoading ||
              (getTransferWallet() &&
                parseFloat(formData.amount) > getTransferWallet()!.balance)
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
                  {formData.amount || "0"} to {selectedContact?.nickname || selectedContact?.name || "contact"}
                </span>
              </>
            )}
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
            <span className="font-semibold">
              {formData.currency === 'AUD' ? 'A$' : 
               formData.currency === 'USD' ? '$' : 
               formData.currency === 'EUR' ? '€' : 
               formData.currency === 'JPY' ? '¥' : ''}{formData.amount}
            </span>
          </div>
          {formData.description && (
            <div className="flex justify-between items-start py-3 border-b border-gray-200">
              <span className="text-gray-600">Description:</span>
              <span className="font-semibold text-right max-w-xs">{formData.description}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600">Contact Type:</span>
            <span className="font-semibold">{selectedContact?.contact_type === 'sendit' ? 'SendIt' : selectedContact?.contact_type === 'payid' ? 'PayID' : 'Bank'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleSubmitSend}
            disabled={isLoading}
            className="w-full py-3 bg-black hover:bg-zinc-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              "Send Payment"
            )}
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        amount={successDetails.amount}
        recipient={successDetails.recipient}
        currency={successDetails.currency}
        currencySymbol={successDetails.symbol}
      />
    </div>
  );
};

export default SendMoney;