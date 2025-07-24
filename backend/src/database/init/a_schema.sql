CREATE TABLE Account (
  account_id SERIAL PRIMARY KEY,
  firebase_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  dob DATE NOT NULL,
  address TEXT,
  verified BOOLEAN DEFAULT FALSE,
  zai_user_id TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT
);

CREATE TABLE account_identity (
  account_id INTEGER PRIMARY KEY REFERENCES Account(account_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  id_type TEXT NOT NULL CHECK (id_type IN ('passport', 'driver_license')),
  id_number TEXT NOT NULL,
  id_expiry_date DATE NOT NULL,
  place_of_issue TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL
);

-- Currencies table
CREATE TABLE Currency (
  currency_id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,  -- e.g. "AUD", "USD"
  symbol VARCHAR(10) NOT NULL UNIQUE
);

-- Wallets table
CREATE TABLE Wallet (
  wallet_id SERIAL PRIMARY KEY,
  zai_wallet_id TEXT NOT NULL UNIQUE,
  account INTEGER NOT NULL,
  currency INTEGER NOT NULL,
  balance NUMERIC(18, 2) DEFAULT 0 CHECK (balance >= 0),
  -- card_number VARCHAR(16) NOT NULL,
  -- expiry_date VARCHAR(5) NOT NULL,
  monthly_limit NUMERIC(18, 2) CHECK (monthly_limit >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (account, currency),
  FOREIGN KEY (account) REFERENCES Account(account_id),
  FOREIGN KEY (currency) REFERENCES Currency(currency_id)
);

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON Wallet
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE Transactions (
  transaction_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(18, 2) DEFAULT 0 CHECK (amount >= 0),
  event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  category TEXT[] NOT NULL DEFAULT '{}',
  sender INTEGER REFERENCES Wallet(wallet_id),
  recipient INTEGER REFERENCES Wallet(wallet_id)
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
