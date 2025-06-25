INSERT INTO Account (email, phone, verified, pword) VALUES
  ('alice@example.com', '0411212122', TRUE, 'hashedpass123'),
  ('bob@example.com', '0411212122', TRUE, 'hashedpass456'),
  ('carol@example.com', '0411212122', FALSE, 'hashedpass789');

  INSERT INTO Wallet (balance, currency, Account) VALUES
  (0, 'AUD', (SELECT aId FROM Account WHERE email = 'alice@example.com')),
  (200, 'USD', (SELECT aId FROM Account WHERE email = 'bob@example.com')),
  (10000, 'YEN', (SELECT aId FROM Account WHERE email = 'carol@example.com'));