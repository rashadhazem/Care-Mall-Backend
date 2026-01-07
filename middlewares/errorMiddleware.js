const ApiError = require('../utils/apiError');

const globalError = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        // Production & other environments
        let error = { ...err };
        error.message = err.message;

        // Handle Mongoose Errors
        if (err.name === 'CastError') error = handleCastErrorDB(error);
        if (err.code === 11000) error = handleDuplicateFieldsDB(error);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
};

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new ApiError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new ApiError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new ApiError(message, 400);
};

const handleJWTError = () =>
    new ApiError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
    new ApiError('Your token has expired! Please log in again.', 401);

module.exports = globalError;
