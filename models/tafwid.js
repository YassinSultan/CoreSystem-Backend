const mongoose = require("mongoose");
const Material = require("./baseMaterial");
const fileSchema = require("./sharedSchemas/fileSchema");
const officerSchema = require("./sharedSchemas/officerSchema");

const tafwidSchema = new mongoose.Schema({
    tafwidFile: fileSchema,
    // رقم التفويض
    tafwidNumber: {
        type: String,
        required: true,
        unique: true
    },
    // اسم المصنغ
    factoryName: {
        type: String,
        required: true,
        trim: true
    },
    // كمية التفويض
    tafwidQuantity: {
        type: Number,
        required: true,
        min: 1
    },
    // امر التوريد
    supplyOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'supplyOrders',
        index: true
    },
    // اسم الظباط
    officers: { // Changed to plural since it's an array
        type: [officerSchema],
        required: true
    },
    // شركة الشحن
    shippingCompany: {
        type: String,
        trim: true
    },
    // موقف التفويض
    mawqfAlTafwid: {
        type: String,
        enum: ['جاري', "منتهي"],
        default: 'جاري'
    }
});

// Indexes
tafwidSchema.index({ factoryName: 1 });

module.exports = Material.discriminator("Tafwid", tafwidSchema);