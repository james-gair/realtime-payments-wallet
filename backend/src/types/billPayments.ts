import { BillInputs } from "../schemas/billPayment.schema";

export interface BillRecord {
  billId: string;
  type: "one-time" | "recurring";
  billDisplayName?: string;
  billerDisplayName?: string;
  billerBsb?: string;
  billerBankAccountNumber?: string;
  billerBpayCode?: string;
  billerBpayRef?: string;
  amount: number;
  nextRunAt: Date;
  currencyCode: string;
}

export interface Bill {
  id: number;
  accountId: number;
  walletId: number;
  amount: number;
  payMethod: string;
  billDisplayName?: string;
  billerBsb?: string;
  billerBankAccountNumber?: string;
  billerBpayCode?: string;
  billerBpayRef?: string;
}

export type UpcomingBillRes = BillRecord;
export interface SavedBillRes extends BillInputs {
  currencyCode: string;
  nextRunAt: Date;
}
