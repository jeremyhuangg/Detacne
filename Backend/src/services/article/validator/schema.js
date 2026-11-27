import Joi from 'joi';

export const articlePayloadSchema = Joi.object({
    judul: Joi.string().required().min(5).max(100),
    kategori: Joi.string().required(),
    ringkasan: Joi.string().required().min(5).max(500),
    isi: Joi.string().required(),
    foto: Joi.string(),
    statusTerbit: Joi.bool().required(),
    statusTop: Joi.bool().required(),
});