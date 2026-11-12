import Joi from 'joi';

export const createOtpPayloadSchema = Joi.object({
    email: Joi.string().email().max(254).required(),
});

export const verifyOtpPayloadSchema = Joi.object({
    email: Joi.string().email().max(254).required(),
    otp: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
});

export const resendOtpPayloadSchema = Joi.object({
    email: Joi.string().email().max(254).required(),
});