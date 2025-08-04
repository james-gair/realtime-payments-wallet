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
  (2, 1, 1000.00),
  (1, 1, 200.00),  -- testuser's AUD wallet (account_id=1)
  (1, 2, 200.00),  -- testuser's USD wallet (account_id=2)
  (1, 3, 200.00),  -- testuser's YEN wallet (account_id=3)
  (3, 1, 50.00);      -- nouser's AUD wallet (account_id=3)

-------------------------------------------------------
-- Bill Payments test data
-- One-time payment with bank account (should succeed)
INSERT INTO bill_payments (
  account_id, wallet_id, amount, pay_method,
  biller_bsb, biller_bank_account_number,
  biller_display_name, bill_display_name,
  type, first_payment_date, status, next_run_at
)
VALUES (
  2, 2, 50.00, 'bankAcct',
  '062000', '12345678',
  'Electricity Company', 'Electricity Bill',
  'one-time', NOW(), 'active', CURRENT_DATE
);

-- Recurring payment with BPAY (should succeed)
INSERT INTO bill_payments (
  account_id, wallet_id, amount, pay_method,
  biller_bpay_code, biller_bpay_ref,
  biller_display_name, bill_display_name,
  type, frequency, first_payment_date, status, next_run_at
)
VALUES (
  2, 2, 75.00, 'bpay',
  '222222', '88888888',
  'Insurance Co.', 'Car Insurance',
  'recurring', 'monthly', NOW(), 'active', CURRENT_DATE
);

-- Recurring payment with bankAcct (large amount to test failure if needed)
INSERT INTO bill_payments (
  account_id, wallet_id, amount, pay_method,
  biller_bsb, biller_bank_account_number,
  biller_display_name, bill_display_name,
  type, frequency, first_payment_date, status, next_run_at
)
VALUES (
  2, 2, 2000.00, 'bankAcct',
  '063333', '98765432',
  'Internet Co.', 'Home Internet',
  'recurring', 'monthly', NOW(), 'active', CURRENT_DATE
);

-- One-time BPAY payment (should succeed)
INSERT INTO bill_payments (
  account_id, wallet_id, amount, pay_method,
  biller_bpay_code, biller_bpay_ref,
  biller_display_name, bill_display_name,
  type, first_payment_date, status, next_run_at
)
VALUES (
  2, 2, 60.00, 'bpay',
  '333333', '99999999',
  'Streaming Service', 'Netflix One-Time',
  'one-time', NOW(), 'active', CURRENT_DATE
);


-- reminders test data
-- 1-day reminder: next_run_at = 2025-08-01 → send reminder today
INSERT INTO bill_payments (
  account_id, wallet_id, amount, pay_method,
  biller_bpay_code, biller_bpay_ref,
  biller_display_name, bill_display_name,
  type, frequency, first_payment_date, status, next_run_at,
  reminder, remind_before_num_days
)
VALUES (
  2, 2, 40.00, 'bpay',
  '123123', '45645678',
  'Water Co.', 'Water Bill',
  'recurring', 'monthly', NOW(), 'active', '2025-08-02',
  true, 1
);

-- 2-day reminder: next_run_at = 2025-08-02 → send reminder today
INSERT INTO bill_payments (
  account_id, wallet_id, amount, pay_method,
  biller_bsb, biller_bank_account_number,
  biller_display_name, bill_display_name,
  type, frequency, first_payment_date, status, next_run_at,
  reminder, remind_before_num_days
)
VALUES (
  2, 2, 88.00, 'bankAcct',
  '062000', '87654321',
  'Gas Corp', 'Gas Bill',
  'recurring', 'monthly', NOW(), 'active', '2025-08-03',
  true, 2
);


