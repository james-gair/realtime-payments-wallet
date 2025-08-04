INSERT INTO accounts (account_id, firebase_id, username, email, phone, date_of_birth, is_verified, first_name, last_name) VALUES
  (1, 'xQAGaT5lXreLsvTUeLimeVC6zKL2', 'testuser', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z', false, 'Test', 'User'),
  (2, 'ImwaeGpTjUhxe5GStIi1nwbYDj72', 'testuserverified', 'test@gmail.com', '0414312212', '2000-12-01T00:00:00.000Z', true, 'Test', 'User'),
  (3, 'IdCcg1ruAUflcZX8SBJp6gJCGPE3', 'nouser', 'no@gmail.com', '0414325212', '2000-12-12T00:00:00.000Z', false, 'No', 'User'),
  (4, 'mGL5NcnAZvOUdQuqxxCDiXcWRBn2', 'EN', 'edwinni@outlook.com.au', '0481088688', '2001-09-19T00:00:00.000Z', 'f', 'Edwin', 'N'),
 -- For api doc testing:
  (5, 'mock-user', 'mockmarker', 'marker@example.com', '0400000000', '1990-01-01T00:00:00.000Z',false,'Marker','Test');

/* 
pword for test is testtest
pword for no is nononono
*/
INSERT INTO currencies (currency_id, code, symbol) VALUES
  (1, 'AUD', 'A$'), (2, 'USD', '$'), (3, 'JPY', '¥');


INSERT INTO wallets (wallet_id, account_id, currency_id, balance) VALUES
  (4, 4, 1, 5000.00), -- Edwin's AUD wallet (account_id=4)
  (3, 2, 2, 1000.00),
  (1, 1, 1, 200.00),  -- testuser's AUD wallet (account_id=1)
  (2, 3, 1, 50.00);      -- nouser's AUD wallet (account_id=3)


INSERT INTO transactions (name, amount, category, sender_wallet_id, recipient_wallet_id, event_time, currency) VALUES
    ('Figma Subscription', 15.00, '{"subscription"}', 1, 4, '2023-10-01T10:00:00.000Z', 1),
    ('Salary', 2500.00, '{"finance", "income"}', 4, 1, '2023-10-05T09:00:00.000Z', 1),
    ('Coffee', 5.50, '{"drink", "cafe"}', 1, 4, '2023-10-06T08:30:00.000Z', 1),
    ('Netflix', 20.00, '{"entertainment","subscription"}', 2, 4, '2023-10-10T18:00:00.000Z', 2),
    ('Dinner with Friends', 75.00, '{"food", "restaurant"}', 1, 3, '2023-10-12T20:00:00.000Z', 1);






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