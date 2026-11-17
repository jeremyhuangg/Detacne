import otpRepositories from '../repositories/otp-repositories.js';
import userRepositories from '../../users/repositories/user-repositories.js';
import response from '../../../utils/response.js';
import { NotFoundError, AuthenticationError, InvariantError, ConflictError } from '../../../exceptions/index.js';
import transporter from '../../../middlewares/otp.js';
import { randomInt } from 'node:crypto';

class OtpController {
    async createOtp(req, res, next) {
        const { email } = req.validated;
        const user = await userRepositories.getUserByEmail(email);
        if(!user){
            return next(new NotFoundError('User tidak ditemukan'));
        }

        const { id, is_verified: isVerified } = user;

        if(isVerified) {
            return next(new ConflictError('Akun sudah terverifikasi'));
        }

        const available = await otpRepositories.verifyAvailableOtp(id);

        if (available) {
            return next(new ConflictError('OTP sudah pernah dibuat. Silakan resend OTP'));
        }
        
        const otp = randomInt(0, 1000000).toString().padStart(6, '0');
        const otps = await otpRepositories.createOtp(id, otp);

        if(!otps) {
            return next(new InvariantError('Otp gagal dibuat'));
        }

        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete the regristration. This code <b>expires in 5 minutes</b></p>`,
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (error) {
            await otpRepositories.deleteOtp(otps.id);
            return next(new InvariantError('Gagal mengirim email OTP'));
        }

        response(res, 200, 'OTP berhasil dikirim');
    }

    async verifyOtp(req, res, next) {
        const { email, otp } = req.validated;

        const user = await userRepositories.getUserByEmail(email);

        if(!user) {
            return next(new NotFoundError('User tidak ditemukan'));
        }

        const { id, is_verified: isVerified } = user;

        if(isVerified) {
            return next(new ConflictError('Akun sudah terverifikasi'));
        }

        const otpId = await otpRepositories.verifyOtpCredential(id, otp);

        if(!otpId) {
            return next(new AuthenticationError('OTP yang Anda berikan salah'));
        }

        await otpRepositories.updateConsumedOtp(otpId);
        await userRepositories.verifyingUser(id);

        response(res, 200, 'Akun berhasil diaktifkan');
    }

    async resendOtp(req, res, next) { 
        const { email } = req.validated;
        const user = await userRepositories.getUserByEmail(email);
        if(!user){
            return next(new NotFoundError('User tidak ditemukan'));
        }

        const { id, is_verified: isVerified } = user;

        if(isVerified) {
            return next(new ConflictError('Akun sudah terverifikasi'));
        }

        const available = await otpRepositories.verifyAvailableOtp(id); 

        if(!available) {
            return next(new InvariantError('OTP belum pernah dibuat'));
        }

        const otp = randomInt(0, 1000000).toString().padStart(6, '0');
        const otps = await otpRepositories.resendOtp(id, otp);
        if(!otps) {
            return next(new InvariantError('Otp gagal dibuat'));
        }

        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete the regristration. This code <b>expires in 5 minutes</b></p>`,
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (error) {
            return next(new InvariantError('Gagal mengirim email OTP'));
        }

        response(res, 200, 'OTP berhasil dikirim');
    }
}

export default new OtpController;