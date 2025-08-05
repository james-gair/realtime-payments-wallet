import { Request, Response } from "express";
import sql from "../database/client";

interface TransferRequest {
  recipientUsername?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  bankAccount?: string;
  bsb?: string;
  accountHolderName?: string;
  currencyCode: string;
  amount: number;
  description?: string;
}

interface TransferResult {
  success: boolean;
  message: string;
  transactionId?: number;
  recipientName?: string;
}

export async function postSendMoney(req: Request, res: Response) {
  const senderFirebaseId = (req as any).user.uid;
  const transferData: TransferRequest = req.body;

  console.log("sendMoney triggered with data:", transferData);

  // Validate required fields
  if (!transferData.currencyCode || !transferData.amount) {
    res.status(400).json({ 
      error: "Currency code and amount are required" 
    });
    return;
  }

  if (transferData.amount <= 0) {
    res.status(400).json({ 
      error: "Amount must be greater than 0" 
    });
    return;
  }

  // Validate that at least one recipient identifier is provided
  const hasRecipient = transferData.recipientUsername || 
                      transferData.recipientEmail || 
                      transferData.recipientPhone || 
                      transferData.bankAccount;
  
  if (!hasRecipient) {
    res.status(400).json({ 
      error: "Must provide recipient username, email, phone, or bank account" 
    });
    return;
  }

  try {
    const result = await sql.begin(async (sql) => {
      // Get sender account
      const [senderAccount] = await sql`
        SELECT account_id, username FROM accounts WHERE firebase_id = ${senderFirebaseId}
      `;
      if (!senderAccount) {
        throw new Error("Sender account not found");
      }

      // Get currency
      const [currency] = await sql`
        SELECT currency_id FROM currencies WHERE code = ${transferData.currencyCode}
      `;
      if (!currency) {
        throw new Error("Invalid currency code");
      }

      // Get sender wallet
      const [senderWallet] = await sql`
        SELECT * FROM wallets
        WHERE account_id = ${senderAccount.account_id} AND currency_id = ${currency.currency_id}
        FOR UPDATE
      `;
      if (!senderWallet) {
        throw new Error(`You don't have a ${transferData.currencyCode} wallet`);
      }

      if (senderWallet.balance < transferData.amount) {
        throw new Error("Insufficient balance");
      }

      let recipientAccount = null;
      let recipientWallet = null;
      let recipientName = "";
      let transferType = "";

      // Handle different recipient types
      if (transferData.recipientUsername) {
        // SendIt account transfer
        [recipientAccount] = await sql`
          SELECT account_id, username, first_name, last_name FROM accounts 
          WHERE username = ${transferData.recipientUsername}
        `;
        if (!recipientAccount) {
          throw new Error("Recipient SendIt account not found");
        }

        [recipientWallet] = await sql`
          SELECT * FROM wallets
          WHERE account_id = ${recipientAccount.account_id} AND currency_id = ${currency.currency_id}
          FOR UPDATE
        `;
        if (!recipientWallet) {
          throw new Error(`Recipient doesn't have a ${transferData.currencyCode} wallet`);
        }

        recipientName = recipientAccount.first_name && recipientAccount.last_name 
          ? `${recipientAccount.first_name} ${recipientAccount.last_name}`
          : recipientAccount.username;
        transferType = "sendit_account";

      } else if (transferData.recipientEmail || transferData.recipientPhone) {
        // PayID transfer
        const payIdValue = transferData.recipientEmail || transferData.recipientPhone;
        const payIdType = transferData.recipientEmail ? "email" : "phone";

        if (!payIdValue) {
          throw new Error("Invalid PayID value");
        }

        // Handle PayID by email or phone
        if (payIdType === 'email') {
          [recipientAccount] = await sql`
            SELECT account_id, username, first_name, last_name, email, phone FROM accounts 
            WHERE email = ${payIdValue}
          `;
        } else {
          [recipientAccount] = await sql`
            SELECT account_id, username, first_name, last_name, email, phone FROM accounts 
            WHERE phone = ${payIdValue}
          `;
        }
        if (!recipientAccount) {
          throw new Error(`No account found with ${payIdType}: ${payIdValue}`);
        }

        [recipientWallet] = await sql`
          SELECT * FROM wallets
          WHERE account_id = ${recipientAccount.account_id} AND currency_id = ${currency.currency_id}
          FOR UPDATE
        `;
        if (!recipientWallet) {
          throw new Error(`Recipient doesn't have a ${transferData.currencyCode} wallet`);
        }

        recipientName = recipientAccount.first_name && recipientAccount.last_name 
          ? `${recipientAccount.first_name} ${recipientAccount.last_name}`
          : recipientAccount.username;
        transferType = "payid";

      } else if (transferData.bankAccount) {
        // Bank account transfer
        if (!transferData.bsb || !transferData.accountHolderName) {
          throw new Error("BSB and account holder name are required for bank transfers");
        }

        // For bank transfers, we don't need a recipient wallet in our system
        // The money would be transferred to the external bank account
        recipientName = transferData.accountHolderName;
        transferType = "bank_account";

        // Note: In a real implementation, you would integrate with a banking API
        // For now, we'll simulate the transfer by creating a transaction record
        // but not actually transferring to an external bank account
      }

      // Update sender wallet balance
      await sql`
        UPDATE wallets
        SET balance = balance - ${transferData.amount}
        WHERE wallet_id = ${senderWallet.wallet_id}
      `;

      // Update recipient wallet balance (for SendIt and PayID transfers)
      if (recipientWallet) {
        await sql`
          UPDATE wallets
          SET balance = balance + ${transferData.amount}
          WHERE wallet_id = ${recipientWallet.wallet_id}
        `;
      }

      // Create transaction record
      const transactionName = transferType === "bank_account" 
        ? `${senderAccount.username} to ${recipientName} (Bank Transfer)`
        : `${senderAccount.username} to ${recipientName}`;

      const [transaction] = await sql`
        INSERT INTO transactions (
          name,
          amount,
          category,
          sender_wallet_id,
          recipient_wallet_id,
          event_time,
          currency
        ) VALUES (
          ${transactionName},
          ${transferData.amount},
          ${["finance"]},
          ${senderWallet.wallet_id},
          ${recipientWallet?.wallet_id || null},
          ${new Date()},
          ${currency.currency_id}
        ) RETURNING transaction_id
      `;

      // Handle cashback logic for SendIt and PayID transfers
      if (recipientWallet) {
        const [deal] = await sql`
          SELECT * FROM cashback_deals
          WHERE deal_wallet_id = ${recipientWallet.wallet_id}
        `;

        if (deal && transferData.amount >= deal.min_spend_amount) {
          console.log("Cashback deal found");
          await sql`
            UPDATE wallets
            SET balance = balance + ${deal.cashback_amount}
            WHERE wallet_id = ${senderWallet.wallet_id}
          `;
        }
      }

      return {
        success: true,
        message: "Transfer successful",
        transactionId: transaction.transaction_id,
        recipientName: recipientName,
        transferType: transferType
      };
    });

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Send money error:", err);
    res.status(500).json({ 
      error: err.message || "Transfer failed" 
    });
  }
}

// Helper function to validate bank account details
export function validateBankAccount(bsb: string, accountNumber: string): boolean {
  // BSB should be 6 digits
  if (!/^\d{6}$/.test(bsb)) {
    return false;
  }
  
  // Account number should be 4-10 digits
  if (!/^\d{4,10}$/.test(accountNumber)) {
    return false;
  }
  
  return true;
}

// Helper function to validate PayID
export function validatePayID(payId: string, type: 'email' | 'phone'): boolean {
  if (type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(payId);
  } else {
    // Phone number validation (Australian format)
    const phoneRegex = /^(\+61|0)[2-478](?:[ -]?[0-9]){8}$/;
    return phoneRegex.test(payId);
  }
}
