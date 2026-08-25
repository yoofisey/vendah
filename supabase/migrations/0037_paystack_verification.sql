ALTER TABLE tenants ADD COLUMN payout_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN payout_verified_name TEXT;
