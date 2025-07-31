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
CREATE TYPE payment_status AS ENUM ('active', 'completed', 'cancelled');
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
