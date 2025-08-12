-- sql functions that handle scheduled bill payments in bulk
-- to avoid hitting db multiple times when doing bulk transfer.

-- Mark a bill payment as failed
CREATE OR REPLACE FUNCTION change_bill_payment_status(p_status payment_status, p_id int)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  row_count int;
BEGIN
  UPDATE bill_payments
  SET status = p_status
  WHERE id = p_id;

  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count = 0 THEN
    RAISE EXCEPTION 'No bill_payment marked as failed for ID %', p_id;
  END IF;
END;
$$;

-- Function to soft deduct bill payments in bulk
-- including error handling for insufficient funds or other issues
CREATE OR REPLACE FUNCTION soft_deduct_today_bills()
RETURNS TABLE (
  bill_payment_id INT,
  soft_deduction_id INT,
  account_id INT,
  status TEXT,
  error TEXT,
  pay_method pay_method,
  amount NUMERIC(10,2),
  biller_bsb VARCHAR,
  biller_bank_account_number VARCHAR,
  biller_bpay_code VARCHAR,
  biller_bpay_ref VARCHAR
) 
LANGUAGE plpgsql
AS $$
DECLARE
  bill RECORD;
  wallet_balance NUMERIC;
  inserted RECORD;
BEGIN
  SET TIME ZONE 'Australia/Sydney';
  FOR bill IN
    SELECT 
      bp.*
    FROM bill_payments bp
    JOIN wallets w ON bp.wallet_id = w.wallet_id
    WHERE 
      bp.status = 'active'
      AND bp.next_run_at::date = CURRENT_DATE
  LOOP
    BEGIN
      SELECT balance INTO wallet_balance 
      FROM wallets 
      WHERE wallet_id = bill.wallet_id 
      FOR UPDATE;
      -- Assign shared fileds
      bill_payment_id := bill.id;
      account_id := bill.account_id;
      pay_method := bill.pay_method;
      amount := bill.amount;
      biller_bsb := bill.biller_bsb;
      biller_bank_account_number := bill.biller_bank_account_number;
      biller_bpay_code := bill.biller_bpay_code;
      biller_bpay_ref := bill.biller_bpay_ref;

      -- Insufficient funds, failed
      IF wallet_balance < bill.amount THEN
        PERFORM change_bill_payment_status('failed'::payment_status, bill.id);

        soft_deduction_id := NULL;
        status := 'failed';
        error := 'Insufficient funds';
        RETURN NEXT;
        CONTINUE;
      END IF;

      -- Deduct balance
      UPDATE wallets
      SET balance = balance - bill.amount
      WHERE wallet_id = bill.wallet_id;

      -- Insert into soft_deductions
      INSERT INTO soft_deductions (bill_payment_id)
      VALUES (bill.id)
      RETURNING id INTO inserted;

      soft_deduction_id := inserted.id;
      status := 'success';
      error := NULL;
      RETURN NEXT;
    EXCEPTION
      WHEN OTHERS THEN
        soft_deduction_id := NULL;
        status := 'failed';
        error := SQLERRM;
        RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- Change status in the soft_deduction_status given p_id
CREATE OR REPLACE FUNCTION set_soft_deduction_status(p_status text, soft_id int)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  row_count int;
BEGIN
  UPDATE soft_deductions
  SET status = p_status
  WHERE id = soft_id;

  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count = 0 THEN
    RAISE EXCEPTION 'No soft_deduction updated for ID %', soft_id;
  END IF;
END;
$$;

-- Set the status and time of a bill payment after paid successfully
CREATE OR REPLACE FUNCTION update_bp_status_and_time_after_paid(p_id int)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  row_count int;
BEGIN
  UPDATE bill_payments
  SET
      last_paid_at = CURRENT_TIMESTAMP,
      status = CASE
          WHEN type = 'one-time' THEN 'completed'
          ELSE status
      END,
      next_run_at = CASE
          WHEN type = 'recurring' THEN
              CASE frequency
                  WHEN 'weekly' THEN CURRENT_TIMESTAMP + INTERVAL '7 days'
                  WHEN 'fortnightly' THEN CURRENT_TIMESTAMP + INTERVAL '14 days'
                  WHEN 'monthly' THEN CURRENT_TIMESTAMP + INTERVAL '1 month'
                  ELSE NULL
              END
          ELSE NULL
      END
  WHERE id = p_id;

  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count = 0 THEN
      RAISE EXCEPTION 'No bill_payment updated for ID %', p_id;
  END IF;
END;
$$;

-- Refund the soft deducted money back to wallet
-- and mark the bill payment as failed after a failed bill payment
CREATE OR REPLACE FUNCTION refund_failed_payment_back_to_wallet_and_mark_bill_failed(p_id int)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  row_count int;
  w_id int;
  refund_amount numeric(10,2);
BEGIN
  -- Refund amount back to wallet
  SELECT bp.wallet_id, bp.amount
    INTO w_id, refund_amount
  FROM bill_payments bp
    WHERE bp.id = p_id;

  IF refund_amount IS NULL THEN
    RAISE EXCEPTION 'Could not fetch refund amount for bill_payment_id %', p_id;
  END IF;

  UPDATE wallets
  SET balance = balance + refund_amount
  WHERE wallet_id = w_id;

  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count = 0 THEN
    RAISE EXCEPTION 'No wallet updated for refund for wallet_id %', w_id;
  END IF;

  -- Also mark corresponding bill_payment as failed
  PERFORM change_bill_payment_status('failed'::payment_status, p_id);
END;
$$;

-- Log a transaction after paid
CREATE OR REPLACE FUNCTION log_transaction_after_bill_paid(p_id int)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
BEGIN
  INSERT INTO transactions (
    name,
    amount,
    sender_wallet_id,
    recipient_wallet_id,
    category,
    currency
  )
  SELECT
    COALESCE(bp.bill_display_name, '') || COALESCE(bp.biller_display_name, '') || 'Bill Payment',
    bp.amount,
    bp.wallet_id,
    NULL,
    ARRAY['bill', bp.pay_method::TEXT],
    w.currency_id
  FROM bill_payments bp
  JOIN wallets w     
    ON w.wallet_id = bp.wallet_id
  WHERE bp.id = p_id;
END;
$$;

-- This fucntion contain the workflow logic after receiving bank reponses for bill payments.
-- It change soft deductions and bill payments table status according to the bank responses.
CREATE OR REPLACE FUNCTION process_bank_responses(results JSONB)
RETURNS VOID 
LANGUAGE plpgsql
AS $$
DECLARE
  item JSONB;
  row_count INT;
  bp_id INT;
  w_id INT;
  refund_amount NUMERIC(10,2);
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(results)
  LOOP
    IF item->>'status' = 'success' THEN
      -- Update soft_deductions
      PERFORM set_soft_deduction_status('success',(item->>'soft_deduction_id')::int);

      -- Update bill_payments
      PERFORM update_bp_status_and_time_after_paid((item->>'bill_payment_id')::INT);

      -- Log transaction
      PERFORM log_transaction_after_bill_paid((item->>'bill_payment_id')::INT);

    ELSIF item->>'status' = 'failed' THEN
      -- Update soft_deductions to failed
      PERFORM set_soft_deduction_status('failed',(item->>'soft_deduction_id')::int);

      -- Refund amount back to wallet and change bill payment status
      PERFORM refund_failed_payment_back_to_wallet_and_mark_bill_failed((item->>'bill_payment_id')::INT);
    END IF;
  END LOOP;
END;
$$;
