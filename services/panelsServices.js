const asyncHandler = require('express-async-handler');
const panelsModel = require('../models/panelsModel');
const ApiError = require('../utils/apiError');
const factory = require('../utils/crudUtils');
const { saveFile } = require('../utils/fileHandler');


exports.createPanel = asyncHandler(async (req, res, next) => {
    console.log("body", req.body);
    console.log("files", req.files);

    // Validate required fields
    const requiredFields = ['project', 'itemsCount'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return next(new ApiError(`الحقل ${field} مطلوب`, 400));
        }
    }

    // Parse the items from the request body
    const v1 = req.body.v1 || [];
    if (v1.length === 0) {
        return next(new ApiError('يجب إضافة عناصر على الأقل', 400));
    }

    // Create the panel document first to get its ID
    const panelData = {
        project: req.body.project,
        itemsCount: req.body.itemsCount,
        v1: []
    };

    const panel = await panelsModel.create(panelData);

    // Process files and update the panel
    try {
        const v1Items = [];

        // Process each item
        for (let i = 0; i < v1.length; i++) {
            const item = v1[i];
            const itemTitle = item.title;
            const itemCount = item.count;

            // Find all files for this item
            const itemFiles = req.files.filter(file =>
                file.fieldname.startsWith(`v1[${i}][files]`)
            );

            // Prepare files array
            const files = [];

            // Process each file pair (scan and zip)
            const fileGroups = {};
            itemFiles.forEach(file => {
                const match = file.fieldname.match(/v1\[(\d+)\]\[files]\[(\d+)\]\[(\w+)\]/);
                if (match) {
                    const itemIndex = match[1];
                    const fileIndex = match[2];
                    const fileType = match[3]; // 'scan' or 'zip'

                    if (!fileGroups[fileIndex]) {
                        fileGroups[fileIndex] = {};
                    }
                    fileGroups[fileIndex][fileType] = file;
                }
            });

            // Process each file group
            for (const groupIndex in fileGroups) {
                const group = fileGroups[groupIndex];
                const fileEntry = {};

                // Process scan file if exists
                if (group.scan) {
                    const scanUrl = await saveFile(
                        group.scan,
                        "panels",
                        panel._id.toString(),
                        `v1/${itemTitle}/scan`
                    );
                    fileEntry.scan = {
                        fileName: decodeURIComponent(group.scan.originalname),
                        fileUrl: scanUrl
                    };
                }

                // Process zip file if exists
                if (group.zip) {
                    const zipUrl = await saveFile(
                        group.zip,
                        "panels",
                        panel._id.toString(),
                        `v1/${itemTitle}/zip`
                    );
                    fileEntry.zip = {
                        fileName: decodeURIComponent(group.zip.originalname),
                        fileUrl: zipUrl
                    };
                }

                if (Object.keys(fileEntry).length > 0) {
                    files.push(fileEntry);
                }
            }

            // Add the item to v1 array
            v1Items.push({
                title: itemTitle,
                count: itemCount,
                files: files
            });
        }

        // Update the panel with the processed files
        panel.v1 = v1Items;
        await panel.save();

        res.status(201).json({
            status: 'success',
            message: "تم إنشاء اللوحات بنجاح",
            data: panel
        });

    } catch (error) {
        // Clean up the panel if there was an error
        await panelsModel.findByIdAndDelete(panel._id);
        next(new ApiError(error.message, 500));
    }
});

exports.updatePanelV2 = asyncHandler(async (req, res, next) => {
    console.log("body", req.body);
    console.log("files", req.files);
    const { id } = req.params;
    // 1. Check if panel exists
    const panel = await panelsModel.findById(id);
    if (!panel) {
        return next(new ApiError('لوحة غير موجودة', 404));
    }

    // 2. Validate if V2 already exists
    if (panel.v2 && panel.v2.length > 0) {
        return next(new ApiError('إصدار V2 موجود بالفعل', 400));
    }

    // 3. Parse the items from the request body
    const v2 = req.body.v2 || [];
    if (v2.length === 0) {
        return next(new ApiError('يجب إضافة عناصر على الأقل', 400));
    }

    try {
        const v2Items = [];

        // Process each item
        for (let i = 0; i < v2.length; i++) {
            const item = v2[i];
            const itemTitle = item.title;
            const itemCount = item.count;

            // Find all files for this item
            const itemFiles = req.files.filter(file =>
                file.fieldname.startsWith(`v2[${i}][files]`)
            );

            // Prepare files array
            const files = [];

            // Process each file pair (scan and zip)
            const fileGroups = {};
            itemFiles.forEach(file => {
                const match = file.fieldname.match(/v2\[(\d+)\]\[files]\[(\d+)\]\[(\w+)\]/);
                if (match) {
                    const itemIndex = match[1];
                    const fileIndex = match[2];
                    const fileType = match[3]; // 'scan' or 'zip'

                    if (!fileGroups[fileIndex]) {
                        fileGroups[fileIndex] = {};
                    }
                    fileGroups[fileIndex][fileType] = file;
                }
            });

            // Process each file group
            for (const groupIndex in fileGroups) {
                const group = fileGroups[groupIndex];
                const fileEntry = {};

                // Process scan file if exists
                if (group.scan) {
                    const scanUrl = await saveFile(
                        group.scan,
                        "panels",
                        panel._id.toString(),
                        `v2/${itemTitle}/scan`
                    );
                    fileEntry.scan = {
                        fileName: decodeURIComponent(group.scan.originalname),
                        fileUrl: scanUrl
                    };
                }

                // Process zip file if exists
                if (group.zip) {
                    const zipUrl = await saveFile(
                        group.zip,
                        "panels",
                        panel._id.toString(),
                        `v2/${itemTitle}/zip`
                    );
                    fileEntry.zip = {
                        fileName: decodeURIComponent(group.zip.originalname),
                        fileUrl: zipUrl
                    };
                }

                if (Object.keys(fileEntry).length > 0) {
                    files.push(fileEntry);
                }
            }

            // Add the item to v2 array (without count as per your schema)
            v2Items.push({
                title: itemTitle,
                count: itemCount,
                files: files
            });
        }

        // Update the panel with V2 data
        panel.v2 = v2Items;

        // Update history
        panel.updateHistory.push({
            updatedBy: req.user._id,
            updatedAt: Date.now(),
            changes: [{
                action: "اضافة",
                field: "v2",
                oldValue: null,
                newValue: v2Items
            }]
        });

        await panel.save();

        res.status(200).json({
            status: 'success',
            message: "تم تحديث اللوحة بإصدار V2 بنجاح",
            data: panel
        });

    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});
exports.updatePanel = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // 1. Check if panel exists
    const panel = await panelsModel.findById(id);
    if (!panel) {
        return next(new ApiError('لوحة غير موجودة', 404));
    }

    // 2. Initialize changes array for history tracking
    const changes = [];
    const updateData = {};

    // 3. Process basic fields (project, itemsCount)
    if (req.body.project && req.body.project !== panel.project.toString()) {
        changes.push({
            action: "تعديل",
            field: "project",
            oldValue: panel.project,
            newValue: req.body.project
        });
        updateData.project = req.body.project;
    }

    if (req.body.itemsCount && req.body.itemsCount !== panel.itemsCount) {
        changes.push({
            action: "تعديل",
            field: "itemsCount",
            oldValue: panel.itemsCount,
            newValue: req.body.itemsCount
        });
        updateData.itemsCount = req.body.itemsCount;
    }

    // 4. Process v1 updates if provided
    if (req.body.v1) {
        const v1Changes = [];
        const updatedV1 = [];

        for (let i = 0; i < req.body.v1.length; i++) {
            const newItem = req.body.v1[i];
            const oldItem = panel.v1[i] || {};

            // Check if item exists in the panel
            if (i >= panel.v1.length) {
                // New item being added
                v1Changes.push({
                    action: "اضافة",
                    field: `v1[${i}]`,
                    oldValue: null,
                    newValue: newItem
                });
                updatedV1.push(newItem);
                continue;
            }

            // Compare title
            if (newItem.title !== oldItem.title) {
                v1Changes.push({
                    action: "تعديل",
                    field: `v1[${i}].title`,
                    oldValue: oldItem.title,
                    newValue: newItem.title
                });
            }

            // Compare count
            if (newItem.count !== oldItem.count) {
                v1Changes.push({
                    action: "تعديل",
                    field: `v1[${i}].count`,
                    oldValue: oldItem.count,
                    newValue: newItem.count
                });
            }

            // Process files if provided
            if (newItem.files) {
                const fileChanges = [];
                const updatedFiles = [];

                for (let j = 0; j < newItem.files.length; j++) {
                    const newFile = newItem.files[j];
                    const oldFile = oldItem.files[j] || {};

                    // Compare scan file
                    if (newFile.scan && (!oldFile.scan || newFile.scan.fileUrl !== oldFile.scan.fileUrl)) {
                        fileChanges.push({
                            action: oldFile.scan ? "تعديل" : "اضافة",
                            field: `v1[${i}].files[${j}].scan`,
                            oldValue: oldFile.scan,
                            newValue: newFile.scan
                        });
                    }

                    // Compare zip file
                    if (newFile.zip && (!oldFile.zip || newFile.zip.fileUrl !== oldFile.zip.fileUrl)) {
                        fileChanges.push({
                            action: oldFile.zip ? "تعديل" : "اضافة",
                            field: `v1[${i}].files[${j}].zip`,
                            oldValue: oldFile.zip,
                            newValue: newFile.zip
                        });
                    }

                    updatedFiles.push(newFile);
                }

                if (fileChanges.length > 0) {
                    v1Changes.push(...fileChanges);
                }
                newItem.files = updatedFiles;
            }

            updatedV1.push(newItem);
        }

        if (v1Changes.length > 0) {
            changes.push(...v1Changes);
            updateData.v1 = updatedV1;
        }
    }

    // 5. Process v2 updates if provided
    if (req.body.v2) {
        const v2Changes = [];
        const updatedV2 = [];

        for (let i = 0; i < req.body.v2.length; i++) {
            const newItem = req.body.v2[i];
            const oldItem = panel.v2[i] || {};

            // Check if item exists in the panel
            if (i >= panel.v2.length) {
                // New item being added
                v2Changes.push({
                    action: "اضافة",
                    field: `v2[${i}]`,
                    oldValue: null,
                    newValue: newItem
                });
                updatedV2.push(newItem);
                continue;
            }

            // Compare title
            if (newItem.title !== oldItem.title) {
                v2Changes.push({
                    action: "تعديل",
                    field: `v2[${i}].title`,
                    oldValue: oldItem.title,
                    newValue: newItem.title
                });
            }

            // Compare count if exists
            if (newItem.count !== undefined && newItem.count !== oldItem.count) {
                v2Changes.push({
                    action: "تعديل",
                    field: `v2[${i}].count`,
                    oldValue: oldItem.count,
                    newValue: newItem.count
                });
            }

            // Process files if provided
            if (newItem.files) {
                const fileChanges = [];
                const updatedFiles = [];

                for (let j = 0; j < newItem.files.length; j++) {
                    const newFile = newItem.files[j];
                    const oldFile = oldItem.files[j] || {};

                    // Compare scan file
                    if (newFile.scan && (!oldFile.scan || newFile.scan.fileUrl !== oldFile.scan.fileUrl)) {
                        fileChanges.push({
                            action: oldFile.scan ? "تعديل" : "اضافة",
                            field: `v2[${i}].files[${j}].scan`,
                            oldValue: oldFile.scan,
                            newValue: newFile.scan
                        });
                    }

                    // Compare zip file
                    if (newFile.zip && (!oldFile.zip || newFile.zip.fileUrl !== oldFile.zip.fileUrl)) {
                        fileChanges.push({
                            action: oldFile.zip ? "تعديل" : "اضافة",
                            field: `v2[${i}].files[${j}].zip`,
                            oldValue: oldFile.zip,
                            newValue: newFile.zip
                        });
                    }

                    updatedFiles.push(newFile);
                }

                if (fileChanges.length > 0) {
                    v2Changes.push(...fileChanges);
                }
                newItem.files = updatedFiles;
            }

            updatedV2.push(newItem);
        }

        if (v2Changes.length > 0) {
            changes.push(...v2Changes);
            updateData.v2 = updatedV2;
        }
    }

    // 6. Process isDeleted if provided
    if (req.body.isDeleted !== undefined && req.body.isDeleted !== panel.isDeleted) {
        changes.push({
            action: "تعديل",
            field: "isDeleted",
            oldValue: panel.isDeleted,
            newValue: req.body.isDeleted
        });
        updateData.isDeleted = req.body.isDeleted;

        if (req.body.isDeleted) {
            updateData.deletedBy = req.user._id;
            updateData.deletedAt = new Date();
        } else {
            updateData.deletedBy = null;
            updateData.deletedAt = null;
        }
    }

    // 7. If no changes detected
    if (changes.length === 0) {
        return res.status(200).json({
            status: 'success',
            message: "لا يوجد تغييرات لتحديثها",
            data: panel
        });
    }

    // 8. Update the panel
    try {
        // Add update history
        updateData.$push = {
            updateHistory: {
                updatedBy: req.user._id,
                updatedAt: new Date(),
                changes: changes
            }
        };

        const updatedPanel = await panelsModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            message: "تم تحديث اللوحة بنجاح",
            data: updatedPanel
        });

    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});
exports.getOnePanel = factory.getOne(panelsModel);
exports.getAllPanels = factory.getAll(panelsModel);
exports.softDeletePanel = factory.softDeleteOne(panelsModel);
exports.recoverPanel = factory.recoverSoftDeletedOne(panelsModel);