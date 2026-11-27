import response from '../../../utils/response.js';
import historyRepositories from '../repositories/history-repositories.js';
import { AuthorizationError, NotFoundError } from '../../../exceptions/index.js';

class HistoryController {
    async getHistory(req, res, next) {
        const { id: owner } = req.user;
        const history = await historyRepositories.getHistory(owner);
        return response(res, 200, 'History sukses ditampilkan', history);
    }

    async getHistoryById(req, res, next) {
        const id = req.params;
        const { id: owner } = req.user;

        const isOwner = await historyRepositories.verifyHistoryAccess(id, owner);

        if(!isOwner) {
            return next(new AuthorizationError('Anda tidak berhak mengakses resource ini'));
        }

        const history = await historyRepositories.getHistoryById(id);
        if(!history) {
            return next(new NotFoundError('History tidak ditemukan'));
        }
        return response(res, 200, 'History sukses ditampilkan', history);
    }
}

export default new HistoryController;