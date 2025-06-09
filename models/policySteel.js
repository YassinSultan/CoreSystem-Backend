const mongoose = require("mongoose");
const Material = require("./baseMaterial");
const fileSchema = require("./sharedSchemas/fileSchema");

const itemSchema = new mongoose.Schema({
    receivingCompany: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
    },
    steelDiameter: {
        type: Number,
        min: 1
    },
    quantityPerDiameter: {
        type: Number,
        min: 1
    },
    companyRecieveFile: fileSchema
}, { _id: true });

const policySteelSchema = new mongoose.Schema({
    tafwid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',

        index: true
    },
    policyNumber: {
        type: Number,

        min: 1,
        unique: true
    },
    policyDate: {
        type: Date,

        default: Date.now
    },
    items: { // Changed to plural since it's an array
        type: [itemSchema],
    },
    totalQuantity: {
        type: Number,
    },
    policyFile: {
        type: fileSchema,

    },
    officer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Officer'
    }
});

// Indexes
policySteelSchema.index({ tafwid: 1, policyDate: 1 });

module.exports = Material.discriminator("PolicySteel", policySteelSchema);