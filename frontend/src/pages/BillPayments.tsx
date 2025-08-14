import { useNavigate } from "react-router-dom";
import { UpcomingBillCard } from "../components/UpcomingBillCard";
import { useEffect, useState } from "react";
import { authFetch } from "../services/firebaseFetch";
import { ErrorModal } from "../components/ErrorModal";
import type { UpcomingBill } from "../types";
import { VITE_BACKEND_URL } from "../constants";

export function BillPayments() {
  const backendUrl = VITE_BACKEND_URL;
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>("");
  const [bills, setBills] = useState<UpcomingBill[]>([]);
  const handlePayBills = async () => {
    try {
      const res = await authFetch(`${backendUrl}/api/bill-payments/kyc-status`);
      const data = await res.json();

      if (!res.ok) {
        if (data.redirectTo) {
          navigate(data.redirectTo);
        }
        setErrorMessage(`Error ${res.status}: ${data.error}`);
        console.error("Issues:", data.issues);
        return;
      }
    } catch (err) {
      console.error("Network error", err);
      setErrorMessage("Something went wrong. Please try again later.");
    }
    navigate("/bill-payments/paybill");
  };

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await authFetch(
          `${backendUrl}/api/bill-payments/upcoming-payments`
        );
        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(`Error ${res.status}: ${data.error}`);
          console.error("Issues:", data.issues);
          return;
        }
        setBills(data);
      } catch (err) {
        console.error("Network error", err);
        setErrorMessage("Something went wrong. Please try again later.");
      }
    };

    fetchBills();
  }, [backendUrl]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Bill Payments</h1>
      <section>
        <button
          onClick={handlePayBills}
          className="mt-14 w-1/4 bg-black text-white font-semibold py-2 px-4 rounded-lg hover:cursor-pointer transition-all"
        >
          Pay Bills
        </button>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-2">
          Active upcoming bill payments
        </h2>
        {bills.length === 0 ? (
          <p className="text-gray-600 italic">
            You have no upcoming bills yet. 😊
          </p>
        ) : (
          bills.map((bill) => (
            <UpcomingBillCard
              key={bill.billId}
              bill={bill}
              onCancelBill={(cancelledId) => {
                // remove the cancelled bill
                setBills((prev) =>
                  prev.filter((b) => b.billId !== cancelledId)
                );
              }}
            />
          ))
        )}
      </section>

      {errorMessage && (
        <ErrorModal
          errorMessage={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
}
