import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';

class ForgotPasswordRepositories{
    constructor(){
        this.pool = new Pool();
    }

    async createOrReplaceToken(userId, token) {
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const expiredAt = new Date(Date.now() + 15 * 60 * 1000);
        const query = {
            text: `
                INSERT INTO forgot_password(user_id, token, expired_at)
                VALUES($1, $2, $3)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    token = EXCLUDED.token,
                    created_at = NOW(),
                    expired_at = EXCLUDED.expired_at,
                    consumed_at = NULL
                RETURNING user_id
            `,
            values: [userId, tokenHash, expiredAt],
        };

        const result = await this.pool.query(query);
        return result.rows[0];
    }

    async deleteToken(userId, token) {
        const tokenHash = createHash('sha256').update(token).digest('hex');

        const query = {
            text: `
                DELETE FROM forgot_password
                WHERE user_id = $1 AND token = $2
            `,
            values: [userId, tokenHash],
        };

        await this.pool.query(query);
    }

    async resetPassword(token, password) {
        const client = await this.pool.connect();
        const tokenHash = createHash('sha256').update(token).digest('hex');
        
        try {
            await client.query('BEGIN');
            
            const tokenQuery = {
                text: `
                SELECT user_id
                FROM forgot_password
                    WHERE token = $1
                      AND expired_at > NOW()
                      AND consumed_at IS NULL
                    FOR UPDATE
                `,
                values: [tokenHash],
            };

            const tokenResult = await client.query(tokenQuery);

            if (!tokenResult.rows.length) {
                await client.query('ROLLBACK');
                return false;
            }
            
            const { user_id: userId } = tokenResult.rows[0];
            const hashedPassword = await bcrypt.hash(password, 10);
            
            await client.query({
                text: 'UPDATE users SET password = $1 WHERE id = $2',
                values: [hashedPassword, userId],
            });

            await client.query({
                text: 'UPDATE forgot_password SET consumed_at = NOW() WHERE user_id = $1',
                values: [userId],
            });

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

export default new ForgotPasswordRepositories;