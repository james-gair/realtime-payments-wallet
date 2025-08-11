import { useNavigate } from "react-router-dom";

export default function KYCVerificationSuccess() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-green-600">
        Verification Successful!
      </h1>
      <p className="mb-10">
        🎉 Congratulations! You've unlocked all the features in our app. You can
        now enjoy everything we have to offer.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="w-fit bg-black text-white font-semibold py-2 px-4 rounded-lg hover:cursor-pointer"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
