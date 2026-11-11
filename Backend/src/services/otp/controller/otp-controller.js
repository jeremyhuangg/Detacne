import otpRepositories from '../repositories/otp-repositories.js';
import userRepositories from '../../users/repositories/user-repositories.js';
import response from '../../../utils/response.js';
import { NotFoundError, AuthenticationError, InvariantError } from '../../../exceptions/index.js';
import transporter from '../../../middlewares/otp.js';

class OtpController {
    async createOtp(req, res, next) {
        const { id } = req.user;
        const user = userRepositories.getUserById(id);
        if(!user){
            return next(new NotFoundError('User tidak ditemukan'));
        }

        const { email } = user;
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        const otps = await otpRepositories.createOtp(id, otp);

        if(!otps) {
            return next(new InvariantError('Otp gagal dibuat'));
        }

        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete the regristration. This code <b>expires in 1 hour</b></p>`,
        };

        transporter.sendMail(mailOptions);

        response(res, 201, 'OTP berhasil dibuat', otp);
    }

    async verifyOtp(req, res, next) {
        const { id } = req.user;
        const { otp } = req.validated;
        const otpId = await otpRepositories.verifyOtpCredential(id, otp);

        if(!otpId) {
            return next(new AuthenticationError('OTP yang Anda berikan salah'));
        }

        await otpRepositories.updateConsumedOtp(otpId);
        const user = await userRepositories.verifyingUser(id);

        if(!user) {
            return next(new NotFoundError('User tidak ditemukan')); // shouldn't be happened
        }

        response(res, 200, 'Akun berhasil diaktifkan');
    }

    async resendOtp(req, res, next) {
        const { id } = req.user;
        const user = userRepositories.getUserById(id);
        if(!user){
            return next(new NotFoundError('User tidak ditemukan'));
        }
        const available = await otpRepositories.verifyAvailableOtp(id);

        if(!available) {
            return next(new InvariantError('OTP belum pernah dibuat')); // harus create dulu kalau mau resend
        }

        const { email } = user;
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        const otps = await otpRepositories.resendOtp(id, otp);
        if(!otps) {
            return next(new InvariantError('Otp gagal dibuat'));
        }

        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete the regristration. This code <b>expires in 1 hour</b></p>`,
        };

        transporter.sendMail(mailOptions);

        response(res, 201, 'OTP berhasil dibuat', otp);
    }
}

export default new OtpController;