CREATE TABLE Account (
  account_id SERIAL PRIMARY KEY,
  firebase_id TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  dob DATE NOT NULL,
  address TEXT,
  verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE account_identity (
  account_id INTEGER PRIMARY KEY REFERENCES Account(account_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  id_type TEXT NOT NULL CHECK (id_type IN ('passport', 'drivers_license')),
  id_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  country_of_issue TEXT,
  state_of_issue TEXT,
  verified_at TIMESTAMP NOT NULL
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
  account INTEGER NOT NULL,
  currency INTEGER NOT NULL,
  balance NUMERIC(18, 2) DEFAULT 0 CHECK (balance >= 0),
  card_number VARCHAR(16) NOT NULL,
  expiry_date VARCHAR(5) NOT NULL,
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
  category TEXT,
  sender SERIAL REFERENCES Wallet(wallet_id),
  recipient SERIAL REFERENCES Wallet(wallet_id)
);

