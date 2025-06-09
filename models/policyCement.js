const mongoose = require("mongoose");
const Material = require("./baseMaterial");
const fileSchema = require("./sharedSchemas/fileSchema");

const policyCementSchema = new mongoose.Schema({
    policyNumber: Number,
    policyDate: Date,
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    cementType: { type: String, enum: ['سايب', 'معبأ'] },
    cementGrade: {
        type: String, enum: [
            "رتبة 33",
            "رتبة 43",
            "رتبة 53",
            "الأسمنت البورتلاندي المقاوم",
            "الأسمنت البوزولاني",
            "الأسمنت سريع التصلب",
            "الأسمنت منخفض الحرارة",
            "الأسمنت الأبيض",
        ],
    },
    quantity: Number,
    policyFile: fileSchema,
    companyRecieveFile: fileSchema,
    recievedName: String
});

module.exports = Material.discriminator("policyCement", policyCementSchema);
