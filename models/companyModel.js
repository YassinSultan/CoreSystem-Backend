const mongoose = require("mongoose");
const fileSchema = new mongoose.Schema({
    fileName: { type: String, required: false },
    fileUrl: { type: String, required: false }
}, { _id: true });
const companySchema = new mongoose.Schema({
    company_name: {
        type: String,
        required: true,
        trim: true
    },
    company_location: {
        type: String,
        required: true,
        trim: true
    },
    company_engineers_name: {
        type: String,
        required: true,
        trim: true
    },
    company_engineers_phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^\d{10,15}$/, "رقم الهاتف غير صالح"]
    },
    company_category: {
        type: String,
        required: true,
        enum: [
            "فئة اولى", "فئة ثانية", "فئة ثالثة", "فئة رابعة", "فئة خامسة",
            "فئة سادسة", "فئة سابعة", "فئة ثامنة", "فئة تاسعة", "فئة عاشرة"
        ]
    },
    allowed_limit: {
        type: Number,
        required: true
    },
    specialization: {
        type: String,
        required: true,
        enum: [
            "اعمال المباني (المتكامل)", "الاساسيات", "الانشاءات المعدنية", "الاعمال التكميلية",
            "اعمال المنشات الصناعية", "اعمال الطرق والممرات ومهابط الطائرات", "الانفاق", "اعمال الكباري",
            "اعمال السكك الحديدية", "اعمال محطات وشبكات المياة والصرف الصحي", "اعمال محطات شبكة الغاز والوقود",
            "اعمال الاشغال العامة ومحطات الري", "الاعمال البحرية والنهرية والتكريك", "اعمال استصلاح الاراضي",
            "الابار", "الاعمال الكهروميكانيكية والالكترونية للمنشأت والمصانع والمباني العامة",
            "اعمال محطات انتاج وتوزيع الطاقة الكهربائية الجديدة والمتجددة", "اعمال شبكة التيار الخفيف",
            "اعمال محطات انتاج وتوزيع الطاقة الكهربائية والمائية والغازية والديزل (التقليدي)",
            "اعمال المصاعد والسلالم والمشيات", "اعمال تشغيل وصيانة المباني", "اعمال صيانة وتشغيل الطرق والكباري",
            "اعمال صيانة السكك الحديدية", "اعمال صيانة وتشغيل الانفاق",
            "اعمال صيانة وتشغيل محطات وشبكة المياة والصرف الصحي والتحلية والرفع والمعالجة",
            "اعمال صيانة وتشغيل محطات القوي الكهربائية والخطوط والمحولات", "اعمال صيانة المسطحات الخضراء"
        ]
    },
    company_file: fileSchema,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
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
    ]
}, { timestamps: true });

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
