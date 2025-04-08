const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const userModel = require('../models/userModel');

exports.verifyToken = asyncHandler(async (req, res, next) => {
    //1- check if token exist if exist catch it
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ApiError('قم بتسجيل الدخول اولا', 401));
    }
    //2- verify token (no change happens, expired token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    //3- check if user exist

    const currentUser = await userModel.findById(decoded.userID);

    if (!currentUser || currentUser.isDeleted === true) {
        return next(new ApiError("هذا المستخدم تم حذفه من قبل", 401));
    }
    //4- check if user changed his password after token creation
    if (currentUser.passwordChangedAt) {
        const passwordChangedTimeStamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);
        if (passwordChangedTimeStamp > decoded.iat) {
            return next(new ApiError("كلمة المرور تم تغييرها من قبل اعد تسجيل الدخول مره اخرى", 401));
        }
    }

    req.user = currentUser;
    next();
});

exports.authorize = (...permissions) => asyncHandler(async (req, res, next) => {
    // Ensure token is verified before checking permissions
    if (!req.user) {
        return next(new ApiError("غير مصرح لك بالوصول", 403));
    }

    // Check if the user has the required permissions
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.every(permission => userPermissions.includes(permission));

    if (!hasPermission && req.user.role !== "admin") {
        return next(new ApiError("لا يمكنك الوصول لهذه الخدمة او هذه الصفحة", 403));
    }

    next();
});