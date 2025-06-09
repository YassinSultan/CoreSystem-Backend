const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

exports.extractKeys = (schema, modelName, parentKey = '') => {
    const keys = {};

    // Load labels from JSON file
    let labels = {};
    const labelsPath = path.join(__dirname, 'labels', `${modelName}Labels.json`);
    try {
        if (fs.existsSync(labelsPath)) {
            labels = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));
        }
    } catch (error) {
        console.error(`Error reading labels file for ${modelName}:`, error.message);
    }

    schema.eachPath((key, path) => {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;
        const options = path.options;

        // Determine the label (Arabic name)
        const label = labels[fullKey] || key;

        // Handle arrays with sub-schemas
        if (Array.isArray(options.type) && options.type[0] instanceof mongoose.Schema) {
            keys[fullKey] = label;
            const subKeys = module.exports.extractKeys(options.type[0], modelName, `${fullKey}[]`);
            Object.assign(keys, subKeys);
        }
        // Handle nested objects
        else if (options.type instanceof mongoose.Schema) {
            keys[fullKey] = label;
            const subKeys = module.exports.extractKeys(options.type, modelName, fullKey);
            Object.assign(keys, subKeys);
        }
        // Handle single fields
        else {
            keys[fullKey] = label;
        }
    });

    return keys;
};