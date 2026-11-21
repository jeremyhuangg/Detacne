import Joi from 'joi';

export const scanPayloadSchema = Joi.object({
    fieldname: Joi.string().valid('photo').required(),
    mimetype: Joi.string()
        .valid('image/jpeg', 'image/png', 'image/webp')
        .required(),
    size: Joi.number().positive().max(5 * 1024 * 1024).required(),
    buffer: Joi.binary().required(),
}).required().unknown(true);

export const savePayloadSchema = Joi.object({

});