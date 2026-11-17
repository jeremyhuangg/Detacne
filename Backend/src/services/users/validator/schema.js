import Joi from 'joi';

export const userPayloadSchema = Joi.object({
    nickname: Joi.string().min(2).max(250).pattern(/^\p{L}+$/u).required(),
    email: Joi.string().email().max(254).required(),
    password: Joi.string().min(8).pattern(/^(?=.*\p{L})(?=.*\d).+$/u).required(),
    gender: Joi.string().valid('male', 'female').required(),
    dateOfBirth: Joi.date().iso().max('now').required(),
});

export const changePasswordPayloadSchema = Joi.object({
    oldPassword: Joi.string().min(8).pattern(/^(?=.*\p{L})(?=.*\d).+$/u).required(),
    newPassword: Joi.string().min(8).pattern(/^(?=.*\p{L})(?=.*\d).+$/u).required(),
});

export const forgotPasswordPayloadSchema = Joi.object({
    email: Joi.string().email().max(254).required(),
});

export const resetPasswordPayloadSchema = Joi.object({
    token: Joi.string().length(64).hex().required(),
    password: Joi.string().min(8).pattern(/^(?=.*\p{L})(?=.*\d).+$/u).required(),
});