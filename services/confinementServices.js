const asyncHandler = require('express-async-handler');
const confinementModel = require('../models/confinementModel');
const ApiError = require('../utils/apiError');
const factory = require('../utils/crudUtils');
const { saveFile } = require('../utils/fileHandler');

exports.createConfinement = asyncHandler(async (req, res, next) => {
    const requiredFields = ['estimate', 'value', 'contractFileDWG', 'contractFileExcel', 'contractFilePdf'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            if (!req.files.filter(file => file.fieldname === field)) {

                return next(new ApiError(`الحقل ${field} مطلوب`, 400));
            }
        }
    }

    // Create the Estimate
    const newConfinement = await confinementModel.create({
        estimate: req.body.estimate,
        value: req.body.value,
    });

    // Handle attachments if any
    try {
        const updatedFields = {};
        for (const file of req.files) {
            const fileName = file.originalname;
            const fileUrl = await saveFile(file, "confinement", newConfinement._id.toString(), file.fieldname);
            updatedFields[file.fieldname] = {
                fileName,
                fileUrl
            };
        }

        const updatedConfinement = await confinementModel.findByIdAndUpdate(
            newConfinement._id,
            { $set: updatedFields },
            { new: true }
        );

        res.status(201).json({
            status: 'success',
            message: "تم إنشاء الحصر بنجاح",
            data: updatedConfinement
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});

exports.updateConfinement = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const confinement = await confinementModel.findById(id);
    if (!confinement) {
        return next(new ApiError("الحصر غير موجود", 404));
    }
    let updateFields = {};
    let changes = [];
    ['estimate', 'value', 'contractFileDWG', 'contractFileExcel', 'contractFilePdf'].forEach(field => {
        if (req.body[field] && req.body[field] !== confinement[field]) {
            changes.push({ action: req.body[field] == 'null' ? 'حذف' : 'تعديل', field, oldValue: confinement[field], newValue: req.body[field] });
            updateFields[field] = req.body[field] === 'null' ? JSON.parse(req.body[field]) : req.body[field];
        }
    });

    if (req.files) {
        for (const file of req.files) {
            const fileName = file.originalname;
            const fileUrl = await saveFile(file, "confinements", id.toString(), file.fieldname);
            updateFields[file.fieldname] = {
                fileName,
                fileUrl
            };
            changes.push({
                field: file.fieldname, oldValue: confinement[file.fieldname], newValue: {
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

        await confinementModel.findByIdAndUpdate(id, updateFields, { new: true });
    }
    res.status(200).json({
        status: "success",
        message: "تم تحديث الحصر بنجاح",
        data: await confinementModel.findById(id)
    });
});
exports.getOneConfinement = factory.getOne(confinementModel);
exports.getAllConfinements = factory.getAll(confinementModel);
exports.softDeleteConfinement = factory.softDeleteOne(confinementModel);
exports.recoverConfinement = factory.recoverSoftDeletedOne(confinementModel);