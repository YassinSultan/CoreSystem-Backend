const mongoose = require("mongoose");
const fileSchema = require("./sharedSchemas/fileSchema");

const paymentOrderSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
    },
    contractingAuthority: {
        type: String,
        enum: ["القوات المسلحة", "جهة مدنية"]
    },
    // ! القوات المسلحة
    financialAllocationDate: {
        type: Date
    },
    financialAllocationValue: {
        type: Number
    },
    correspondenceNumber: {
        type: String
    },
    correspondenceFile: fileSchema,
    // ! الجهة المدنية
    paymentOrderDate: {
        type: Date
    },
    paymentOrderValue: {
        type: Number
    },
    paymentOrderNumber: {
        type: String
    },
    paymentOrderFile: fileSchema,
    paymentOrderDetails: {
        type: String
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


module.exports = mongoose.model('paymentOrder', paymentOrderSchema);