export interface SoftDeductionResult {
  bill_payment_id: number;
  soft_deduction_id: number | null;
  account_id: number;
  status: "success" | "failed";
  error: string | null;
  pay_method: "bankAcct" | "bpay";
  amount: string;
  biller_bsb: string | null;
  biller_bank_account_number: string | null;
  biller_bpay_code: string | null;
  biller_bpay_ref: string | null;
}

export interface BankResponse {
  soft_deduction_id: number;
  bill_payment_id: number;
  status: "success" | "failed";
  message: string;
  pay_method: "bankAcct" | "bpay";
  amount: string;
  biller_bsb?: string | null;
  biller_bank_account_number?: string | null;
  biller_bpay_code?: string | null;
  biller_bpay_ref?: string | null;
}

export interface BillReminderInfo {
  email: string;
  username: string;
  remind_before_num_days: number;
  scheduled_date: string; // use Date if you prefer
}
