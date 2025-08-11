import React, { useEffect, useState } from "react";
import { authFetch } from "../services/firebaseFetch";
import { ErrorModal } from "../components/ErrorModal";
import { Modal } from "../components/Modal";
import { VITE_BACKEND_URL } from "../constants";

interface PaymentLimitInput {
  walletId: string;
  limit: number;
  currency: string;
}

export function PaymentLimits() {
  const backendUrl = VITE_BACKEND_URL;
  const [paymentLimits, setPaymentLimits] = useState<PaymentLimitInput[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>("");
  const [changeSaved, setChangeSaved] = useState(false);
  useEffect(() => {
    const fetchPaymentLimits = async () => {
      try {
        const res = await authFetch(`${backendUrl}/api/payment-limits`);
        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(`Error ${res.status}: ${data.error}`);
          console.error("Issues:", data.issues);
          return;
        }
        setPaymentLimits(data.limits);
      } catch (err) {
        console.error("Network error", err);
        setErrorMessage("Something went wrong. Please try again later.");
      }
    };
    fetchPaymentLimits();
  }, [backendUrl]);

  const handleActualSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const limitsArray: { walletId: string; limit: number }[] = [];

    for (const [key, value] of formData.entries()) {
      limitsArray.push({
        walletId: key,
        limit: Number(value),
      });
    }
    try {
      const res = await authFetch(`${backendUrl}/api/payment-limits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limits: limitsArray }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(`Error ${res.status}: ${data.error}`);
        console.error("Issues:", data.issues);
        return;
      }
      setChangeSaved(true);
    } catch (error) {
      console.error("Error updating payment limits:", error);
      setErrorMessage("Failed to update payment limits. Please try again.");
      return;
    }
  };
  return (
    <>
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Payment Limits</h1>
        <p className="text-gray-700">
          Set a monthly payment limit for each wallet. You'll get an email
          notification if the limit is exceeded.
        </p>
      </section>

      <form className="flex flex-col gap-6 mt-6" onSubmit={handleActualSubmit}>
        {paymentLimits.map((p) => (
          <div
            className="flex items-center gap-4"
            key={`${p.walletId}-section`}
          >
            <label
              htmlFor={`limit-${p.walletId}`}
              className="w-1/3 text-gray-800 font-medium"
            >
              {p.currency} Wallet Monthly Spending Limit
            </label>
            <input
              type="number"
              id={p.walletId}
              name={p.walletId}
              defaultValue={p.limit}
              className="border border-gray-300 px-3 py-2 rounded-md w-60"
            />
          </div>
        ))}
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-6 rounded font-semibold hover:cursor-pointer w-32"
        >
          Save
        </button>
      </form>
      {errorMessage && (
        <ErrorModal
          errorMessage={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      {changeSaved && (
        <Modal
          modalName="Saved"
          displayMessage={"Your payment limits have been saved."}
          onClose={() => setChangeSaved(false)}
        />
      )}
    </>
  );
}

export default PaymentLimits;
