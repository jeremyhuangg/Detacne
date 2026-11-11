import { Pool } from 'pg';

class AuthenticationRepositories {
    constructor(){
        this.pool = new Pool();
    }

    async addRefreshToken(refreshToken) {
        const query = {
            text: 'INSERT INTO authentications VALUES($1)',
            values: [refreshToken],
        };

        await this.pool.query(query);
    }

    async verifyRefreshToken(refreshToken) {
        const query = {
            text: 'SELECT * FROM authentications WHERE token = $1',
            values: [refreshToken],
        };

        const result = await this.pool.query(query);
        if(!result.rows.length) {
            return false;
        }

        return result.rows[0];
    }

    async deleteRefreshToken(refreshToken) {
        const query = {
            text: 'DELETE FROM authentications WHERE token = $1',
            values: [refreshToken],
        };

        await this.pool.query(query);
    }
}

export default new AuthenticationRepositories;