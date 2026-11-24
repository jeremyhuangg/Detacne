import scanRepositories from '../repositories/scan_repositories.js';
import response from '../../../utils/response.js';
import { InvariantError } from '../../../exceptions/index.js';

class ScanController{
    async scan (req, res, next) {
        const { imageKey } = req.validated;

        try {
            const mlResponse = await fetch(`${process.env.FASTAPI_URL}/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageKey }),
            });

            if(!mlResponse.ok) {
                const errText = await mlResponse.text();
                return next(new InvariantError(`Gagal memproses scan: ${errText}`));
            }

            const result = await mlResponse.json();
            return response(res, 200, 'Scan berhasil', result);
        } catch (error) {
            return next(error);
        }
    }

    async save (req, res, next) {
        const { imageKey, acne } = req.validated;

        
    }
};

export default new ScanController;