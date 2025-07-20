-- INSERT INTO Account (account_id, firebase_id, username, email, phone, dob) VALUES
--   (1, 'xQAGaT5lXreLsvTUeLimeVC6zKL2', 'testuser', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z'),
--   (3, 'ImwaeGpTjUhxe5GStIi1nwbYDj72', 'testuserverified', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z'),
--   (2, 'IdCcg1ruAUflcZX8SBJp6gJCGPE3', 'nouser', 'no@gmail.com', '0414325212', '2000-12-12T00:00:00.000Z');
/* 
pword for test is testtest
pword for no is nononono
*/
INSERT INTO Currency (currency_id, code, symbol) VALUES
  (1, 'AUD', 'A$'), (2, 'USD', '$'), (3, 'JPY', '¥');


-- INSERT INTO Wallet (wallet_id, account, currency, balance) VALUES
--     (20, 1, 1, 1000),
--     (2, 1, 2, 1000),
--     (3, 1, 3, 10000),
--     (11, 3, 1, 1000),
--     (12, 3, 2, 500),
--     (13, 3, 3, 100),
--     (4, 2, 2, 100),
--     (5, 2, 3, 100);

-- INSERT INTO Transactions (transaction_id, name, amount, 
--                           category, sender, recipient) VALUES
--     (1, 'Figma', 15, 'stuff', 1, 4),
--     (2, 'Grammarly', 20, 'stuff', 1, 4),
--     (3, 'Blender', 300, 'stuff', 1, 4),
--     (4, 'Netflix', 30, 'stuff', 4, 1),
--     (5, 'Spotify', 20, 'stuff', 1, 4);