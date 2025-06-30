INSERT INTO Account (email, phone, dob, verified) VALUES
  ('alice@example.com', '0411212122', '2025-06-30', TRUE),
  ('bob@example.com', '0411212122', '2025-06-30', TRUE),
  ('carol@example.com', '0411212122', '2025-06-30', FALSE);

  INSERT INTO Wallet (balance, currency, Account) VALUES
  (0, 'AUD', (SELECT aId FROM Account WHERE email = 'alice@example.com')),
  (200, 'USD', (SELECT aId FROM Account WHERE email = 'bob@example.com')),
  (10000, 'YEN', (SELECT aId FROM Account WHERE email = 'carol@example.com'));