const validator = require('express-validator');
// this middleware using for express validator
const validatorMiddleware = (req, res, next) => {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: `fail`, message: `${errors.array()[0].msg}` });
    }
    next();
};

module.exports = validatorMiddleware;