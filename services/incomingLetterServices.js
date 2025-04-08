const asyncHandler = require('express-async-handler');
const incomingLetterModel = require('../models/incomingLetterModel');
const ApiError = require('../utils/apiError');
const factory = require('../utils/crudUtils');
const { deleteFile, saveFile } = require('../utils/fileHandler');
const arrayHelpers = require('../utils/arrayHelpers');

exports.createIncomingLetter = asyncHandler(async (req, res, next) => {
    // Validate required fields
    const requiredFields = ['registrationNumber', 'subject'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return next(new ApiError(`الحقل ${field} مطلوب`, 400));
        }
    }

    // Create the letter
    const newLetter = await incomingLetterModel.create({
        registrationNumber: req.body.registrationNumber,
        registrationType: req.body.registrationType || null,
        projectId: req.body.projectId || null,
        subject: req.body.subject,
        createdBy: req.user._id
    });

    // Handle attachments if any
    const attachments = req.files ? req.files.filter(file => file.fieldname === 'attachments') : [];
    try {
        for (const file of attachments) {
            const fileName = decodeURIComponent(file.originalname);
            console.log(decodeURIComponent(file.originalname));
            const fileUrl = await saveFile(file, "incoming_letters", newLetter._id.toString(), "attachments");
            await arrayHelpers.addToArray(incomingLetterModel, newLetter._id, "attachments", { fileName, fileUrl });
        }

        // Fetch the updated letter with attachments
        const updatedLetter = await incomingLetterModel.findById(newLetter._id);

        res.status(201).json({
            status: 'success',
            message: "تم إنشاء الخطاب الوارد بنجاح",
            data: updatedLetter
        });
    } catch (error) {
        // Clean up if something went wrong
        await incomingLetterModel.findByIdAndDelete(newLetter._id);
        for (const file of attachments) {
            await deleteFile(file.path).catch(console.error);
        }
        next(new ApiError(error.message, 500));
    }
});


exports.updateIncomingLetter = asyncHandler(async (req, res, next) => {
    console.log(req.files);
    try {
        const { id } = req.params;
        // بيجيب ال model
        const letter = await incomingLetterModel.findById(id);
        if (!letter) {
            return next(new ApiError("الخطاب غير موجود", 404));
        }

        let updateFields = {};
        let changes = [];

        // التحقق من الحقول النصية المرسلة وتحديثها إن وجدت
        ["registrationNumber", "projectId", "subject", "registrationType"].forEach(field => {
            if (req.body[field] && req.body[field] !== letter[field]) {
                changes.push({ field, oldValue: letter[field], newValue: req.body[field] });
                updateFields[field] = req.body[field];
            }
        });

        // التعامل مع الملفات الجديدة إذا تم إرسالها
        let attachments = req.files ? req.files.filter(file => file.fieldname === "attachments") : [];
        for (const attachment of attachments) {
            const fileName = attachment.originalname;
            const fileUrl = await saveFile(attachment, "incoming_letters", id.toString(), "attachments");
            await arrayHelpers.addToArray(incomingLetterModel, id, "attachments", { fileName, fileUrl });
            changes.push({ field: "attachments", action: "اضافة", newValue: { fileUrl, fileName } });
        }
        // التعامل مع حذف الملفات 
        const deletedAttachments = req.body.deletedAttachments
            ? JSON.parse(req.body.deletedAttachments)
            : [];
        if (Array.isArray(deletedAttachments) && deletedAttachments.length > 0) {
            const deletePromises = deletedAttachments.map(async (attachmentId) => {
                return await arrayHelpers.removeFromArray(incomingLetterModel, id, "attachments", attachmentId);
            });

            const deletedItems = await Promise.all(deletePromises);
            changes.push({ field: "attachments", action: "حذف", oldValue: deletedItems });
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

            await incomingLetterModel.findByIdAndUpdate(id, updateFields, { new: true });
        }

        res.status(200).json({
            status: "success",
            message: "تم تحديث الخطاب بنجاح",
            data: await incomingLetterModel.findById(id) // إرجاع البيانات المحدثة
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});


exports.getOneIncomingLetter = factory.getOne(incomingLetterModel);
exports.getAllIncomingLetters = factory.getAll(incomingLetterModel);
exports.softDeleteIncomingLetter = factory.softDeleteOne(incomingLetterModel);
exports.recoverIncomingLetter = factory.recoverSoftDeletedOne(incomingLetterModel);