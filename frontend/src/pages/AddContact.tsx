import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AddContactForm } from "../components/AddContactForm";
import { AddContactMethod } from "../components/AddContactMethod";

type ContactStep = 'select-method' | 'payid' | 'account' | 'bank-account';

function AddContact() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get return path and skip method selection flag from location state
  const returnTo = (location.state as any)?.returnTo || "/contacts";
  const skipMethodSelection = (location.state as any)?.skipMethodSelection || false;
  
  const [currentStep, setCurrentStep] = useState<ContactStep>(
    skipMethodSelection ? 'account' : 'select-method'
  );

  const handleMethodSelect = (method: 'payid' | 'account' | 'bank-account') => {
    setCurrentStep(method);
  };

  const handleSuccess = (newContact?: any) => {
    if (newContact && returnTo === "/request-money") {
      // If we're returning to request-money, pass the new contact
      navigate(returnTo, { state: { newContact } });
    } else {
      navigate(returnTo);
    }
  };

  const handleCancel = () => {
    if (currentStep === 'select-method' || skipMethodSelection) {
      navigate(returnTo);
    } else {
      setCurrentStep('select-method');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'select-method':
        return (
          <AddContactMethod 
            onMethodSelect={handleMethodSelect}
            onCancel={handleCancel}
          />
        );
      case 'payid':
      case 'account':
      case 'bank-account':
        return (
          <AddContactForm 
            method={currentStep}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderStep()}
      </div>
    </div>
  );
}

export default AddContact; 