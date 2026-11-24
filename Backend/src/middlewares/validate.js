import { valid } from "joi";

const validationOption = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
}

const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, validationOption);

    if(error) return next(error);
    req.validated = value;
    next();
};

const validateQuery = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.query, validationOption);

    if(error) return next(error);
    req.validated = value;
    next();
}

export { validate, validateQuery };