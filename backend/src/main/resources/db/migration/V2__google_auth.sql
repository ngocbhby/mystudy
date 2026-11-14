
ALTER TABLE profiles RENAME COLUMN firebase_uid TO legacy_auth_uid;
ALTER TABLE profiles
    ALTER COLUMN legacy_auth_uid DROP NOT NULL,
    ADD COLUMN google_sub text UNIQUE CHECK (length(google_sub) BETWEEN 1 AND 255),
    ADD COLUMN email text,
    ADD CONSTRAINT profiles_has_identity CHECK (google_sub IS NOT NULL OR legacy_auth_uid IS NOT NULL);

CREATE TABLE google_login_attempts (
    state_hash text PRIMARY KEY,
    nonce text NOT NULL,
    code_verifier text NOT NULL,
    expires_at timestamptz NOT NULL
);

CREATE INDEX google_login_attempts_expiration ON google_login_attempts (expires_at);

CREATE TABLE auth_sessions (
    token_hash text PRIMARY KEY,
    profile_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL
);

CREATE INDEX auth_sessions_expiration ON auth_sessions (expires_at);
CREATE INDEX auth_sessions_profile ON auth_sessions (profile_id);

