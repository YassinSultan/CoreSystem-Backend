const asyncHandler = require('express-async-handler');
const companyModel = require('../models/companyModel');
const estimateModel = require("../models/estimateModel");;
const ApiError = require('../utils/apiError');
const factory = require('../utils/crudUtils');
const { saveFile } = require('../utils/fileHandler');


exports.createCompany = asyncHandler(async (req, res, next) => {
    const requiredFields = ["company_name", "company_location", "company_engineers_name",
        "company_engineers_phone",
        "company_category",
        "allowed_limit",
        "specialization"
    ];
    // التحقق من الحقول المطلوبة
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return next(new ApiError(`الحقل ${field} مطلوب`, 400));
        }
    }
    // إنشاء كيان الشركة أولًا للحصول على الـ _id
    const newCompany = new companyModel({
        company_name: req.body.company_name,
        company_location: req.body.company_location,
        company_engineers_name: req.body.company_engineers_name,
        company_engineers_phone: req.body.company_engineers_phone,
        company_category: req.body.company_category,
        allowed_limit: req.body.allowed_limit,
        specialization: req.body.specialization,
        createdBy: req.user ? req.user._id : null,
    });
    await newCompany.save();

    let fileUrl = "";
    if (req.files && req.files.length > 0) {
        fileName = req.files[0].originalname;
        fileUrl = await saveFile(req.files[0], "companies", newCompany._id); // استخدام الـ _id
        newCompany.company_file = {
            fileName,
            fileUrl
        };
        await newCompany.save();
    }
    res.status(201).json({
        status: 'success',
        message: "تم إنشاء الشركة بنجاح",
        data: newCompany
    });
});

// جلب جميع الشركات مع تفاصيل المقايسات والعقود مع دعم التصفية والترتيب والتقسيم إلى صفحات
exports.getAllCompanies = factory.getAll(companyModel);


// جلب شركة معينة
exports.getCompanyById = factory.getOne(companyModel);


// تحديث بيانات شركة
// تحديث بيانات شركة مع سجل التغييرات
exports.updateCompany = asyncHandler(async (req, res, next) => {
    const company = await companyModel.findById(req.params.id);
    if (!company) {
        return next(new ApiError('الشركة غير موجودة', 404));
    }

    const changes = []; // لتخزين التعديلات التي تمت

    // مقارنة الحقول القديمة بالجديدة وتسجيل التغييرات
    Object.keys(req.body).forEach(field => {
        if (company[field] !== undefined && company[field] !== req.body[field]) {
            changes.push({
                field,
                oldValue: company[field],
                newValue: req.body[field]
            });
        }
    });

    // تحديث بيانات الشركة
    Object.assign(company, req.body);

    // التعامل مع الملفات
    if (req.files && req.files.length > 0) {
        const newFileUrl = await saveFile(req.files[0], "companies", company._id);
        changes.push({
            field: "company_file",
            oldValue: {
                fileName: company.company_file.fileName,
                fileUrl: company.company_file.fileUrl,
            } || null,
            newValue: {
                fileName: req.files[0].originalname,
                fileUrl: newFileUrl
            }
        });
        company.company_file.fileName = req.files[0].originalname;
        company.company_file.fileUrl = newFileUrl;
    }

    // إضافة سجل التحديث في `updateHistory` فقط إذا كان هناك تغييرات
    if (changes.length > 0) {
        company.updateHistory.push({
            updatedBy: req.user ? req.user._id : null, // الشخص الذي قام بالتحديث
            updatedAt: new Date(),
            changes
        });
    }

    await company.save();

    res.status(200).json({
        status: 'success',
        message: "تم تحديث بيانات الشركة بنجاح",
        data: company
    });
});



// حذف شركة
exports.deleteCompany = asyncHandler(async (req, res, next) => {
    const company = await companyModel.findById(req.params.id);
    if (!company) {
        return next(new ApiError('الشركة غير موجودة', 404));
    }

    if (company.company_file) {
        company.company_file = null;
    }

    await deleteFolder("companies", company._id);
    await companyModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: 'success',
        message: "تم حذف الشركة بنجاح"
    });
});


exports.softDelete = factory.softDeleteOne(companyModel);
exports.restore = factory.recoverSoftDeletedOne(companyModel);