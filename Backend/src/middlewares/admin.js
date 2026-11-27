import response from '../utils/response.js';

export const isAdmin = (req, res, next) => {
    if(!req.user || req.user.role !== 'admin') {
        return response(res, 403, 'Forbidden: Admin access only', null);
    }

    return next();
};