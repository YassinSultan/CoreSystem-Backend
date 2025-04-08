const mongoose = require('mongoose');

const incomingLetterSchema = new mongoose.Schema({
    // رقم القيد
    registrationNumber: {
        type: String, required: [true, 'رقم القيد مطلوب']
    },
    // نوع المكاتبة
    registrationType: {
        type: String,
        enum: ["مكتب فني", "افراد", "ندريب و عمليات", "ماليات"]
    },
    // ربط مع  المشروع
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    // موضوع الخطاب
    subject: {
        type: String, required: [true, 'موضوع الخطاب مطلوب']
    },
    // الملحقات
    attachments: [
        {
            fileName: { type: String, required: true },
            fileUrl: { type: String, required: true },
        }
    ],
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
                    action: {
                        type: String,
                        enum: ["اضافة", "تعديل", "حذف"],
                        default: "تعديل"
                    },
                    field: { type: String, required: true },  // اسم الحقل المعدل
                    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },  // القيمة القديمة
                    newValue: { type: mongoose.Schema.Types.Mixed, default: null }   // القيمة الجديدة
                }
            ]
        }
    ],
}, { timestamps: true });

module.exports = mongoose.model('IncomingLetter', incomingLetterSchema);
