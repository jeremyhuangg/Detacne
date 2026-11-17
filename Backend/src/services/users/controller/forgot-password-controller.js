import { randomBytes } from 'node:crypto';
import UserRepositories from '../../users/repositories/user-repositories.js';
import ForgotPasswordRepositories from '../repositories/forgot-password-repositories.js';
import transporter from '../../../middlewares/otp.js';
import response from '../../../utils/response.js';
import { InvariantError, AuthenticationError } from '../../../exceptions/index.js';

class ForgotPasswordController {
    async forgotPassword(req, res, next) {
        const { email } = req.validated;
        const genericMessage = 'Jika email terdaftar, link reset password akan dikirim.';

        const user = await UserRepositories.getUserByEmail(email);

        // Do not reveal whether an email exists or whether its account is verified.
        if (!user || !user.is_verified) {
            return response(res, 200, genericMessage);
        }

        const token = randomBytes(32).toString('hex');

        await ForgotPasswordRepositories.createOrReplaceToken(user.id, token);

        try {
            if (!process.env.FRONTEND_RESET_PASSWORD_URL) {
                throw new Error('FRONTEND_RESET_PASSWORD_URL belum dikonfigurasi');
            }

            const resetUrl = new URL(process.env.FRONTEND_RESET_PASSWORD_URL);
            resetUrl.searchParams.set('token', token);

            await transporter.sendMail({
                from: process.env.SMTP_EMAIL,
                to: email,
                subject: 'Reset Your Detacne Password',
                html: `
                    <p>We received a request to reset your password.</p>
                    <p><a href="${resetUrl.toString()}">Reset your password</a></p>
                    <p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>
                `,
            });
        } catch (error) {
            await ForgotPasswordRepositories.deleteToken(user.id, token);
            return next(new InvariantError('Gagal mengirim email reset password'));
        }

        return response(res, 200, genericMessage);
    }

    async resetPassword(req, res, next) {
        const { token, password } = req.validated;
        const isReset = await ForgotPasswordRepositories.resetPassword(token, password);

        if (!isReset) {
            return next(new AuthenticationError('Link reset password tidak valid atau sudah kedaluwarsa'));
        }

        return response(res, 200, 'Password berhasil diperbarui. Silakan login kembali.'); 
    }
};

export default new ForgotPasswordController;