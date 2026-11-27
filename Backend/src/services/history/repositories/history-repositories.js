import Pool from 'pg';

class HistoryRepositories {
    constructor() {
        this.pool = new Pool();
    }

    async getHistory(owner) {
        const query = {
            text: 'SELECT * FROM analysis_result WHERE user_id = $1',
            values: [owner],
        };

        const result = await this.pool.query(query);
        return result.rows;
    }

    async getHistoryById(id) {
        const query = {
            text: 'SELECT * FROM analysis_result WHERE id = $1',
            values: [id],
        };

        const result = await this.pool.query(query);
        return result.rows;
    }

    async verifyHistoryAccess(id, owner) {
        const query = {
            text: 'SELECT * FROM analysis_results WHERE id = $1',
            values: [id],
        };

        const result = await this.pool.query(query);

        if(!result.rows.length) {
            return true;
        }

        const history = result.rows[0];

        if(history.user_id !== owner) {
            return null;
        }

        return result.rows[0];
    }
};

export default new HistoryRepositories;