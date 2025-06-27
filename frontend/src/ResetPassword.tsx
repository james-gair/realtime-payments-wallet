import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";
import "./styles/App.css";
function ResetPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleReset = async () => {
        try {
          await sendPasswordResetEmail(auth, email);
          setMessage("Password reset email sent. Please check your inbox.");
        } catch (error: any) {
          setMessage("Error: " + error.message);
        }
    };

    return (
        <div className="form-container">
          <h1>Reset Password</h1>
          <h2>Please enter the email you used to register with us.</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleReset}>Send Reset Email</button>
          {message && <p>{message}</p>}
        </div>
      );
    }
  
  export default ResetPassword;