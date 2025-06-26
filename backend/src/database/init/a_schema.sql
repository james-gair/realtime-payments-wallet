CREATE TABLE IF NOT EXISTS Account (
  aId SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  verified BOOLEAN,
  pword TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Wallet (
  wId SERIAL PRIMARY KEY,
  balance MONEY,
  currency TEXT NOT NULL,
  account SERIAL REFERENCES Account(aId)
);

CREATE TABLE IF NOT EXISTS Transactions (
  tId SERIAL PRIMARY KEY,
  category TEXT NOT NULL, /*bills, direct payment*/
  eventTime TIMESTAMP NOT NULL,
  amount MONEY NOT NULL,
  receiveWallet SERIAL REFERENCES Wallet(wId),
  sendWallet SERIAL REFERENCES Wallet(wId)
);
