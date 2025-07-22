import React, { useState } from 'react';

interface FormState {
  amount: string;
  recipient: string;
  description: string;
}

const RequestPage: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    amount: '',
    recipient: '',
    description: '',
  });

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  // Handle form submission (for now, it doesn't do anything)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', formData);
  };

  return (
    <div className="flex justify-between p-8">
      {/* Right Section: Request Payment Form */}
      <div className="w-1/2 p-6 border rounded-lg">
        <h2 className="text-center text-2xl font-bold mb-6">Request Payment</h2>
        <form onSubmit={handleSubmit}>
          {/* Amount Field */}
          <div className="mb-4">
            <label htmlFor="amount" className="block text-lg font-semibold mb-2">Amount</label>
            <input
              type="number"
              id="amount"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md text-lg"
            />
          </div>

          {/* Recipient Field */}
          <div className="mb-4">
            <label htmlFor="recipient" className="block text-lg font-semibold mb-2">Recipient</label>
            <input
              type="text"
              id="recipient"
              placeholder="Enter recipient name"
              value={formData.recipient}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md text-lg"
            />
          </div>

          {/* Description Field */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-lg font-semibold mb-2">Description</label>
            <textarea
              id="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md text-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full p-3 bg-green-500 text-white text-lg font-semibold rounded-md hover:bg-green-400"
          >
            Request Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestPage;