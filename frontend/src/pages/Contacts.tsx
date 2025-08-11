import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SavedContacts } from "../components/SavedContacts";
import type { Contact } from "../types";

function Contacts() { 
  const navigate = useNavigate();
  const [refreshKey] = useState(0);

  const handleContactSelect = (contact: Contact) => {
    // Navigate to contact details page
    navigate(`/contacts/${contact.id}`);
  };

  const handleAddNew = () => {
    navigate("/add-contact");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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