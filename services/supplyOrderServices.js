const asyncHandler = require('express-async-handler');
const supplyOrdersModel = require('../models/supplyOrdersModel');
const ApiError = require('../utils/apiError');
const factory = require('../utils/crudUtils');
const { deleteFile, saveFile } = require('../utils/fileHandler');
const { isEqual } = require('lodash');

exports.createSupplyOrder = asyncHandler(async (req, res, next) => {
    // Validate required fields
    if (!req.body.projectId || !req.body.supplyNumber || !req.body.supplyName) {
        return next(new ApiError('يجب إدخال معرف المشروع ورقم واسم أمر التوريد', 400));
    }

    // Convert string boolean to actual boolean
    if (req.body.discountOnContracts) {
        req.body.discountOnContracts = req.body.discountOnContracts === 'true';
    }

    // Clean up and calculate totals for itemDetails descriptions
    if (req.body.itemDetails && Array.isArray(req.body.itemDetails)) {
        req.body.itemDetails = req.body.itemDetails.map(item => {
            if (item.descriptions && Array.isArray(item.descriptions)) {
                // Calculate total and filter descriptions
                item.descriptions = item.descriptions.map(desc => {
                    // Convert quantity and unit to numbers
                    const quantity = parseFloat(desc.quantity) || 0;
                    const unitPrice = parseFloat(desc.unit) || 0;

                    // Calculate total (unit * quantity)
                    desc.total = quantity * unitPrice;

                    return desc;
                }).filter(desc =>
                    desc.category && desc.code && desc.quantity && desc.unit
                );

                // Remove duplicates based on category and code
                item.descriptions = item.descriptions.filter(
                    (desc, index, self) =>
                        index === self.findIndex(d =>
                            d.category === desc.category && d.code === desc.code
                        )
                );
            }
            return item;
        });
    }
    console.log(req.body);
    try {
        // Create the supply order
        const newSupplyOrder = await supplyOrdersModel.create({
            projectId: req.body.projectId,
            customType: req.body.customType,
            rawType: req.body.rawType,
            numberOfItems: req.body.numberOfItems,
            discountOnContracts: req.body.discountOnContracts,
            supplyNumber: req.body.supplyNumber,
            supplyName: req.body.supplyName,
            supplyValue: req.body.supplyValue,
            settlementValue: req.body.settlementValue,
            itemDetails: req.body.itemDetails,
            status: req.body.status,
            quantity: req.body.quantity,
            price: req.body.price,
            createdBy: req.user._id
        });

        // Handle file uploads if they exist
        const updatedFields = {};
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileName = file.originalname;
                const fileUrl = await saveFile(
                    file,
                    "supplyOrders",
                    newSupplyOrder._id.toString(),
                    file.fieldname
                );
                updatedFields[file.fieldname] = {
                    fileName,
                    fileUrl
                };
            }

            // Update the supply order with file information
            await supplyOrdersModel.findByIdAndUpdate(
                newSupplyOrder._id,
                { $set: updatedFields },
                { new: true }
            );
        }

        // Fetch the complete supply order with any updates
        const completeSupplyOrder = await supplyOrdersModel.findById(newSupplyOrder._id);

        res.status(201).json({
            status: 'success',
            message: "تم إنشاء أمر التوريد بنجاح",
            data: completeSupplyOrder
        });

    } catch (error) {
        // Handle duplicate key error for supplyNumber
        if (error.code === 11000 && error.keyPattern.supplyNumber) {
            return next(new ApiError('رقم أمر التوريد موجود بالفعل', 400));
        }
        next(new ApiError(error.message, 500));
    }
});

exports.updateSupplyOrder = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const supplyOrder = await supplyOrdersModel.findById(id);

        if (!supplyOrder) {
            return next(new ApiError("أمر التوريد غير موجود", 404));
        }

        // Convert string boolean to actual boolean
        if (req.body.discountOnContracts) {
            req.body.discountOnContracts = req.body.discountOnContracts === 'true';
        }

        let updateFields = {};
        let changes = [];
        console.log(req.body);
        // Check if rawType is being changed to "حديد" or "اسمنت"
        if (req.body.rawType && ['حديد', 'اسمنت'].includes(req.body.rawType)) {
            console.log('here');
            // Reset fields when rawType is changed to حديد or اسمنت
            updateFields.customType = null;
            updateFields.numberOfItems = null;
            updateFields.itemDetails = [];

            changes.push(
                { field: 'customType', oldValue: supplyOrder.customType, newValue: null },
                { field: 'numberOfItems', oldValue: supplyOrder.numberOfItems, newValue: null },
                { field: 'itemDetails', oldValue: supplyOrder.itemDetails, newValue: [] }
            );
        }

        // Check if status is being changed and not to "تم التسوية" or "تم تسوية جزء"
        if (req.body.status && !['تم التسوية', 'تم تسوية جزء'].includes(req.body.status)) {
            // Reset settlementValue when status changes to something other than these values
            updateFields.settlementValue = null;
            changes.push({
                field: 'settlementValue',
                oldValue: supplyOrder.settlementValue,
                newValue: null
            });
        }

        // Track changes for regular fields
        const fieldsToCheck = [
            'projectId', 'customType', 'rawType', 'numberOfItems',
            'discountOnContracts', 'supplyNumber', 'supplyName',
            'supplyValue', 'settlementValue', 'status', 'price', 'quantity'
        ];

        fieldsToCheck.forEach(field => {
            if (req.body[field] !== undefined && !isEqual(req.body[field], supplyOrder[field])) {
                changes.push({
                    field,
                    oldValue: supplyOrder[field],
                    newValue: req.body[field]
                });
                updateFields[field] = req.body[field];
            }
        });

        // Handle itemDetails changes (only if rawType is "متنوع")
        if (req.body.itemDetails && (req.body.rawType === 'متنوع' || supplyOrder.rawType == 'متنوع')) {
            console.log('iam here');
            const oldItemDetails = supplyOrder.itemDetails || [];
            const newItemDetails = req.body.itemDetails;

            // Clean up and calculate totals for new itemDetails
            const processedItemDetails = newItemDetails.map(item => {
                if (item.descriptions && Array.isArray(item.descriptions)) {
                    item.descriptions = item.descriptions.map(desc => {
                        const quantity = parseFloat(desc.quantity) || 0;
                        const unitPrice = parseFloat(desc.unit) || 0;
                        desc.total = quantity * unitPrice;
                        return desc;
                    }).filter(desc =>
                        desc.category && desc.code && desc.quantity && desc.unit
                    );

                    // Remove duplicates
                    item.descriptions = item.descriptions.filter(
                        (desc, index, self) =>
                            index === self.findIndex(d =>
                                d.category === desc.category && d.code === desc.code
                            )
                    );
                }
                return item;
            });

            if (!isEqual(oldItemDetails, processedItemDetails)) {
                changes.push({
                    field: 'itemDetails',
                    oldValue: oldItemDetails,
                    newValue: processedItemDetails
                });
                updateFields.itemDetails = processedItemDetails;
            }
        }

        // Handle file uploads
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileName = file.originalname;
                const fileUrl = await saveFile(
                    file,
                    "supplyOrders",
                    id,
                    file.fieldname
                );

                // Delete old file if exists
                if (supplyOrder[file.fieldname]?.fileUrl) {
                    await deleteFile(supplyOrder[file.fieldname].fileUrl);
                }

                updateFields[file.fieldname] = {
                    fileName,
                    fileUrl
                };

                changes.push({
                    field: file.fieldname,
                    oldValue: supplyOrder[file.fieldname],
                    newValue: { fileName, fileUrl }
                });
            }
        }
        console.log('changes', changes);
        console.log('updateFields', updateFields);
        // Only update if there are changes
        if (changes.length > 0) {
            // Add update history
            updateFields.$push = {
                updateHistory: {
                    updatedBy: req.user._id,
                    updatedAt: new Date(),
                    changes: changes.map(change => ({
                        action: "تعديل",
                        field: change.field,
                        oldValue: change.oldValue,
                        newValue: change.newValue
                    }))
                }
            };

            const updatedSupplyOrder = await supplyOrdersModel.findByIdAndUpdate(
                id,
                updateFields,
                { new: true }
            );

            res.status(200).json({
                status: "success",
                message: "تم تحديث أمر التوريد بنجاح",
                data: updatedSupplyOrder
            });
        } else {
            res.status(200).json({
                status: "success",
                message: "لا يوجد تغييرات لحفظها",
                data: supplyOrder
            });
        }

    } catch (error) {
        // Handle duplicate key error for supplyNumber
        if (error.code === 11000 && error.keyPattern.supplyNumber) {
            return next(new ApiError('رقم أمر التوريد موجود بالفعل', 400));
        }
        next(new ApiError(error.message, 500));
    }
});


exports.getOneSupplyOrder = factory.getOne(supplyOrdersModel);
exports.getAllSupplyOrders = factory.getAll(supplyOrdersModel);
exports.softDeleteSupplyOrder = factory.softDeleteOne(supplyOrdersModel);
exports.recoverSupplyOrder = factory.recoverSoftDeletedOne(supplyOrdersModel);

