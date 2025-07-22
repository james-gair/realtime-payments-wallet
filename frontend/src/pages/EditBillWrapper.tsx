import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { authFetch } from "../services/firebaseFetch";
import { BillForm, type BillInputs } from "../components/BillForm";
import { ErrorModal } from "../components/ErrorModal";
import { auth } from "../services/firebase";

export function EditBillWrapper() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const { id } = useParams<{ id: string }>();
  const [billData, setBillData] = useState<BillInputs | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>("");
  const navigate = useNavigate();
  useEffect(() => {
    const fetchBill = async () => {
      const res = await authFetch(
        `${backendUrl}/api/bill-payments/bills/${id}`,
        {
          method: "GET",
        }
      );

      const data = await res.json();
      console.log(data);
      if (!data) {
        setErrorMessage("Failed to fetch this bill's info.");
        return;
      }
      setBillData(data);
    };
    fetchBill();
  }, [backendUrl, id]);

  const handleActualSubmit = async (validatedInputs: BillInputs) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const user = auth.currentUser;
    if (!user) throw new Error("not authenticated");

    try {
      const res = await authFetch(
        `${backendUrl}/api/bill-payments/upcoming-payments/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(validatedInputs),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(`Error ${res.status}: ${data.error}`);
        console.error("Issues:", data.issues);
        return;
      }
      console.log("data: " + data.billId);
      navigate(`/bill-payments/confirmation/${data.billId}`, {
        state: { mode: "edit" },
      });
      // navigate();
    } catch (err) {
      console.error("Network error", err);
      setErrorMessage("Something went wrong. Please try again later.");
      return;
    }
  };

  if (!billData) return <p>Loading...</p>;

  return (
    <>
      <BillForm
        handleActualSubmit={handleActualSubmit}
        billData={billData}
        isEditMode={true}
      />
      {errorMessage && (
        <ErrorModal
          errorMessage={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </>
  );
}
