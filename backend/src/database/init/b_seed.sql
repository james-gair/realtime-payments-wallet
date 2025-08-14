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
INSERT INTO currencies (code, symbol) VALUES
  ('AUD', 'A$'), ('USD', '$'), ('JPY', '¥');


-- INSERT INTO wallets (wallet_id, account_id, currency_id, balance) VALUES
--   (1, 1, 1, 200.00),  -- testuser's AUD wallet (account_id=1)
--   (2, 3, 1, 50.00);      -- nouser's AUD wallet (account_id=3)

INSERT INTO wallets (account_id, currency_id, balance) VALUES
  (4, 1, 5000.00), -- Edwin's AUD wallet (account_id=4)
  (2, 2, 1000.00),
  (2, 1, 1000.00),
  (1, 1, 200.00),  -- testuser's AUD wallet (account_id=1)
  (1, 2, 200.00),  -- testuser's USD wallet (account_id=1)
  (1, 3, 200.00),  -- testuser's YEN wallet (account_id=1)
  (3, 1, 100.00);  -- nouser's AUD wallet (account_id=3)

INSERT INTO transactions (name, amount, category, sender_wallet_id, recipient_wallet_id, event_time, currency) VALUES
    ('Figma Subscription', 15.00, '{"subscription"}', 1, 4, '2023-10-01T10:00:00.000Z', 1),
    ('Salary', 2500.00, '{"finance", "income"}', 4, 1, '2023-10-05T09:00:00.000Z', 1),
    ('Coffee', 5.50, '{"drink", "cafe"}', 1, 4, '2023-10-06T08:30:00.000Z', 1),
    ('Netflix', 20.00, '{"entertainment","subscription"}', 2, 4, '2023-10-10T18:00:00.000Z', 2),
    ('Dinner with Friends', 75.00, '{"food", "restaurant"}', 1, 3, '2023-10-12T20:00:00.000Z', 1);

-- Example: Australian bank account (not linked to an account)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, NULL, 'Aussie Bank', 'James Johnson', 'bank_account', '802985-12345678', 'james.johnson@example.com', NULL, '802985-12345678');

-- Example: US bank account (not linked to an account)
INSERT INTO saved_contacts (account_id, contact_account_id, nickname, name, added_by, added_value, email, phone, bank_account)
VALUES (1, NULL, 'US Bank', 'Sarah Johnson', 'bank_account', '021000021-1234567890', 'sarah.johnson@example.com', NULL, '021000021-1234567890');

INSERT INTO cashback_deals (deal_wallet_id, min_spend_amount, cashback_amount) VALUES
  (7, 10, 2);
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
  2, 3, 40.00, 'bpay',
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
  2, 3, 88.00, 'bankAcct',
  '062000', '87654321',
  'Gas Corp', 'Gas Bill',
  'recurring', 'monthly', NOW(), 'active', '2025-08-03',
  true, 2
);


-- Top-level categories
INSERT INTO categories (category_id, category, icon, parent) VALUES 
(1, 'food', '🍽️', NULL),
(2, 'drink', '🥤', NULL),
(3, 'housing', '🏠', NULL),
(4, 'finance', '💳', NULL),
(5, 'shopping', '🛍️', NULL),
(6, 'health', '🏥', NULL),
(7, 'entertainment', '🎉', NULL),
(8, 'travel', '✈️', NULL);

-- Subcategories of food
INSERT INTO categories (category_id, category, icon, parent) VALUES 
(9, 'groceries', '🛒', 1),
(10, 'restaurant', '🍝', 1),
(11, 'fast food', '🍟', 1);

-- Subcategories of drink
INSERT INTO categories (category_id, category, icon, parent) VALUES 
(12, 'cafe', '☕', 2),
(13, 'alcohol', '🍷', 2);

-- Subcategories of housing
INSERT INTO categories (category_id, category, icon, parent) VALUES 
(14, 'rent', '💸', 3),
(15, 'mortgage', '🏡', 3),
(16, 'utilities', '💡', 3),
(17, 'internet', '🌐', 16),
(18, 'electricity', '🔌', 16),
(19, 'water', '🚿', 16);

-- Subcategories of finance
INSERT INTO categories (category_id, category, icon, parent) VALUES 
(20, 'loan', '🏦', 4),
(21, 'investment', '📈', 4),
(22, 'income', '💵', 4),
(23, 'savings', '💰', 4),
(24, 'insurance', '🛡️', 4);

-- Subcategories of shopping
INSERT INTO categories (category_id, category, icon, parent) VALUES 
(25, 'clothing', '👗', 5),
(26, 'electronics', '📱', 5),
(27, 'furniture', '🛋️', 5),
(28, 'online shopping', '💻', 5);

-- Subcategories of health
INSERT INTO categories (category_id, category, icon, parent) VALUES 
(29, 'pharmacy', '💊', 6),
(30, 'doctor', '🩺', 6),
(31, 'gym', '🏋️', 6);

-- Subcategories of entertainment
INSERT INTO categories (category_id, category, icon, parent) VALUES 
(32, 'movies', '🎬', 7),
(33, 'music', '🎧', 7),
(34, 'games', '🎮', 7),
(35, 'subscription', '🔔', 7);

-- Subcategories of travel
INSERT INTO categories (category_id, category, icon, parent) VALUES 
(36, 'accommodation', '🏨', 8),
(37, 'flights', '🛫', 8),
(38, 'taxis', '🚖', 8),
(39, 'sightseeing', '🗺️', 8);

-------------------------------------------------------
-- Group Payments test data
-------------------------------------------------------

-- Create some test groups
INSERT INTO groups (id, admin_account_id, name, icon) VALUES 
  ('11111111-1111-1111-1111-111111111111', 1, 'Roommates', '🏠'),
  ('22222222-2222-2222-2222-222222222222', 2, 'Weekend Trip', '🚗'),
  ('33333333-3333-3333-3333-333333333333', 4, 'Lunch Squad', '🍕');

-- Add members to groups
INSERT INTO group_members (group_id, account_id, balance) VALUES 
  -- Roommates group (testuser is admin)
  ('11111111-1111-1111-1111-111111111111', 1, -20.00),  -- testuser owes 20
  ('11111111-1111-1111-1111-111111111111', 2, -5.00),   -- testuserverified owes 5
  ('11111111-1111-1111-1111-111111111111', 3, 15.00),   -- nouser is owed 15
  ('11111111-1111-1111-1111-111111111111', 4, 10.00),   -- Edwin is owed 10

  -- Weekend Trip group (testuserverified is admin)
  ('22222222-2222-2222-2222-222222222222', 1, 50.00),   -- testuser is owed 50
  ('22222222-2222-2222-2222-222222222222', 2, -30.00),  -- testuserverified owes 30
  ('22222222-2222-2222-2222-222222222222', 4, -20.00),  -- Edwin owes 20

  -- Lunch Squad group (Edwin is admin)
  ('33333333-3333-3333-3333-333333333333', 1, 25.00),   -- testuser is owed 25
  ('33333333-3333-3333-3333-333333333333', 2, -15.00),  -- testuserverified owes 15
  ('33333333-3333-3333-3333-333333333333', 4, -10.00);  -- Edwin owes 10

-- Add some expenses
INSERT INTO group_expenses (id, group_id, payer_account_id, amount, description) VALUES 
  ('eeeeeeee-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 3, 40.00, 'Groceries for the house'),
  ('eeeeeeee-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 1, 100.00, 'Gas for road trip'),
  ('eeeeeeee-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 1, 50.00, 'Pizza lunch');

-- Add expense splits
INSERT INTO group_expense_splits (expense_id, account_id, amount) VALUES 
  -- Groceries split (40.00 total)
  ('eeeeeeee-1111-1111-1111-111111111111', 1, 10.00),   -- testuser
  ('eeeeeeee-1111-1111-1111-111111111111', 2, 10.00),   -- testuserverified
  ('eeeeeeee-1111-1111-1111-111111111111', 3, 10.00),   -- nouser (payer)
  ('eeeeeeee-1111-1111-1111-111111111111', 4, 10.00),   -- Edwin

  -- Gas split (100.00 total)
  ('eeeeeeee-2222-2222-2222-222222222222', 1, 35.00),   -- testuser (payer)
  ('eeeeeeee-2222-2222-2222-222222222222', 2, 35.00),   -- testuserverified
  ('eeeeeeee-2222-2222-2222-222222222222', 4, 30.00),   -- Edwin

  -- Pizza split (50.00 total)
  ('eeeeeeee-3333-3333-3333-333333333333', 1, 15.00),   -- testuser (payer)
  ('eeeeeeee-3333-3333-3333-333333333333', 2, 20.00),   -- testuserverified
  ('eeeeeeee-3333-3333-3333-333333333333', 4, 15.00);   -- Edwin

-- Add some group activity
INSERT INTO group_activity (group_id, account_id, activity_type, description, details, amount) VALUES 
  ('11111111-1111-1111-1111-111111111111', NULL, 'group_created', 'Group was created', 'Roommates group started', NULL),
  ('11111111-1111-1111-1111-111111111111', 3, 'expense_added', 'Added an expense', 'Groceries for the house - $40.00', 40.00),
  ('22222222-2222-2222-2222-222222222222', NULL, 'group_created', 'Group was created', 'Weekend Trip group started', NULL),
  ('22222222-2222-2222-2222-222222222222', 1, 'expense_added', 'Added an expense', 'Gas for road trip - $100.00', 100.00),
  ('33333333-3333-3333-3333-333333333333', NULL, 'group_created', 'Group was created', 'Lunch Squad group started', NULL),
  ('33333333-3333-3333-3333-333333333333', 1, 'expense_added', 'Added an expense', 'Pizza lunch - $50.00', 50.00);
