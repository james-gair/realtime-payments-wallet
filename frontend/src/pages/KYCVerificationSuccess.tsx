import { useNavigate } from "react-router-dom";

export default function KYCVerificationSuccess() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4 text-green-600">
        Verification Successful!
      </h1>
      <p className="mb-6">
        🎉 Congratulations! You've unlocked all the features in our app. You can
        now freely explore and enjoy everything we have to offer.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
