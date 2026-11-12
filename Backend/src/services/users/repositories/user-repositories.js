import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';

class UserRepositories {
    constructor(){
        this.pool = new Pool();
    }

    async createUser({ nickname, email, password, gender, dateOfBirth }) {
        const id = nanoid(16);
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = {
            text: 'INSERT INTO users(id, nickname, email, password, gender, date_of_birth) VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
            values: [id, nickname, email, hashedPassword, gender, dateOfBirth],
        };

        const result = await this.pool.query(query);
        return result.rows[0];
    }

    async verifyNewUser(email){
        const query = {
            text: 'SELECT email FROM users WHERE email = $1',
            values: [email],
        };

        const result = await this.pool.query(query);
        return result.rows.length > 0;
    }

    async getUserById(id) {
        const query = {
            text: 'SELECT id, nickname, email, gender, date_of_birth FROM users WHERE id = $1',
            values: [id],
        };

        const result = await this.pool.query(query);
        return result.rows[0];
    }

    async getUserByEmail(email) {
        const query = {
            text: 'SELECT id, is_verified FROM users WHERE email = $1',
            values: [email],
        };

        const result = await this.pool.query(query);
        return result.rows[0];
    }

    async verifyUserCredential(email, password){
        const query = {
            text: 'SELECT id, password FROM users WHERE email = $1',
            values: [email],
        };

        const user = await this.pool.query(query);
        if(!user.rows.length){
            return null;
        }

        const { id, password: hashedPassword } = user.rows[0];
        const isPasswordMatch = await bcrypt.compare(password, hashedPassword);

        if(!isPasswordMatch) return null;
        return id;
    }

    async verifyVerfiedUser(id) {
        const query = {
            text: 'SELECT is_verified FROM users WHERE id = $1',
            values: [id],
        };

        const user = await this.pool.query(query);
        return user.rows[0].is_verified;
    }

    async verifyingUser(id){
        const query = {
            text: 'UPDATE users SET is_verified = true WHERE id = $1 RETURNING id',
            values: [id],
        };

        const result = await this.pool.query(query);
        return result.rows[0];
    }
}

export default new UserRepositories;