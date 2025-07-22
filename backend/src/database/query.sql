
\dt

DELETE FROM account_identity WHERE account_id = 3;


select * from account_identity;

SELECT verified FROM Account WHERE firebase_id = 'ImwaeGpTjUhxe5GStIi1nwbYDj72';

UPDATE Account
SET verified = true
WHERE account_id = 3;

select * from bill_payments;
SET TIME ZONE 'Australia/Sydney';
select * from bill_payments where account_id = '3' AND id = '1' AND status = 'active';

SELECT * FROM Wallet;
SELECT * FROM Currency;
