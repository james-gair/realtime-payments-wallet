CREATE TABLE Account (
  account_id SERIAL PRIMARY KEY,
  firebase_id TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  dob DATE NOT NULL,
  address TEXT,
  verified BOOLEAN DEFAULT FALSE
);

-- Currencies table
CREATE TABLE Currency (
  currency_id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE  -- e.g. "AUD", "USD"
);

-- Wallets table
CREATE TABLE Wallet (
  wallet_id SERIAL PRIMARY KEY,  
  account INTEGER NOT NULL,
  currency INTEGER NOT NULL,
  balance NUMERIC(18, 2) DEFAULT 0 CHECK (balance >= 0),
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
  category TEXT NOT NULL, /*bills, direct payment*/
  event_Time TIMESTAMP NOT NULL,
  amount MONEY NOT NULL,
  sender SERIAL REFERENCES Wallet(wallet_id),
  recipient SERIAL REFERENCES Wallet(wallet_id)
);
