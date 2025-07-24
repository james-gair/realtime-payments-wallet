import { useEffect, useState } from "react";
import { authFetch } from "../services/firebaseFetch";

interface Contact {
  id: number; // saved contact id
  nickname?: string | null;
  name: string; // always present, certified at time of adding
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  bank_account?: string | null; // for future use
  added_by: "username" | "email" | "phone" | "bank_account"; // how the contact was added
  added_value: string; // the value used to add the contact
}

export function SavedContacts({
  onSelect,
  onAddNew,
  actionText = "Select"
}: {
  onSelect: (contact: Contact) => void;
  onAddNew?: () => void;
  actionText?: string;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Filter contacts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredContacts(
        contacts.filter(contact =>
          (contact.nickname || "").toLowerCase().includes(q) ||
          (contact.name || "").toLowerCase().includes(q) ||
          (contact.username || "").toLowerCase().includes(q) ||
          (contact.email || "").toLowerCase().includes(q) ||
          (contact.phone || "").toLowerCase().includes(q)
          // Add more fields here for future extensibility (e.g., bank_account)
        )
      );
    }
  }, [searchQuery, contacts]);

  const handleSelect = (contact: Contact) => {
    onSelect(contact);
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
          <h3 className="font-semibold text-gray-900 text-lg sm:text-xl">Your Contacts</h3>
        </div>
        <button 
          onClick={onAddNew}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:shadow-md text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                    {/*
                    // Uncomment and extend here for more details in the future, e.g.:
                    // {contact.bank_account && <div>Bank: {contact.bank_account}</div>}
                    */}
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
                        d="M9 5l7 7-7 7" 
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
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">No contacts match "{searchQuery}"</p>
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
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No contacts yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-6">Add your first contact to get started</p>
          <button 
            onClick={onAddNew}
            className="inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:shadow-md text-sm sm:text-base"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Add Your First Contact</span>
          </button>
        </div>
      )}
    </div>
  );
}
