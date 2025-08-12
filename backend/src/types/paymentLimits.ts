export interface PaymentLimit {
  walletId: string;
  limit: number | null;
  currency: string;
}
