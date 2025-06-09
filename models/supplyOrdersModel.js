const mongoose = require("mongoose");
const fileSchema = new mongoose.Schema({
    fileName: { type: String, required: false },
    fileUrl: { type: String, required: false }
}, { _id: true });
const descriptionSchema = new mongoose.Schema({
    // الصنف
    category: { type: String, required: true },
    // الكود
    code: { type: String, required: true },
    // الكمية
    quantity: { type: String, required: true },
    // الفئة
    unit: { type: String, required: true },
    // الاجمالي
    total: { type: Number, required: false },
}, { _id: false });
const itemDetailsSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    count: { type: String, required: true }, // برضو ممكن تخليها Number
    descriptions: [descriptionSchema]
}, { _id: false });
const supplyOrderSchema = new mongoose.Schema({
    // Id المشروع
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    // نوع الخام
    rawType: { type: String, enum: ['متنوع', 'حديد', 'اسمنت'], required: false },
    // النوع
    customType: { type: String, required: false },
    // عدد الاصناف
    numberOfItems: { type: String, required: false },
    // الجداول
    itemDetails: [itemDetailsSchema],
    // يخصم على العقد
    discountOnContracts: { type: Boolean, required: false },
    status: {
        type: String,
        enum: ["جاري التصديق", "تم التصديق", "تم التسوية", "تم تسوية جزء", "جاري التسليم في الادارة", "تم التسليم في الادارة", "الغاء"]
    },
    // الكمية
    quantity: { type: String, required: false },
    price: { type: Number, required: false },
    // رقم امر التوريد
    supplyNumber: { type: String, required: true },
    // اسم امر التوريد
    supplyName: { type: String, required: true },
    // قيمة امر التوريد
    supplyValue: { type: String, required: false },
    // قيمة التسوية
    settlementValue: { type: String, required: false },
    // ملف التسوية
    settlementFile: fileSchema,
    // ملف الموقف
    statusFile: fileSchema,
    // ملف التدبير
    procurementFile: fileSchema,
    // ملف امر التوريد
    supplyOrderFile: fileSchema,
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

module.exports = mongoose.model('supplyOrders', supplyOrderSchema);