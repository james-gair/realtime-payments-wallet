import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../services/firebaseFetch";
import type { SavedBillRes } from "../types";

export function BillConfirmation() {
  const { id } = useParams<{ id: string }>();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const [bill, setBill] = useState<SavedBillRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const location = useLocation();
  const mode = location.state?.mode || "create"; // fallback to "create"

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await authFetch(
          `${backendUrl}/api/bill-payments/bills/${id}`
        );
        const data = await res.json();
        console.log(data);
        if (!res.ok) {
          setErrorMessage(data.error || "Failed to fetch bill.");
        } else if (data) {
          setBill(data);
        } else {
          setErrorMessage("No bill found with that ID.");
        }
      } catch (err) {
        console.log(err);
        setErrorMessage("Something went wrong. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [backendUrl, id]);

  if (loading) {
    return <p className="p-6 text-gray-700">Loading...</p>;
  }

  if (errorMessage) {
    return (
      <div className="p-6 text-red-600">
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p>{errorMessage}</p>
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {mode === "edit" ? "Bill Updated" : "Bill Confirmation"}
      </h1>

      <p className="mb-4 text-gray-700">
        {mode === "edit"
          ? "Your bill has been successfully updated."
          : "Your bill has been successfully created. Once payment is processed, we’ll notify you via email."}
      </p>

      <div className="bg-gray-100 p-4 rounded shadow max-w-md space-y-2">
        {bill.billDisplayName && (
          <p>
            <strong>Bill Name:</strong> {bill.billDisplayName}
          </p>
        )}
        {bill.billerDisplayName && (
          <p>
            <strong>Recipient:</strong> {bill.billerDisplayName}
          </p>
        )}

        <p>
          <strong>Amount:</strong> {bill.currencyCode} {bill.amount}
        </p>
        <p>
          <strong>Type:</strong> {bill.type}
        </p>
        {bill.type === "recurring" && (
          <p>
            <strong>Frequency:</strong> {bill.frequency}
          </p>
        )}
        <p>
          <strong>Scheduled Date:</strong>{" "}
          {new Date(bill.nextRunAt).toLocaleDateString()}
        </p>
        {bill.billerBsb && (
          <p>
            <strong>BSB:</strong> {bill.billerBsb}
          </p>
        )}
        {bill.billerBankAccountNumber && (
          <p>
            <strong>Bank Account:</strong> {bill.billerBankAccountNumber}
          </p>
        )}
        {bill.billerBpayCode && (
          <p>
            <strong>BPAY Code:</strong> {bill.billerBpayCode}
          </p>
        )}
        {bill.billerBpayRef && (
          <p>
            <strong>BPAY Reference:</strong> {bill.billerBpayRef}
          </p>
        )}
      </div>

      <button
        className="mt-6 bg-black text-white px-4 py-2 rounded"
        onClick={() => navigate("/bill-payments")}
      >
        Back to Bills
      </button>
    </div>
  );
}
