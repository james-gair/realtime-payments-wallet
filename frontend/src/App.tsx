import { Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import Register from "./Register";
import Dashboard from "./Dashboard";
import ResetPassword from "./ResetPassword";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/resetPassword" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;