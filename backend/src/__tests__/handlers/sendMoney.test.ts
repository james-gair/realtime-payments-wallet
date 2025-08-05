import { postSendMoney } from '../../handlers/sendMoney';
import sql from '../../database/client';

const mockReq = {
  user: {
    uid: "test-user-id",
  },
  body: {},
} as any;

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('sendMoney handler', () => {
  beforeEach(async () => {
    // Clean up test data
    await sql`DELETE FROM transactions WHERE name LIKE '%test%'`;
    await sql`DELETE FROM wallets WHERE account_id IN (SELECT account_id FROM accounts WHERE firebase_id = 'test-user-id')`;
    await sql`DELETE FROM accounts WHERE firebase_id = 'test-user-id'`;
  });

  afterAll(async () => {
    await sql.end();
  });

  describe('SendIt Account Transfer', () => {
    beforeEach(async () => {
      // Create test accounts
      await sql`
        INSERT INTO accounts (firebase_id, username, email, phone, date_of_birth, first_name, last_name)
        VALUES 
          ('test-user-id', 'sender', 'sender@test.com', '0412345678', '1990-01-01', 'John', 'Sender'),
          ('recipient-id', 'recipient', 'recipient@test.com', '0487654321', '1990-01-01', 'Jane', 'Recipient')
      `;

      // Create wallets
      await sql`
        INSERT INTO wallets (account_id, currency_id, balance)
        VALUES 
          ((SELECT account_id FROM accounts WHERE firebase_id = 'test-user-id'), 1, 1000.00),
          ((SELECT account_id FROM accounts WHERE firebase_id = 'recipient-id'), 1, 500.00)
      `;
    });

    it('should successfully transfer money between SendIt accounts', async () => {
      const req = {
        ...mockReq,
        body: {
          recipientUsername: 'recipient',
          currencyCode: 'AUD',
          amount: 100.00,
          description: 'Test transfer'
        }
      };
      const res = createMockRes();

      await postSendMoney(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Transfer successful',
          transferType: 'sendit_account',
          recipientName: 'Jane Recipient'
        })
      );

      // Verify balances were updated
      const [senderWallet] = await sql`
        SELECT balance FROM wallets 
        WHERE account_id = (SELECT account_id FROM accounts WHERE firebase_id = 'test-user-id')
      `;
      const [recipientWallet] = await sql`
        SELECT balance FROM wallets 
        WHERE account_id = (SELECT account_id FROM accounts WHERE firebase_id = 'recipient-id')
      `;

      expect(senderWallet.balance).toBe(900.00);
      expect(recipientWallet.balance).toBe(600.00);
    });

    it('should fail when recipient account does not exist', async () => {
      const req = {
        ...mockReq,
        body: {
          recipientUsername: 'nonexistent',
          currencyCode: 'AUD',
          amount: 100.00
        }
      };
      const res = createMockRes();

      await postSendMoney(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Recipient SendIt account not found'
        })
      );
    });

    it('should fail when sender has insufficient balance', async () => {
      const req = {
        ...mockReq,
        body: {
          recipientUsername: 'recipient',
          currencyCode: 'AUD',
          amount: 2000.00
        }
      };
      const res = createMockRes();

      await postSendMoney(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Insufficient balance'
        })
      );
    });
  });

  describe('PayID Transfer', () => {
    beforeEach(async () => {
      // Create test accounts
      await sql`
        INSERT INTO accounts (firebase_id, username, email, phone, date_of_birth, first_name, last_name)
        VALUES 
          ('test-user-id', 'sender', 'sender@test.com', '0412345678', '1990-01-01', 'John', 'Sender'),
          ('recipient-id', 'recipient', 'recipient@test.com', '0487654321', '1990-01-01', 'Jane', 'Recipient')
      `;

      // Create wallets
      await sql`
        INSERT INTO wallets (account_id, currency_id, balance)
        VALUES 
          ((SELECT account_id FROM accounts WHERE firebase_id = 'test-user-id'), 1, 1000.00),
          ((SELECT account_id FROM accounts WHERE firebase_id = 'recipient-id'), 1, 500.00)
      `;
    });

    it('should successfully transfer money using PayID email', async () => {
      const req = {
        ...mockReq,
        body: {
          recipientEmail: 'recipient@test.com',
          currencyCode: 'AUD',
          amount: 100.00
        }
      };
      const res = createMockRes();

      await postSendMoney(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          transferType: 'payid'
        })
      );
    });

    it('should successfully transfer money using PayID phone', async () => {
      const req = {
        ...mockReq,
        body: {
          recipientPhone: '0487654321',
          currencyCode: 'AUD',
          amount: 100.00
        }
      };
      const res = createMockRes();

      await postSendMoney(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          transferType: 'payid'
        })
      );
    });

    it('should fail when PayID email does not exist', async () => {
      const req = {
        ...mockReq,
        body: {
          recipientEmail: 'nonexistent@test.com',
          currencyCode: 'AUD',
          amount: 100.00
        }
      };
      const res = createMockRes();

      await postSendMoney(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No account found with email: nonexistent@test.com'
        })
      );
    });
  });

  describe('Bank Account Transfer', () => {
    beforeEach(async () => {
      // Create test sender account
      await sql`
        INSERT INTO accounts (firebase_id, username, email, phone, date_of_birth, first_name, last_name)
        VALUES ('test-user-id', 'sender', 'sender@test.com', '0412345678', '1990-01-01', 'John', 'Sender')
      `;

      // Create sender wallet
      await sql`
        INSERT INTO wallets (account_id, currency_id, balance)
        VALUES ((SELECT account_id FROM accounts WHERE firebase_id = 'test-user-id'), 1, 1000.00)
      `;
    });

    it('should successfully process bank account transfer', async () => {
      const req = {
        ...mockReq,
        body: {
          bankAccount: '12345678',
          bsb: '123456',
          accountHolderName: 'Jane Recipient',
          currencyCode: 'AUD',
          amount: 100.00
        }
      };
      const res = createMockRes();

      await postSendMoney(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          transferType: 'bank_account',
          recipientName: 'Jane Recipient'
        })
      );

      // Verify sender balance was deducted
      const [senderWallet] = await sql`
        SELECT balance FROM wallets 
        WHERE account_id = (SELECT account_id FROM accounts WHERE firebase_id = 'test-user-id')
      `;
      expect(senderWallet.balance).toBe(900.00);
    });

    it('should fail when BSB is missing for bank transfer', async () => {
      const req = {
        ...mockReq,
        body: {
          bankAccount: '12345678',
          accountHolderName: 'Jane Recipient',
          currencyCode: 'AUD',
          amount: 100.00
        }
      };
      const res = createMockRes();

      await postSendMoney(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BSB and account holder name are required for bank transfers'
        })
      );
    });
  });

  describe('Validation', () => {
    it('should fail when no recipient is provided', async () => {
      const req = {
        ...mockReq,
        body: {
          currencyCode: 'AUD',
          amount: 100.00
        }
      };
      const res = createMockRes();

      await postSendMoney(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Must provide recipient username, email, phone, or bank account'
        })
      );
    });

    it('should fail when amount is negative', async () => {
      const req = {
        ...mockReq,
        body: {
          recipientUsername: 'recipient',
          currencyCode: 'AUD',
          amount: -100.00
        }
      };
      const res = createMockRes();

      await postSendMoney(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Amount must be greater than 0'
        })
      );
    });

    it('should fail when currency code is missing', async () => {
      const req = {
        ...mockReq,
        body: {
          recipientUsername: 'recipient',
          amount: 100.00
        }
      };
      const res = createMockRes();

      await postSendMoney(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Currency code and amount are required'
        })
      );
    });
  });
}); 