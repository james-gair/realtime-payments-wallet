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
  country: 'AU' | 'US'; // Extensible for future countries
  bsb?: string; // Australian BSB (6 digits)
  routingNumber?: string; // US routing number (9 digits)
  accountNumber: string;
  accountHolderName: string;
  accountEmail?: string;
  nickname?: string;
}

export type AddContactReq = AddContactByAccountReq | AddContactByPayIDReq | AddContactByBankAccountReq; 