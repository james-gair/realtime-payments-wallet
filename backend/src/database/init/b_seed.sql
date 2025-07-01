INSERT INTO Account (account_id, firebase_id, email, phone, dob) VALUES
  (1, 'xQAGaT5lXreLsvTUeLimeVC6zKL2', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z'),
  (2, 'IdCcg1ruAUflcZX8SBJp6gJCGPE3', 'no@gmail.com', '0414325212', '2000-12-12T00:00:00.000Z');

INSERT INTO Currency (currency_id, code) VALUES
  (1, 'AUD'), (2, 'USD'), (3, 'EUR');


INSERT INTO Wallet (wallet_id, account, currency, balance) VALUES
    (1, 1, 1, 1000),
    (2, 1, 2, 500),
    (3, 1, 3, 100),
    (4, 2, 2, 100),
    (5, 2, 3, 100);
