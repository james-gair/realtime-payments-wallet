import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SavedContacts } from "../components/SavedContacts";
import type { Contact } from "../types";
import { Toast } from "../components/Toast";

function Contacts() { 
  const navigate = useNavigate();
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleContactSelect = (contact: Contact) => {
    // Navigate to contact details page
    navigate(`/contacts/${contact.id}`);
  };

  const handleAddNew = () => {
    navigate("/add-contact");
  };

  // Show toast passed via navigation state (e.g., after delete)
  useEffect(() => {
    const state = location.state as any;
    if (state && state.toast) {
      setToastMessage(state.toast);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SavedContacts 
          onSelect={handleContactSelect}
          onAddNew={handleAddNew}
          actionText="View"
          showEditModal={false}
        />
      </div>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}

export default Contacts;