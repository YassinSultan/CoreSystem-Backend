const mongoose = require('mongoose');

const outgoingLetterSchema = new mongoose.Schema({
    // رقم القيد
    registrationNumber: {
        type: String, required: [true, 'رقم القيد مطلوب']
    },
    // ربط مع  المشروع
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    // الملفات
    filePDF: { type: String },
    fileWord: { type: String },
    // موضوع الخطاب
    subject: {
        type: String, required: [true, 'موضوع الخطاب مطلوب']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isDeleted: {
        type: Boolean, default: false
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deletedAt: { type: Date, default: null },
    // تاريخ التعديل
    updateHistory: [
        {
            updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            updatedAt: { type: Date, default: Date.now },
            changes: [
                {
                    field: { type: String, required: true },  // اسم الحقل المعدل
                    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },  // القيمة القديمة
                    newValue: { type: mongoose.Schema.Types.Mixed, default: null }   // القيمة الجديدة
                }
            ]
        }
    ],
}, { timestamps: true });

module.exports = mongoose.model('OutgoingLetter', outgoingLetterSchema);
