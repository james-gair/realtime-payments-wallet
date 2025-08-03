import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SavedContacts } from "../components/SavedContacts";
import type { Contact } from "../types";

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

  // Check if we're returning from adding a contact
  useEffect(() => {
    const newContact = (location.state as any)?.newContact;
    if (newContact) {
      // If we have a new contact, automatically select it and go to request details
      setSelectedContact(newContact);
      setCurrentStep('request-details');
      // Clear the state to prevent re-triggering
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Mock user wallets - in real app this would come from API
  const userWallets = [
    { currency: 'AUD', currencyCode: 'AUD' },
    { currency: 'USD', currencyCode: 'USD' },
    { currency: 'EUR', currencyCode: 'EUR' }
  ];

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

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContact) {
      alert("No contact selected");
      return;
    }

    if (!formData.currency || !formData.amount) {
      alert("Please fill in all required fields");
      return;
    }

    // TODO: Submit request to backend
    console.log("Payment request:", {
      contact: selectedContact,
      currency: formData.currency,
      amount: formData.amount,
      description: formData.description
    });

    alert(`Payment request sent to ${selectedContact.nickname || selectedContact.name} for ${formData.currency} ${formData.amount}`);
    
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

  const renderContactSelection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Request Payment</h1>
        <p className="text-gray-600 mt-2">
          Select a contact to request money from them
        </p>
      </div>

      {/* Saved Contacts Section */}
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
        />
      </div>
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