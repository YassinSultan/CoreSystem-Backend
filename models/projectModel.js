const mongoose = require('mongoose');
const fileSchema = new mongoose.Schema({
    fileName: { type: String, required: false },
    fileUrl: { type: String, required: false }
}, { _id: true });
const projectSchema = new mongoose.Schema({
    // اسم المشروع
    name: {
        type: String,
        required: true
    },
    // جهة التعاقد
    contracting_authority: {
        type: String,
        enum: {
            values: ['القوات المسلحة', 'الموازنة', 'جهة مدنية'],
            message: 'يجب اختيار جهة تعاقد صحيحة'
        },
    },
    // محضر استلام الموقع
    site_receipt_file: fileSchema,
    // تصديق الامانة
    trust_approval_file: fileSchema,
    // البيانات المالية للمشروع
    project_financials: [{
        value: { type: Number, required: false },
        file: fileSchema,
        registration_date: {
            type: Date,
            required: false,
            default: null
        } // جعل الحقل اختياريًا
    }],
    // حالة المشروع
    status: {
        type: String,
        enum: {
            values: ['منتهي', 'جاري', 'دراسة'],
            message: 'يجب اختيار حالة صحيحة'
        },
        required: true
    },
    // مكان المشروع
    location: {
        type: String,
        required: true
    },
    // تاريخ بدأ المشروع
    start_date: {
        type: Date,
        required: true
    },
    // تاريخ انتهاء المشروع
    end_date: {
        type: Date,
        required: false
    },
    // ربط المياه
    water_connection: {
        date: { type: Date },
        file: fileSchema,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },
    // ربط الكهرباء
    electricity_connection: {
        date: { type: Date },
        file: fileSchema,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },
    // ربط  الري
    irrigation_connection: {
        date: { type: Date },
        file: fileSchema,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },
    // ربط الصرف الصحي
    drainage_connection: {
        date: { type: Date },
        file: fileSchema,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },
    // اسم الجهة
    entity_name: {
        type: String,
        required: false
    },
    // الميزانية التقديرية
    estimated_budget: {
        type: Number,
        required: false
    },
    // ملف الموازونة التقديرية
    estimated_budget_file: fileSchema,
    // بروتوكلات المشروع
    protocols: [
        {
            value: {
                type: Number,
                required: false
            },
            file: fileSchema,
            registration_date: {
                type: Date,
                required: false,
                default: null
            }

        }
    ],
    aerial_view_file: fileSchema,  // العرض الجوي
    illustrative_view_file: fileSchema,
    // محذوف؟
    isDeleted: {
        type: Boolean,
        default: false,
    },
    // من قام بالحذف
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // من قام بانشاء 
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
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


const Project = mongoose.model("Project", projectSchema);
module.exports = Project;