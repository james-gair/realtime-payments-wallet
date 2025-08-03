import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SavedContacts } from "../components/SavedContacts";
import type { Contact } from "../types";

function Contacts() { 
  const navigate = useNavigate();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleContactSelect = (contact: Contact) => {
    // Navigate to contact details page
    navigate(`/contacts/${contact.id}`);
  };

  const handleAddNew = () => {
    navigate("/add-contact");
  };

  const handleContactAdded = () => {
    // Trigger a refresh of the contacts list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {showSuccess && selectedContact && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800">
                Contact "{selectedContact.nickname || selectedContact.name}" updated successfully!
              </span>
            </div>
          </div>
        )}

        <SavedContacts 
          key={refreshKey}
          onSelect={handleContactSelect}
          onAddNew={handleAddNew}
          actionText="View"
          showEditModal={false}
        />
      </div>
    </div>
  );
}

export default Contacts;