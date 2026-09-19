-- ============================================================
-- V7: Email verification and OTP columns on users table
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;

-- Grandfather existing users so existing development accounts remain active
UPDATE users SET email_verified = TRUE WHERE email_verified IS FALSE;
