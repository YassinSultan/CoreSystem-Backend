const asyncHandler = require('express-async-handler');
const BaseMaterial = require('../models/baseMaterial');
const Tafwid = require('../models/tafwid');
const PolicySteel = require('../models/policySteel');
const policyCement = require('../models/policyCement');
const estimateModel = require('../models/estimateModel');
const projectModel = require('../models/projectModel');
const baseMaterialModel = require('../models/baseMaterial');
const supplyOrdersModel = require('../models/supplyOrdersModel');
const contractAssignmentsMaterials = require('../models/contractAssignmentsMaterials');
const abstractModel = require('../models/abstractModel');
const contractsModel = require('../models/contractsModel');

const ApiError = require('../utils/apiError');
const factory = require('../utils/crudUtils');
const { deleteFile, saveFile } = require('../utils/fileHandler');
const tafwid = require('../models/tafwid');
const { addToArray } = require('../utils/arrayHelpers');
const policySteel = require('../models/policySteel');
const baseMaterial = require('../models/baseMaterial');
const { isEqual } = require('lodash');
const { default: mongoose } = require('mongoose');

const createTafwidService = async (req) => {
    try {
        // Validate required fields
        if (!req.body.project || !req.body.type || !req.body.transactionType || !req.body.tafwidNumber) {
            throw new Error('Missing required fields');
        }

        // Create basic project
        const newTafwid = await tafwid.create({
            project: req.body.project,
            type: req.body.type,
            transactionType: req.body.transactionType,
            tafwidNumber: req.body.tafwidNumber,
            factoryName: req.body.factoryName,
            tafwidQuantity: req.body.tafwidQuantity,
            supplyOrder: req.body.supplyOrder,
            shippingCompany: req.body.shippingCompany,
            mawqfAlTafwid: req.body.mawqfAlTafwid,
            createdBy: req.user._id
        });

        // Handle officers if provided
        if (req.body.officers && Array.isArray(req.body.officers)) {
            const officerPromises = req.body.officers.map(officer =>
                addToArray(tafwid, newTafwid._id, "officers", {
                    officerName: officer.officerName
                })
            );
            await Promise.all(officerPromises);
        }

        // Handle file uploads if any
        const updatedFields = {};
        if (req.files && req.files.length > 0) {
            const fileUploadPromises = req.files.map(async (file) => {
                const fileName = file.originalname;
                const fileUrl = await saveFile(file, "materials", newTafwid._id.toString(), file.fieldname);
                updatedFields[file.fieldname] = {
                    fileName,
                    fileUrl
                };
            });

            await Promise.all(fileUploadPromises);
        }

        // Update the document with file information
        const updatedTafwid = await tafwid.findByIdAndUpdate(
            newTafwid._id,
            { $set: updatedFields },
            { new: true }
        ).lean();

        return {
            status: 'success',
            message: "تم إنشاء تفاويض الحديد بنجاح",
            data: updatedTafwid
        };
    } catch (error) {
        console.error('Error in createTafwidService:', error);
        return {
            status: 'error',
            message: error.message || 'حدث خطأ أثناء إنشاء تفاويض الحديد',
            data: null
        };
    }
};


const createIronPolicyService = async (req) => {
    try {
        // Validate required fields
        if (!req.body.project || !req.body.type || !req.body.transactionType) {
            throw new Error('Missing required fields');
        }
        // Create basic project
        const newPolicySteel = await policySteel.create({
            project: req.body.project,
            type: req.body.type,
            transactionType: req.body.transactionType,
            policyNumber: req.body.policyNumber,
            policyDate: req.body.policyDate,
            totalQuantity: req.body.totalQuantity,
            officer: req.body.officer,
            tafwid: req.body.tafwid,
            createdBy: req.user._id
        });

        const updatedFields = {};
        const files = req.files || [];

        // Handle items if provided
        if (req.body.items && Array.isArray(req.body.items)) {
            const itemsPromises = req.body.items.map(async (item, index) => {
                const targetFile = files.find(file => file.fieldname === `items[${index}][companyRecieveFile]`);
                const itemData = {
                    receivingCompany: item.receivingCompany,
                    steelDiameter: item.steelDiameter,
                    quantityPerDiameter: item.quantityPerDiameter
                };

                if (targetFile) {
                    itemData.companyRecieveFile = {
                        fileName: targetFile.originalname,
                        fileUrl: await saveFile(targetFile, "materials", newPolicySteel._id.toString(), targetFile.fieldname)
                    };
                }

                await policySteel.findByIdAndUpdate(
                    newPolicySteel._id,
                    { $push: { items: itemData } },
                    { new: true }
                );
            });
            await Promise.all(itemsPromises);
        }

        // Handle other file uploads if any
        if (files.length > 0) {
            const fileUploadPromises = files.map(async (file) => {
                // Skip files already processed in items
                if (!file.fieldname.startsWith('items[')) {
                    const fileName = file.originalname;
                    const fileUrl = await saveFile(file, "materials", newPolicySteel._id.toString(), file.fieldname);
                    updatedFields[file.fieldname] = {
                        fileName,
                        fileUrl
                    };
                }
            });

            await Promise.all(fileUploadPromises);
        }

        // Update the document with file information
        const updatedPolicy = await policySteel.findByIdAndUpdate(
            newPolicySteel._id,
            { $set: updatedFields },
            { new: true }
        ).lean();

        return {
            status: 'success',
            message: "تم إنشاء بلايص الحديد بنجاح",
            data: updatedPolicy
        };
    } catch (error) {
        console.error('Error in createIronPolicyService:', error);
        return {
            status: 'error',
            message: error.message || 'حدث خطأ أثناء إنشاء بلايص الحديد',
            data: null
        };
    }
};

const createCementPolicyService = async (req) => {
    try {
        // Validate required fields
        if (!req.body.project || !req.body.type || !req.body.transactionType) {
            throw new Error('Missing required fields');
        }
        // Create basic project
        const newPolicyCement = await policyCement.create({
            project: req.body.project,
            type: req.body.type,
            transactionType: req.body.transactionType,
            policyNumber: req.body.policyNumber,
            policyDate: req.body.policyDate,
            company: req.body.company,
            cementType: req.body.cementType,
            cementGrade: req.body.cementGrade,
            quantity: req.body.quantity,
            recievedName: req.body.recievedName,
            createdBy: req.user._id
        });

        const updatedFields = {};
        const files = req.files || [];

        // Handle files uploads if any
        if (files.length > 0) {
            const fileUploadPromises = files.map(async (file) => {
                const fileName = file.originalname;
                const fileUrl = await saveFile(file, "materials", newPolicyCement._id.toString(), file.fieldname);
                updatedFields[file.fieldname] = {
                    fileName,
                    fileUrl
                };

            });

            await Promise.all(fileUploadPromises);
        }

        // Update the document with file information
        const updatedPolicy = await policyCement.findByIdAndUpdate(
            newPolicyCement._id,
            { $set: updatedFields },
            { new: true }
        ).lean();

        return {
            status: 'success',
            message: "تم إنشاء بلايص الاسمنت بنجاح",
            data: updatedPolicy
        };
    } catch (error) {
        console.error('Error in createIronPolicyService:', error);
        return {
            status: 'error',
            message: error.message || 'حدث خطأ أثناء إنشاء بلايص الاسمنت',
            data: null
        };
    }
    const {
        project,
        type,
        transactionType,
        cementGrade,
        cementType,
        company,
        policyDate,
        policyNumber,
        quantity,
        recievedName,
    } = req.body;

    // Validate required fields
    if (!project || !type || !transactionType || !cementGrade || !cementType) {
        throw new ApiError('Missing required fields', 400);
    }

    // Process policy file
    let policyFileData = null;
    const policyFile = files?.find(f => f.fieldname === 'policyFile');

    if (policyFile) {
        try {
            const fileUrl = await saveFile(
                policyFile,
                "Materials",
                policyNumber.toString(),
                policyFile.fieldname
            );
            policyFileData = {
                fileName: policyFile.originalname,
                fileUrl,
            };
        } catch (err) {
            throw new ApiError('Failed to upload policy file', 500);
        }
    }
    let companyRecieveData = null;
    const companyRecieveFile = files?.find(f => f.fieldname === 'companyRecieveFile');

    if (companyRecieveFile) {
        try {
            const fileUrl = await saveFile(
                companyRecieveFile,
                "policy",
                policyNumber.toString(),
                policyFile.fieldname
            );
            companyRecieveData = {
                fileName: companyRecieveFile.originalname,
                fileUrl,
            };
        } catch (err) {
            throw new ApiError('Failed to upload policy file', 500);
        }
    }

    // Create and save policy
    try {
        const newPolicy = new policyCement({
            project,
            type,
            transactionType,
            cementGrade,
            cementType,
            company,
            companyRecieveFile: companyRecieveData,
            policyDate,
            policyFile: policyFileData,
            policyNumber,
            quantity,
            recievedName,
        });

        const savedPolicy = await newPolicy.save();
        return {
            status: 'success',
            message: "تم إنشاء بوليصة الاسمنت بنجاح",
            data: savedPolicy
        };
    } catch (err) {
        if (err.code === 11000) {
            throw new ApiError('Policy number already exists', 400);
        }
        throw new ApiError('Failed to create policy', 500);
    }
};
const createContractAssignmentsService = async (req) => {
    try {
        // Validate required fields
        if (!req.body.project || !req.body.type || !req.body.transactionType) {
            throw new Error('Missing required fields');
        }
        // Create basic project
        const newContractAssignments = await contractAssignmentsMaterials.create({
            project: req.body.project,
            type: req.body.type,
            transactionType: req.body.transactionType,
            estimate: req.body.estimate,
            allocatedQuantity: req.body.allocatedQuantity,
            disbursedQuantity: req.body.disbursedQuantity,
            discountedQuantityOnTheContract: req.body.discountedQuantityOnTheContract,
            createdBy: req.user._id
        });

        return {
            status: 'success',
            message: "تم إنشاء تسكين على العقود بنجاح",
            data: newContractAssignments
        };
    } catch (error) {
        return {
            status: 'error',
            message: error.message || 'حدث خطأ أثناء إنشاء بلايص الاسمنت',
            data: null
        };
    }
};

exports.createMaterial = asyncHandler(async (req, res, next) => {
    console.log(req.body);
    console.log(req.files);
    try {
        if (!req.body.type || !req.body.transactionType) {
            return next(new ApiError('Type and transactionType are required', 400));
        }

        let result;
        if (req.body.type === "حديد" && req.body.transactionType === "تفاويض") {
            result = await createTafwidService(req);
        } else if (req.body.type === "حديد" && req.body.transactionType === "بلايص") {
            result = await createIronPolicyService(req);
        } else if (req.body.type === "اسمنت" && req.body.transactionType === "بلايص") {
            result = await createCementPolicyService(req);
        } else if (req.body.transactionType === "تسكين على عقود") {
            result = await createContractAssignmentsService(req);
        }

        res.status(201).json(result);
    } catch (error) {
        next(error instanceof ApiError ? error : new ApiError(error.message, 500));
    }
});
exports.updateMaterial = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;

        // First determine what type of material we're updating
        const existingMaterial = await baseMaterial.findById(id);
        if (!existingMaterial) {
            return next(new ApiError("الخام غير موجود", 404));
        }

        const { type, transactionType } = existingMaterial;
        let result;

        // Route to appropriate update handler
        if (type === "حديد" && transactionType === "تفاويض") {
            result = await updateTafwidService(id, req);
        } else if (type === "حديد" && transactionType === "بلايص") {
            result = await updateIronPolicyService(id, req);
        } else if (type === "اسمنت" && transactionType === "بلايص") {
            result = await updateCementPolicyService(id, req);
        } else {
            return next(new ApiError('Not implemented for this type/transaction', 501));
        }

        res.status(200).json(result);
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});


// Service functions for each material type
const updateTafwidService = async (id, req) => {
    let updateFields = {};
    let changes = [];
    const existingTafwid = await Tafwid.findById(id);

    // Handle regular fields
    for (const [field, value] of Object.entries(req.body)) {
        if (field === 'updateHistory' || field.startsWith('$')) continue;

        if (!isEqual(existingTafwid[field], value)) {
            changes.push({
                field,
                oldValue: existingTafwid[field],
                newValue: value
            });
            updateFields[field] = value;
        }
    }

    // Handle officers array updates
    if (req.body.officers) {
        updateFields.officers = req.body.officers;
    }

    // Handle file uploads
    if (req.files?.length) {
        for (const file of req.files) {
            const fileUrl = await saveFile(file, "materials", id, file.fieldname);

            if (existingTafwid[file.fieldname]?.fileUrl) {
                await deleteFile(existingTafwid[file.fieldname].fileUrl);
            }

            updateFields[file.fieldname] = {
                fileName: file.originalname,
                fileUrl
            };
        }
    }

    // Add update history if changes exist
    if (changes.length > 0 || req.files?.length) {
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
    }

    const updatedTafwid = await Tafwid.findByIdAndUpdate(
        id,
        updateFields,
        { new: true }
    );

    return {
        status: "success",
        message: "تم تحديث تفاويض الحديد بنجاح",
        data: updatedTafwid
    };
};

const updateIronPolicyService = async (id, req) => {
    let updateFields = {};
    let changes = [];
    const existingPolicy = await PolicySteel.findById(id);

    // Handle root level fields
    for (const [field, value] of Object.entries(req.body)) {
        if (field === 'items' || field === 'updateHistory' || field.startsWith('$')) continue;

        if (!isEqual(existingPolicy[field], value)) {
            changes.push({
                field,
                oldValue: existingPolicy[field],
                newValue: value
            });
            updateFields[field] = value;
        }
    }

    // Handle items array updates
    if (req.body.items) {
        // First clear existing items
        await PolicySteel.findByIdAndUpdate(id, { $set: { items: [] } });

        // Then add new items
        const itemsWithFiles = await Promise.all(
            req.body.items.map(async (item, index) => {
                const itemData = { ...item };
                const fileField = `items[${index}][companyRecieveFile]`;
                const file = req.files?.find(f => f.fieldname === fileField);

                if (file) {
                    const fileUrl = await saveFile(file, "materials", id, fileField);
                    itemData.companyRecieveFile = {
                        fileName: file.originalname,
                        fileUrl
                    };
                }
                return itemData;
            })
        );

        updateFields.items = itemsWithFiles;
    }

    // Handle other file uploads
    if (req.files?.length) {
        for (const file of req.files) {
            if (!file.fieldname.startsWith('items[')) {
                const fileUrl = await saveFile(file, "materials", id, file.fieldname);

                if (existingPolicy[file.fieldname]?.fileUrl) {
                    await deleteFile(existingPolicy[file.fieldname].fileUrl);
                }

                updateFields[file.fieldname] = {
                    fileName: file.originalname,
                    fileUrl
                };
            }
        }
    }

    // Add update history if changes exist
    if (changes.length > 0 || req.files?.length || req.body.items) {
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
    }

    const updatedPolicy = await PolicySteel.findByIdAndUpdate(
        id,
        updateFields,
        { new: true }
    );

    return {
        status: "success",
        message: "تم تحديث بوليصة الحديد بنجاح",
        data: updatedPolicy
    };
};

const updateCementPolicyService = async (id, req) => {
    let updateFields = {};
    let changes = [];
    const existingPolicy = await policyCement.findById(id);

    // Handle regular fields
    for (const [field, value] of Object.entries(req.body)) {
        if (field === 'updateHistory' || field.startsWith('$')) continue;

        if (!isEqual(existingPolicy[field], value)) {
            changes.push({
                field,
                oldValue: existingPolicy[field],
                newValue: value
            });
            updateFields[field] = value;
        }
    }

    // Handle file uploads
    if (req.files?.length) {
        for (const file of req.files) {
            const fileUrl = await saveFile(file, "materials", id, file.fieldname);

            if (existingPolicy[file.fieldname]?.fileUrl) {
                await deleteFile(existingPolicy[file.fieldname].fileUrl);
            }

            updateFields[file.fieldname] = {
                fileName: file.originalname,
                fileUrl
            };
        }
    }

    // Add update history if changes exist
    if (changes.length > 0 || req.files?.length) {
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
    }

    const updatedPolicy = await policyCement.findByIdAndUpdate(
        id,
        updateFields,
        { new: true }
    );

    return {
        status: "success",
        message: "تم تحديث بوليصة الاسمنت بنجاح",
        data: updatedPolicy
    };
};


exports.getAllMaterial = factory.getAll(BaseMaterial);
exports.getOneMaterial = factory.getOne(BaseMaterial);
exports.softDeleteMaterial = factory.softDeleteOne(BaseMaterial);
exports.recoverMaterial = factory.recoverSoftDeletedOne(BaseMaterial);


exports.contractAssignmentOperators = asyncHandler(async (req, res, next) => {
    try {
        const { project, estimate, type, allocatedQuantity } = req.body;
        // Validate required fields
        console.log(estimate);
        if (!project || !estimate || !type) {
            return next(new ApiError('يجب توفير معرف المشروع، معرف المقايسة والنوع', 400));
        }

        // Run both queries in parallel for better performance
        const [currentEstimate, currentProject] = await Promise.all([
            estimateModel.findById(estimate).lean(),
            projectModel.findById(project).lean()
        ]);

        if (!currentEstimate) {
            return next(new ApiError('المقايسة غير موجودة', 404));
        }
        if (!currentProject) {
            return next(new ApiError('المشروع غير موجود', 404));
        }

        // Initialize result object
        const result = {
            disbursedQuantity: 0,
            quantityAllocatedToEachContract: 0,
            unallocatedQuantities: 0,
            discountedQuantityOnTheContract: 0,
            remainingAmountOnTheContract: 0,
            totalUnspentAmountsInTheContract: 0,
            totalUndiscountedValue: 0
        };

        if (type === "حديد") {
            // Optimized query for steel materials
            const policySteelMaterials = await baseMaterialModel.find({
                project,
                type: 'حديد',
                transactionType: 'بلايص',
            })
                .select('items')
                .populate({
                    path: 'items.receivingCompany',
                    select: '_id'
                })
                .lean();

            // Calculate disbursed quantity
            result.disbursedQuantity = policySteelMaterials.reduce((total, material) => {
                return total + material.items.reduce((sum, item) => {
                    if (item.receivingCompany?._id?.toString() === currentEstimate.company?.toString()) {
                        return sum + (item.quantityPerDiameter || 0);
                    }
                    return sum;
                }, 0);
            }, 0);

        } else {
            // For other material types
            const rawType = type;

            // First try to find supply orders with matching rawType
            let supplyOrders = await supplyOrdersModel.find({
                project,
                rawType,
                isDeleted: false
            })
                .select('itemDetails')
                .lean();

            // If none found, try with customType
            if (supplyOrders.length === 0) {
                const customTypeOrders = await supplyOrdersModel.find({
                    project,
                    rawType: "متنوع",
                    customType: rawType,
                    isDeleted: false
                })
                    .select('itemDetails')
                    .lean();

                supplyOrders = supplyOrders.concat(customTypeOrders);
            }

            // Calculate disbursed quantity from supply orders
            result.disbursedQuantity = supplyOrders.reduce((total, order) => {
                return total + order.itemDetails.reduce((sum, item) => {
                    return sum + (item.descriptions?.reduce((descSum, desc) => {
                        return descSum + (desc.total || 0);
                    }, 0) || 0);
                }, 0);
            }, 0);
        }

        const contractAssignments = await contractAssignmentsMaterials.find({
            type,
            transactionType: "تسكين على عقود",
            estimate,
            project
        });
        result.quantityAllocatedToEachContract = contractAssignments.reduce((total, material) => {
            return total + material.allocatedQuantity || 0;
        }, 0);

        result.quantityAllocatedToEachContract += Number(allocatedQuantity);

        result.unallocatedQuantities = (result.quantityAllocatedToEachContract - result.disbursedQuantity);

        const abstracts = await abstractModel.find({
            estimate,
        });
        result.discountedQuantityOnTheContract = abstracts.reduce((total, abstract) => {
            if (type == "حديد")
                return total + abstract.steelTotal || 0;
            else if (type == "اسمنت")
                return total + abstract.cementTotal || 0;
            else
                return 0;
        }, 0);
        result.remainingAmountOnTheContract = (result.discountedQuantityOnTheContract - allocatedQuantity);

        const contract = await contractsModel.findOne({ estimate }).sort({ createdAt: -1 });
        const latestAbstract = await abstractModel.findOne({ estimate }).sort({ createdAt: -1 });
        if (contract && contract.contract_value) {
            result.totalUnspentAmountsInTheContract = (
                contract.contract_value - latestAbstract.amount
            );
        } else {
            result.totalUnspentAmountsInTheContract = (
                currentEstimate.contractValue - latestAbstract.amount
            );
        }
        if (type == "حديد") {
            result.totalUndiscountedValue = (
                currentEstimate.ironPrice * result.remainingAmountOnTheContract
            );
        } else if (type == "اسمنت") {
            result.totalUndiscountedValue = (
                currentEstimate.cementPrice * result.remainingAmountOnTheContract
            );
        }
        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in contractAssignmentOperators:', error);
        return next(new ApiError('حدث خطأ أثناء الحساب', 500));
    }
});
