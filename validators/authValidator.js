const validator = require("express-validator");
const bcrypt = require("bcrypt");
const validatorMiddleware = require("../middlewares/validatorMiddleware");
const userModel = require("../models/userModel");

exports.loginValidator = [
    validator
        .check("username")
        .notEmpty()
        .withMessage("اسم المستخدم مطلوب")
        .custom(async (val, { req }) => {
            const user = await userModel.findOne({ username: val });

            if (!user) {
                console.log("❌ المستخدم غير موجود");
                throw new Error("المعلومات المدخلة غير صحيحة");
            }

            if (user.isDeleted) {
                console.log("❌ المستخدم محذوف");
                throw new Error("تم حذف هذا المستخدم");
            }

            req.user = user;  // ✅ حفظ المستخدم في `req.user`
        }),

    validator
        .check("password")
        .notEmpty()
        .withMessage("كلمة المرور مطلوبة")
        .custom(async (password, { req }) => {
            if (!req.user) {
                console.log("❌ خطأ: req.user غير معرف!");
                throw new Error("المعلومات المدخلة غير صحيحة");
            }

            const passwordMatch = await bcrypt.compare(password, req.user.password);

            console.log("✅ نتيجة المقارنة:", passwordMatch);
            if (!passwordMatch) {
                console.log("❌ كلمة المرور غير صحيحة");
                throw new Error("المعلومات المدخلة غير صحيحة");
            }
        }),

    validatorMiddleware,
];