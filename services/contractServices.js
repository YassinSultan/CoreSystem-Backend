const asyncHandler = require('express-async-handler');
const contractsModel = require('../models/contractsModel');
const ApiError = require('../utils/apiError');
const factory = require('../utils/crudUtils');
const { deleteFile, saveFile } = require('../utils/fileHandler');
const arrayHelpers = require('../utils/arrayHelpers');
const { request } = require('express');

exports.createContract = asyncHandler(async (req, res, next) => {
    // Validate required fields
    console.log(req.body);
    const requiredFields = ['estimate', 'contract_cancel'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            if (!req.files.filter(file => file.fieldname === field)) {

                return next(new ApiError(`الحقل ${field} مطلوب`, 400));
            }
        }
    }

    // Create the Estimate
    const newContract = await contractsModel.create({
        estimate: req.body.estimate,
        contract_cancel: req.body.contract_cancel,
        contract_value: req.contract_value,
    });

    // Handle attachments if any
    try {
        const updatedFields = {};
        for (const file of req.files) {
            const fileName = file.originalname;
            const fileUrl = await saveFile(file, "contracts", newContract._id.toString(), file.fieldname);
            updatedFields[file.fieldname] = {
                fileName,
                fileUrl
            };
        }

        const updatedContract = await contractsModel.findByIdAndUpdate(
            newContract._id,
            { $set: updatedFields },
            { new: true }
        );

        res.status(201).json({
            status: 'success',
            message: "تم إنشاء العقد بنجاح",
            data: updatedContract
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});

exports.updateContract = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const contract = await contractsModel.findById(id);
    if (!contract) {
        return next(new ApiError("العقد غير موجود", 404));
    }
    let updateFields = {};
    let changes = [];
    ['estimate', 'contract_cancel', 'contract_file', 'contract_value'].forEach(field => {
        if (req.body[field] && req.body[field] !== contract[field]) {
            changes.push({ action: req.body[field] == 'null' ? 'حذف' : 'تعديل', field, oldValue: contract[field], newValue: req.body[field] });
            updateFields[field] = req.body[field] === 'null' ? JSON.parse(req.body[field]) : req.body[field];
        }
    });

    if (req.files) {
        for (const file of req.files) {
            const fileName = file.originalname;
            const fileUrl = await saveFile(file, "contract", id.toString(), file.fieldname);
            updateFields[file.fieldname] = {
                fileName,
                fileUrl
            };
            changes.push({
                field: file.fieldname, oldValue: contract[file.fieldname], newValue: {
                    fileName,
                    fileUrl
                }
            });
        }
    }
    if (('contract_cancel' in req.body) &&
        (req.body.contract_cancel === true || req.body.contract_cancel === 'true')) {
        if (contract.contract_file) {
            changes.push({
                action: 'حذف',
                field: 'contract_file',
                oldValue: contract.contract_file,
                newValue: null
            });
            updateFields.contract_file = null;
        }
        if (contract.contract_value) {
            changes.push({
                action: 'حذف',
                field: 'contract_value',
                oldValue: contract.contract_value,
                newValue: null
            });
            updateFields.contract_value = null;
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

        await contractsModel.findByIdAndUpdate(id, updateFields, { new: true });
    }
    res.status(200).json({
        status: "success",
        message: "تم تحديث العقد بنجاح",
        data: await contractsModel.findById(id)
    });
});
exports.getOneContrat = factory.getOne(contractsModel);
exports.getAllContrats = factory.getAll(contractsModel);
exports.softDeleteContrat = factory.softDeleteOne(contractsModel);
exports.recoverContrat = factory.recoverSoftDeletedOne(contractsModel);