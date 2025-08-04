import { Route, Routes } from "react-router-dom";
import NavbarLayout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AddMoney from "./pages/AddMoney";
import AddContact from "./pages/AddContact";
import ContactDetails from "./pages/ContactDetails";
import { BillConfirmation } from "./pages/BillConfirmation";
import { BillPayments } from "./pages/BillPayments";
import Contacts from "./pages/Contacts";
import { CreateBillWrapper } from "./pages/CreateBillWrapper";
import Dashboard from "./pages/Dashboard";
import { EditBillWrapper } from "./pages/EditBillWrapper";
import EmailConfirmation from "./pages/EmailConfirmation";
import EmailSent from "./pages/EmailSent";
import Forex from "./pages/Forex";
import GroupPayments from "./pages/GroupPayments";
import GroupPaymentsDashboard from "./pages/GroupPaymentsDashboard";
import { KYCApplication } from "./pages/KYCApplication";
import KYCVerificationSuccess from "./pages/KYCVerificationSuccess";
import LoginPage from "./pages/LoginPage";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import RequestPayment from "./pages/RequestPayment";
import ResetPassword from "./pages/ResetPassword";
import SendMoney from "./pages/SendMoney";
import Transactions from "./pages/Transactions";
import "./styles/App.css";
import PaymentLimits from "./pages/PaymentLimits";

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
        <Route element={<NavbarLayout />}>
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-money" element={<AddMoney />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/forex" element={<Forex />} />
          <Route path="/request-money" element={<RequestPayment />} />
          <Route path="/send-money" element={<SendMoney />} />
          <Route path="/bill-payments" element={<BillPayments />} />
          <Route path="/payment-limits" element={<PaymentLimits />} />
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
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:contactId" element={<ContactDetails />} />
          <Route path="/add-contact" element={<AddContact />} />
          <Route path="/kyc" element={<KYCApplication />} />
          <Route path="/kyc/success" element={<KYCVerificationSuccess />} />
          <Route path="/group-payments" element={<GroupPaymentsDashboard />} />
          <Route path="/group-payments/:id" element={<GroupPayments />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
