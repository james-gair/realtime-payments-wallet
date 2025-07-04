import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { auth } from "../services/firebase";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      navigate("/emailSent");
    } catch (error: any) {
      setMessage("Error: " + error.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img alt="SENDIT Logo" src={logo} className="mx-auto h-20 w-auto" />
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please enter the email you used to register with us.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm/6 font-medium text-gray-900"
            >
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleReset}
              className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black cursor-pointer"
            >
              Send Reset Email
            </button>
          </div>

          {message && (
            <div className="text-center text-sm text-red-600">{message}</div>
          )}
        </div>

        <p className="mt-10 text-center text-sm/6 text-gray-500">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-black hover:text-zinc-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
