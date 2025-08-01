INSERT INTO accounts (firebase_id, username, email, phone, date_of_birth, is_verified, first_name, last_name) VALUES
  ('xQAGaT5lXreLsvTUeLimeVC6zKL2', 'testuser', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z', false, 'Test', 'User'),
  ('ImwaeGpTjUhxe5GStIi1nwbYDj72', 'testuserverified', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z', true, 'Test', 'User'),
  ('IdCcg1ruAUflcZX8SBJp6gJCGPE3', 'nouser', 'no@gmail.com', '0414325212', '2000-12-12T00:00:00.000Z', false, 'No', 'User'),
  ('mGL5NcnAZvOUdQuqxxCDiXcWRBn2', 'EN', 'edwinni@outlook.com.au', '0481088688', '2001-09-19T00:00:00.000Z', 'f', 'Edwin', 'N'),
 -- For api doc testing:
  ('mock-user', 'mockmarker', 'marker@example.com', '0400000000', '1990-01-01T00:00:00.000Z',false,'Marker','Test');

/* 
pword for test is testtest
pword for no is nononono
*/
INSERT INTO currencies (currency_id, code, symbol) VALUES
  (1, 'AUD', 'A$'), (2, 'USD', '$'), (3, 'JPY', '¥');

-- Example: added by username (linked to account_id 2)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, 2, 'Bestie', 'Test User Verified', 'username', 'testuserverified', NULL, NULL, NULL);

-- Example: added by username (linked to account_id 3, no nickname)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, 3, NULL, 'No User', 'username', 'nouser', NULL, NULL, NULL);

-- Example: added by email (PayID, not linked to an account)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, NULL, 'PayID Jane', 'Jane Doe', 'email', 'jane.payid@example.com', 'jane.payid@example.com', NULL, NULL);

-- Example: added by phone (PayID, not linked to an account)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, NULL, NULL, 'John Smith', 'phone', '+61412345678', NULL, '+61412345678', NULL);

-- Example: added by bank account (not linked to an account)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, NULL, 'Bank Buddy', 'Sally Account', 'bank_account', '123-456 987654321', NULL, NULL, '123-456 987654321');

INSERT INTO wallets (account_id, currency_id, balance) VALUES
  (4, 1, 5000.00), -- Edwin's AUD wallet (account_id=4)
  (2, 2, 1000.00),
  (1, 1, 200.00),  -- testuser's AUD wallet (account_id=1)
  (3, 1, 50.00);      -- nouser's AUD wallet (account_id=3)

INSERT INTO transactions (name, amount, category, sender_wallet_id, recipient_wallet_id, event_time) VALUES
    ('Figma Subscription', 15.00, '{"design","software","subscription"}', 1, 4, '2023-10-01T10:00:00.000Z'),
    ('Salary', 2500.00, '{"income", "work"}', 4, 1, '2023-10-05T09:00:00.000Z'),
    ('Coffee', 5.50, '{"food", "cafe"}', 1, 4, '2023-10-06T08:30:00.000Z'),
    ('Netflix', 20.00, '{"entertainment","subscription"}', 2, 4, '2023-10-10T18:00:00.000Z'),
    ('Dinner with Friends', 75.00, '{"food", "social"}', 1, 3, '2023-10-12T20:00:00.000Z');

