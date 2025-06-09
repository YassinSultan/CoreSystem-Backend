const asyncHandler = require('express-async-handler');
const abstractModel = require('../models/abstractModel');
const ApiError = require('../utils/apiError');
const factory = require('../utils/crudUtils');
const { saveFile } = require('../utils/fileHandler');

exports.createAbstract = asyncHandler(async (req, res, next) => {
    // Create the Estimate
    const newAbstract = await abstractModel.create({
        estimate: req.body.estimate,
        type: req.body.type,
        number: req.body.number,
        amount: req.body.amount,
        steelUnitPrice: req.body.steelUnitPrice,
        steelTotal: req.body.steelTotal,
        cementUnitPrice: req.body.cementUnitPrice,
        cementTotal: req.body.cementTotal,
        ceramicsQuantity: req.body.ceramicsQuantity,
        marbleQuantity: req.body.marbleQuantity,
        bricksQuantity: req.body.bricksQuantity,
        bricksUnitPrice: req.body.bricksUnitPrice,
        abstractComments: req.body.abstractComments,
        abstractType: req.body.abstractType,
        createdBy: req.user._id
    });
    try {
        const updatedFields = {};
        for (const file of req.files) {
            console.log(file);
            const fileName = file.originalname;
            const fileUrl = await saveFile(file, "abstract", newAbstract._id.toString(), file.fieldname);
            updatedFields[file.fieldname] = {
                fileName,
                fileUrl
            };
        }

        const updatedAbstract = await abstractModel.findByIdAndUpdate(
            newAbstract._id,
            { $set: updatedFields },
            { new: true }
        );

        res.status(201).json({
            status: 'success',
            message: "تم إنشاء المستخلص بنجاح",
            data: updatedAbstract
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }

});

exports.updateAbstract = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const abstract = await abstractModel.findById(id);
    if (!abstract) {
        return next(new ApiError("المستخلص غير موجود", 404));
    }
    let updateFields = {};
    let changes = [];
    ['estimate', 'type', 'enum', 'number', 'amount', 'abstractFile', 'attachmentFile', 'steelUnitPrice', 'cementUnitPrice', 'ceramicsQuantity', 'ceramicsQuantity', 'bricksQuantity', 'bricksUnitPrice', 'abstractComments', 'abstractType'].forEach(field => {
        if (req.body[field] && req.body[field] !== abstract[field]) {
            changes.push({ action: req.body[field] == 'null' ? 'حذف' : 'تعديل', field, oldValue: abstract[field], newValue: req.body[field] });
            updateFields[field] = req.body[field] === 'null' ? JSON.parse(req.body[field]) : req.body[field];
        }
    });

    if (req.files) {
        for (const file of req.files) {
            const fileName = file.originalname;
            const fileUrl = await saveFile(file, "abstract", id.toString(), file.fieldname);
            updateFields[file.fieldname] = {
                fileName,
                fileUrl
            };
            changes.push({
                field: file.fieldname, oldValue: abstract[file.fieldname], newValue: {
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

        await abstractModel.findByIdAndUpdate(id, updateFields, { new: true });
    }
    res.status(200).json({
        status: "success",
        message: "تم تحديث المستخلص بنجاح",
        data: await abstractModel.findById(id)
    });
});
exports.updateAbstractLeaderShip = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const abstract = await abstractModel.findById(id);
    if (!abstract) {
        return next(new ApiError("المستخلص غير موجود", 404));
    }
    let updateFields = {};
    let changes = [];
    ['deliveryDate', 'subReport', 'subReportDate'].forEach(field => {
        if (req.body[field] && req.body[field] !== abstract[field]) {
            changes.push({ action: req.body[field] == 'null' ? 'حذف' : (abstract[field] == undefined) ? "اضافة" : 'تعديل', field, oldValue: abstract[field], newValue: req.body[field] });
            updateFields[field] = req.body[field] === 'null' ? JSON.parse(req.body[field]) : req.body[field];
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

        await abstractModel.findByIdAndUpdate(id, updateFields, { new: true });
    }
    res.status(200).json({
        status: "success",
        message: "تم تعديل الادارة بنجاح",
        data: await abstractModel.findById(id)
    });
});
exports.updateAbstractManagement = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const abstract = await abstractModel.findById(id);
    if (!abstract) {
        return next(new ApiError("المستخلص غير موجود", 404));
    }
    let updateFields = {};
    let changes = [];
    ['dateAbstractManagement', 'procedureAbstractManagement', 'notesAbstractManagement', "statusAbstractManagement", "nameAbstractManagement"].forEach(field => {
        if (req.body[field] && req.body[field] !== abstract[field]) {
            changes.push({ action: req.body[field] == 'null' ? 'حذف' : (abstract[field] == undefined) ? "اضافة" : 'تعديل', field, oldValue: abstract[field], newValue: req.body[field] });
            updateFields[field] = req.body[field] === 'null' ? JSON.parse(req.body[field]) : req.body[field];
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

        await abstractModel.findByIdAndUpdate(id, updateFields, { new: true });
    }
    res.status(200).json({
        status: "success",
        message: "تم تعديل الادارة بنجاح",
        data: await abstractModel.findById(id)
    });
});
exports.updateAbstractFinancial = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const abstract = await abstractModel.findById(id);
    if (!abstract) {
        return next(new ApiError("المستخلص غير موجود", 404));
    }
    let updateFields = {};
    let changes = [];
    ['dateAbstractFinancial'].forEach(field => {
        if (req.body[field] && req.body[field] !== abstract[field]) {
            changes.push({ action: req.body[field] == 'null' ? 'حذف' : (abstract[field] == undefined) ? "اضافة" : 'تعديل', field, oldValue: abstract[field], newValue: req.body[field] });
            updateFields[field] = req.body[field] === 'null' ? JSON.parse(req.body[field]) : req.body[field];
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

        await abstractModel.findByIdAndUpdate(id, updateFields, { new: true });
    }
    res.status(200).json({
        status: "success",
        message: "تم تعديل الادارة بنجاح",
        data: await abstractModel.findById(id)
    });
});
exports.updateAbstractCentral = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const abstract = await abstractModel.findById(id);
    if (!abstract) {
        return next(new ApiError("المستخلص غير موجود", 404));
    }
    let updateFields = {};
    let changes = [];
    ['dateAbstractCentral', 'codeAbstractCentral'].forEach(field => {
        if (req.body[field] && req.body[field] !== abstract[field]) {
            changes.push({ action: req.body[field] == 'null' ? 'حذف' : (abstract[field] == undefined) ? "اضافة" : 'تعديل', field, oldValue: abstract[field], newValue: req.body[field] });
            updateFields[field] = req.body[field] === 'null' ? JSON.parse(req.body[field]) : req.body[field];
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

        await abstractModel.findByIdAndUpdate(id, updateFields, { new: true });
    }
    res.status(200).json({
        status: "success",
        message: "تم تعديل الادارة بنجاح",
        data: await abstractModel.findById(id)
    });
});

exports.getOneAbstract = factory.getOne(abstractModel);
exports.getAllAbstract = factory.getAll(abstractModel);
exports.softDeleteAbstract = factory.softDeleteOne(abstractModel);
exports.recoverAbstract = factory.recoverSoftDeletedOne(abstractModel);