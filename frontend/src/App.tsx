import { Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import Register from "./Register";
import Dashboard from "./Dashboard";
import ResetPassword from "./ResetPassword";
import EmailSent from "./EmailSent";
import EmailConfirmation from "./EmailConfirmation";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/resetPassword" element={<ResetPassword />} />
      <Route path="/emailSent" element={<EmailSent />} />
      <Route path="/emailConfirmation" element={<EmailConfirmation />} />
    </Routes>
  );
}

export default App;