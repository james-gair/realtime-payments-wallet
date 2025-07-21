import { Route, Routes } from "react-router-dom";
import NavbarLayout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AddMoney from "./pages/AddMoney";
import { BillConfirmation } from "./pages/BillConfirmation";
import { BillPayments } from "./pages/BillPayments";
import { CreateBillWrapper } from "./pages/CreateBillWrapper";
import Dashboard from "./pages/Dashboard";
import { EditBillWrapper } from "./pages/EditBillWrapper";
import EmailConfirmation from "./pages/EmailConfirmation";
import EmailSent from "./pages/EmailSent";
import Forex from "./pages/Forex";
import { KYCApplication } from "./pages/KYCApplication";
import KYCVerificationSuccess from "./pages/KYCVerificationSuccess";
import LoginPage from "./pages/LoginPage";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Transactions from "./pages/Transactions";
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

      <Route element={<ProtectedRoute />}>
        <Route path="/transactions" element={<Transactions />} />
        <Route element={<NavbarLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-money" element={<AddMoney />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/forex" element={<Forex />} />
          <Route path="/bill-payments" element={<BillPayments />} />
          <Route
            path="/bill-payments/confirmation/:id"
            element={<BillConfirmation />}
          />
          <Route path="/bill-payments/edit/:id" element={<EditBillWrapper />} />
          <Route
            path="/bill-payments/paybill"
            element={<CreateBillWrapper />}
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/kyc" element={<KYCApplication />} />
          <Route path="/kyc/success" element={<KYCVerificationSuccess />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
