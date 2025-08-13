-- This test file truncates the existing rows and does the tests.
-- It rolls back to the original state after the tests are done.
-- Tests the sql functions.

-- To run this test file,
-- in the repo dir, run:

--     docker cp backend/src/database/test_seeds.sql postgres_db:/tmp/test_seeds.sql
--     docker cp backend/src/database/test.sql        postgres_db:/tmp/test.sql

-- to cp the test file and seeds to docker
-- and then run:

--     docker exec -i postgres_db psql -U admin -d mydb -v ON_ERROR_STOP=1 -f /tmp/test.sql

-- to run the test

\set ON_ERROR_STOP on
BEGIN;

-- Start clean + seed
TRUNCATE accounts, wallets, transactions, saved_contacts, cashback_deals,
         bill_payments, currencies, categories RESTART IDENTITY CASCADE;

-- * Run this test in the repo dir
\i /tmp/test_seeds.sql

-- Test function soft_deduct_today_bills()
-- NO ROLLBACK, we need this table for other unit tests
SELECT * FROM soft_deduct_today_bills() \g /dev/null;

-- 3) ASSERT: balances (wallet_id=3 has AUD 1000 in your seeds)
-- Expect three successes: 50 + 75 + 60 = 185; the 2000 should fail
DO $$
DECLARE v numeric;
BEGIN
  SELECT balance INTO v FROM wallets WHERE wallet_id = 3;
  IF v <> 1000 - 185 THEN
    RAISE EXCEPTION 'wallet_id=3 balance expected %, got %', 1000 - 185, v;
  END IF;
END$$;

-- unit-test change_bill_payment_status with isolation
SAVEPOINT t_change;

DO $$
DECLARE s text;
BEGIN

  SELECT status INTO s FROM bill_payments WHERE id = 1;
  IF s <> 'active' THEN
    RAISE EXCEPTION 'Precondition failed: bill_payment[1] expected active, got %', s;
  END IF;

  PERFORM change_bill_payment_status('failed', 1);

  SELECT status INTO s FROM bill_payments WHERE id = 1;
  IF s <> 'failed' THEN
    RAISE EXCEPTION 'Status did not change to failed; got %', s;
  END IF;
END$$;

ROLLBACK TO SAVEPOINT t_change;

-- unit-test set_soft_deduction_status with isolation
SAVEPOINT t_change;

DO $$
DECLARE s text;
BEGIN

  SELECT status INTO s FROM soft_deductions WHERE id = 1;
  IF s <> 'pending' THEN
    RAISE EXCEPTION 'Precondition failed: soft_deductions[1] expected pending, got %', s;
  END IF;

  PERFORM set_soft_deduction_status('failed', 1);

  SELECT status INTO s FROM soft_deductions WHERE id = 1;
  IF s <> 'failed' THEN
    RAISE EXCEPTION 'Status did not change to failed for soft deduction; got %', s;
  END IF;
END$$;

ROLLBACK TO SAVEPOINT t_change;

-- unit-test update_bp_status_and_time_after_paid with isolation
SAVEPOINT t_change;

DO $$
DECLARE 
s_one_time text;
s_recurring text;
next_run_date date;
paid_date date;
BEGIN

  SELECT status INTO s_one_time FROM bill_payments WHERE id = 1;
  IF s_one_time <> 'active' THEN
    RAISE EXCEPTION 'Precondition failed: bill_payment[1] expected active, got %', s;
  END IF;

  SELECT status INTO s_recurring FROM bill_payments WHERE id = 2;
  IF s_recurring <> 'active' THEN
    RAISE EXCEPTION 'Precondition failed: bill_payment[2] expected active, got %', s;
  END IF;

  PERFORM update_bp_status_and_time_after_paid(1);

  SELECT status, last_paid_at::date
  INTO s_one_time, paid_date
  FROM bill_payments
  WHERE id = 1;

  IF s_one_time <> 'completed' THEN
    RAISE EXCEPTION 'Status did not change to completed; got %', s;
  END IF;

  IF paid_date <> CURRENT_DATE THEN
    RAISE EXCEPTION 'last_paid_at expected today %, got %', CURRENT_DATE, paid_date;
  END IF;

  PERFORM update_bp_status_and_time_after_paid(2);

  SELECT status, next_run_at::date, last_paid_at::date
  INTO s_recurring, next_run_date, paid_date
  FROM bill_payments
  WHERE id = 2;

  IF s_recurring <> 'active' THEN
    RAISE EXCEPTION 'Status changed to satus % while should stay unchanged', s;
  END IF;

  IF paid_date <> CURRENT_DATE THEN
    RAISE EXCEPTION 'last_paid_at expected today %, got %', CURRENT_DATE, paid_date;
  END IF;

  IF next_run_date <> CURRENT_DATE + INTERVAL '1 month' THEN
    RAISE EXCEPTION 'next run at expected 1 month later %, got %', CURRENT_DATE + INTERVAL '1 month', next_run_date;
  END IF;
END$$;

ROLLBACK TO SAVEPOINT t_change;

-- unit-test refund_failed_payment_back_to_wallet_and_mark_bill_failed with isolation
SAVEPOINT t_change;

DO $$
DECLARE 
bal_ori int;
bal int;
s text;
amt int;
BEGIN

  SELECT amount, status INTO amt, s FROM bill_payments WHERE id = 1;
  IF s <> 'active' THEN
    RAISE EXCEPTION 'Precondition failed: bill_payments[1] expected active, got %', s;
  END IF;

  IF amt <> 50 THEN
    RAISE EXCEPTION 'returning 50 back; while get amount %', amt;
  END IF;

  SELECT balance INTO bal_ori FROM wallets WHERE wallet_id = 3;

  PERFORM refund_failed_payment_back_to_wallet_and_mark_bill_failed(1);

  SELECT balance INTO bal FROM wallets WHERE wallet_id = 3;
  SELECT status into s FROM bill_payments WHERE id = 1;

  IF bal <> bal_ori + amt THEN
    RAISE EXCEPTION 'failed amount not refuneded to wallet; got % while should be %', bal, bal_ori + amt;
  END IF;

  IF s <> 'failed' THEN
    RAISE EXCEPTION 'status should be failed after a failed payment, got %', s;
  END IF;
END$$;

ROLLBACK TO SAVEPOINT t_change;


-- unit-test log_transaction_after_bill_paid with isolation
SAVEPOINT t_change;

DO $$
DECLARE 
cnt int;
BEGIN

  SELECT COUNT(*) INTO cnt
  FROM transactions
  WHERE sender_wallet_id = 3;

  IF cnt <> 0 THEN
    RAISE EXCEPTION 'Expected no transactions with sender_wallet_id=3, found %', cnt;
  END IF;

  PERFORM log_transaction_after_bill_paid(1);

  SELECT COUNT(*) INTO cnt
  FROM transactions
  WHERE sender_wallet_id = 3;

  IF cnt <> 1 THEN
    RAISE EXCEPTION 'Expected 1 transaction with sender_wallet_id=3, found %', cnt;
  END IF;
  
END$$;

ROLLBACK TO SAVEPOINT t_change;

-- unit-test process_bank_responses with isolation
SAVEPOINT t_proc;

DO $$
DECLARE
  sd1 int; bp1 int;
  sd2 int; bp2 int;
  s1  text; s2  text;
  cnt int;
BEGIN
  -- Assuming we already have the soft_deduction table rows
  -- we should have because the soft deduction test did not roll back
  -- some of the previous tests used it too
  -- get two objs
  SELECT sd.id, bp.id INTO sd1, bp1
  FROM soft_deductions sd JOIN bill_payments bp ON bp.id = sd.bill_payment_id
  ORDER BY sd.id LIMIT 1;

  SELECT sd.id, bp.id INTO sd2, bp2
  FROM soft_deductions sd JOIN bill_payments bp ON bp.id = sd.bill_payment_id
  ORDER BY sd.id OFFSET 1 LIMIT 1;

  PERFORM process_bank_responses(
    format(
      '[{"soft_deduction_id": %s, "bill_payment_id": %s, "status":"success"},' ||
      ' {"soft_deduction_id": %s, "bill_payment_id": %s, "status":"failed"}]',
      sd1, bp1, sd2, bp2
    )::jsonb
  );

  SELECT status INTO s1 FROM soft_deductions WHERE id = sd1;
  SELECT status INTO s2 FROM soft_deductions WHERE id = sd2;

  IF s1 <> 'success' THEN RAISE EXCEPTION 'Expected sd % to be success, got %', sd1, s1; END IF;
  IF s2 <> 'failed'  THEN RAISE EXCEPTION 'Expected sd % to be failed,  got %', sd2, s2; END IF;

  SELECT COUNT(*) INTO cnt
  FROM transactions t
  JOIN bill_payments bp ON bp.id = bp1
  WHERE t.sender_wallet_id = bp.wallet_id AND t.amount = bp.amount;

  IF cnt < 1 THEN
    RAISE EXCEPTION 'Expected a transaction for bill % (successful); found %', bp1, cnt;
  END IF;
END$$;

ROLLBACK TO SAVEPOINT t_proc;

ROLLBACK;

-- Print message at the end
DO $$
BEGIN
  RAISE NOTICE 'All tests are passed ✅';
END$$;