import { useEffect, useState } from "react";
import { authFetch } from "../services/firebaseFetch";
import type { Contact } from "../types";
import { EditNicknameModal } from "./EditNicknameModal";

export function SavedContacts({
  onSelect,
  onAddNew,
  actionText = "Select",
  showEditModal = true,
  filterAccountOnly = false,
}: {
  onSelect: (contact: Contact) => void;
  onAddNew?: () => void;
  actionText?: string;
  showEditModal?: boolean;
  filterAccountOnly?: boolean;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch contacts from backend
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await authFetch("http://localhost:4000/api/saved-contacts");
        const text = await response.text();
        console.log("Raw response text:", text);
        const data = JSON.parse(text);
        setContacts(data);
      } catch (err: any) {
        console.error("Failed to load saved contacts:", err);
        setError("Failed to load saved contacts.");
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  // Filter contacts based on search query and account-only filter
  useEffect(() => {
    let filtered = contacts;
    
    // Filter to only show account contacts if requested
    if (filterAccountOnly) {
      filtered = contacts.filter(contact => contact.contact_account_id !== null);
    }
    
    if (!searchQuery.trim()) {
      setFilteredContacts(filtered);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredContacts(
        filtered.filter(contact => {
          // Remove @ symbol from search query for username matching
          const cleanQuery = q.startsWith('@') ? q.substring(1) : q;
          
          return (
            (contact.nickname || "").toLowerCase().includes(q) ||
            (contact.name || "").toLowerCase().includes(q) ||
            (contact.username || "").toLowerCase().includes(cleanQuery) ||
            (contact.email || "").toLowerCase().includes(q) ||
            (contact.phone || "").toLowerCase().includes(q) ||
            // Also match @username format
            (contact.username && `@${contact.username.toLowerCase()}`.includes(q))
          );
        })
      );
    }
  }, [searchQuery, contacts, filterAccountOnly]);

  const handleSelect = (contact: Contact) => {
    if (showEditModal) {
      setSelectedContact(contact);
      setIsEditModalOpen(true);
    } else {
      // Directly call onSelect without opening modal
      onSelect(contact);
    }
  };

  const handleSaveNickname = async (contactId: number, nickname: string | null) => {
    try {
      const response = await authFetch("http://localhost:4000/api/saved-contacts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contactId, nickname }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update nickname");
      }

      const updatedContact = await response.json();
      
      // Update the contact in the local state
      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact.id === contactId
            ? { ...contact, nickname: updatedContact.nickname }
            : contact
        )
      );

      // Call the original onSelect callback
      onSelect(selectedContact!);
    } catch (err: any) {
      throw new Error(err.message || "Failed to update nickname");
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedContact(null);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Main label: nickname if present, otherwise certified name
  const getMainLabel = (contact: Contact) => {
    return contact.nickname && contact.nickname.trim().length > 0
      ? contact.nickname
      : contact.name;
  };

  // Sub-label: for username, show @username; for others, show the value used to add them
  const getSubLabel = (contact: Contact) => {
    switch (contact.added_by) {
      case "username":
        return contact.username ? `@${contact.username}` : `@${contact.added_value}`;
      case "email":
      case "phone":
      case "bank_account":
        return contact.added_value;
      default:
        return "";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-2 py-4 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg sm:text-xl">
            Your Contacts
          </h3>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:shadow-md text-sm font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add New</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Name, username, email, phone"
          className="block w-full pl-10 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-2 flex items-center"
          >
            <svg
              className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Loading and error states */}
      {loading && (
        <div className="text-center py-8 text-gray-500">Loading contacts...</div>
      )}
      {error && (
        <div className="text-center py-8 text-red-500">{error}</div>
      )}

      {/* Contacts List */}
      {!loading && !error && (
        <div className="space-y-2 sm:space-y-3">
          {filteredContacts.map((contact, index) => (
            <div 
              key={contact.id} 
              onClick={() => handleSelect(contact)}
              className="group relative p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:cursor-pointer bg-white hover:bg-blue-50/30"
            >
              {/* Subtle gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/20 group-hover:to-transparent rounded-xl transition-all duration-200"></div>
              <div className="relative flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {/* Contact Avatar */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-base sm:text-lg shadow-sm">
                    {/* Use initials from nickname or username */}
                    {(getMainLabel(contact) || "").split(' ').map(n => n[0]).join('')}
                  </div>
                  {/* Contact Info */}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base">
                      {getMainLabel(contact)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {getSubLabel(contact)}
                    </div>
                  </div>
                </div>
                {/* Action Button */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
                    {actionText}
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-all duration-200">
                    <svg 
                      className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Subtle bottom border for separation */}
              {index < filteredContacts.length - 1 && (
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && searchQuery && filteredContacts.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            No contacts found
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">
            No contacts match "{searchQuery}"
          </p>
          <button
            onClick={clearSearch}
            className="text-xs sm:text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Empty State (if no contacts) */}
      {!loading && !error && contacts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            No contacts yet
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-6">
            Add your first contact to get started
          </p>
          <button
            onClick={onAddNew}
            className="inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:shadow-md text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="font-medium">Add Your First Contact</span>
          </button>
        </div>
      )}

      {/* Edit Nickname Modal */}
      <EditNicknameModal
        contact={selectedContact}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveNickname}
      />
    </div>
  );
}
