const asyncHandler = require('express-async-handler');
const paymentOrderModel = require('../models/paymentOrderModel');
const ApiError = require('../utils/apiError');
const factory = require('../utils/crudUtils');
const { saveFile } = require('../utils/fileHandler');

exports.createPaymentOrder = asyncHandler(async (req, res, next) => {
    const requiredFields = ['project', 'contractingAuthority'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            if (!req.files.filter(file => file.fieldname === field)) {

                return next(new ApiError(`الحقل ${field} مطلوب`, 400));
            }
        }
    }

    // Create the Estimate
    const newPaymentOrder = await paymentOrderModel.create({
        project: req.body.project,
        contractingAuthority: req.body.contractingAuthority,
        financialAllocationDate: req.body.financialAllocationDate,
        financialAllocationValue: req.body.financialAllocationValue,
        correspondenceNumber: req.body.correspondenceNumber,
        paymentOrderDate: req.body.paymentOrderDate,
        paymentOrderValue: req.body.paymentOrderValue,
        paymentOrderNumber: req.body.paymentOrderNumber,
        paymentOrderDetails: req.body.paymentOrderDetails,
    });

    // Handle attachments if any
    try {
        const updatedFields = {};
        for (const file of req.files) {
            const fileName = file.originalname;
            const fileUrl = await saveFile(file, "paymentOrders", newPaymentOrder._id.toString(), file.fieldname);
            updatedFields[file.fieldname] = {
                fileName,
                fileUrl
            };
        }

        const updatedPaymentOrder = await paymentOrderModel.findByIdAndUpdate(
            newPaymentOrder._id,
            { $set: updatedFields },
            { new: true }
        );

        res.status(201).json({
            status: 'success',
            message: "تم إنشاء امر الدفع / الشيك بنجاح",
            data: updatedPaymentOrder
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});

exports.updatePaymentOrder = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const paymentOrder = await paymentOrderModel.findById(id);
    if (!paymentOrder) {
        return next(new ApiError("الحصر غير موجود", 404));
    }
    let updateFields = {};
    let changes = [];
    ['project', 'contractingAuthority', 'financialAllocationDate', 'financialAllocationValue', 'correspondenceNumber', 'correspondenceFile', 'paymentOrderDate', 'paymentOrderValue', 'paymentOrderNumber', 'paymentOrderFile', 'paymentOrderDetails'].forEach(field => {
        if (req.body[field] && req.body[field] !== paymentOrder[field]) {
            changes.push({ action: req.body[field] == 'null' ? 'حذف' : 'تعديل', field, oldValue: paymentOrder[field], newValue: req.body[field] });
            updateFields[field] = req.body[field] === 'null' ? JSON.parse(req.body[field]) : req.body[field];
        }
    });

    if (req.files) {
        for (const file of req.files) {
            const fileName = file.originalname;
            const fileUrl = await saveFile(file, "paymentOrders", id.toString(), file.fieldname);
            updateFields[file.fieldname] = {
                fileName,
                fileUrl
            };
            changes.push({
                field: file.fieldname, oldValue: paymentOrder[file.fieldname], newValue: {
                    fileName,
                    fileUrl
                }
            });
        }
    }
    if (req.body['contractingAuthority'] && req.body['contractingAuthority'] !== paymentOrder['contractingAuthority']) {
        changes.push({
            action: 'تعديل',
            field: 'contractingAuthority',
            oldValue: paymentOrder['contractingAuthority'],
            newValue: req.body['contractingAuthority']
        });
        updateFields['contractingAuthority'] = req.body['contractingAuthority'];

        if (req.body['contractingAuthority'] === 'القوات المسلحة') {
            // نفرغ بيانات جهة مدنية
            ['paymentOrderDate', 'paymentOrderValue', 'paymentOrderNumber', 'paymentOrderFile', 'paymentOrderDetails'].forEach(field => {
                if (paymentOrder[field]) {
                    changes.push({
                        action: 'حذف',
                        field,
                        oldValue: paymentOrder[field],
                        newValue: null
                    });
                    updateFields[field] = null;
                }
            });
        } else if (req.body['contractingAuthority'] === 'جهة مدنية') {
            // نفرغ بيانات القوات المسلحة
            ['financialAllocationDate', 'financialAllocationValue', 'correspondenceNumber', 'correspondenceFile'].forEach(field => {
                if (paymentOrder[field]) {
                    changes.push({
                        action: 'حذف',
                        field,
                        oldValue: paymentOrder[field],
                        newValue: null
                    });
                    updateFields[field] = null;
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

        await paymentOrderModel.findByIdAndUpdate(id, updateFields, { new: true });
    }
    res.status(200).json({
        status: "success",
        message: "تم تحديث الحصر بنجاح",
        data: await paymentOrderModel.findById(id)
    });
});
exports.getOnePaymentOrder = factory.getOne(paymentOrderModel);
exports.getAllPaymentOrders = factory.getAll(paymentOrderModel);
exports.softDeletePaymentOrder = factory.softDeleteOne(paymentOrderModel);
exports.recoverPaymentOrder = factory.recoverSoftDeletedOne(paymentOrderModel);