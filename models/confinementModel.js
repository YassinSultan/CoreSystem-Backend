const mongoose = require("mongoose");
const fileSchema = require("./sharedSchemas/fileSchema");

const confinementSchema = new mongoose.Schema({
    estimate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'estimate',
    },
    value: {
        type: Number
    },
    contractFileDWG: fileSchema,
    contractFileExcel: fileSchema,
    contractFilePdf: fileSchema,
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


module.exports = mongoose.model('confinement', confinementSchema);