import UserRepositories from '../repositories/user-repositories.js';
import response from '../../../utils/response.js';
import { AuthenticationError, InvariantError, NotFoundError } from '../../../exceptions/index.js';

class UserController{
    async createUser(req, res, next) {
        const { nickname, email, password, gender, dateOfBirth } = req.validated;

        const isUserExist = await UserRepositories.verifyNewUser(email);
        if(isUserExist) {
            return next(new InvariantError('Gagal menambahkan user. Email telah terdaftar.'));
        }

        const user = await UserRepositories.createUser({
            nickname,
            email,
            password,
            gender,
            dateOfBirth
        });

        if(!user) {
            return next(new InvariantError('User gagal ditambahkan'));
        }

        return response(res, 201, 'User berhasil ditambahkan', user);
    };

    async getUserById(req, res, next) {
        const { id } = req.params;
        const user = await UserRepositories.getUserById(id);

        if(!user){
            return next(new NotFoundError('User tidak ditemukan'));
        }

        return response(res, 200, 'User berhasil ditampilkan', { user: user });
    }

    async changePassword(req, res, next) {
        const { id } = req.user;
        const { oldPassword, newPassword } = req.validated;

        const isOldPasswordCorrect = await UserRepositories.verifyUserPassword(id, oldPassword);
        
        if(!isOldPasswordCorrect) {
            return next(new AuthenticationError('Kredensial yang Anda berikan salah'));
        }

        const reset = await UserRepositories.changePassword(id, newPassword);

        if(!reset){
            return next(new NotFoundError('User tidak ditemukan'));
        }

        return response(res, 200, 'Password berhasil diperbarui.');
    }

    async changeNickname(req, res, next) {
        const { id } = req.user;
        const { nickname } = req.validated;

        const change = await UserRepositories.changeNickname(id, nickname);

        if(!change) {
            return next(new NotFoundError('User tidak ditemukan'));
        }

        return response(res, 200, 'Nickname berhasil diperbarui.');
    }
}

export default new UserController;