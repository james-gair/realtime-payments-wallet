import { useState } from "react";

import { ErrorModal } from "../components/ErrorModal";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/firebaseFetch";
import { auth } from "../services/firebase";
import { BillForm, type BillInputs } from "../components/BillForm";

export function CreateBillWrapper() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [errorMessage, setErrorMessage] = useState<string | null>("");
  const navigate = useNavigate();
  const handleActualSubmit = async (validatedInputs: BillInputs) => {
    const user = auth.currentUser;
    if (!user) throw new Error("not authenticated");

    try {
      const res = await authFetch(`${backendUrl}/api/bill-payments`, {
        method: "POST",
        body: JSON.stringify(validatedInputs),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(`Error ${res.status}: ${data.error}`);
        console.error("Issues:", data.issues);
        return;
      }
      console.log("data: " + data.billId);
      navigate(`/bill-payments/confirmation/${data.billId}`);
      // navigate();
    } catch (err) {
      console.error("Network error", err);
      setErrorMessage("Something went wrong. Please try again later.");
      return;
    }
  };
  return (
    <>
      <BillForm handleActualSubmit={handleActualSubmit} />
      {errorMessage && (
        <ErrorModal
          errorMessage={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </>
  );
}
