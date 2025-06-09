const mongoose = require("mongoose");
const fileSchema = require("./sharedSchemas/fileSchema");
const abstractSchema = new mongoose.Schema({
    // المقايسة
    estimate: { type: mongoose.Schema.Types.ObjectId, ref: "estimate", required: true },
    // نوع المستخلص
    type: { type: String, enum: ["جاري", "أول ختامي", "ختامي"], required: true },
    // ! لو جاري هيبقى في رقم المستخلص
    number: Number, // لو جاري
    // قيمة المستخلص
    amount: Number,
    // ملف المستخلص
    abstractFile: fileSchema,
    // الملف المرفق
    attachmentFile: fileSchema,
    // فئة الحديد
    steelUnitPrice: {
        type: Number
    },
    steelTotal: {
        type: Number
    },
    // فئة الاسمنت
    cementUnitPrice: {
        type: Number
    },
    cementTotal: {
        type: Number
    },
    // اجمالي الخصم للسيراميك
    ceramicsQuantity: {
        type: Number
    },
    // اجمالي الخصم للرخام
    marbleQuantity: {
        type: Number
    },
    // كمية الطوب
    bricksQuantity: {
        type: Number
    },
    // فئة الطوب
    bricksUnitPrice: {
        type: Number
    },
    abstractComments: {
        type: String
    },
    // ! تعديل قيادة اللواء
    // تاريخ التسليم
    deliveryDate: {
        type: Date,
        default: undefined
    },
    // التمام الفرعي
    subReport: {
        type: String,
        enum: ['توقيع', "مساعد للمشروعات", "لجان"],
        default: undefined
    },
    subReportDate: {
        type: Date,
        default: undefined
    },
    // ! تعديل الادارة
    dateAbstractManagement: {
        type: Date,
        default: undefined
    },
    // التمام الفرعي
    procedureAbstractManagement: {
        type: String,
        enum: ['جاري', "استيفاء", "جاهز للتحرك"],
        default: undefined
    },
    statusAbstractManagement: {
        type: String
    },
    nameAbstractManagement: {
        type: String
    },
    notesAbstractManagement: {
        type: String,
        default: undefined
    },
    // ! تعديل فرع مالي
    dateAbstractFinancial: {
        type: Date,
        default: undefined
    },
    // ! تعديل الادارة المركزية
    dateAbstractCentral: {
        type: Date,
        default: undefined
    },
    codeAbstractCentral: {
        type: String,
        default: undefined
    },
    /*     manpowerClearance: {
            type: Number
        }, */
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
module.exports = mongoose.model("Aabstract", abstractSchema);