import { Route, Routes } from "react-router-dom";
import NavbarLayout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AddMoney from "./pages/AddMoney";
import Dashboard from "./pages/Dashboard";
import EmailConfirmation from "./pages/EmailConfirmation";
import EmailSent from "./pages/EmailSent";
import Forex from "./pages/Forex";
import LoginPage from "./pages/LoginPage";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import "./styles/App.css";

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
          <Route path="/add-money" element={<AddMoney />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/forex" element={<Forex />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
