import React, { useState } from "react";

const SentPayments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const paymentRequests = [
    { id: 1, recipient: "John Doe", amount: 100, description: "Payment for services" },
    { id: 2, recipient: "Jane Smith", amount: 200, description: "Payment for goods" },
    { id: 3, recipient: "Bob Johnson", amount: 50, description: "Reimbursement" },
  ];

  const sentPayments = [
    { id: 1, recipient: "Alice", amount: 150, description: "Payment for project" },
    { id: 2, recipient: "Charlie", amount: 300, description: "Payment for consulting" },
  ];

  const handleClickPaymentRequest = (payment: any) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleSubmitPayment = () => {
    // Logic for settling payment here
    alert(`Payment to ${selectedPayment.recipient} settled.`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Payment Requests Section */}
      <div>
        <h2 className="text-2xl font-bold text-center">Payment Requests</h2>
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <ul role="list" className="divide-y divide-gray-200">
            {paymentRequests.map((payment) => (
              <li
                key={payment.id}
                className="flex justify-between gap-x-6 px-6 py-5 cursor-pointer hover:bg-gray-100"
                onClick={() => handleClickPaymentRequest(payment)}
              >
                <div className="flex gap-x-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {payment.recipient}
                    </p>
                    <p className="truncate text-sm text-gray-500">{payment.description}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-lg font-semibold text-gray-900">${payment.amount}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sent Payments Section */}
      <div>
        <h2 className="text-2xl font-bold text-center">Sent Payment Requests</h2>
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <ul role="list" className="divide-y divide-gray-200">
            {sentPayments.map((payment) => (
              <li key={payment.id} className="flex justify-between gap-x-6 px-6 py-5">
                <div className="flex gap-x-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {payment.recipient}
                    </p>
                    <p className="truncate text-sm text-gray-500">{payment.description}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-lg font-semibold text-gray-900">${payment.amount}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal for Settling Payment Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-xl font-bold text-center">Settle Payment</h3>
            <div className="mt-4">
              <p>
                <strong>Recipient:</strong> {selectedPayment?.recipient}
              </p>
              <p>
                <strong>Amount:</strong> ${selectedPayment?.amount}
              </p>
              <p>
                <strong>Description:</strong> {selectedPayment?.description}
              </p>
            </div>
            <div className="mt-4 flex gap-x-4 justify-center">
              <button
                onClick={handleSubmitPayment}
                className="px-4 py-2 bg-green-500 text-white rounded-md"
              >
                Settle
              </button>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentPayments;