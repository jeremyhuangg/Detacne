import Joi from 'joi';

export const otpPayloadSchema = Joi.object({
    otp: Joi.number().integer().min(1000).max(9999).required(),
});