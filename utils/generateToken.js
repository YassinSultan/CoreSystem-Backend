const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');

const generateToken = asyncHandler(async (payload) =>
    jwt.sign({ userID: payload }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE_TIME,
    }));

module.exports = generateToken;