// ============================================================================
// CORE TYPES - Centralized type definitions for the frontend application
// ============================================================================

// ============================================================================
// WALLET & CARD TYPES
// ============================================================================

export interface Card {
  id: number;
  currency: string;
  balance: number;
  cardNumber?: string;
  expiryDate?: string;
  gradient: string;
  symbol: string;
}

export interface Wallet {
  walletId: string;
  currency: string;
  balance: string;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface Transaction {
  id: number;
  name: string;
  amount: string;
  icon: string;
  color: string;
  time: string;
  category?: string;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================


export interface PaymentRequest {
  id: number;
  account_id_from: number;
  username_from: string;
  account_id_to: number;
  amount: number;
  description: string;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface SentPayment {
  id: number;
  recipient: string;
  amount: number;
  description: string;
}

export interface BankAccountForm {
  accountName: string;
  bsb: string;
  accountNumber: string;
  description: string;
}

// ============================================================================
// Payment Limits Types
// ============================================================================

// ============================================================================
// FOREX & RATES TYPES
// ============================================================================

export interface Rates {
  [currency: string]: number;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

// ============================================================================
// BILL PAYMENT TYPES
// ============================================================================

export interface BillInputs {
  walletId: string;
  amount: number;
  payMethod: "bankAcct" | "bpay";
  // Optional depending on payment method
  billerBsb?: string;
  billerBankAccountNumber?: string;
  billerBpayCode?: string;
  billerBpayRef?: string;
  billerDisplayName?: string;
  billDisplayName?: string;
  type: "one-time" | "recurring";
  frequency?: string;
  firstPaymentDate?: string;
  // Sprint 3
  reminder?: boolean;
  reminderDays?: string;
  currencyCode?: string;
  nextRunAt?: string;
}

export interface UpcomingBill {
  billId: string;
  type: "one-time" | "recurring";
  billDisplayName?: string;
  billerDisplayName?: string;
  billerBsb?: string;
  billerBankAccountNumber?: string;
  billerBpayCode?: string;
  billerBpayRef?: string;
  amount: string;
  nextRunAt: string;
  currencyCode: string;
}

export interface SavedBillRes extends BillInputs {
  currencyCode: string;
  nextRunAt: string;
}

// ============================================================================
// CONTACT TYPES
// ============================================================================

export interface Contact {
  id: number; // saved contact id
  nickname?: string | null;
  name: string; // always present, certified at time of adding
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  bank_account?: string | null; // for future use
  contact_account_id?: number | null; // account_id if contact has an account
  added_by: "username" | "email" | "phone" | "bank_account"; // how the contact was added
  added_value: string; // the value used to add the contact
  // Bank account specific fields (for extensibility)
  bsb?: string | null;
  routing_number?: string | null;
  account_number?: string | null;
  account_holder_name?: string | null;
  account_email?: string | null;
}

// ============================================================================
// USER & PROFILE TYPES
// ============================================================================

export interface UserProfile {
  email: string;
  contact: string;
  address: string;
}

// ============================================================================
// KYC TYPES
// ============================================================================

export interface KYCVerifyResultResponse {
  result: "verified" | "rejected";
  validatedData: unknown; // Using any for now, can be refined based on schema
  verifiedAt: string; // ISO timestamp string
  idType: "passport" | "driver_license";
}

// ============================================================================
// FORM & UI TYPES
// ============================================================================

export interface FormState {
  amount: string;
  recipient: string;
  description: string;
}

export interface ExpenseCategory {
  name: string;
  amount: string;
  color: string;
  percentage: number;
}

export interface IncomeExpenseData {
  type: "income" | "expense";
  amount: string;
  period: string;
  change: string;
  changeType: "positive" | "negative";
}

export interface PayIdDetails {
  payId: string;
}

// ============================================================================
// MODAL & COMPONENT PROP TYPES
// ============================================================================

export interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ErrorModalProps {
  errorMessage: string;
  onClose: () => void;
}

export interface WebcamCaptureProps {
  onCapture: (file: File) => void;
  label: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CancelBillParams {
  id: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PaymentMethod = "bankAcct" | "bpay";
export type BillType = "one-time" | "recurring";
export type KYCIdType = "passport" | "driver_license";
export type KYCResult = "verified" | "rejected";
export type TransactionType = "income" | "expense";
export type ChangeType = "positive" | "negative";
