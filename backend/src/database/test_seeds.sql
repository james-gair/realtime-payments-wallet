-- Bill Payments test data

-- Create user, wallet and currency
INSERT INTO accounts (account_id, firebase_id, username, email, phone, date_of_birth, is_verified, first_name, last_name) VALUES
  (2, 'ImwaeGpTjUhxe5GStIi1nwbYDj72', 'testuserverified', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z', true, 'Test', 'User');

INSERT INTO currencies (code, symbol) VALUES
('AUD', 'A$'), ('USD', '$'), ('JPY', '¥');

INSERT INTO wallets (wallet_id, account_id, currency_id, balance) VALUES
  (2, 2, 2, 1000.00),
  (3, 2, 1, 1000.00);

-------------------------------------------------------
-- Bill Payments test data
-- One-time payment with bank account (should succeed)
SET TIME ZONE 'Australia/Sydney';
INSERT INTO bill_payments (
  account_id, wallet_id, amount, pay_method,
  biller_bsb, biller_bank_account_number,
  biller_display_name, bill_display_name,
  type, first_payment_date, status, next_run_at
)
VALUES (
  2, 3, 50.00, 'bankAcct',
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
  2, 3, 75.00, 'bpay',
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
  2, 3, 2000.00, 'bankAcct',
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
  2, 3, 60.00, 'bpay',
  '333333', '99999999',
  'Streaming Service', 'Netflix One-Time',
  'one-time', NOW(), 'active', CURRENT_DATE
);
