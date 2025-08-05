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
        className="mt-14 w-fit bg-black text-white font-semibold py-2 px-4 rounded-lg hover:cursor-pointer transition-all"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
