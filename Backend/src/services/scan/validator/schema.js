import Joi from 'joi';

export const scanPayloadSchema = Joi.object({
    imageKey: Joi.string().required(),
});

export const savePayloadSchema = Joi.object({
    imageKey: Joi.string().required(),
    acne: Joi.array().items(
        Joi.object({
            acneName: Joi.string().required(),
            jumlah: Joi.number().integer().required(),
        })
    ).required(),
});