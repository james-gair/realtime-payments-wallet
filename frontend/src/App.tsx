import { Route, Routes } from "react-router";
import NavbarLayout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import EmailConfirmation from "./pages/EmailConfirmation";
import EmailSent from "./pages/EmailSent";
import LoginPage from "./pages/LoginPage";
import Payments from "./pages/Payments";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import "./styles/App.css";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/resetPassword" element={<ResetPassword />} />
      <Route path="/emailSent" element={<EmailSent />} />
      <Route path="/emailConfirmation" element={<EmailConfirmation />} />
      <Route element={<NavbarLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/payments" element={<Payments />} />
      </Route>
    </Routes>
  );
}

export default App;
