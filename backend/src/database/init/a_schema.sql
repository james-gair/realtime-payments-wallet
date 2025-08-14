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

-- Enforce one SendIt account per user regardless of how it was added
ALTER TABLE saved_contacts
  ADD CONSTRAINT unique_account_per_contact UNIQUE (account_id, contact_account_id);

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

CREATE TABLE payment_requests (
  id SERIAL PRIMARY KEY,
  account_id_from INTEGER NOT NULL REFERENCES accounts(account_id),
  username_from TEXT NOT NULL,
  account_id_to INTEGER NOT NULL REFERENCES accounts(account_id),
  username_to TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency_id INTEGER NOT NULL REFERENCES currencies(currency_id),
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cashback_deals (
  deal_id SERIAL PRIMARY KEY,
  deal_wallet_id INTEGER NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  min_spend_amount NUMERIC(18,2) NOT NULL CHECK (min_spend_amount >= 0),
  cashback_amount NUMERIC(18,2) NOT NULL CHECK (cashback_amount > 0)
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
  currency INTEGER REFERENCES currencies(currency_id),
  sender_wallet_id INTEGER REFERENCES wallets(wallet_id),
  recipient_wallet_id INTEGER REFERENCES wallets(wallet_id)
);

CREATE TABLE categories (
  category_id SERIAL PRIMARY KEY,
  category TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  parent INTEGER REFERENCES categories(category_id) DEFAULT NULL
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
  biller_bpay_code VARCHAR(20),
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


-- ============================================================================
-- GROUP PAYMENT TABLES
-- ============================================================================

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_account_id INTEGER NOT NULL REFERENCES accounts(account_id),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, account_id)
);

CREATE TABLE group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  payer_account_id INTEGER NOT NULL REFERENCES accounts(account_id),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Track individual splits for each expense
CREATE TABLE group_expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(account_id),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
  UNIQUE (expense_id, account_id)
);

-- Track group activity/events for history
CREATE TABLE group_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES accounts(account_id), -- NULL for system events
  activity_type TEXT NOT NULL CHECK (activity_type IN ('expense_added', 'payment_made', 'payment_settled', 'member_joined', 'member_left', 'group_created', 'group_updated')),
  description TEXT NOT NULL,
  details TEXT,
  amount NUMERIC(18, 2), -- optional, for money-related activities
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Track settlements/payments between group members
CREATE TABLE group_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  payer_account_id INTEGER NOT NULL REFERENCES accounts(account_id),
  recipient_account_id INTEGER NOT NULL REFERENCES accounts(account_id),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ
);

-- Add triggers for updating timestamps
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GROUP PAYMENT HELPER FUNCTIONS
-- ============================================================================

-- Function to add an expense and automatically update member balances
CREATE OR REPLACE FUNCTION add_group_expense(
  p_group_id UUID,
  p_payer_account_id INTEGER,
  p_amount NUMERIC(18,2),
  p_description TEXT,
  p_splits JSONB -- {"account_id": amount, "account_id": amount, ...}
)
RETURNS UUID AS $$
DECLARE
  expense_id UUID;
  split_record RECORD;
  total_splits NUMERIC(18,2) := 0;
  payer_split NUMERIC(18,2) := 0;
  amount_to_receive NUMERIC(18,2);
BEGIN
  -- Validate that splits add up to the total amount
  SELECT SUM((value::text)::NUMERIC(18,2)) INTO total_splits
  FROM jsonb_each(p_splits);
  
  IF total_splits != p_amount THEN
    RAISE EXCEPTION 'Split amounts (%) do not equal total expense amount (%)', total_splits, p_amount;
  END IF;

  -- Insert the expense
  INSERT INTO group_expenses (group_id, payer_account_id, amount, description)
  VALUES (p_group_id, p_payer_account_id, p_amount, p_description)
  RETURNING id INTO expense_id;

  -- Insert splits and update balances
  FOR split_record IN 
    SELECT key::INTEGER as account_id, (value::text)::NUMERIC(18,2) as split_amount
    FROM jsonb_each(p_splits)
  LOOP
    -- Insert the split record
    INSERT INTO group_expense_splits (expense_id, account_id, amount)
    VALUES (expense_id, split_record.account_id, split_record.split_amount);

    -- Update member balance
    IF split_record.account_id = p_payer_account_id THEN
      -- Payer is owed the total amount minus their own share (positive balance)
      payer_split := split_record.split_amount;
      amount_to_receive := p_amount - payer_split;
      
      UPDATE group_members 
      SET balance = balance + amount_to_receive
      WHERE group_id = p_group_id AND account_id = p_payer_account_id;
    ELSE
      -- Other members owe their share (negative balance)
      UPDATE group_members 
      SET balance = balance - split_record.split_amount
      WHERE group_id = p_group_id AND account_id = split_record.account_id;
    END IF;
  END LOOP;

  -- Add activity log
  INSERT INTO group_activity (group_id, account_id, activity_type, description, details, amount)
  VALUES (
    p_group_id, 
    p_payer_account_id, 
    'expense_added',
    'Added an expense',
    p_description || ' - $' || p_amount::TEXT,
    p_amount
  );

  RETURN expense_id;
END;
$$ LANGUAGE plpgsql;

-- Function to settle debt between two group members
-- TODO: This is only for AUD wallets for now
CREATE OR REPLACE FUNCTION settle_group_debt(
  p_group_id UUID,
  p_payer_account_id INTEGER,
  p_recipient_account_id INTEGER,
  p_amount NUMERIC(18,2),
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  settlement_id UUID;
BEGIN

  -- Check if payer has enough balance
  IF (SELECT balance FROM wallets WHERE account_id = p_payer_account_id AND currency_id = 1) < p_amount THEN
    RAISE EXCEPTION 'Payer does not have enough balance to settle debt';
  END IF;

  -- Check if p_amount is positive
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Settlement amount must be positive';
  END IF;


  -- Insert settlement record
  INSERT INTO group_settlements (group_id, payer_account_id, recipient_account_id, amount, description, status)
  VALUES (p_group_id, p_payer_account_id, p_recipient_account_id, p_amount, p_description, 'completed')
  RETURNING id INTO settlement_id;

  -- Update balances
  -- Payer reduces their debt (their balance increases toward zero from negative)
  UPDATE group_members 
  SET balance = balance + p_amount
  WHERE group_id = p_group_id AND account_id = p_payer_account_id;

  -- Update payer wallet balance
  UPDATE wallets
  SET balance = balance - p_amount
  WHERE account_id = p_payer_account_id AND currency_id = 1;

  -- Recipient is owed less (their balance decreases toward zero from positive)
  UPDATE group_members 
  SET balance = balance - p_amount
  WHERE group_id = p_group_id AND account_id = p_recipient_account_id;

  -- Update recipient wallet balance
  UPDATE wallets
  SET balance = balance + p_amount
  WHERE account_id = p_recipient_account_id AND currency_id = 1;

  -- Add activity log
  INSERT INTO group_activity (group_id, account_id, activity_type, description, details, amount)
  VALUES (
    p_group_id, 
    p_payer_account_id, 
    'payment_made',
    'Made a payment',
    COALESCE(p_description, 'Settlement payment') || ' - $' || p_amount::TEXT,
    p_amount
  );

  -- Add transaction
  INSERT INTO transactions (
    name,
    amount,
    sender_wallet_id,
    recipient_wallet_id,
    category,
    currency
  )
  VALUES (
    'Settlement payment',
    p_amount,
    (SELECT wallet_id FROM wallets WHERE account_id = p_payer_account_id AND currency_id = 1),
    (SELECT wallet_id FROM wallets WHERE account_id = p_recipient_account_id AND currency_id = 1),
    ARRAY['finance'],
    1
  );

  -- Mark settlement as completed
  UPDATE group_settlements 
  SET completed_at = CURRENT_TIMESTAMP 
  WHERE id = settlement_id;

  RETURN settlement_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get member balances for a group
-- Returns optimal settlement balances based on the calculate_optimal_settlements function
CREATE OR REPLACE FUNCTION get_group_member_balances(p_group_id UUID)
RETURNS TABLE (
  account_id INTEGER,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  balance NUMERIC(18,2),
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH optimal_balances AS (
    -- Calculate optimal net balances from settlements
    SELECT 
      gm.account_id,
      COALESCE(
        SUM(
          CASE 
            -- If this member should pay in optimal settlements (they owe money)
            WHEN os.debtor_account_id = gm.account_id THEN -os.amount
            -- If this member should receive in optimal settlements (they are owed money)
            WHEN os.creditor_account_id = gm.account_id THEN os.amount
            ELSE 0
          END
        ), 0
      ) as optimal_balance
    FROM group_members gm
    LEFT JOIN calculate_optimal_settlements(p_group_id) os 
      ON (os.debtor_account_id = gm.account_id OR os.creditor_account_id = gm.account_id)
    WHERE gm.group_id = p_group_id
    GROUP BY gm.account_id
  )
  SELECT 
    gm.account_id,
    a.username,
    a.first_name,
    a.last_name,
    COALESCE(ob.optimal_balance, 0) as balance,
    gm.joined_at
  FROM group_members gm
  JOIN accounts a ON gm.account_id = a.account_id
  LEFT JOIN optimal_balances ob ON ob.account_id = gm.account_id
  WHERE gm.group_id = p_group_id
  ORDER BY COALESCE(ob.optimal_balance, 0) DESC, a.username;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate optimal settlements (who should pay whom)
CREATE OR REPLACE FUNCTION calculate_optimal_settlements(p_group_id UUID)
RETURNS TABLE (
  debtor_account_id INTEGER,
  debtor_username TEXT,
  creditor_account_id INTEGER,
  creditor_username TEXT,
  amount NUMERIC(18,2)
) AS $$
DECLARE
  debtor RECORD;
  creditor RECORD;
  settlement_amount NUMERIC(18,2);
BEGIN
  -- Get all members who owe money (negative balance)
  FOR debtor IN
    SELECT gm.account_id, a.username, gm.balance
    FROM group_members gm
    JOIN accounts a ON gm.account_id = a.account_id
    WHERE gm.group_id = p_group_id AND gm.balance < 0
    ORDER BY gm.balance ASC
  LOOP
    -- For each debtor, find creditors to pay
    FOR creditor IN
      SELECT gm.account_id, a.username, gm.balance
      FROM group_members gm
      JOIN accounts a ON gm.account_id = a.account_id
      WHERE gm.group_id = p_group_id AND gm.balance > 0
      ORDER BY gm.balance DESC
    LOOP
      -- Calculate how much the debtor should pay this creditor
      settlement_amount := LEAST(ABS(debtor.balance), creditor.balance);
      
      IF settlement_amount > 0 THEN
        debtor_account_id := debtor.account_id;
        debtor_username := debtor.username;
        creditor_account_id := creditor.account_id;
        creditor_username := creditor.username;
        amount := settlement_amount;
        
        RETURN NEXT;
        
        -- Update remaining balances for this calculation
        debtor.balance := debtor.balance + settlement_amount;
        creditor.balance := creditor.balance - settlement_amount;
        
        -- If debtor has paid off their debt, move to next debtor
        IF debtor.balance >= 0 THEN
          EXIT;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get detailed debt breakdown for a specific member
CREATE OR REPLACE FUNCTION get_member_debt_details(p_group_id UUID, p_account_id INTEGER)
RETURNS TABLE (
  expense_description TEXT,
  total_expense_amount NUMERIC(18,2),
  member_share NUMERIC(18,2),
  payer_username TEXT,
  expense_date TIMESTAMPTZ,
  member_is_payer BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ge.description,
    ge.amount,
    ges.amount as member_share,
    payer.username,
    ge.created_at,
    (ge.payer_account_id = p_account_id) as member_is_payer
  FROM group_expenses ge
  JOIN group_expense_splits ges ON ge.id = ges.expense_id
  JOIN accounts payer ON ge.payer_account_id = payer.account_id
  WHERE ge.group_id = p_group_id 
    AND ges.account_id = p_account_id
  ORDER BY ge.created_at DESC;
END;
$$ LANGUAGE plpgsql;

