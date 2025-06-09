const mongoose = require("mongoose");
const Material = require("./baseMaterial");
const fileSchema = require("./sharedSchemas/fileSchema");

const contractAssignmentsMaterialsSchema = new mongoose.Schema({
    // المقايسة
    estimate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'estimate',
    },
    // الكمية المخصصة
    allocatedQuantity: {
        type: Number
    },
    // الكمية المنصرفة
    disbursedQuantity: {
        type: Number
    },
    // الكمية المخصصة لكل العقود
    discountedQuantityOnTheContract: {
        type: Number
    }
});

module.exports = Material.discriminator("contractAssignments", contractAssignmentsMaterialsSchema);
