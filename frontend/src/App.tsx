import { Route, Routes } from "react-router-dom";
import NavbarLayout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import EmailConfirmation from "./pages/EmailConfirmation";
import EmailSent from "./pages/EmailSent";
import LoginPage from "./pages/LoginPage";
import Payments from "./pages/Payments";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import "./styles/App.css";
import ProtectedRoute from "./components/ProtectedRoute";
import { KYCApplication } from "./pages/KYCApplication";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/resetPassword" element={<ResetPassword />} />
      <Route path="/emailSent" element={<EmailSent />} />
      <Route path="/emailConfirmation" element={<EmailConfirmation />} />
      <Route path="/profile" element={<Profile />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<NavbarLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/kyc" element={<KYCApplication />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
