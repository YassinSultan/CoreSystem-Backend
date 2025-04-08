const asyncHandler = require('express-async-handler');
const projectModel = require('../models/projectModel'); // تصحيح الاستيراد
const factory = require('../utils/crudUtils');
const { deleteFile, saveFile } = require('../utils/fileHandler');
const { forEach } = require('lodash');
const { addToArray, removeFromArray } = require('../utils/arrayHelpers');
const { request } = require('express');
const ApiError = require('../utils/apiError');
const Project = require('../models/projectModel');
const mongoose = require('mongoose');

/**
 * @description Create project
 * @route /api/v1/project
 * @method POST
 * @access create project 
 */
exports.createProject = asyncHandler(async (req, res, next) => {
    // Validate required fields
    const requiredFields = ['name', 'contracting_authority', 'status'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return next(new ApiError(`الحقل ${field} مطلوب`, 400));
        }
    }

    try {
        // Create basic project
        const newProject = await projectModel.create({
            name: req.body.name,
            contracting_authority: req.body.contracting_authority,
            status: req.body.status,
            location: req.body.location || null,
            start_date: req.body.start_date || null,
            protocols: [],
            project_financials: [],
            createdBy: req.user._id
        });

        // Handle protocols for civil authority
        if (req.body.contracting_authority === 'جهة مدنية') {
            // Process protocols if they exist
            if (req.body.protocols && Array.isArray(req.body.protocols)) {
                for (const [index, protocol] of req.body.protocols.entries()) {
                    const protocol_file = req.files?.find(file =>
                        file.fieldname === `protocols[${index}][file]`
                    );

                    let newFileUrl = null;
                    if (protocol_file) {
                        newFileUrl = await saveFile(
                            protocol_file,
                            "projects",
                            newProject._id.toString(),
                            "protocols"
                        );
                    }

                    await addToArray(projectModel, newProject._id, "protocols", {
                        value: protocol.value,
                        file: newFileUrl ? {
                            fileName: protocol_file.originalname,
                            fileUrl: newFileUrl
                        } : null,
                        registration_date: protocol.date || new Date()
                    });
                }
            }

            // Process entity name if provided
            if (req.body.entity_name) {
                newProject.entity_name = req.body.entity_name;
            }

            // Process estimated budget file if exists
            const estimated_budget_file = req.files?.find(file => file.fieldname === "estimated_budget_file");
            if (estimated_budget_file) {
                const fileUrl = await saveFile(
                    estimated_budget_file,
                    "projects",
                    newProject._id.toString(),
                    "estimated_budget_file"
                );
                newProject.estimated_budget_file = {
                    fileName: estimated_budget_file.originalname,
                    fileUrl: fileUrl
                };
            }
        }
        // Handle financials for non-civil authority
        else {
            // Process financials if they exist
            if (req.body.project_financials && Array.isArray(req.body.project_financials)) {
                for (const [index, financial] of req.body.project_financials.entries()) {
                    const financial_file = req.files?.find(file =>
                        file.fieldname === `project_financials[${index}][file]`
                    );

                    let newFileUrl = null;
                    if (financial_file) {
                        newFileUrl = await saveFile(
                            financial_file,
                            "projects",
                            newProject._id.toString(),
                            "project_financials"
                        );
                    }

                    await addToArray(projectModel, newProject._id, "project_financials", {
                        value: financial.value,
                        file: newFileUrl ? {
                            fileName: financial_file.originalname,
                            fileUrl: newFileUrl
                        } : null,
                        registration_date: financial.date || new Date()
                    });
                }
            }

            // Process trust approval file if exists
            const trust_approval_file = req.files?.find(file => file.fieldname === "trust_approval_file");
            if (trust_approval_file) {
                const fileUrl = await saveFile(
                    trust_approval_file,
                    "projects",
                    newProject._id.toString(),
                    "trust_approval_file"
                );
                newProject.trust_approval_file = {
                    fileName: trust_approval_file.originalname,
                    fileUrl: fileUrl
                };
            }
        }

        // Process site receipt file if exists
        const site_receipt_file = req.files?.find(file => file.fieldname === "site_receipt_file");
        if (site_receipt_file) {
            const fileUrl = await saveFile(
                site_receipt_file,
                "projects",
                newProject._id.toString(),
                "site_receipt_file"
            );
            newProject.site_receipt_file = {
                fileName: site_receipt_file.originalname,
                fileUrl: fileUrl
            };
        }

        // Save all changes to the project
        await newProject.save();

        // Get the updated project with all relations
        const updatedProject = await projectModel.findById(newProject._id).populate('createdBy');

        res.status(201).json({
            status: 'success',
            message: "تم إنشاء المشروع بنجاح",
            data: updatedProject
        });

    } catch (error) {
        console.error('Error creating project:', error);
        return next(new ApiError('حدث خطأ أثناء إنشاء المشروع', 500));
    }
});

/**
 * @description Edit/Add projects videos
 * @route /api/v1/project/:id/videos
 * @method PUT
 * @access edit_project_videos
 */
exports.updateProjectVideos = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const project = await projectModel.findById(id);

    if (!project) {
        return next(new ApiError('لا يوجد هذا المشروع', 404));
    }

    const userId = req.user.id; // Assuming user info is available in req.user
    const changes = []; // لتخزين التعديلات

    // Helper function to handle file updates
    const handleFileUpdate = async (fileField, fileType) => {
        if (req.files && req.files[fileField]) {
            try {
                const file = req.files[fileField][0];
                const newFileUrl = await saveFile(file, "projects", id, fileType);
                const oldFile = project[fileField];

                project[fileField] = {
                    fileUrl: newFileUrl,
                    fileName: file.originalname
                };

                console.log(`📂 تم رفع ملف جديد لـ ${fileField}: ${newFileUrl}`);

                changes.push({
                    action: oldFile ? "تعديل" : "اضافة",
                    field: fileField,
                    oldValue: oldFile,
                    newValue: newFileUrl
                });
            } catch (error) {
                console.error(`❌ فشل في حفظ ملف ${fileField}: ${error.message}`);
                throw error; // Re-throw to be caught by the outer try-catch
            }
        }
    };

    try {
        // Update aerial view file if exists
        await handleFileUpdate('aerial_view_file', 'aerial_view');

        // Update illustrative view file if exists
        await handleFileUpdate('illustrative_view_file', 'illustrative_view');

        // Save update history if there are changes
        if (changes.length > 0) {
            project.updateHistory.push({
                updatedBy: userId,
                updatedAt: new Date(),
                changes: changes
            });
            await project.save();
        }

        res.status(200).json({
            status: 'success',
            message: 'تم تحديث عروض المشروع بنجاح',
            data: project
        });

    } catch (error) {
        return next(new ApiError(`حدث خطأ أثناء تحديث ملفات المشروع: ${error.message}`, 500));
    }
});


/**
 * @description Edit/Add projects dates & connections
 * @route PUT /api/v1/project/:id/dates
 * @method PUT
 * @access edit_project_dates 
 */
exports.updateProjectDates = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate project exists
    const project = await projectModel.findById(id);
    if (!project) {
        return next(new ApiError('لا يوجد هذا المشروع', 404));
    }

    // Extract data from request
    const { end_date, water_date, electricity_date, irrigation_date, drainage_date } = req.body;
    const deleteFiles = req.body.deleteFiles ? JSON.parse(req.body.deleteFiles) : [];

    // Validate at least one field is being updated
    if (!end_date && !water_date && !electricity_date && !irrigation_date && !drainage_date && !req.files && deleteFiles.length === 0) {
        return next(new ApiError('لم يتم تقديم أي بيانات للتحديث', 400));
    }

    // Prepare updates and track changes
    const updates = {};
    const changes = [];

    // Helper function to track changes
    const trackChange = (field, oldValue, newValue, action = null) => {
        const actualAction = action || (oldValue === undefined || oldValue === null ? "اضافة" : "تعديل");

        changes.push({
            action: actualAction,
            field,
            oldValue,
            newValue
        });
        return true;
    };

    // Handle file deletions first
    deleteFiles.forEach(fileType => {
        const connectionType = fileType.replace('_file', '_connection');

        if (project[connectionType]?.file) {
            trackChange(
                `${connectionType}.file`,
                project[connectionType].file,
                null,
                "حذف"
            );

            updates[`${connectionType}.file`] = {
                fileName: null,
                fileUrl: null
            };
        }
    });

    // Track date changes
    if (end_date !== undefined && trackChange('end_date', project.end_date, end_date)) {
        updates.end_date = end_date;
    }

    if (water_date !== undefined && trackChange('water_connection.date', project.water_connection?.date, water_date)) {
        updates['water_connection.date'] = water_date;
    }

    if (electricity_date !== undefined && trackChange('electricity_connection.date', project.electricity_connection?.date, electricity_date)) {
        updates['electricity_connection.date'] = electricity_date;
    }

    if (irrigation_date !== undefined && trackChange('irrigation_connection.date', project.irrigation_connection?.date, irrigation_date)) {
        updates['irrigation_connection.date'] = irrigation_date;
    }

    if (drainage_date !== undefined && trackChange('drainage_connection.date', project.drainage_connection?.date, drainage_date)) {
        updates['drainage_connection.date'] = drainage_date;
    }

    // Handle file uploads and track changes
    if (req.files) {
        const { water_file, electricity_file, irrigation_file, drainage_file } = req.files;

        const processFileUpdate = async (file, connectionType) => {
            if (file) {
                const oldFileName = project[connectionType]?.file?.fileName;
                const oldFileUrl = project[connectionType]?.file?.fileUrl;
                const hasExistingFile = oldFileName || oldFileUrl;

                const fileUrl = await saveFile(
                    file[0],
                    "projects",
                    id,
                    connectionType
                );

                const newFileData = {
                    fileName: file[0].originalname,
                    fileUrl
                };

                trackChange(
                    `${connectionType}.file`,
                    hasExistingFile ? { fileName: oldFileName, fileUrl: oldFileUrl } : null,
                    newFileData,
                    hasExistingFile ? "تعديل" : "اضافة"
                );

                updates[`${connectionType}.file`] = newFileData;
            }
        };

        await Promise.all([
            processFileUpdate(water_file, 'water_connection'),
            processFileUpdate(electricity_file, 'electricity_connection'),
            processFileUpdate(irrigation_file, 'irrigation_connection'),
            processFileUpdate(drainage_file, 'drainage_connection')
        ]);
    }

    // Only proceed with update if there are actual changes
    if (Object.keys(updates).length === 0 && changes.length === 0) {
        return res.status(200).json({
            status: 'success',
            message: 'لا يوجد تغييرات لتحديثها',
            data: project
        });
    }

    // Add update history if there are changes
    if (changes.length > 0) {
        updates.$push = {
            updateHistory: {
                updatedBy: userId,
                updatedAt: new Date(),
                changes
            }
        };
    }

    // Update the project
    const updatedProject = await projectModel.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'تم تحديث بيانات المشروع بنجاح',
        data: updatedProject
    });
});

/**
 * @description Add/Edit projects values (protocols or financials)
 * @route PUT /api/v1/project/:id/values
 * @method PUT
 * @access add_project_values
 */
exports.AddProjectValues = asyncHandler(async (req, res, next) => {

    console.log(req.body);
    console.log(req.files);
    const { id } = req.params;
    const userId = req.user?._id;

    // 1. التحقق من وجود المشروع
    const project = await projectModel.findById(id);
    if (!project) {
        return next(new ApiError('لم يتم العثور على المشروع', 404));
    }

    // 2. تحديد نوع البيانات (protocols أو project_financials)
    const isCivil = project.contracting_authority === 'جهة مدنية';
    const fieldType = isCivil ? 'protocols' : 'project_financials';
    const singularType = isCivil ? 'protocol' : 'financial';

    // 3. استخراج البيانات من الطلب
    const { updated = [], added = [], deleted = [], deletedFiles = [] } = req.body;
    const files = req.files || [];

    console.log('📦 البيانات الواردة:', {
        updated,
        added,
        deleted,
        deletedFiles,
        filesCount: files.length
    });

    const changes = []; // لتسجيل التغييرات

    try {
        // 4. معالجة الملفات المحذوفة - الإصدار المعدل
        for (const fileId of deletedFiles) {
            try {
                // البحث عن الملف في المشروع
                let fileFound = false;

                // البحث في protocols
                for (const protocol of project.protocols) {
                    if (protocol.file?._id?.toString() === fileId) {
                        await deleteFile(protocol.file.fileUrl);
                        protocol.file = null;
                        fileFound = true;
                        break;
                    }
                }

                // إذا لم يتم العثور عليه في protocols، نبحث في project_financials
                if (!fileFound) {
                    for (const financial of project.project_financials) {
                        if (financial.file?._id?.toString() === fileId) {
                            await deleteFile(financial.file.fileUrl);
                            financial.file = null;
                            fileFound = true;
                            break;
                        }
                    }
                }

                if (fileFound) {
                    changes.push({
                        action: 'حذف',
                        field: 'ملف',
                        _id: fileId,
                        oldValue: fileId,
                        newValue: null
                    });
                    console.log(`🗑️ تم حذف الملف بنجاح: ${fileId}`);
                } else {
                    console.warn(`⚠️ لم يتم العثور على الملف المراد حذفه: ${fileId}`);
                }
            } catch (error) {
                console.error(`❌ فشل في حذف الملف ${fileId}:`, error);
                // يمكنك اختيار إما:
                // 1. تجاهل الملف الذي لا يمكن حذفه والمتابعة
                // 2. إرجاع خطأ وإيقاف العملية
                // return next(new ApiError(`فشل في حذف الملف: ${fileId}`, 500));
            }
        }

        // 5. معالجة العناصر المحذوفة
        for (const itemId of deleted) {
            const itemToDelete = project[fieldType].id(itemId);
            if (itemToDelete) {
                // حذف الملف المرتبط إذا كان موجودًا
                if (itemToDelete.file?.fileUrl) {
                    await deleteFile(itemToDelete.file.fileUrl);
                    console.log(`🗑️ تم حذف ملف العنصر: ${itemToDelete.file.fileUrl}`);
                }

                project[fieldType].pull(itemId);
                changes.push({
                    action: 'حذف',
                    field: singularType,
                    _id: itemId,
                    oldValue: itemToDelete.value,
                    newValue: null
                });
                console.log(`❌ تم حذف ${singularType} بالـ ID: ${itemId}`);
            }
        }

        // 6. معالجة العناصر المحدثة
        for (let i = 0; i < updated.length; i++) {
            const updatedItem = updated[i];
            const existingItem = project[fieldType].id(updatedItem._id);
            if (!existingItem) {
                console.warn(`⚠️ لم يتم العثور على ${singularType} للتحديث: ${updatedItem._id}`);
                continue;
            }

            const itemChanges = {};

            // تحديث تاريخ التسجيل إذا تم توفيره
            if (updatedItem.registration_date) {
                const newDate = new Date(updatedItem.registration_date);
                if (newDate.toISOString() !== new Date(existingItem.registration_date).toISOString()) {
                    itemChanges.registration_date = {
                        old: existingItem.registration_date,
                        new: newDate
                    };
                    existingItem.registration_date = newDate;
                    console.log(`📅 تم تحديث تاريخ ${singularType}: ${updatedItem._id}`);
                }
            }

            // تحديث القيمة إذا تم توفيرها
            if (updatedItem.value !== undefined && updatedItem.value !== existingItem.value) {
                itemChanges.value = {
                    old: existingItem.value,
                    new: updatedItem.value
                };
                existingItem.value = updatedItem.value;
                console.log(`💰 تم تحديث قيمة ${singularType}: ${updatedItem._id}`);
            }

            // البحث عن الملف المرفق لهذا العنصر المحدث
            const fileField = `updated[${i}][file]`;
            const newFile = files.find(f => f.fieldname === fileField);

            if (newFile) {
                // حذف الملف القديم إذا كان موجودًا
                if (existingItem.file?.fileUrl) {
                    await deleteFile(existingItem.file.fileUrl);
                    console.log(`🗑️ تم حذف الملف القديم: ${existingItem.file.fileUrl}`);
                    itemChanges.file = {
                        old: existingItem.file.fileName,
                        new: newFile.originalname
                    };
                }

                // حفظ الملف الجديد
                const fileUrl = await saveFile(
                    newFile,
                    "projects",
                    id,
                    `${fieldType}/${updatedItem.value || existingItem.value || 'updated'}`
                );

                existingItem.file = {
                    fileName: newFile.originalname,
                    fileUrl: fileUrl
                };
                console.log(`📂 تم تحديث ملف ${singularType}: ${fileUrl}`);
            }

            // إذا كان هناك تغييرات، نضيفها للسجل
            if (Object.keys(itemChanges).length > 0) {
                changes.push({
                    action: 'تعديل',
                    field: singularType,
                    _id: updatedItem._id,
                    changes: itemChanges
                });
            }
        }

        // 7. معالجة العناصر المضافة
        for (let i = 0; i < added.length; i++) {
            const newItem = added[i];
            let fileData = null;

            // البحث عن الملف المرفق لهذا العنصر
            const fileField = `added[${i}][file]`;
            const newFile = files.find(f => f.fieldname === fileField);

            if (newFile) {
                const fileUrl = await saveFile(
                    newFile,
                    "projects",
                    id,
                    `${fieldType}/${newItem.value || 'new'}`
                );

                fileData = {
                    fileName: newFile.originalname,
                    fileUrl: fileUrl
                };
                console.log(`📂 تم حفظ ملف جديد: ${fileUrl}`);
            }

            const itemToAdd = {
                value: newItem.value,
                registration_date: newItem.registration_date ?
                    new Date(newItem.registration_date) : new Date(),
                file: fileData
            };

            project[fieldType].push(itemToAdd);
            changes.push({
                action: 'اضافة',
                field: singularType,
                newValue: newItem.value,
                file: fileData ? fileData.fileName : null,
                registration_date: itemToAdd.registration_date
            });
            console.log(`✅ تم إضافة ${singularType} جديد بقيمة: ${newItem.value}`);
        }

        // 8. تسجيل التغييرات في السجل التاريخي
        if (changes.length > 0) {
            project.updateHistory.push({
                updatedBy: userId,
                updatedAt: new Date(),
                changes: changes
            });
            console.log(`📝 تم تسجيل ${changes.length} تغييرات في السجل التاريخي`);
        }

        // 9. حفظ التغييرات
        const updatedProject = await project.save();

        res.status(200).json({
            status: 'success',
            message: `تم تحديث ${isCivil ? 'البروتوكولات' : 'القيم المالية'} بنجاح`,
            data: {
                projectId: updatedProject._id,
                updatedCount: updated.length,
                addedCount: added.length,
                deletedCount: deleted.length,
                deletedFilesCount: deletedFiles.length,
                changes: changes.map(c => ({
                    action: c.action,
                    field: c.field,
                    _id: c._id || null
                }))
            }
        });

    } catch (error) {
        console.error('❌ خطأ في تحديث القيم:', error);
        return next(new ApiError(`حدث خطأ أثناء تحديث القيم: ${error.message}`, 500));
    }
});

/**
 *  @description Get all projects
 *  @route /api/v1/project
 *  @method Get
 *  @access view project 
 */
exports.getAllProjects = factory.getAll(projectModel);




/**
 *  @description Get specific project
 *  @route /api/v1/project/:id
 *  @method get
 *  @access show projects
 */
exports.getSpecificProject = factory.getOne(projectModel);

/**
 *  @description Get specific project
 *  @route /api/v1/project/soft-delete/:id
 *  @method put
 *  @access  delete_project
 */
exports.softDeleteProject = factory.softDeleteOne(projectModel);


/**
 * @description Update specific project
 * @route PUT /api/v1/project/:id
 * @method PUT
 * @access update_project
 */
exports.updateSpecificProject = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user._id;
    console.log(req.files);
    console.log(req.body);

    // 1. Validate project exists
    const project = await projectModel.findById(id);
    if (!project) {
        return next(new ApiError('لا يوجد هذا المشروع', 404));
    }

    // 2. Process contracting authority if changed
    if (req.body.contracting_authority &&
        req.body.contracting_authority !== project.contracting_authority) {

        const oldAuthority = project.contracting_authority;
        project.contracting_authority = req.body.contracting_authority;

        // Clear opposite fields when authority type changes
        if (req.body.contracting_authority === 'جهة مدنية') {
            // When switching to civil authority, clear financials and keep protocols
            project.project_financials = [];
            project.trust_approval_file = null;

            // Add to update history
            addToUpdateHistory(project, userId, 'contracting_authority', oldAuthority, req.body.contracting_authority);
            addToUpdateHistory(project, userId, 'project_financials', 'Existing financials', [], 'حذف');
        } else {
            // When switching to non-civil authority, clear protocols and keep financials
            project.protocols = [];
            project.entity_name = null;
            project.estimated_budget_file = null;

            // Add to update history
            addToUpdateHistory(project, userId, 'contracting_authority', oldAuthority, req.body.contracting_authority);
            addToUpdateHistory(project, userId, 'protocols', 'Existing protocols', [], 'حذف');
        }
    }

    // 3. Process simple fields updates
    const simpleFields = ['name', 'status', 'location', 'start_date', 'end_date',
        'entity_name', 'estimated_budget'];

    simpleFields.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== project[field]) {
            const oldValue = project[field];
            project[field] = req.body[field];
            addToUpdateHistory(project, userId, field, oldValue, req.body[field]);
        }
    });

    // 4. Process connection dates
    const connectionFields = ['water', 'electricity', 'drainage', 'irrigation'];
    connectionFields.forEach(conn => {
        const dateField = `${conn}_date`;
        if (req.body[dateField]) {
            const oldValue = project[`${conn}_connection`].date;
            project[`${conn}_connection`].date = req.body[dateField];
            project[`${conn}_connection`].addedBy = userId;
            addToUpdateHistory(project, userId, `${conn}_connection.date`, oldValue, req.body[dateField]);
        }
    });

    // 5. Process file uploads
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            console.log("file", file);
            // Handle connection files
            if (file.fieldname.endsWith('_file') && !file.fieldname.includes('protocols') &&
                !file.fieldname.includes('aerial_view_file') && !file.fieldname.includes('illustrative_view_file') &&
                !file.fieldname.includes('site_receipt_file') && !file.fieldname.includes('trust_approval_file')) {

                const field = file.fieldname.replace('_file', '');
                const connectionField = `${field}_connection`;

                // Save old file info for history
                const oldFile = project[connectionField].file;

                // Save new file
                const fileUrl = await saveFile(file, 'projects', id, connectionField);

                // Update project with new file
                project[connectionField].file = {
                    fileName: decodeURIComponent(file.originalname),
                    fileUrl: fileUrl
                };

                // Add to update history
                addToUpdateHistory(project, userId, connectionField, oldFile, project[connectionField].file);
            }
            // Handle aerial and illustrative view files
            else if (file.fieldname === 'aerial_view_file' || file.fieldname === 'illustrative_view_file' ||
                file.fieldname === 'site_receipt_file' || file.fieldname === 'trust_approval_file') {

                // Save old file info for history
                const oldFile = project[file.fieldname];

                // Save new file
                const fileUrl = await saveFile(file, 'projects', id, 'views');

                // Update project with new file
                project[file.fieldname] = {
                    fileName: decodeURIComponent(file.originalname),
                    fileUrl: fileUrl
                };

                // Add to update history
                addToUpdateHistory(project, userId, file.fieldname, oldFile, project[file.fieldname]);
            }
        }
    }

    // 6. Process protocols updates (only for civil authority projects)
    if (project.contracting_authority === 'جهة مدنية') {
        // Handle deleted protocols
        if (req.body['protocols.deletedItems']) {
            const deletedItems = JSON.parse(req.body['protocols.deletedItems']);
            for (const itemId of deletedItems) {
                const removedItem = await removeFromArray(projectModel, id, 'protocols', itemId);
                addToUpdateHistory(project, userId, 'protocols', removedItem, null, 'حذف');
            }
        }

        // Handle updated protocols
        const updateProtocolsPrefix = 'update_protocols.';
        for (const key in req.body) {
            if (key.startsWith(updateProtocolsPrefix)) {
                const protocolId = key.split('.')[1];
                const field = key.split('.')[2];

                // Find the protocol to update
                const protocol = project.protocols.id(protocolId);
                if (protocol) {
                    // Save old value for history
                    const oldValue = protocol[field];

                    // Update protocol field
                    if (field === 'registration_date') {
                        protocol[field] = new Date(req.body[key]);
                    } else if (field !== 'file') { // file handled separately
                        protocol[field] = req.body[key];
                    }

                    // Add to update history if value changed
                    if (oldValue !== protocol[field]) {
                        addToUpdateHistory(project, userId, `protocols.${protocolId}.${field}`, oldValue, protocol[field]);
                    }
                }
            }
        }

        // Handle new protocols
        const newProtocolsPrefix = 'New_protocols';
        const newProtocolsMap = {};

        for (const key in req.body) {
            if (key.startsWith(newProtocolsPrefix)) {
                const match = key.match(/New_protocols\[(\d+)\]\.(\w+)/);
                if (match) {
                    const index = match[1];
                    const field = match[2];

                    if (!newProtocolsMap[index]) {
                        newProtocolsMap[index] = {};
                    }

                    if (field === 'registration_date') {
                        newProtocolsMap[index][field] = new Date(req.body[key]);
                    } else if (field !== 'file') {
                        newProtocolsMap[index][field] = req.body[key];
                    }
                }
            }
        }

        const newProtocolsIds = {};
        for (const index in newProtocolsMap) {
            const protocolData = newProtocolsMap[index];
            const newProtocol = project.protocols.create(protocolData);
            project.protocols.push(newProtocol);
            newProtocolsIds[index] = newProtocol._id;
            addToUpdateHistory(project, userId, `protocols`, null, protocolData, 'اضافة');
        }

        // Process protocol files
        if (req.files) {
            for (const file of req.files) {
                if (file.fieldname.includes('protocols')) {
                    const match = file.fieldname.match(/(update_protocols\.([^.]+)\.file|New_protocols\[(\d+)\]\.file)/);
                    if (match) {
                        let protocol;

                        if (match[2]) { // update existing
                            const protocolId = match[2];
                            protocol = project.protocols.id(protocolId);
                        } else if (match[3]) { // new protocol
                            const index = match[3];
                            const newProtocolId = newProtocolsIds[index];
                            protocol = project.protocols.id(newProtocolId);
                        }

                        if (protocol) {
                            const oldFile = protocol.file;
                            const fileUrl = await saveFile(file, 'projects', id, 'protocols');
                            protocol.file = {
                                fileName: decodeURIComponent(file.originalname),
                                fileUrl: fileUrl
                            };
                            addToUpdateHistory(project, userId, `protocols.${protocol._id}.file`, oldFile, protocol.file);
                        }
                    }
                }
            }
        }
    }

    // 7. Process project financials (only for non-civil authority projects)
    if (project.contracting_authority !== 'جهة مدنية') {
        // Handle deleted financials
        if (req.body['project_financials.deletedItems']) {
            const deletedItems = JSON.parse(req.body['project_financials.deletedItems']);
            for (const itemId of deletedItems) {
                const removedItem = await removeFromArray(projectModel, id, 'project_financials', itemId);
                addToUpdateHistory(project, userId, 'project_financials', removedItem, null, 'حذف');
            }
        }

        // Handle updated financials
        const updateFinancialsPrefix = 'update_project_financials.';
        for (const key in req.body) {
            if (key.startsWith(updateFinancialsPrefix)) {
                const financialId = key.split('.')[1];
                const field = key.split('.')[2];

                const financial = project.project_financials.id(financialId);
                if (financial) {
                    const oldValue = financial[field];
                    if (field !== 'file') {
                        financial[field] = req.body[key];
                        if (oldValue !== financial[field]) {
                            addToUpdateHistory(project, userId, `project_financials.${financialId}.${field}`, oldValue, financial[field]);
                        }
                    }
                }
            }
        }

        // Handle new financials
        const newFinancialsPrefix = 'New_project_financials';
        const newFinancialsMap = {};

        for (const key in req.body) {
            if (key.startsWith(newFinancialsPrefix)) {
                const match = key.match(/New_project_financials\[(\d+)\]\.(\w+)/);
                if (match) {
                    const index = match[1];
                    const field = match[2];

                    if (!newFinancialsMap[index]) {
                        newFinancialsMap[index] = {};
                    }

                    if (field === 'date') {
                        newFinancialsMap[index][field] = new Date(req.body[key]);
                    } else if (field !== 'file') {
                        newFinancialsMap[index][field] = req.body[key];
                    }
                }
            }
        }

        const newFinancialsIds = {};
        for (const index in newFinancialsMap) {
            const financialData = newFinancialsMap[index];
            const newFinancial = {
                ...financialData,
                createdBy: userId
            };
            project.project_financials.push(newFinancial);
            newFinancialsIds[index] = project.project_financials[project.project_financials.length - 1]._id;
            addToUpdateHistory(project, userId, `project_financials`, null, financialData, 'اضافة');
        }

        // Process financial files
        if (req.files) {
            for (const file of req.files) {
                if (file.fieldname.includes('project_financials')) {
                    const match = file.fieldname.match(/(update_project_financials\.([^.]+)\.file|New_project_financials\[(\d+)\]\.file)/);
                    if (match) {
                        let financial;

                        if (match[2]) { // update existing
                            const financialId = match[2];
                            financial = project.project_financials.id(financialId);
                        } else if (match[3]) { // new financial
                            const index = match[3];
                            const newFinancialId = newFinancialsIds[index];
                            financial = project.project_financials.id(newFinancialId);
                        }

                        if (financial) {
                            const oldFile = financial.file;
                            const fileUrl = await saveFile(file, 'projects', id, 'project_financials');
                            financial.file = {
                                fileName: decodeURIComponent(file.originalname),
                                fileUrl: fileUrl
                            };
                            addToUpdateHistory(project, userId, `project_financials.${financial._id}.file`, oldFile, financial.file);
                        }
                    }
                }
            }
        }
    }

    // 8. Process deleted files
    if (req.body.deletedFiles) {
        const deletedFiles = JSON.parse(req.body.deletedFiles);
        for (const { field, fileId } of deletedFiles) {
            const [parentField, index, subField] = field.split('.');

            if (parentField === 'protocols' && project[parentField][index]) {
                const protocol = project[parentField][index];
                if (protocol.file && protocol.file._id.toString() === fileId) {
                    const oldFile = protocol.file;
                    protocol.file = null;
                    addToUpdateHistory(project, userId, field, oldFile, null, 'حذف');
                }
            }
            else if (parentField === 'project_financials' && project[parentField][index]) {
                const financial = project[parentField][index];
                if (financial.file && financial.file._id.toString() === fileId) {
                    const oldFile = financial.file;
                    financial.file = null;
                    addToUpdateHistory(project, userId, field, oldFile, null, 'حذف');
                }
            }
            else if (field === "aerial_view_file" || field === "illustrative_view_file" || field === "site_receipt_file" || field === "trust_approval_file") {
                const oldFile = {
                    fileName: project[field].fileName,
                    fileUrl: project[field].fileUrl
                };
                project[field] = null;
                addToUpdateHistory(project, userId, field, oldFile, null, 'حذف');
            }
            else if (field === "water_file") {
                const oldFile = {
                    fileName: project['water_connection'].file.fileName,
                    fileUrl: project['water_connection'].file.fileUrl,
                };
                project['water_connection'].file = null;
                addToUpdateHistory(project, userId, field, oldFile, null, 'حذف');
            }
            else if (field === "electricity_file") {
                const oldFile = {
                    fileName: project['electricity_connection'].file.fileName,
                    fileUrl: project['electricity_connection'].file.fileUrl,
                };
                project['electricity_connection'].file = null;
                addToUpdateHistory(project, userId, field, oldFile, null, 'حذف');
            }
            else if (field === "drainage_file") {
                const oldFile = {
                    fileName: project['drainage_connection'].file.fileName,
                    fileUrl: project['drainage_connection'].file.fileUrl,
                };
                project['drainage_connection'].file = null;
                addToUpdateHistory(project, userId, field, oldFile, null, 'حذف');
            }
            else if (field === "irrigation_file") {
                const oldFile = {
                    fileName: project['irrigation_connection'].file.fileName,
                    fileUrl: project['irrigation_connection'].file.fileUrl,
                };
                project['irrigation_connection'].file = null;
                addToUpdateHistory(project, userId, field, oldFile, null, 'حذف');
            }
        }
    }

    // 9. Save the updated project
    await project.save();

    res.status(200).json({
        success: true,
        message: 'تم تحديث المشروع بنجاح',
        data: project
    });
});

// Helper function to add changes to update history
function addToUpdateHistory(project, userId, field, oldValue, newValue, action = 'تعديل') {
    if (!project.updateHistory) {
        project.updateHistory = [];
    }

    const today = new Date().toISOString().split('T')[0];
    let updateEntry = project.updateHistory.find(entry =>
        entry.updatedBy.equals(userId) &&
        entry.updatedAt.toISOString().split('T')[0] === today
    );

    if (!updateEntry) {
        updateEntry = {
            updatedBy: userId,
            updatedAt: new Date(),
            changes: []
        };
        project.updateHistory.push(updateEntry);
    }

    updateEntry.changes.push({
        action,
        field,
        oldValue,
        newValue
    });
}
