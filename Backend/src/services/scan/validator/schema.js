import Joi from 'joi';

export const scanPayloadSchema = Joi.object({
    image_key: Joi.string().required(),
});

export const savePayloadSchema = Joi.object({
    image_key: Joi.string().required(),
    acne: Joi.array().items(
        Joi.object({
            acne_name: Joi.string().required(),
            jumlah: Joi.number().integer().required(),
        })
    ).required(),
});