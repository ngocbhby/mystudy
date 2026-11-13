export function createAuthStore(pool) {
  async function issueSession(findProfile, { tokenHash, expiresAt, previousTokenHash }) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const profile = await findProfile(client)
      if (profile) {
        await client.query(
          'DELETE FROM auth_sessions WHERE expires_at <= now() OR token_hash = $1',
          [previousTokenHash],
        )
        await client.query(
          'INSERT INTO auth_sessions (token_hash, profile_id, expires_at) VALUES ($1, $2, $3)',
          [tokenHash, profile.id, expiresAt],
        )
      }
      await client.query('COMMIT')
      return profile
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  return {
    async createLoginAttempt(stateHash, nonce, codeVerifier, expiresAt) {
      await pool.query('DELETE FROM google_login_attempts WHERE expires_at <= now()')
      await pool.query(
        `INSERT INTO google_login_attempts (state_hash, nonce, code_verifier, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [stateHash, nonce, codeVerifier, expiresAt],
      )
    },

    async consumeLoginAttempt(stateHash) {
      const { rows } = await pool.query(
        `DELETE FROM google_login_attempts
         WHERE state_hash = $1 AND expires_at > now()
         RETURNING nonce, code_verifier`,
        [stateHash],
      )
      return rows[0] ?? null
    },

    createGoogleSession({ subject, email, name }, session) {
      return issueSession(async (client) => {
        const { rows } = await client.query(
          `INSERT INTO profiles (google_sub, email, display_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (google_sub) DO UPDATE
           SET email = EXCLUDED.email, display_name = EXCLUDED.display_name
           RETURNING id`,
          [subject, email, name],
        )
        return rows[0]
      }, session)
    },

    registerWithEmail(email, passwordHash, session) {
      return issueSession(async (client) => {
        const { rows } = await client.query(
          `INSERT INTO profiles (email, password_hash) VALUES ($1, $2)
           ON CONFLICT (lower(email)) WHERE password_hash IS NOT NULL DO NOTHING
           RETURNING id, email, display_name AS "displayName"`,
          [email, passwordHash],
        )
        return rows[0] ?? null
      }, session)
    },

    async findPasswordProfile(email) {
      const { rows } = await pool.query(
        `SELECT id, email, display_name AS "displayName", password_hash AS "passwordHash"
         FROM profiles WHERE lower(email) = $1 AND password_hash IS NOT NULL`,
        [email],
      )
      return rows[0] ?? null
    },

    createEmailSession(profile, session) {
      return issueSession(() => profile, session)
    },

    async getSession(tokenHash) {
      const { rows } = await pool.query(
        `SELECT profiles.id, profiles.email, profiles.display_name AS "displayName"
         FROM auth_sessions JOIN profiles ON profiles.id = auth_sessions.profile_id
         WHERE auth_sessions.token_hash = $1 AND auth_sessions.expires_at > now()`,
        [tokenHash],
      )
      return rows[0] ?? null
    },

    async deleteSession(tokenHash) {
      await pool.query('DELETE FROM auth_sessions WHERE token_hash = $1', [tokenHash])
    },
  }
}
