import scanRepositories from '../repositories/scan_repositories.js';
import response from '../../../utils/response.js';

class ScanController{
    async scan (req, res, next) {
        const { imageKey } = req.validated;

        try {
            const response = await fetch(`${process.env.FASTAPI_URL}/scan`, {
                mthod: 'POST',
                header: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageKey }),
            });

            if(!response.ok) {
                const errText = await response.text();
                return next(new InvariantError(`Gagal memproses scan: ${errText}`));
            }

            const result = await response.json();
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