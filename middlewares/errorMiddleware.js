const ApiError = require("../utils/apiError");

const sendErrorForProd = (err, res) => res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
});

const sendErrorForDev = (err, res) => res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
});

const handleJwtInvalidSignature = () => new ApiError("رمز الدخول غير صالح، يرجى تسجيل الدخول مرة أخرى", 401);
const handleJwtTokenExpired = () => new ApiError("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى", 401);

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === "development") {
        sendErrorForDev(err, res);
    }
    else {
        if (err.name === "JsonWebTokenError") {
            err = handleJwtInvalidSignature();
        }
        if (err.name === "TokenExpiredError") {
            err = handleJwtTokenExpired();
        }
        sendErrorForProd(err, res);
    }
};

module.exports = globalErrorHandler;