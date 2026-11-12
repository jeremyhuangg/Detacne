import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';

class OtpRepositories {
    constructor(){
        this.pool = new Pool();
    }

    async createOtp(userId, otp){
        const id = nanoid(16);
        const saltRound = 10;

        const hashedOtp = await bcrypt.hash(otp, saltRound);

        const createdAt = new Date();
        const expiredAt = new Date(createdAt.getTime() + 300000);

        const query = {
            text: 'INSERT INTO otps(id, user_id, otp, created_at, expired_at) VALUES($1, $2, $3, $4, $5) RETURNING id',
            values: [id, userId, hashedOtp, createdAt, expiredAt],
        };

        const result = await this.pool.query(query);
        return result.rows[0];
    }
    
    async verifyOtpCredential(userId, otp){
        const query = {
            text: 'SELECT id, otp, expired_at, consumed_at FROM otps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            values: [userId],
        };

        const otps = await this.pool.query(query);
        if(!otps.rows.length || new Date() >= otps.rows[0].expired_at || otps.rows[0].consumed_at !== null){
            return null;
        }

        const { id, otp: hashedOtp } = otps.rows[0];
        const isOtpMatch = await bcrypt.compare(otp, hashedOtp);
        
        if(!isOtpMatch) return null;
        return id;
    }

    async updateConsumedOtp(id){
        const consumedAt = new Date();
        const query = {
            text: 'UPDATE otps SET consumed_at = $1 WHERE id = $2',
            values: [consumedAt, id],
        };

        await this.pool.query(query);
    }

    async verifyAvailableOtp(userId){ 
        const query = {
            text: 'SELECT user_id FROM otps WHERE user_id = $1',
            values: [userId],
        };

        const result = await this.pool.query(query);
        return result.rows.length > 0;
    }

    async resendOtp(userId, otp){ 
        const saltRound = 10;
        const hashedOtp = await bcrypt.hash(otp, saltRound);

        const createdAt = new Date();
        const expiredAt = new Date(createdAt.getTime() + 300000);

        const query = { 
            text: 'UPDATE otps SET otp = $1, created_at = $2, expired_at = $3, consumed_at = NULL WHERE user_id = $4 RETURNING id',
            values: [hashedOtp, createdAt, expiredAt, userId],
        };

        const result = await this.pool.query(query);
        return result.rows[0];
    }

    async deleteOtp(id) {
        const query = {
            text: 'DELETE FROM otps WHERE id = $1',
            values: [id],
        };

        await this.pool.query(query);
    }
};

export default new OtpRepositories;