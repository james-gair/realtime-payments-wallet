CREATE TABLE accounts (
  account_id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  address TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE account_identities (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(account_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  id_type TEXT NOT NULL CHECK (id_type IN ('passport', 'driver_license')),
  id_number TEXT NOT NULL,
  id_expiry_date DATE NOT NULL,
  place_of_issue TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE saved_contacts (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE, -- who saved the contact
  contact_account_id INTEGER REFERENCES accounts(account_id) ON DELETE SET NULL, -- if linked to an account
  nickname TEXT,
  name TEXT NOT NULL,
  added_by TEXT NOT NULL,    -- 'username', 'email', 'phone', 'bank_account'
  added_value TEXT NOT NULL, -- the value used to add the contact (e.g. username, email, phone, bank acct)
  email TEXT,                -- for PayID/email (optional, for display)
  phone TEXT,                -- for PayID/phone (optional, for display)
  bank_account TEXT,         -- for bank account (optional, for display)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (account_id, added_by, added_value)
);

-- Currencies table
CREATE TABLE currencies (
  currency_id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,  -- e.g. "AUD", "USD"
  symbol VARCHAR(10) NOT NULL UNIQUE
);

-- Wallets table
CREATE TABLE wallets (
  wallet_id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  currency_id INTEGER NOT NULL,
  balance NUMERIC(18, 2) DEFAULT 0 CHECK (balance >= 0),
  -- card_number VARCHAR(16) NOT NULL,
  -- expiry_date VARCHAR(5) NOT NULL,
  monthly_limit NUMERIC(18, 2) CHECK (monthly_limit >= 0),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (account_id, currency_id),
  CONSTRAINT fk_wallets_account FOREIGN KEY (account_id) REFERENCES accounts(account_id),
  CONSTRAINT fk_wallets_currency FOREIGN KEY (currency_id) REFERENCES currencies(currency_id)
);

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE transactions (
  transaction_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(18, 2) DEFAULT 0 CHECK (amount >= 0),
  event_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  category TEXT[] NOT NULL DEFAULT '{}',
  sender_wallet_id INTEGER REFERENCES wallets(wallet_id),
  recipient_wallet_id INTEGER REFERENCES wallets(wallet_id)
);


CREATE TYPE payment_type AS ENUM ('one-time', 'recurring');
CREATE TYPE payment_frequency AS ENUM ('weekly', 'fortnightly', 'monthly');
CREATE TYPE payment_status AS ENUM ('active', 'completed', 'cancelled', 'failed', 'processing');
CREATE TYPE pay_method AS ENUM ('bankAcct', 'bpay');

CREATE TABLE bill_payments (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,          -- user who scheduled the bill
  wallet_id INTEGER NOT NULL,           -- which wallet to deduct from
  amount NUMERIC(10,2) NOT NULL,
  pay_method pay_method NOT NULL,

  biller_bsb VARCHAR(6),
  biller_bank_account_number VARCHAR(20),
-- OR
  biller_bpay_code VARCHAR(10),
  biller_bpay_ref VARCHAR(20),

  biller_display_name VARCHAR(40),        -- optional
  bill_display_name VARCHAR(40),          -- for user labeling (e.g., 'Internet')

  type payment_type NOT NULL,
  first_payment_date TIMESTAMPTZ NOT NULL DEFAULT now(), -- the initial payment time
  frequency payment_frequency,
  CHECK (
    (type = 'one-time' AND frequency IS NULL) OR
    (type = 'recurring' AND frequency IS NOT NULL)
  ),

  created_at TIMESTAMPTZ DEFAULT now(),
  last_paid_at TIMESTAMPTZ,                  -- updated after each run (esp. recurring)

  status payment_status DEFAULT 'active',
  next_run_at TIMESTAMPTZ, -- for reccuring payment and scheduled payments

 ----sprint 3 part----

  reminder BOOLEAN DEFAULT false,
  remind_before_num_days INTEGER CHECK (remind_before_num_days >= 1)

  -----------------------
);

-- soft deduction for bill payments
-- This is used to track the payment status of bills that are paid via bank transfer or bpay
CREATE TABLE soft_deductions (
  id SERIAL PRIMARY KEY,
  bill_payment_id INTEGER REFERENCES bill_payments(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  external_ref TEXT -- to track sth like an id the bank gives us or a webhook id etc.
);

-- Function to soft deduct bill payments in bulk
-- including error handling for insufficient funds or other issues
CREATE OR REPLACE FUNCTION soft_deduct_today_bills()
RETURNS TABLE (
  bill_payment_id INT,
  soft_deduction_id INT,
  account_id INT,
  status TEXT,
  error TEXT,
  pay_method pay_method,
  amount NUMERIC(10,2),
  biller_bsb VARCHAR,
  biller_bank_account_number VARCHAR,
  biller_bpay_code VARCHAR,
  biller_bpay_ref VARCHAR
) AS $$
DECLARE
  bill RECORD;
  wallet_balance NUMERIC;
  inserted RECORD;
BEGIN
  SET TIME ZONE 'Australia/Sydney';
  FOR bill IN
    SELECT 
      bp.id,
      bp.wallet_id,
      bp.account_id,
      bp.amount,
      bp.pay_method,
      bp.biller_bsb,
      bp.biller_bank_account_number,
      bp.biller_bpay_code,
      bp.biller_bpay_ref
    FROM bill_payments bp
    JOIN wallets w ON bp.wallet_id = w.wallet_id
    WHERE 
      bp.status = 'active'
      AND bp.next_run_at::date = CURRENT_DATE
  LOOP
    BEGIN
      SELECT balance INTO wallet_balance 
      FROM wallets 
      WHERE wallet_id = bill.wallet_id 
      FOR UPDATE;

      IF wallet_balance < bill.amount THEN
        bill_payment_id := bill.id;
        soft_deduction_id := NULL;
        account_id := bill.account_id;
        status := 'failed';
        error := 'Insufficient funds';
        pay_method := bill.pay_method;
        amount := bill.amount;
        biller_bsb := bill.biller_bsb;
        biller_bank_account_number := bill.biller_bank_account_number;
        biller_bpay_code := bill.biller_bpay_code;
        biller_bpay_ref := bill.biller_bpay_ref;
        RETURN NEXT;
        CONTINUE;
      END IF;

      -- Deduct balance
      UPDATE wallets
      SET balance = balance - bill.amount
      WHERE wallet_id = bill.wallet_id;

      -- Insert into soft_deductions
      INSERT INTO soft_deductions (bill_payment_id)
      VALUES (bill.id)
      RETURNING id INTO inserted;

      bill_payment_id := bill.id;
      soft_deduction_id := inserted.id;
      account_id := bill.account_id;
      status := 'success';
      error := NULL;
      pay_method := bill.pay_method;
      amount := bill.amount;
      biller_bsb := bill.biller_bsb;
      biller_bank_account_number := bill.biller_bank_account_number;
      biller_bpay_code := bill.biller_bpay_code;
      biller_bpay_ref := bill.biller_bpay_ref;
      RETURN NEXT;
    EXCEPTION
      WHEN OTHERS THEN
        bill_payment_id := bill.id;
        soft_deduction_id := NULL;
        account_id := bill.account_id;
        status := 'failed';
        error := SQLERRM;
        pay_method := bill.pay_method;
        amount := bill.amount;
        biller_bsb := bill.biller_bsb;
        biller_bank_account_number := bill.biller_bank_account_number;
        biller_bpay_code := bill.biller_bpay_code;
        biller_bpay_ref := bill.biller_bpay_ref;
        RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION process_bank_responses(results JSONB)
RETURNS VOID AS $$
DECLARE
  item JSONB;
  row_count INT;
  bp_id INT;
  w_id INT;
  refund_amount NUMERIC(10,2);
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(results)
  LOOP
    IF item->>'status' = 'success' THEN
      -- Update soft_deductions
      UPDATE soft_deductions
      SET status = 'success'
      WHERE id = (item->>'soft_deduction_id')::INT;

      GET DIAGNOSTICS row_count = ROW_COUNT;
      IF row_count = 0 THEN
        RAISE EXCEPTION 'No soft_deduction updated for ID %', item->>'soft_deduction_id';
      END IF;

      -- Update bill_payments
      UPDATE bill_payments
      SET
        last_paid_at = CURRENT_TIMESTAMP,
        status = CASE
          WHEN type = 'one-time' THEN 'completed'
          ELSE status
        END,
        next_run_at = CASE
          WHEN type = 'recurring' THEN
            CASE frequency
              WHEN 'weekly' THEN CURRENT_TIMESTAMP + INTERVAL '7 days'
              WHEN 'fortnightly' THEN CURRENT_TIMESTAMP + INTERVAL '14 days'
              WHEN 'monthly' THEN CURRENT_TIMESTAMP + INTERVAL '1 month'
              ELSE NULL
            END
          ELSE NULL
        END
      WHERE id = (item->>'bill_payment_id')::INT;

      GET DIAGNOSTICS row_count = ROW_COUNT;
      IF row_count = 0 THEN
        RAISE EXCEPTION 'No bill_payment updated for ID %', item->>'bill_payment_id';
      END IF;

      -- Log transaction
      INSERT INTO transactions (
        name,
        amount,
        sender_wallet_id,
        recipient_wallet_id,
        category
      )
      SELECT
        COALESCE(bp.bill_display_name, 'Bill Payment'),
        bp.amount,
        bp.wallet_id,
        NULL,
        ARRAY['bill', bp.pay_method::TEXT]
      FROM bill_payments bp
      WHERE bp.id = (item->>'bill_payment_id')::INT;

    ELSIF item->>'status' = 'failed' THEN
      -- Update soft_deductions to failed
      UPDATE soft_deductions
      SET status = 'failed'
      WHERE id = (item->>'soft_deduction_id')::INT;

      GET DIAGNOSTICS row_count = ROW_COUNT;
      IF row_count = 0 THEN
        RAISE EXCEPTION 'No soft_deduction marked as failed for ID %', item->>'soft_deduction_id';
      END IF;

      -- Refund amount back to wallet
      SELECT bp.wallet_id, bp.amount
      INTO w_id, refund_amount
      FROM bill_payments bp
      WHERE bp.id = (item->>'bill_payment_id')::INT;

      IF refund_amount IS NULL THEN
        RAISE EXCEPTION 'Could not fetch refund amount for bill_payment_id %', item->>'bill_payment_id';
      END IF;

      UPDATE wallets
      SET balance = balance + refund_amount
      WHERE wallet_id = w_id;

      GET DIAGNOSTICS row_count = ROW_COUNT;
      IF row_count = 0 THEN
        RAISE EXCEPTION 'No wallet updated for refund for wallet_id %', w_id;
      END IF;

      -- Also mark corresponding bill_payment as failed
      UPDATE bill_payments
      SET status = 'failed'
      WHERE id = (item->>'bill_payment_id')::INT;

      GET DIAGNOSTICS row_count = ROW_COUNT;
      IF row_count = 0 THEN
        RAISE EXCEPTION 'No bill_payment marked as failed for ID %', item->>'bill_payment_id';
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
