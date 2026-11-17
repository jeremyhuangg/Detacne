import TokenManager from "../security/token-manager.js";
import response from "../utils/response.js";

async function authenticateToken(req, res, next) {
    const token = req.headers.authorization;
    if(!token || !token.startsWith('Bearer ')) {
        return response(res, 401, 'Missing authentication', null);
    }

    try {
        const user = await TokenManager.verify(
            token.split('Bearer ')[1],
            process.env.ACCESS_TOKEN_KEY
        );

        req.user = user;
        return next();
    } catch(error) {
        return response(res, 401, error.message, null);
    }
}

export default authenticateToken;