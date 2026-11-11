import UserRepositories from '../repositories/user-repositories.js';
import response from '../../../utils/response.js';
import { InvariantError, NotFoundError } from '../../../exceptions/index.js';

export const createUser = async (req, res, next) => {
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

export const getUserById = async (req, res, next) => {
    const { id } = req.params;
    const user = await UserRepositories.getUserById(id);

    if(!user){
        return next(new NotFoundError('User tidak ditemukan'));
    }

    return response(res, 200, 'User berhasil ditampilkan', { user: user });
}