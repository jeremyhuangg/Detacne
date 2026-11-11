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

        const createdAt = Date.now();
        const expiredAt = createdAt + 3600000;

        const query = {
            text: 'INSERT INTO otps VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
            values: [id, userId, hashedOtp, createdAt, expiredAt],
        };

        const result = await this.pool.query(query);
        return result.rows[0];
    }
    
    async verifyOtpCredential(userId, otp){
        const query = {
            text: 'SELECT id, otp, expired_at FROM otps WHERE user_id = $1',
            values: [userId],
        };

        const otps = await this.pool.query(query);
        if(!otps.rows.length || Date.now() > otps.rows[0].expired_at || otps.rows[0].consumed_at !== null){
            return null;
        }

        const { id, otp: hashedOtp } = otps.rows[0];
        const isOtpMatch = await bcrypt.compare(otp, hashedOtp);
        
        if(!isOtpMatch) return null;
        return id;
    }

    async updateConsumedOtp(id){
        const consumedAt = Date.now()
        const query = {
            text: 'UPDATE otps SET consumed_at = $1 WHERE id = $1',
            values: [consumedAt, id],
        };

        const result = await this.pool.query(query);
        return result.rows[0];
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

        const createdAt = Date.now();
        const expiredAt = createdAt + 3600000;

        const query = { // harus updated untuk created sama expirednya juga
            text: 'UPDATE otps SET otp = $1, created_at = $2, expired_at = $3 WHERE user_id = $4 RETURNING id',
            values: [hashedOtp, createdAt, expiredAt, userId],
        };

        const result = await this.pool.query(query);
        return result.rows[0];
    }
};

export default new OtpRepositories;