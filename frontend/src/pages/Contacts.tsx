import { useState } from "react";
import { SavedContacts } from "../components/SavedContacts";
import type { Contact } from "../types";

function Contacts() { 
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setShowSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleAddNew = () => {
    // TODO: Navigate to add contact page
    console.log("Navigate to add contact page");
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
          onSelect={handleContactSelect}
          onAddNew={handleAddNew}
          actionText="Edit"
        />
      </div>
    </div>
  );
}

export default Contacts;