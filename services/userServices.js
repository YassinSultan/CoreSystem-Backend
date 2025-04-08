const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const User = require('../models/userModel'); // تصحيح الاستيراد
const { saveFile, deleteFile, deleteFolder } = require("../utils/fileHandler");
const _ = require('lodash');
const factory = require('../utils/crudUtils');
/**
 *  @description Create User
 *  @route /api/v1/user/create
 *  @method Post
 *  @access create user 
 */
exports.createUser = factory.createOne(User);
/**
 *  @description update User
 *  @route /api/v1/user/update
 *  @method Put
 *  @access update user 
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params; // استخراج ID المستخدم من البارامتر
    const updates = req.body; // البيانات الجديدة

    // 1️⃣ التحقق من وجود المستخدم
    const user = await User.findById(userId);
    if (!user) {
        return next(new ApiError("المستخدم غير موجود", 404));
    }

    // 2️⃣ منع تحديث الرقم القومي
    if (updates.national_ID) {
        return next(new ApiError("لا يمكن تحديث الرقم القومي", 400));
    }
    // 2️⃣ منع تحديث role 
    if (updates.role) {
        return next(new ApiError("لا يمكن تحديث دور المستخدم", 400));
    }
    // 3️⃣ تحويل `permissions` من نص JSON إلى مصفوفة
    let parsedPermissions = [];
    if (updates.permissions) {
        try {
            parsedPermissions = JSON.parse(updates.permissions);
            if (!Array.isArray(parsedPermissions)) {
                return next(new ApiError("الصلاحيات يجب أن تكون مصفوفة", 400));
            }
            updates.permissions = parsedPermissions;
        } catch (error) {
            return next(new ApiError("صيغة الصلاحيات غير صحيحة", 400));
        }
    }

    // 4️⃣ تحديث صورة الملف الشخصي إذا تم رفع صورة جديدة
    if (req.file) {
        deleteFile(user.profileImage);
        updates.profileImage = await saveFile(req.file, "users", user._id, "profileImages");
    }

    // 5️⃣ تحديث بيانات المستخدم
    Object.assign(user, updates);

    // 6️⃣ إضافة سجل التعديل
    user.updateHistory.push({ updatedBy: req.user._id });

    // 7️⃣ حفظ التعديلات في قاعدة البيانات
    await user.save();

    // 8️⃣ إرسال الاستجابة
    res.status(200).json({
        status: "success",
        message: "تم تحديث المستخدم بنجاح",
        data: user
    });
});
/**
 * @description Get All Users
 * @route /api/v1/user/getAll
 * @method GET
 * @access Get All Users
 */
exports.getAllUsers = asyncHandler(async (req, res, next) => {
    // 1️⃣ الترحيل (Pagination)
    const page = parseInt(req.query.page) || 1; // الصفحة الحالية (الافتراضي: 1)
    const limit = parseInt(req.query.limit) || 10; // عدد العناصر في الصفحة (الافتراضي: 10)
    const skip = (page - 1) * limit; // عدد العناصر التي سيتم تخطيها

    // 2️⃣ التصفية (Filtering)
    const filter = {};
    if (req.query.role) {
        filter.role = req.query.role; // تصفية حسب الدور
    }
    if (req.query.gender) {
        filter.gender = req.query.gender; // تصفية حسب الجنس
    }

    // 3️⃣ الترتيب (Sorting)
    const sort = {};
    if (req.query.sort) {
        const [field, order] = req.query.sort.split(':');
        sort[field] = order === 'desc' ? -1 : 1; // ترتيب تصاعدي أو تنازلي
    } else {
        sort.createdAt = -1; // الترتيب الافتراضي حسب تاريخ الإنشاء (من الأحدث إلى الأقدم)
    }

    // 4️⃣ استرجاع البيانات من قاعدة البيانات
    const users = await User.find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .populate("updateHistory.updatedBy")
        .populate("deletedBy");

    // 5️⃣ حساب العدد الإجمالي للمستخدمين (لأغراض الترحيل)
    const totalUsers = await User.countDocuments(filter);

    // 6️⃣ إرسال الاستجابة
    res.status(200).json({
        status: "success",
        results: users.length,
        total: totalUsers,
        page: page,
        limit: limit,
        data: users
    });
});
/**
 * @description Soft Delete User
 * @route /api/v1/user/soft-delete/:userId
 * @method put
 * @access update user
 */
exports.softDeleteUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    // البحث عن المستخدم وتضمين isDeleted
    const user = await User.findById(userId).select("+isDeleted");

    if (!user) {
        return next(new ApiError("المستخدم غير موجود", 404));
    }

    if (user.isDeleted) {
        return next(new ApiError("هذا المستخدم تم حذفه من قبل", 400));
    }

    // تحديث الحذف الناعم
    user.isDeleted = true;
    user.deletedBy = req.user._id;
    user.updateHistory.push({
        updatedBy: req.user._id,
    });

    await user.save();

    res.status(200).json({
        status: "success",
        message: "تم حذف المستخدم بنجاح",
        data: user
    });
});
/**
 * @description recover User
 * @route /api/v1/user/recover/:userId
 * @method put
 * @access update user
 */
exports.recoverUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    // البحث عن المستخدم وتضمين isDeleted
    const user = await User.findById(userId).select("+isDeleted");

    if (!user) {
        return next(new ApiError("المستخدم غير موجود", 404));
    }

    if (!user.isDeleted) {
        return next(new ApiError("هذا المستخدم لم يتم حذفه", 400));
    }

    // تحديث الحذف الناعم
    user.isDeleted = false;
    user.deletedBy = null;
    user.updateHistory.push({
        updatedBy: req.user._id,
    });

    await user.save();

    res.status(200).json({
        status: "success",
        message: "تم استرجاع المستخدم بنجاح",
        data: user
    });
});
/**
 * @description Hard Delete User
 * @route /api/v1/user/delete/:userId
 * @method Delete
 * @access delete user
 */
exports.hardDeleteUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    // البحث عن المستخدم
    const user = await User.findById(userId);
    if (!user) {
        return next(new ApiError("المستخدم غير موجود", 404));
    }
    deleteFolder("users", userId);
    // حذف المستخدم نهائيًا
    await User.findByIdAndDelete(userId);

    res.status(200).json({
        status: "success",
        message: "تم حذف المستخدم نهائيًا بنجاح"
    });
});
/**
 * @description get user profile
 * @route /api/v1/user/profile
 * @method get
 * @access them selves
 */
exports.getUserProfile = asyncHandler(async (req, res, next) => {
    res.status(200).json({ 'status': 'success', 'message': 'تم استرداد بيانات المستخدم بنجاح', 'data': req.user });

});
/**
 * @description update user profile
 * @route /api/v1/user/profile
 * @method put
 * @access them selves
 */
exports.updateUserProfile = asyncHandler(async (req, res, next) => {
    const allowedFields = ['username', 'password', 'phoneNumber', 'address', 'gender'];

    // 1️⃣ استخراج البيانات المسموح بتحديثها فقط
    const updatedData = _.pick(req.body, allowedFields);

    // 2️⃣ التحقق من وجود المستخدم
    let user = await User.findById(req.user.id);
    if (!user) {
        return next(new ApiError('لا يوجد هذا المستخدم', 404));
    }

    // 3️⃣ تحديث صورة الملف الشخصي إذا تم رفع صورة جديدة
    if (req.file) {
        deleteFile(user.profileImage); // حذف الصورة القديمة
        updatedData.profileImage = await saveFile(req.file, "users", user._id, "profileImages");
    }

    // 4️⃣ تحديث المستخدم بالبيانات الجديدة
    Object.assign(user, updatedData);
    await user.save();

    // 5️⃣ إرسال الاستجابة
    res.status(200).json({
        status: 'success',
        message: 'تم تحديث بيانات المستخدم بنجاح',
        data: user
    });
});
/**
 * @description get specific user
 * @route /api/v1/user/:userId
 * @method get
 * @access view users
 */
exports.getSpecificUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const user = await User.findById(userId).populate();
    if (!user) {
        return next(new ApiError('لا يوجد هذا المستخدم', 404));
    }
    res.status(200).json({ 'status': 'success', 'message': 'تم استرداد بيانات المستخدم بنجاح', 'data': user });

});