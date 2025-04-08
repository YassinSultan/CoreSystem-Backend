const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');
const ApiError = require('../utils/apiError');
const userModel = require('../models/userModel');
/**
 *  @description login
 *  @route /api/v1/auth/login
 *  @method Post
 *  @access public 
 */
exports.login = asyncHandler(async (req, res, next) => {
    console.log("🚀 ~ Username:", req.body);
    //1- check if user exists
    const user = await userModel.findOne({ username: req.body.username });
    if (!user) {
        return next(new ApiError('اسم المستخدم غير صحيح', 401));
    }
    // 2- check if user is deleted
    if (user.isDeleted) {
        return next(new ApiError('تم حذف هذا المستخدم', 401));
    }

    // 3- compare passwords
    const passwordMatch = await bcrypt.compare(req.body.password, user.password);
    if (!passwordMatch) {
        return next(new ApiError('كلمة المرور غير صحيحة', 401));
    }

    //4- generate token
    const token = await generateToken(user._id);


    res.status(200).json({ status: "success", message: 'تم تسجيل الدخول بنجاح', token: token, data: user });
});
/**
 *  @description check Token
 *  @route /api/v1/auth/check-token
 *  @method Post
 *  @access public 
 */
exports.checkToken = asyncHandler(async (req, res, next) => {
    if (req.user) {
        res.status(200).json({ status: "success", message: 'تم التحقق من التوكن بنجاح', data: req.user });
    } else {
        next(new ApiError("الرجاء تسجيل الدخول مره اخرى", 401));
    }
});