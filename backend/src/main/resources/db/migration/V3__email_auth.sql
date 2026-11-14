
ALTER TABLE profiles
    ADD COLUMN password_hash text,
    DROP CONSTRAINT profiles_has_identity,
    ADD CONSTRAINT profiles_has_identity CHECK (
        google_sub IS NOT NULL OR legacy_auth_uid IS NOT NULL OR password_hash IS NOT NULL
    ),
    ADD CONSTRAINT password_profiles_have_email CHECK (password_hash IS NULL OR email IS NOT NULL);

CREATE UNIQUE INDEX profiles_password_email_key
    ON profiles (lower(email)) WHERE password_hash IS NOT NULL;

