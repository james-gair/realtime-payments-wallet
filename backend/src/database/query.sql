
\dt

DELETE FROM account_identities WHERE account_id = 3;


select * from account_identities;

SELECT is_verified FROM accounts WHERE firebase_id = 'ImwaeGpTjUhxe5GStIi1nwbYDj72';

UPDATE accounts
SET is_verified = true
WHERE account_id = 2;

select * from bill_payments;
SET TIME ZONE 'Australia/Sydney';
select * from bill_payments where account_id = '3' AND id = '1' AND status = 'active';


SELECT * FROM currencies;


select * from accounts;

select * from soft_deductions;

SELECT * FROM wallets;