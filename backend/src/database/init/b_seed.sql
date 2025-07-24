INSERT INTO account (account_id, firebase_id, username, email, phone, dob) VALUES
  (1, 'xQAGaT5lXreLsvTUeLimeVC6zKL2', 'testuser', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z'),
  (3, 'ImwaeGpTjUhxe5GStIi1nwbYDj72', 'testuserverified', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z'),
  (2, 'IdCcg1ruAUflcZX8SBJp6gJCGPE3', 'nouser', 'no@gmail.com', '0414325212', '2000-12-12T00:00:00.000Z');
/* 
pword for test is testtest
pword for no is nononono
*/
INSERT INTO currency (currency_id, code, symbol) VALUES
  (1, 'AUD', 'A$'), (2, 'USD', '$'), (3, 'JPY', '¥');

-- Example: added by username (linked to account_id 2)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, 2, 'Bestie', 'No User', 'username', 'nouser', NULL, NULL, NULL);

-- Example: added by username (linked to account_id 3, no nickname)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, 3, NULL, 'Test User Verified', 'username', 'testuserverified', NULL, NULL, NULL);

-- Example: added by email (PayID, not linked to an account)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, NULL, 'PayID Jane', 'Jane Doe', 'email', 'jane.payid@example.com', 'jane.payid@example.com', NULL, NULL);

-- Example: added by phone (PayID, not linked to an account)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, NULL, NULL, 'John Smith', 'phone', '+61412345678', NULL, '+61412345678', NULL);

-- Example: added by bank account (not linked to an account)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, NULL, 'Bank Buddy', 'Sally Account', 'bank_account', '123-456 987654321', NULL, NULL, '123-456 987654321');

INSERT INTO wallet (wallet_id, account, currency, balance) VALUES
    (20, 1, 1, 1000),
    (2, 1, 2, 1000),
    (3, 1, 3, 10000),
    (11, 3, 1, 1000),
    (12, 3, 2, 500),
    (13, 3, 3, 100),
    (4, 2, 1, 500),
    (5, 2, 3, 100);

INSERT INTO transactions (event_time, transaction_id, name, amount, 
                          category, sender, recipient) VALUES
    ('2000-12-01T00:00:00.000Z', 1, 'Figma', 15, '{"design","software","subscription"}', 1, 4),
    ('2012-11-06T02:00:00.000Z', 2, 'Grammarly', 20, '{"software","subscription", "language"}', 1, 4),
    ('2000-12-01T00:00:00.000Z', 3, 'Blender', 300, '{"technology","kitchen"}', 1, 4),
    ('2010-12-01T00:00:00.000Z', 4, 'Netflix', 30, '{"stuff","subscription","entertainment"}', 4, 1),
    ('2025-7-18T12:00:00.000Z', 5, 'Spotify', 20, '{"software","subscription", "music"}', 1, 4),
    ('2025-7-18T12:30:00.000Z', 6, 'Spotify', 20, '{"software","subscription", "music"}', 1, 4),
    ('2025-7-18T12:00:00.000Z', 7, 'Spotify', 20, '{"software","subscription", "music"}', 1, 4),
    ('2025-7-18T09:05:00.000Z', 8, 'Spotify', 20, '{"software","subscription", "music"}', 1, 4),
    ('2025-7-18T18:24:00.000Z', 9, 'Spotify', 20, '{"software","subscription", "music"}', 1, 4),
    ('2025-7-18T22:19:00.000Z', 10, 'Spotify', 20, '{"software","subscription", "music"}', 1, 4);