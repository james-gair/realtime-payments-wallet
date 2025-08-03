// TODO: Implement Bank Account API service
// This service should query external banking services to retrieve account holder information
// based on BSB and account number

export interface BankAccountContactInfo {
  name: string;
  accountNumber: string;
  bsb: string;
  email?: string;
}

export async function lookupBankAccountContact(bsb: string, accountNumber: string): Promise<BankAccountContactInfo> {
  // TODO: Implement actual Bank Account API call
  // For now, return mock data
  console.log(`Looking up bank account: BSB ${bsb}, Account ${accountNumber}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock response - in real implementation, this would be an API call
  return {
    name: 'Account Holder',
    accountNumber: accountNumber,
    bsb: bsb,
    email: 'account.holder@example.com'
  };
} 