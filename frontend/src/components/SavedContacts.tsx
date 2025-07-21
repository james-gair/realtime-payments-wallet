import { useEffect, useState } from "react";

interface Contact {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
}

const mockContacts: Contact[] = [
  {
    id: 1,
    name: "John Doe",
    username: "john.doe",
    email: "john.doe@example.com",
    phone: "1234567890",
  },
  {
    id: 2,
    name: "Jane Doe",
    username: "jane.doe",
    email: "jane.doe@example.com",
    phone: "1234567890",
  },
  {
    id: 3,
    name: "Jim Doe",
    username: "jim.doe",
    email: "jim.doe@example.com",
    phone: "1234567890",
  },
];

export function SavedContacts({
  onSelect,
  onAddNew,
  actionText = "Select"
}: {
  onSelect: (contact: Contact) => void;
  onAddNew?: () => void;
  actionText?: string;
}) {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>(mockContacts);

  // useEffect(() => {
  //   const fetchContacts = async () => {
  //     const response = await fetch("/api/contacts");
  //     const data = await response.json();
  //     setContacts(data);
  //   };
  //   fetchContacts();
  // }, []);

  // Filter contacts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  const handleSelect = (contact: Contact) => {
    onSelect(contact);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Your Contacts</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filteredContacts.length} of {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
        <button 
          onClick={onAddNew}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Add New</span>
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
          placeholder="Search contacts by name, username, or email..."
          className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filteredContacts.map((contact, index) => (
          <div 
            key={contact.id} 
            onClick={() => handleSelect(contact)}
            className="group relative p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:cursor-pointer bg-white hover:bg-blue-50/30"
          >
            {/* Subtle gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/20 group-hover:to-transparent rounded-xl transition-all duration-200"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Contact Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                  {contact.name.split(' ').map(n => n[0]).join('')}
                </div>
                
                {/* Contact Info */}
                <div className="flex-1">
                  <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                    {contact.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    @{contact.username}
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
                  {actionText}
                </span>
                <div className="w-8 h-8 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-all duration-200">
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

      {/* No Search Results */}
      {searchQuery && filteredContacts.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
          <p className="text-sm text-gray-500 mb-4">No contacts match "{searchQuery}"</p>
          <button 
            onClick={clearSearch}
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Empty State (if no contacts) */}
      {contacts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No contacts yet</h3>
          <p className="text-sm text-gray-500 mb-6">Add your first contact to get started</p>
          <button 
            onClick={onAddNew}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:shadow-md"
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
