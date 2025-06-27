import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./styles/App.css";
import { Link } from "react-router-dom";


function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error: any) {
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <p >
        <Link to="/ResetPassword" style={{ textDecoration: "underline", color: "blue", cursor: "pointer" }}>
        Forgot password?
        </Link>
      </p>
      <button onClick={handleLogin}>Next</button>
      <p>Don't have an account? <a href="/Register">Create One</a></p>
    </div>
  );
}

export default LoginPage;
