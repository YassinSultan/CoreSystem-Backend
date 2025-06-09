const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema({
    officerName: {
        type: String,
        required: true,
        trim: true
    },
}, { _id: true });

module.exports = officerSchema;