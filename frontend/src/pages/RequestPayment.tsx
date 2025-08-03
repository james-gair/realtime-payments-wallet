import React, { useState, useEffect } from "react";
import type { FormState } from "../types";
import { authFetch } from "../services/firebaseFetch";

const RequestPage: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    amount: "",
    recipient: "",
    description: "",
  });

  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [view, setView] = useState<"request" | "sent">("request"); // toggle state

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const fetchSentRequests = async () => {
    try {
      const response = await authFetch(
        "http://localhost:4000/api/payment-request/sent"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sent payment requests");
      }
      const result = await response.json();
      setSentRequests(result.data);
    } catch (err) {
      console.error("Error fetching sent requests:", err);
    }
  };

  useEffect(() => {
    if (view === "sent") {
      fetchSentRequests();
    }
  }, [view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await authFetch("http://localhost:4000/api/payment-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send payment request");
      }

      const result = await response.json();
      console.log("Payment request submitted:", result);
      setFormData({ amount: "", recipient: "", description: "" });

      // Switch to sent requests after submitting?
      setView("sent");
      await fetchSentRequests();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this payment request?")) return;

    try {
      const response = await authFetch(`http://localhost:4000/api/payment-request/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel payment request");
      }

      alert("Payment request cancelled.");
      await fetchSentRequests();
    } catch (err) {
      console.error("Error cancelling payment request:", err);
      alert("Error cancelling payment request");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Toggle Buttons */}
      <h1 className="text-3xl font-bold text-gray-900">
        {view === "request" ? "Request Payment" : "Previously Sent Requests"}
      </h1>
      <div className="flex justify-center border-b border-gray-300 mb-8">
        <button
          onClick={() => setView("request")}
          className={`py-3 px-6 -mb-px font-semibold transition-colors duration-300 ${
            view === "request"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Request Payment
        </button>
        <button
          onClick={() => setView("sent")}
          className={`py-3 px-6 -mb-px font-semibold transition-colors duration-300 ${
            view === "sent"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Sent Requests
        </button>
      </div>

      {view === "request" && (
        <>
          <div className="mb-6">
            <p className="text-gray-500 text-sm mt-1">
              Fill in the form below to request a payment.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label
                  htmlFor="recipient"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  To Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-lg">@</span>
                  </div>
                  <input
                    type="text"
                    id="recipient"
                    placeholder="   Enter recipient name"
                    value={formData.recipient}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={4}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all"
              >
                Request Payment
              </button>
            </form>
          </div>
        </>
      )}

      {view === "sent" && (
        <div>
          {sentRequests.length === 0 ? (
            <p className="text-gray-500">No sent requests yet.</p>
          ) : (
            <ul className="space-y-4">
              {sentRequests.map((req) => (
                <li
                  key={req.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-800 font-medium">
                      To: <span className="font-bold">@{req.account_id_to}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-gray-700">Amount: ${req.amount}</div>
                  <div className="text-gray-600 text-sm mt-1">{req.description}</div>
                  <div className="text-sm mt-2 text-amber-500 font-semibold">
                    Status: {req.status}
                  </div>

                  {req.status === "pending" && (
                    <button
                      onClick={() => handleCancel(req.id)}
                      className="mt-3 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                      Cancel
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestPage;