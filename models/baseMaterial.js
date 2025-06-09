const mongoose = require("mongoose");

const options = {
    discriminatorKey: 'data',
    timestamps: true,
    collection: 'materials'
};

const baseMaterialSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['حديد', 'اسمنت', 'سيراميك', 'رخام', 'متنوعات'],
        required: true,
        index: true
    },
    transactionType: {
        type: String,
        enum: ['تفاويض', 'بلايص', 'تسكين على عقود'],
        required: true,
        index: true
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
}, options);

// Compound index
baseMaterialSchema.index({ project: 1, type: 1, transactionType: 1 });

module.exports = mongoose.model("Material", baseMaterialSchema);