INSERT INTO Account (account_id, firebase_id, email, phone, dob) VALUES
  (1, 'xQAGaT5lXreLsvTUeLimeVC6zKL2', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z'),
  (3, 'ImwaeGpTjUhxe5GStIi1nwbYDj72', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z'),
  (2, 'IdCcg1ruAUflcZX8SBJp6gJCGPE3', 'no@gmail.com', '0414325212', '2000-12-12T00:00:00.000Z');
/* 
pword for test is testtest
pword for no is nononono
*/
INSERT INTO Currency (currency_id, code, symbol) VALUES
  (1, 'AUD', 'A$'), (2, 'USD', '$'), (3, 'YEN', '¥');


INSERT INTO Wallet (wallet_id, account, currency, balance, card_number, expiry_date) VALUES
    (1, 1, 1, 1000, '4532680845262698', '01/26'),
    (2, 1, 2, 500, '4716177774944469', '05/28'),
    (3, 1, 3, 100, '4716218735065224', '05/27'),
    (4, 2, 2, 100, '4716041045948800', '12/27'),
    (5, 2, 3, 100, '4556004299128951', '04/26');

INSERT INTO Transactions (transaction_id, name, amount, 
                          category, sender, recipient) VALUES
    (1, 'Figma', 15, 'stuff', 1, 4),
    (2, 'Grammarly', 20, 'stuff', 1, 4),
    (3, 'Blender', 300, 'stuff', 1, 4),
    (4, 'Netflix', 30, 'stuff', 4, 1),
    (5, 'Spotify', 20, 'stuff', 1, 4);