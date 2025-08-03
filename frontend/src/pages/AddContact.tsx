import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddContactForm } from "../components/AddContactForm";
import { AddContactMethod } from "../components/AddContactMethod";

type ContactStep = 'select-method' | 'payid' | 'account' | 'bank-account';

function AddContact() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<ContactStep>('select-method');

  const handleMethodSelect = (method: 'payid' | 'account' | 'bank-account') => {
    setCurrentStep(method);
  };

  const handleSuccess = () => {
    navigate("/contacts");
  };

  const handleCancel = () => {
    if (currentStep === 'select-method') {
      navigate("/contacts");
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