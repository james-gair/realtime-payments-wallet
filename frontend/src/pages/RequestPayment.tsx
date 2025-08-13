import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SavedContacts } from "../components/SavedContacts";
import { authFetch } from "../services/firebaseFetch";
import type { Contact, Card } from "../types";

type RequestStep = 'select-contact' | 'request-details';

interface RequestFormData {
  currency: string;
  amount: string;
  description: string;
}

const RequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<RequestStep>('select-contact');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<RequestFormData>({
    currency: '',
    amount: '',
    description: ''
  });

  // Toggle state for viewing sent requests
  const [view, setView] = useState<"request" | "sent">("request");
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  // Check if we're returning from adding a contact and resolve to full saved contact
  useEffect(() => {
    const newContact = (location.state as any)?.newContact;
    const resolveAndProceed = async () => {
      if (!newContact) return;
      if (newContact.id && newContact.contact_account_id) {
        setSelectedContact(newContact);
        setCurrentStep('request-details');
        navigate(location.pathname, { replace: true });
        return;
      }
      const id = newContact.contactId || newContact.id;
      if (!id) return;
      try {
        const resp = await authFetch("http://localhost:4000/api/saved-contacts");
        const list: Contact[] = await resp.json();
        const found = Array.isArray(list) ? list.find(c => c.id === id) : null;
        if (found) {
          setSelectedContact(found);
          setCurrentStep('request-details');
        }
      } finally {
        navigate(location.pathname, { replace: true });
      }
    };
    resolveAndProceed();
  }, [location.state, navigate, location.pathname]);

  // Fetch sent requests when view changes to "sent"
  useEffect(() => {
    if (view === "sent") {
      fetchSentRequests();
    }
  }, [view]);

  const fetchSentRequests = async () => {
    try {
      const response = await authFetch(
        "http://localhost:4000/api/payment-request/sent"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sent payment requests");
      }
      const result = await response.json();
      setSentRequests(result.data);
    } catch (err) {
      console.error("Error fetching sent requests:", err);
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
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setCurrentStep('request-details');
  };

  const handleAddNewContact = () => {
    navigate("/add-contact", { 
      state: { 
        returnTo: "/request-money",
        skipMethodSelection: true 
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

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContact) {
      alert("No contact selected");
      return;
    }

    if (!formData.currency || !formData.amount) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const requestData = {
        amount: parseFloat(formData.amount),
        recipientId: selectedContact.contact_account_id,
        description: formData.description,
        currencyCode: formData.currency,
      } as any;
      // Ensure required fields for account-based requests
      if (!requestData.recipientId) {
        throw new Error("Selected contact is not a SendIt account");
      }


      const response = await authFetch("http://localhost:4000/api/payment-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Log server response message
        console.error("❌ Server returned error:", response.status, errorText);
        throw new Error("Failed to send payment request");
      }

      const result = await response.json();
      console.log("Payment request submitted:", result);
      
      alert(`Payment request sent to ${selectedContact.nickname || selectedContact.name} for ${formData.currency} ${formData.amount}`);
      
      // Reset and go back to contact selection
      setCurrentStep('select-contact');
      setSelectedContact(null);
      setFormData({ currency: '', amount: '', description: '' });
      
      // Switch to sent requests after submitting
      setView("sent");
      await fetchSentRequests();
    } catch (err) {
      console.error("Error:", err);
      console.error("❌ Error caught in handleSubmitRequest:", err);
      alert("Failed to send payment request. Please try again.");
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this payment request?")) return;

    try {
      const response = await authFetch(`http://localhost:4000/api/payment-request/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel payment request");
      }

      alert("Payment request cancelled.");
      await fetchSentRequests();
    } catch (err) {
      console.error("Error cancelling payment request:", err);
      alert("Error cancelling payment request");
    }
  };

  const handleBackToContacts = () => {
    setCurrentStep('select-contact');
    setSelectedContact(null);
    setFormData({ currency: '', amount: '', description: '' });
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const renderContactSelection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {view === "request" ? "Request Payment" : "Previously Sent Requests"}
        </h1>
        <p className="text-gray-600 mt-2">
          {view === "request" 
            ? "Select a contact to request money from them"
            : "View and manage your sent payment requests"
          }
        </p>
      </div>

      {/* Toggle Buttons */}
      <div className="flex justify-center border-b border-gray-300 mb-8">
        <button
          onClick={() => setView("request")}
          className={`py-3 px-6 -mb-px font-semibold transition-colors duration-300 ${
            view === "request"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Request Payment
        </button>
        <button
          onClick={() => setView("sent")}
          className={`py-3 px-6 -mb-px font-semibold transition-colors duration-300 ${
            view === "sent"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Sent Requests
        </button>
      </div>

      {view === "request" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Select a Contact
            </h2>
            <p className="text-gray-600">
              Choose a contact to request money from. You can only request from users who have an account.
            </p>
          </div>

          <SavedContacts 
            onSelect={handleContactSelect}
            onAddNew={handleAddNewContact}
            actionText="Request Money"
            showEditModal={false}
            filterAccountOnly={true}
            allowedTypes={['sendit']}
          />
        </div>
      )}

      {view === "sent" && (
        <div>
          {sentRequests.length === 0 ? (
            <p className="text-gray-500">No sent requests yet.</p>
          ) : (
            <ul className="space-y-4">
              {sentRequests.map((req) => (
                <li
                  key={req.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-800 font-medium">
                     To: <span className="font-bold">@{req.recipient_username}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-gray-700">Amount: ${req.amount}</div>
                  <div className="text-gray-600 text-sm mt-1">{req.description}</div>
                  <div className="text-sm mt-2 text-purple-500 font-semibold">
                    Status: {req.status}
                  </div>

                  {req.status === "pending" && (
                    <button
                      onClick={() => handleCancel(req.id)}
                      className="mt-3 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                      Cancel
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );

  const renderRequestDetails = () => (
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
          <h1 className="text-3xl font-bold text-gray-900">Request Payment Details</h1>
        </div>
        <p className="text-gray-600 mt-2">
          Request money from {selectedContact?.nickname || selectedContact?.name}
        </p>
      </div>

      {/* Request Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmitRequest} className="space-y-6">
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
              />
            </div>
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
            Send Payment Request
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {currentStep === 'select-contact' ? renderContactSelection() : renderRequestDetails()}
    </div>
  );
};

export default RequestPage;