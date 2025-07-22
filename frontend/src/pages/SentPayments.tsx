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
    alert(`Payment to ${selectedPayment.recipient} settled.`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-10 px-6 py-8 max-w-4xl mx-auto">
      {/* Section: Payment Requests */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Incoming Payment Requests</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <ul role="list" className="divide-y divide-gray-100">
            {paymentRequests.map((payment) => (
              <li
                key={payment.id}
                onClick={() => handleClickPaymentRequest(payment)}
                className="flex justify-between items-center gap-x-6 px-6 py-4 hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{payment.recipient}</p>
                  <p className="text-sm text-gray-500 truncate">{payment.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-base font-semibold text-gray-900">${payment.amount}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Section: Sent Payments */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Sent Payments</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <ul role="list" className="divide-y divide-gray-100">
            {sentPayments.map((payment) => (
              <li
                key={payment.id}
                className="flex justify-between items-center gap-x-6 px-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{payment.recipient}</p>
                  <p className="text-sm text-gray-500 truncate">{payment.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-base font-semibold text-gray-900">${payment.amount}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 px-4">
          <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Settle Payment</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Recipient:</span> {selectedPayment?.recipient}</p>
              <p><span className="font-medium">Amount:</span> ${selectedPayment?.amount}</p>
              <p><span className="font-medium">Description:</span> {selectedPayment?.description}</p>
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={handleSubmitPayment}
                className="w-full mr-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition"
              >
                Settle
              </button>
              <button
                onClick={handleCloseModal}
                className="w-full ml-2 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentPayments;