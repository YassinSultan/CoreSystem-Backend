const asyncHandler = require('express-async-handler');
const outgoingLetterModel = require('../models/outgoingLetterModel');
const ApiError = require('../utils/apiError');
const factory = require('../utils/crudUtils'); const { deleteFile, saveFile } = require('../utils/fileHandler');


exports.createOutgoingLetter = asyncHandler(async (req, res, next) => {
    try {
        // التحقق من الحقول المطلوبة
        const requiredFields = ['registrationNumber', 'subject'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return next(new ApiError(`الحقل ${field} مطلوب`, 400));
            }
        }

        // البحث عن ملفات `filePDF` و `fileWord` داخل req.files (لو موجودة)
        let pdfFile = req.files ? req.files.find(file => file.fieldname === 'filePDF') : null;
        let wordFile = req.files ? req.files.find(file => file.fieldname === 'fileWord') : null;

        // إنشاء الخطاب بدون الملفات للحصول على `_id`
        const newLetter = await outgoingLetterModel.create({
            registrationNumber: req.body.registrationNumber,
            projectId: req.body.projectId || null,
            subject: req.body.subject,
            createdBy: req.user._id
        });

        // حفظ الملفات فقط لو تم رفعها
        if (pdfFile) {
            newLetter.filePDF = await saveFile(pdfFile, "outgoing_letters", newLetter._id.toString());
        }
        if (wordFile) {
            newLetter.fileWord = await saveFile(wordFile, "outgoing_letters", newLetter._id.toString());
        }

        // تحديث السجل في قاعدة البيانات
        await newLetter.save();

        res.status(201).json({
            status: 'success',
            message: "تم إنشاء الخطاب الصادر بنجاح",
            data: newLetter
        });

    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});

exports.updateOutgoingLetter = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const letter = await outgoingLetterModel.findById(id);
        if (!letter) {
            return next(new ApiError("الخطاب غير موجود", 404));
        }

        let updateFields = {};
        let changes = [];

        // التحقق من الحقول النصية المرسلة وتحديثها إن وجدت
        ["registrationNumber", "projectId", "subject"].forEach(field => {
            if (req.body[field] && req.body[field] !== letter[field]) {
                changes.push({ field, oldValue: letter[field], newValue: req.body[field] });
                updateFields[field] = req.body[field];
            }
        });

        // التعامل مع الملفات الجديدة إذا تم إرسالها
        let pdfFile = req.files ? req.files.find(file => file.fieldname === "filePDF") : null;
        let wordFile = req.files ? req.files.find(file => file.fieldname === "fileWord") : null;

        if (pdfFile) {
            let newPdfPath = await saveFile(pdfFile, "outgoing_letters", letter._id.toString());
            changes.push({ field: "filePDF", oldValue: letter.filePDF, newValue: newPdfPath });
            updateFields.filePDF = newPdfPath;
        }

        if (wordFile) {
            let newWordPath = await saveFile(wordFile, "outgoing_letters", letter._id.toString());
            changes.push({ field: "fileWord", oldValue: letter.fileWord, newValue: newWordPath });
            updateFields.fileWord = newWordPath;
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

            await outgoingLetterModel.findByIdAndUpdate(id, updateFields, { new: true });
        }

        res.status(200).json({
            status: "success",
            message: "تم تحديث الخطاب بنجاح",
            data: await outgoingLetterModel.findById(id) // إرجاع البيانات المحدثة
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});

exports.getOneOutgoingLetter = factory.getOne(outgoingLetterModel);
exports.getAllOutgoingLetters = factory.getAll(outgoingLetterModel);
exports.softDeleteOutgoingLetter = factory.softDeleteOne(outgoingLetterModel);
exports.recoverOutgoingLetter = factory.recoverSoftDeletedOne(outgoingLetterModel);
