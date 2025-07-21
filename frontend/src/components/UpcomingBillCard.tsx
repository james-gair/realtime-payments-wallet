import { useState } from "react";
import { authFetch } from "../services/firebaseFetch";
import { ErrorModal } from "./ErrorModal";
import { ConfirmModal } from "./ConfirmModal";
import { useNavigate } from "react-router-dom";

export interface UpcomingBill {
  billId: string;
  type: "one-time" | "recurring";
  billDisplayName?: string;
  billerDisplayName?: string;
  billerBsb?: string;
  billerBankAccountNumber?: string;
  billerBpayCode?: string;
  billerBpayRef?: string;
  amount: string;
  nextRunAt: string;
  currencyCode: string;
}

export function UpcomingBillCard({
  bill,
  onCancelBill,
}: {
  bill: UpcomingBill;
  onCancelBill: (billId: string) => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleCancel = async (billId: string) => {
    try {
      const res = await authFetch(
        `${backendUrl}/api/bill-payments/upcoming-payments/${billId}/cancel`,
        {
          method: "PATCH",
        }
      );
      const data = await res.json();
      console.log(data);
      if (!res.ok) {
        setErrorMessage(`Error ${res.status}: ${data.error}`);
        console.log(data.error);
        return;
      }
      onCancelBill(bill.billId);
    } catch (err) {
      console.error("Network error", err);
      setErrorMessage("Something went wrong. Please try again later.");
      return;
    }
  };

  return (
    <article className="rounded-2xl shadow-md p-4 border border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div
        className={`text-sm px-2 py-1 rounded-full font-medium w-fit ${
          bill.type === "one-time" ? "bg-green-300" : "bg-pink-300"
        }`}
      >
        {bill.type}
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <header className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {bill.billDisplayName}
          </h2>
        </header>
        <p className="text-sm text-gray-600">
          Pay to:{" "}
          {bill.billerDisplayName ? (
            bill.billerDisplayName
          ) : bill.billerBsb && bill.billerBankAccountNumber ? (
            <>
              Bank Account: {bill.billerBsb} {bill.billerBankAccountNumber}
            </>
          ) : bill.billerBpayCode && bill.billerBpayRef ? (
            <>
              BPAY: {bill.billerBpayCode} {bill.billerBpayRef}
            </>
          ) : (
            "Unknown biller"
          )}
        </p>
        <p className="text-base font-medium text-blue-700 mt-1">
          {bill.currencyCode} {bill.amount}
        </p>
      </div>

      <time className="text-sm text-gray-500">
        Paying on:{" "}
        {new Date(bill.nextRunAt).toLocaleDateString("en-AU", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })}
      </time>
      <button
        className="border rounded-sm w-20 p-1 hover:cursor-pointer"
        onClick={() => navigate(`/bill-payments/edit/${bill.billId}`)}
      >
        Edit
      </button>
      <button
        onClick={() => setShowModal(true)}
        className="border rounded-sm w-20 p-1 bg-red-500 text-white border-black hover:cursor-pointer"
      >
        Cancel
      </button>
      {errorMessage && (
        <ErrorModal
          errorMessage={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
      {showModal && (
        <ConfirmModal
          message="Are you sure you want to cancel this bill?"
          onConfirm={() => {
            setShowModal(false);
            handleCancel(bill.billId);
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </article>
  );
}
