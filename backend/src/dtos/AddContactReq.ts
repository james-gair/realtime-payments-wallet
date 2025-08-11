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
  country: 'AU' | 'US' | 'JP'; // Extensible for future countries
  // AU
  bsb?: string; // Australian BSB (6 digits)
  // US
  routingNumber?: string; // US routing number (9 digits)
  // JP
  bankCode?: string; // Japan bank code (4 digits)
  branchCode?: string; // Japan branch code (3 digits)
  // Common
  accountNumber: string;
  accountHolderName: string;
  accountEmail?: string;
  nickname?: string;
}

export type AddContactReq = AddContactByAccountReq | AddContactByPayIDReq | AddContactByBankAccountReq; 