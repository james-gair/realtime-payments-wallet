import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { authFetch } from "../services/firebaseFetch";
import type { Contact } from "../types";
import { Toast } from "../components/Toast";
import { ConfirmModal } from "../components/ConfirmModal";

const ContactDetails: React.FC = () => {
  const navigate = useNavigate();
  const { contactId } = useParams();
  const location = useLocation();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch contact details
  useEffect(() => {
    const fetchContactDetails = async () => {
      if (!contactId) {
        setError("Contact ID is required");
        setLoading(false);
        return;
      }

      try {
        const response = await authFetch("http://localhost:4000/api/saved-contacts");
        const contacts = await response.json();
        const foundContact = contacts.find((c: Contact) => c.id === parseInt(contactId));
        
        if (!foundContact) {
          setError("Contact not found");
          setLoading(false);
          return;
        }

        setContact(foundContact);
        setNewNickname(foundContact.nickname || "");
      } catch (err) {
        console.error("Failed to load contact details:", err);
        setError("Failed to load contact details");
      } finally {
        setLoading(false);
      }
    };

    fetchContactDetails();
  }, [contactId]);

  // Show toast if navigated here with a message (e.g., after add)
  useEffect(() => {
    const state = location.state as any;
    if (state && state.toast) {
      setToastMessage(state.toast);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleEditNickname = async () => {
    if (!contact) return;

    try {
      const response = await authFetch("http://localhost:4000/api/saved-contacts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          contactId: contact.id, 
          nickname: newNickname.trim() || null 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update nickname");
      }

      const updatedContact = await response.json();
      setContact(prev => prev ? { ...prev, nickname: updatedContact.nickname } : null);
      setShowNicknameModal(false);
      setToastMessage("Nickname updated");
    } catch (err) {
      console.error("Failed to update nickname:", err);
      // Keep in-page error handling minimal
    }
  };

  const handleRemoveContact = async () => {
    if (!contact) return;

    setIsRemoving(true);
    try {
      const response = await authFetch(`http://localhost:4000/api/saved-contacts/${contact.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove contact");
      }

      navigate("/contacts", { state: { toast: `${contact.nickname || contact.name} removed` } });
    } catch (err) {
      console.error("Failed to remove contact:", err);
      // Keep in-page error handling minimal
    } finally {
      setIsRemoving(false);
    }
  };

  const getContactTypeLabel = (contact: Contact) => {
    if (contact.contact_type === 'sendit') return 'SendIt Account';
    if (contact.contact_type === 'payid') return 'PayID';
    if (contact.contact_type === 'bank') {
      if (contact.bsb) return 'Australian Bank Account';
      if (contact.routing_number) return 'US Bank Account';
      if (contact.jp_bank_code) return 'Japan Bank Account';
      return 'Bank Account';
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-8 text-gray-500">Loading contact details...</div>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-8 text-red-500">
            {error || "Contact not found"}
          </div>
          <div className="text-center">
            <button
              onClick={() => navigate("/contacts")}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Back to Contacts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/contacts")}
            className="flex items-center text-black hover:text-zinc-700 mr-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="underline">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Contact Details</h1>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {/* Contact Avatar */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-2xl shadow-sm mr-4 relative">
                {(contact.nickname || contact.name).split(' ').map(n => n[0]).join('')}
                {/* Flag indicator for bank accounts */}
                {contact.contact_type === 'bank' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">
                      {contact.bsb ? "🇦🇺" : contact.routing_number ? "🇺🇸" : contact.jp_bank_code ? "🇯🇵" : "🏦"}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Contact Name */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {contact.nickname || contact.name}
                </h2>
                {contact.nickname && (
                  <p className="text-gray-600">Original name: {contact.name}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/send-money`, { state: { selectedContact: contact } })}
                className="px-6 py-2 border border-green-500 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
              >
                Send
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isRemoving}
                className="px-6 py-2 border border-red-500 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
              >
                {isRemoving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          {/* Account Details Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Account holder name:</span>
                  <span className="font-semibold">{contact.account_holder_name || contact.name}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Account type:</span>
                  <span className="font-semibold">{contact.contact_type === 'bank' ? 'Private' : getContactTypeLabel(contact)}</span>
                </div>

                {contact.contact_type === 'bank' && contact.jp_bank_code && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Account number:</span>
                      <span className="font-semibold">{contact.account_number}</span>
                    </div>
                  </>
                )}

                {contact.contact_type === 'bank' && contact.bsb && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">BSB:</span>
                      <span className="font-semibold">{contact.bsb}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Account number:</span>
                      <span className="font-semibold">{contact.account_number}</span>
                    </div>
                  </>
                )}

                {contact.contact_type === 'bank' && contact.routing_number && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Routing number:</span>
                      <span className="font-semibold">{contact.routing_number}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Account number:</span>
                      <span className="font-semibold">{contact.account_number}</span>
                    </div>
                  </>
                )}

                {contact.contact_type === 'bank' && contact.account_email && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Email (Optional):</span>
                    <span className="font-semibold">{contact.account_email}</span>
                  </div>
                )}

                {contact.email && contact.contact_type !== 'bank' && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Email:</span>
                    <span className="font-semibold">{contact.email}</span>
                  </div>
                )}

                {contact.phone && contact.contact_type !== 'bank' && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Phone:</span>
                    <span className="font-semibold">{contact.phone}</span>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Nickname:</span>
                  <button
                    onClick={() => {
                      setNewNickname(contact.nickname || "");
                      setShowNicknameModal(true);
                    }}
                    className="text-green-600 underline hover:text-green-700"
                  >
                    {contact.nickname ? "Edit nickname" : "Add nickname"}
                  </button>
                </div>

                {contact.contact_type === 'bank' && contact.bsb && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Bank name:</span>
                      <span className="font-semibold">Commonwealth Bank</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Account type:</span>
                      <span className="font-semibold">Savings</span>
                    </div>
                  </>
                )}

                {contact.contact_type === 'bank' && contact.routing_number && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Bank name:</span>
                      <span className="font-semibold">JPMORGAN CHASE BANK, NA</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Account type:</span>
                      <span className="font-semibold">Checking</span>
                    </div>
                  </>
                )}

                {contact.contact_type === 'sendit' && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Account provider:</span>
                    <span className="font-semibold">SendIt</span>
                  </div>
                )}

                {contact.contact_type === 'bank' && contact.jp_bank_code && (
                  <>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Bank code:</span>
                      <span className="font-semibold">{contact.jp_bank_code}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Branch code:</span>
                      <span className="font-semibold">{contact.jp_branch_code}</span>
                    </div>
                  </>
                )}


              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Nickname Edit Modal */}
      {showNicknameModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4"
          onClick={() => setShowNicknameModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add nickname</h3>
              <button
                onClick={() => setShowNicknameModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              Add a nickname so you can easily find this account.
            </p>

            {/* Input Field */}
            <div className="mb-6">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                Account nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Enter nickname"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                maxLength={40}
                autoFocus
              />
              <div className="text-sm text-gray-500 mt-1 text-right">
                {newNickname.length}/40
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleEditNickname}
              className="w-full py-3 bg-black hover:bg-zinc-800 text-white font-semibold rounded-lg transition-all"
            >
              Save
            </button>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <ConfirmModal
          message={`Are you sure you want to remove ${contact?.nickname || contact?.name}?`}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            handleRemoveContact();
          }}
        />
      )}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default ContactDetails; 