export interface AddContactByAccountReq {
  type: 'account';
  searchValue: string;
  nickname?: string;
}

export interface AddContactByPayIDReq {
  type: 'payid';
  payid: string; // email or phone number
  nickname?: string;
}

export interface AddContactByBankAccountReq {
  type: 'bank_account';
  bsb: string;
  accountNumber: string;
  nickname?: string;
}

export type AddContactReq = AddContactByAccountReq | AddContactByPayIDReq | AddContactByBankAccountReq; 