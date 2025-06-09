const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    }
}, {
    _id: false,
    timestamps: false
});

module.exports = fileSchema;