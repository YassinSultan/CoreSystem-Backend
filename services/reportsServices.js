import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import ApiFeatures from '../utils/apiFeatures.js';
import ApiError from '../utils/apiError.js';
import { saveFile } from '../utils/fileHandler.js';
import fs from 'fs/promises';
import path from 'path';
import companyModel from "../models/companyModel.js";
import projectModel from "../models/projectModel.js";
import estimateModel from "../models/estimateModel.js";
import materialModel from "../models/baseMaterial.js";
import supplyOrdersModel from "../models/supplyOrdersModel.js";

// Helper function to get nested property values
const getNestedValue = (obj, path, forExcel = false) => {
    const keys = path.split('.');
    let value = keys.reduce((o, key) => (o && o[key] !== undefined) ? o[key] : null, obj);

    if (forExcel && Array.isArray(value)) {
        return value
            .map(item => {
                if (typeof item === 'object' && item !== null) {
                    const lastKey = keys[keys.length - 1];
                    return item[lastKey] !== undefined ? item[lastKey].toString() : '';
                }
                return item !== null ? item.toString() : '';
            })
            .filter(val => val !== '')
            .join('; ');
    } else if (forExcel && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const lastKey = keys[keys.length - 1];
        return value[lastKey] !== undefined ? value[lastKey].toString() : '';
    }

    return value !== null ? value : '';
};

// Helper function to get Arabic label from labels JSON
const getArabicLabel = (labels, field) => {
    const keys = field.split('.');
    let current = labels;
    let parentLabel = '';

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!current[key]) return field.split('.').join(' ');

        if (i === 0 && current[key].label) {
            parentLabel = current[key].label;
        }

        if (i === keys.length - 1) {
            const currentLabel = current[key].label || field.split('.').join(' ');
            return parentLabel && keys.length > 1 ? `${parentLabel} - ${currentLabel}` : currentLabel;
        }

        current = current[key].subKeys || current[key];
    }

    return field.split('.').join(' ');
};

// Helper function to get subfields for array fields, including nested subKeys
const getArraySubfields = (labels, field, prefix = '') => {
    const keys = field.split('.');
    let current = labels;

    for (const key of keys) {
        if (!current[key]) return [];
        current = current[key].subKeys || current[key];
    }

    if (!current) return [];

    return Object.keys(current).flatMap(subKey => {
        const subField = prefix ? `${prefix}.${subKey}` : `${field}.${subKey}`;
        if (current[subKey].subKeys) {
            return getArraySubfields(labels, field, subField);
        }
        return {
            field: subField,
            label: getArabicLabel(labels, subField)
        };
    });
};

// Helper function to group subfields by parent array field
const groupSchemaFields = (schema, labels) => {
    const grouped = {};
    schema.forEach(field => {
        const parentField = field.split('.')[0];
        const labelValue = getNestedValue(labels, parentField);
        if (labelValue && labelValue.subKeys) {
            if (!grouped[parentField]) {
                grouped[parentField] = [];
            }
            grouped[parentField].push(field);
        } else {
            grouped[field] = [field];
        }
    });
    return grouped;
};

export const getReports = async (req, res, next) => {
    try {
        const { schemaName, schema } = req.query;

        if (!schemaName || !schema || !Array.isArray(schema)) {
            return next(new ApiError('يجب توفير اسم المخطط وقائمة الحقول', 400));
        }

        // Get the model dynamically based on schemaName
        let Model;
        try {
            const modelName = schemaName.charAt(0).toUpperCase() + schemaName.slice(1);
            Model = mongoose.model(modelName);
        } catch (error) {
            return next(new ApiError(`المخطط ${schemaName} غير موجود`, 404));
        }

        // Load the labels JSON file
        let labels;
        try {
            const filePath = path.join(process.cwd(), 'models', 'labels', `${schemaName}.json`);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            labels = JSON.parse(fileContent);
        } catch (error) {
            return next(new ApiError(`ملف التسميات لـ ${schemaName} غير موجود`, 404));
        }

        // Group schema fields by parent array fields
        const groupedSchema = groupSchemaFields(schema, labels);

        // Fetch data using ApiFeatures, selecting schema fields and subfields
        const expandedSchema = Object.keys(groupedSchema).flatMap(parentField => {
            const value = getNestedValue(labels, parentField);
            if (value && value.subKeys) {
                return getArraySubfields(labels, parentField).map(sub => sub.field);
            }
            return parentField;
        });
        const query = Model.find().select(expandedSchema.join(' '));
        const apiFeatures = new ApiFeatures(query, {})
            .filter()
            .sort()
            .populate();

        const documents = await apiFeatures.mongooseQuery;

        if (!documents.length) {
            return next(new ApiError('لا توجد بيانات متاحة للتقرير', 404));
        }

        // Create Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(schemaName);

        // Generate headers for Excel
        const headers = [];
        const headerFields = [];
        schema.forEach(field => {
            headers.push(getArabicLabel(labels, field));
            headerFields.push(field);
        });
        worksheet.addRow(headers);

        // Style headers
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data rows to Excel
        documents.forEach(doc => {
            const docObj = doc.toObject();
            const rowData = headerFields.map(field => {
                const parentField = field.split('.')[0];
                const labelValue = getNestedValue(labels, parentField);
                if (labelValue && labelValue.subKeys && groupedSchema[parentField]?.includes(field)) {
                    const subFieldPath = field.split('.').slice(parentField.split('.').length).join('.');
                    const arrayData = getNestedValue(docObj, parentField) || [];
                    return arrayData
                        .map(item => getNestedValue(item, subFieldPath, true))
                        .filter(val => val !== '')
                        .join('; ');
                }
                return getNestedValue(docObj, field, true);
            });
            worksheet.addRow(rowData);
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });

        // Generate a buffer from the workbook
        const buffer = await workbook.xlsx.writeBuffer();

        // Create a file object to pass to saveFile
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const originalName = `${schemaName}_report_${timestamp}.xlsx`;

        const file = {
            originalname: originalName,
            buffer: buffer,
            size: buffer.length,
            mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };

        // Save the file using the file service
        const fileUrl = await saveFile(file, 'reports', 'exports', '');

        // Prepare filtered data for response with Arabic labels
        const filteredData = documents.map(doc => {
            const obj = {};
            const docObj = doc.toObject();
            Object.entries(groupedSchema).forEach(([parentField, fields]) => {
                const labelValue = getNestedValue(labels, parentField);
                if (labelValue && labelValue.subKeys) {
                    const arrayData = getNestedValue(docObj, parentField) || [];
                    obj[getArabicLabel(labels, parentField)] = arrayData.map(item => {
                        const subObj = {};
                        fields.forEach(field => {
                            const subFieldPath = field.split('.').slice(parentField.split('.').length).join('.');
                            const subLabel = getArabicLabel(labels, field);
                            subObj[subLabel] = getNestedValue(item, subFieldPath);
                        });
                        return subObj;
                    });
                } else {
                    fields.forEach(field => {
                        obj[getArabicLabel(labels, field)] = getNestedValue(docObj, field);
                    });
                }
            });
            return obj;
        });

        res.status(201).json({
            status: 'success',
            message: 'تم إنشاء ملف Excel بنجاح',
            data: {
                fileUrl,
                filename: originalName,
                documents: filteredData
            }
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
};
export const getAllReports = async (req, res, next) => {
    try {
        // Fetch all companies
        const companies = await companyModel.find().lean();

        // Fetch all companies with their estimates, projects, materials, and supply orders
        const companyData = await Promise.all(
            companies.map(async (company) => {
                // Fetch all estimates for the company, populating the project
                const estimates = await estimateModel
                    .find({ company: company._id })
                    .populate("project", null, null, { strictPopulate: false })
                    .lean();

                // Process each estimate to include materials and supply orders
                const estimateData = await Promise.all(
                    estimates.map(async (estimate) => {
                        // Fetch materials and supply orders for the project
                        const [materials, supplyOrders] = await Promise.all([
                            materialModel.find({ project: estimate.project._id }).lean(),
                            supplyOrdersModel.find({ projectId: estimate.project._id }).lean(),
                        ]);

                        return {
                            ...estimate, // Include all estimate fields
                            project: {
                                ...estimate.project, // Include all project fields
                                materials, // Include all materials
                                supplyOrders, // Include all supply orders
                            },
                        };
                    })
                );

                // Return company with its estimates
                return {
                    ...company, // Include all company fields
                    estimates: estimateData, // Estimates with project, materials, and supply orders
                };
            })
        );

        // Fetch projects that have no estimates
        const projectsWithNoEstimates = await projectModel
            .find({
                _id: { $nin: companyData.flatMap((company) => company.estimates.map((e) => e.project._id)) },
            })
            .lean();

        // Fetch materials and supply orders for projects with no estimates
        const projectsData = await Promise.all(
            projectsWithNoEstimates.map(async (project) => {
                const [materials, supplyOrders] = await Promise.all([
                    materialModel.find({ project: project._id }).lean(),
                    supplyOrdersModel.find({ projectId: project._id }).lean(),
                ]);

                return {
                    ...project, // Include all project fields
                    materials, // Include all materials
                    supplyOrders, // Include all supply orders
                    estimates: [], // Add empty estimates array for consistency
                };
            })
        );

        // Merge companies and projectsWithNoEstimates into a single array
        const mergedData = [...companyData, ...projectsData];

        // Send response
        res.status(200).json({
            status: "success",
            message: "تم جلب البيانات بنجاح",
            data: mergedData, // Single array containing companies and projects without estimates
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
};