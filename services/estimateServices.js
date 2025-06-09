const asyncHandler = require('express-async-handler');
const estimateModel = require('../models/estimateModel');
const ApiError = require('../utils/apiError');
const factory = require('../utils/crudUtils');
const { deleteFile, saveFile } = require('../utils/fileHandler');
const arrayHelpers = require('../utils/arrayHelpers');
const { request } = require('express');

exports.createEstimate = asyncHandler(async (req, res, next) => {
    // Validate required fields
    // appent estimateType

    const requiredFields = ['project', 'company', 'name', 'value', 'area', 'battalionProofDocument', 'quantitySurveyFile', 'approvalCertificateFile', 'shopDrawingsDWGFile', 'shopDrawingsPDFFile', 'ironPrice', 'cementPrice', 'estimateType', 'lengthOfLinearMeter'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            if (!req.files.filter(file => file.fieldname === field)) {

                return next(new ApiError(`الحقل ${field} مطلوب`, 400));
            }
        }
    }
    console.log("body", req.body.estimateType);
    // Create the Estimate
    const newEstimate = await estimateModel.create({
        project: req.body.project,
        company: req.body.company,
        name: req.body.name,
        value: req.body.value,
        area: req.body.area,
        cementPrice: req.body.cementPrice,
        ironPrice: req.body.ironPrice,
        estimateType: req.body.estimateType,
        lengthOfLinearMeter: req.body.lengthOfLinearMeter,
        createdBy: req.user._id
    });

    // Handle attachments if any
    try {
        const updatedFields = {};
        for (const file of req.files) {
            const fileName = file.originalname;
            const fileUrl = await saveFile(file, "estimate", newEstimate._id.toString(), file.fieldname);
            updatedFields[file.fieldname] = {
                fileName,
                fileUrl
            };
        }

        const updatedEstimate = await estimateModel.findByIdAndUpdate(
            newEstimate._id,
            { $set: updatedFields },
            { new: true }
        );

        res.status(201).json({
            status: 'success',
            message: "تم إنشاء المقايسة بنجاح",
            data: updatedEstimate
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});


exports.updateEstimate = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        // بيجيب ال model
        const estimate = await estimateModel.findById(id);
        if (!estimate) {
            return next(new ApiError("الخطاب غير موجود", 404));
        }

        let updateFields = {};
        let changes = [];

        // التحقق من الحقول النصية المرسلة وتحديثها إن وجدت
        ['project', 'company', 'name', 'value', 'area'].forEach(field => {
            if (req.body[field] && req.body[field] !== estimate[field]) {
                changes.push({ field, oldValue: estimate[field], newValue: req.body[field] });
                updateFields[field] = req.body[field];
            }
        });
        // التعامل مع الملفات الجديدة إذا تم إرسالها
        if (req.files) {
            for (const file of req.files) {
                console.log(file);
                const fileName = file.originalname;
                const fileUrl = await saveFile(file, "estimate", id.toString(), file.fieldname);
                updateFields[file.fieldname] = {
                    fileName,
                    fileUrl
                };
                changes.push({
                    field: file.fieldname, oldValue: estimate[file.fieldname], newValue: {
                        fileName,
                        fileUrl
                    }
                });
            }
        }

        // إذا كان هناك تغييرات، نقوم بتحديث السجل
        if (changes.length > 0) {
            updateFields.$push = {
                updateHistory: {
                    updatedBy: req.user._id,
                    updatedAt: new Date(),
                    changes
                }
            };

            await estimateModel.findByIdAndUpdate(id, updateFields, { new: true });
        }

        res.status(200).json({
            status: "success",
            message: "تم تحديث المقايسة بنجاح",
            data: await estimateModel.findById(id)
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});

exports.updateEstimateStep = asyncHandler(async (req, res, next) => {
    const { id, stepNumber } = req.params;
    const user = req.user;
    const estimate = await estimateModel.findById(id);
    if (!estimate) {
        return next(new ApiError('المقايسة غير موجودة', 404));
    }
    if (estimate.isDeleted) {
        return next(new ApiError("هذة المقايسة محذوفة", 404));
    }
    const isAdmin = user.role === 'admin';
    let updateFields = {};
    let changes = [];
    switch (parseInt(stepNumber)) {
        case 1: {
            console.log(req.body);
            let updateFields = {};
            let changes = [];
            ['project', 'company', 'name', 'value', 'area', 'battalionProofDocument', 'quantitySurveyFile', 'approvalCertificateFile', 'shopDrawingsDWGFile', 'shopDrawingsPDFFile', 'cementPrice', 'ironPrice', 'estimateType', 'offersAndPriceAnalisisFile', 'lengthOfLinearMeter'].forEach(field => {
                if (req.body[field] && req.body[field] !== estimate[field]) {
                    changes.push({ action: req.body[field] == 'null' ? 'حذف' : 'تعديل', field, oldValue: estimate[field], newValue: req.body[field] });
                    updateFields[field] = req.body[field] === 'null' ? JSON.parse(req.body[field]) : req.body[field];
                }
            });
            // التعامل مع الملفات الجديدة إذا تم إرسالها
            if (req.files) {
                for (const file of req.files) {
                    const fileName = file.originalname;
                    const fileUrl = await saveFile(file, "estimate", id.toString(), file.fieldname);
                    updateFields[file.fieldname] = {
                        fileName,
                        fileUrl
                    };
                    changes.push({
                        field: file.fieldname, oldValue: estimate[file.fieldname], newValue: {
                            fileName,
                            fileUrl
                        }
                    });
                }
            }
            if (changes.length > 0) {
                updateFields.$push = {
                    updateHistory: {
                        updatedBy: req.user._id,
                        updatedAt: new Date(),
                        changes
                    }
                };

                await estimateModel.findByIdAndUpdate(id, updateFields, { new: true });
            }
            res.status(200).json({
                status: "success",
                message: "تم تحديث المقايسة بنجاح",
                data: await estimateModel.findById(id)
            });
        }
        case 2: {
            const requiredFields = ['estimateNumber'];
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    if (!req.files.filter(file => file.fieldname === field)) {

                        return next(new ApiError(`الحقل ${field} مطلوب`, 400));
                    }
                }
            }
            ['value_normal', 'value_electric', 'value_ac', 'value_fire', 'value_plumbing', 'value_maintenance', 'duration_normal', 'duration_electric', 'duration_ac', 'duration_fire', 'duration_plumbing', 'duration_maintenance', 'estimateNumber'].forEach(field => {
                if (field === 'estimateNumber' && estimate[field] && !isAdmin) {
                    return next(new ApiError('لا يمكنك تعديل رقم المقايسة', 400));
                }
                if (req.body[field] && req.body[field] !== estimate[field]) {
                    changes.push({ action: estimate[field] ? "تعديل" : "اضافة", field, oldValue: estimate[field], newValue: req.body[field] });
                    updateFields[field] = req.body[field];
                }
            });
            if (changes.length > 0) {
                updateFields.$push = {
                    updateHistory: {
                        updatedBy: req.user._id,
                        updatedAt: new Date(),
                        changes
                    }
                };

                await estimateModel.findByIdAndUpdate(id, updateFields, { new: true });
            }
            res.status(200).json({
                status: "success",
                message: "تم تحديث المقايسة بنجاح",
                data: await estimateModel.findById(id)
            });
            break;
        }
        case 3: {
            if (!isAdmin && (!estimate.estimateNumber || !estimate.estimateValueForManagement)) {
                return res.status(400).json({ message: 'يجب إكمال خطوة الادراة أولاً' });
            }
            const requiredFields = [];
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    if (!req.files.filter(file => file.fieldname === field)) {

                        return next(new ApiError(`الحقل ${field} مطلوب`, 400));
                    }
                }
            }
            ['value_authority_normal', 'value_authority_electric', 'value_authority_ac', 'value_authority_fire', 'value_authority_plumbing', 'value_authority_maintenance', 'duration_authority_normal', 'duration_authority_electric', 'duration_authority_ac', 'duration_authority_fire', 'duration_authority_plumbing', 'duration_authority_maintenance'

            ].forEach(field => {
                if (req.body[field] && req.body[field] !== estimate[field]) {
                    changes.push({ action: estimate[field] ? "تعديل" : "اضافة", field, oldValue: estimate[field], newValue: req.body[field] });
                    updateFields[field] = req.body[field];
                }
            });
            if (changes.length > 0) {
                updateFields.$push = {
                    updateHistory: {
                        updatedBy: req.user._id,
                        updatedAt: new Date(),
                        changes
                    }
                };

                await estimateModel.findByIdAndUpdate(id, updateFields, { new: true });
            }
            res.status(200).json({
                status: "success",
                message: "تم تحديث المقايسة بنجاح",
                data: await estimateModel.findById(id)
            });
        }
            break;
        default:
            return next(new ApiError("رقم الخطوة غير صالح", 400));
    }
});

exports.getOneEstimate = factory.getOne(estimateModel);
exports.getAllEstimates = factory.getAll(estimateModel);
exports.softDeleteEstimate = factory.softDeleteOne(estimateModel);
exports.recoverEstimate = factory.recoverSoftDeletedOne(estimateModel);

// اللغاء
exports.cancelEstimate = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const estimate = await estimateModel.findById(id);

        if (!estimate) {
            return next(new ApiError("الخطاب غير موجود", 404));
        }
        let updateFields = {};
        let changes = [];
        ['isCancelled', 'cancellationFile'].forEach(field => {
            if (req.body[field] !== undefined) {
                const newValue = req.body[field] === 'null' ? null : req.body[field];
                const oldValue = estimate[field];

                if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
                    changes.push({
                        action: newValue === null ? 'حذف' : 'تعديل',
                        field,
                        oldValue,
                        newValue
                    });
                    updateFields[field] = newValue;
                }
            }
        });
        if (('isCancelled' in req.body) &&
            (req.body.isCancelled === false || req.body.isCancelled === 'false')) {
            if (estimate.cancellationFile) {
                changes.push({
                    action: 'حذف',
                    field: 'cancellationFile',
                    oldValue: estimate.cancellationFile,
                    newValue: null
                });
                updateFields.contractNotificationFile = null;
            }
        }
        // Handle file uploads
        if (req.files && req.files.length > 0) {
            try {
                for (const file of req.files) {
                    const fileName = file.originalname;
                    const fileUrl = await saveFile(file, "estimate", id.toString(), file.fieldname);

                    updateFields[file.fieldname] = {
                        fileName,
                        fileUrl
                    };

                    changes.push({
                        action: 'رفع',
                        field: file.fieldname,
                        oldValue: estimate[file.fieldname],
                        newValue: {
                            fileName,
                            fileUrl
                        }
                    });
                }
            } catch (fileError) {
                return next(new ApiError(`فشل في رفع الملفات: ${fileError.message}`, 500));
            }
        }
        if (changes.length > 0) {
            try {
                updateFields.$push = {
                    updateHistory: {
                        updatedBy: req.user._id,
                        updatedAt: new Date(),
                        changes
                    }
                };

                const updatedEstimate = await estimateModel.findByIdAndUpdate(
                    id,
                    updateFields,
                    { new: true }
                );

                res.status(200).json({
                    status: "success",
                    message: "تم اتمام التعاقد على المقايسة بنجاح",
                    data: updatedEstimate
                });
            } catch (updateError) {
                return next(new ApiError(`فشل في تحديث المقايسة: ${updateError.message}`, 500));
            }
        } else {
            res.status(200).json({
                status: "success",
                message: "لم يتم إجراء أي تغييرات على المقايسة",
                data: estimate
            });
        }
        res.status(200).json({
            status: "success",
            message: "تم الغاء الخطاب بنجاح",
            data: estimate
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});


// التعاقد
exports.contractEstimate = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const estimate = await estimateModel.findById(id);

        if (!estimate) {
            return next(new ApiError("المقايسة غير موجودة", 404));
        }

        let updateFields = {};
        let changes = [];

        // Check isContracted and contractNotificationFile
        ['isContracted', 'contractNotificationFile', 'contractValue'].forEach(field => {
            if (req.body[field] !== undefined) {
                const newValue = req.body[field] === 'null' ? null : req.body[field];
                const oldValue = estimate[field];

                if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
                    changes.push({
                        action: newValue === null ? 'حذف' : 'تعديل',
                        field,
                        oldValue,
                        newValue
                    });
                    updateFields[field] = newValue;
                }
            }
        });

        // If isContracted is set to false, remove contractNotificationFile
        if (('isContracted' in req.body) &&
            (req.body.isContracted === false || req.body.isContracted === 'false')) {
            if (estimate.contractNotificationFile) {
                changes.push({
                    action: 'حذف',
                    field: 'contractNotificationFile',
                    oldValue: estimate.contractNotificationFile,
                    newValue: null
                });
                updateFields.contractNotificationFile = null;
            }
            if (estimate.contractValue) {
                changes.push({
                    action: 'حذف',
                    field: 'contractValue',
                    oldValue: estimate.contractValue,
                    newValue: null
                });
                updateFields.contractValue = null;
            }
        }
        // Handle file uploads
        if (req.files && req.files.length > 0) {
            try {
                for (const file of req.files) {
                    const fileName = file.originalname;
                    const fileUrl = await saveFile(file, "estimate", id.toString(), file.fieldname);

                    updateFields[file.fieldname] = {
                        fileName,
                        fileUrl
                    };

                    changes.push({
                        action: 'رفع',
                        field: file.fieldname,
                        oldValue: estimate[file.fieldname],
                        newValue: {
                            fileName,
                            fileUrl
                        }
                    });
                }
            } catch (fileError) {
                return next(new ApiError(`فشل في رفع الملفات: ${fileError.message}`, 500));
            }
        }

        if (changes.length > 0) {
            try {
                updateFields.$push = {
                    updateHistory: {
                        updatedBy: req.user._id,
                        updatedAt: new Date(),
                        changes
                    }
                };

                const updatedEstimate = await estimateModel.findByIdAndUpdate(
                    id,
                    updateFields,
                    { new: true }
                );

                res.status(200).json({
                    status: "success",
                    message: "تم اتمام التعاقد على المقايسة بنجاح",
                    data: updatedEstimate
                });
            } catch (updateError) {
                return next(new ApiError(`فشل في تحديث المقايسة: ${updateError.message}`, 500));
            }
        } else {
            res.status(200).json({
                status: "success",
                message: "لم يتم إجراء أي تغييرات على المقايسة",
                data: estimate
            });
        }
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});



// تعديل تمام المقايسة
exports.completeEstimate = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const estimate = await estimateModel.findById(id);

        if (!estimate) {
            return next(new ApiError("المقايسة غير موجودة", 404));
        }
        let updateFields = {};
        let changes = [];
        ['completionReason', 'completionProcedureName'].forEach(field => {
            if (req.body[field] && req.body[field] !== estimate[field]) {
                changes.push({ field, oldValue: estimate[field], newValue: req.body[field] });
                updateFields[field] = req.body[field];
            }
        });
        if (changes.length > 0) {
            updateFields.$push = {
                updateHistory: {
                    updatedBy: req.user._id,
                    updatedAt: new Date(),
                    changes
                }
            };

            await estimateModel.findByIdAndUpdate(id, updateFields, { new: true });
        }

        res.status(200).json({
            status: "success",
            message: "تم اتمام التعاقد على المقايسة ",
            data: estimate
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});


exports.restudyEstimate = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const estimate = await estimateModel.findById(id);

        if (!estimate) {
            return next(new ApiError("المقايسة غير موجودة", 404));
        }

        // الحقول التي سيتم إعادة تعيينها
        const fieldsToReset = {
            estimateValueForManagement: null,
            estimateValueForAuthority: null,
            ironPrice: null,
            cementPrice: null,
            isCancelled: false,
            cancellationFile: null,
            isContracted: false,
            contractNotificationFile: null,
            completionProcedureName: null,
            completionReason: null
        };

        // تسجيل التغييرات في السجل التاريخي
        const changes = Object.entries(fieldsToReset).map(([field, newValue]) => ({
            action: newValue === null ? 'حذف' : 'تعديل',
            field,
            oldValue: estimate[field],
            newValue
        }));

        // تحديث المقايسة
        const updatedEstimate = await estimateModel.findByIdAndUpdate(
            id,
            {
                ...fieldsToReset,
                $push: {
                    updateHistory: {
                        updatedBy: req.user._id,
                        updatedAt: new Date(),
                        changes
                    }
                }
            },
            { new: true }
        );

        res.status(200).json({
            status: "success",
            message: "تم إعادة تعيين المقايسة للدراسة بنجاح",
            data: updatedEstimate
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});
