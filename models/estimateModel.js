const mongoose = require("mongoose");
const fileSchema = new mongoose.Schema({
    fileName: { type: String, required: false },
    fileUrl: { type: String, required: false }
}, { _id: true });
const estimateSchema = new mongoose.Schema({
    //! =============== الخطوة الاولى الادارة ===============
    // المشروع
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
    },
    // الشركة
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    // اسم المقايسة
    name: {
        type: String, required: [true, 'اسم المقايسة مطلوب']
    },
    // قيمة المقايسة
    value: {
        type: Number, required: [true, 'قيمة المقايسة مطلوبة']
    },
    // المسطح
    area: {
        type: Number, required: [true, 'مسطح المقايسة مطلوب']
    },
    // مستند اثبات الكتيبة
    battalionProofDocument: fileSchema,
    // جدول الكميات Excel
    quantitySurveyFile: fileSchema,
    // شهادة الاعتماد
    approvalCertificateFile: fileSchema,
    // اللوحات التنفيذية
    shopDrawingsDWGFile: fileSchema,
    // اللوحات التنفيذية PDF
    shopDrawingsPDFFile: fileSchema,
    // ! =============== الخطوة الثانية الادارة ===============
    // قيمة المقايسة للادارة
    estimateValueForManagement: {
        type: Number,
    },
    // رقم المقايسة
    estimateNumber: {
        type: Number,
        unique: true,
    },
    //! =============== الخطوة الثالثة الادارة ===============
    // قيمة المقايسة للهينة
    estimateValueForAuthority: {
        type: Number,
    },
    // سعر الحديد
    ironPrice: {
        type: Number,
    },
    // سعر الاسمنت
    cementPrice: {
        type: Number,
    },
    // ==============================
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    // الغاء
    isCancelled: {
        type: Boolean, default: false
    },
    // ملف الالغاء
    cancellationFile: {
        fileName: {
            type: String,
        },
        fileUrl: {
            type: String,
        }
    },
    // تمت التعاقد
    isContracted: {
        type: Boolean, default: false
    },
    // اخطار التعاقد
    contractNotificationFile: {
        fileName: {
            type: String,
        },
        fileUrl: {
            type: String,
        }
    },
    contractValue: {
        type: Number
    },
    // اسم اجراء التمام
    completionProcedureName: {
        type: String,
        enum: ["اللواء", "منتظر تسليم الادارة", "جاري المراجعة بالادارة", "جاري المراجعة مكتب الاستشاري", "منتظر تسليم المكتب الاستشاري", "نسب تجاوز", "استيفاء", "كارت", "اعداد كراسة", "ربط مالي", "تموين"]
    },
    // سبب تمام المقايسة
    completionReason: {
        type: String,
    },
    // قيمة المقايسة
    estimateNumber: {
        type: Number
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

module.exports = mongoose.model('estimate', estimateSchema);