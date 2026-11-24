import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import { InvariantError } from '../../../exceptions/index.js';

class ScanRepositories{
    constructor() {
        this.pool = new Pool();
    }

    async saveScanResult(userId, imageKey, acne) {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const resultId = nanoid(16);
            const insertResultQuery = {
                text: `
                    INSERT INTO analysis_results (id, user_id, image_key, date)
                    VALUES ($1, $2, $3, NOW())
                    RETURNING id
                `,
                values: [resultId, userId, imageKey],
            };

            const { rows } = await client.query(insertResultQuery);

            for (const item of acne) {
                const findAcneQuery = {
                    text: 'SELECT id FROM acne_classify WHERE LOWER(acne) = LOWER($1)',
                    values: [item.acneName],
                };
                const acneResult = await client.query(findAcneQuery);

                if (!acneResult.rows.length) {
                    throw new InvariantError(`Jenis jerawat "${item.acneName}" tidak ditemukan di database`);
                }

                const acneId = acneResult.rows[0].id;
                const insertDetailQuery = {
                    text: `
                        INSERT INTO analysis_details (result_id, acne_id)
                        VALUES ($1, $2)
                        ON CONFLICT (result_id, acne_id) DO NOTHING
                    `,
                    values: [resultId, acneId],
                };
                await client.query(insertDetailQuery);
            }

            await client.query('COMMIT');

            return {
                id: rows[0].id,
                imageKey: rows[0].image_key,
                date: rows[0].date,
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};

export default new ScanRepositories;