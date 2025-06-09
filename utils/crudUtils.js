const asyncHandler = require('express-async-handler');
const _ = require('lodash');
const ApiError = require('./apiError');
const ApiFeatures = require('./apiFeatures');
const { saveFile } = require("../utils/fileHandler");

exports.createOne = (Model) => asyncHandler(async (req, res) => {
    // ✅ 1️⃣ تحويل القيم النصية إلى JSON إذا كانت Array أو Object
    Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
            try {
                const parsed = JSON.parse(req.body[key]);
                if (Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null)) {
                    req.body[key] = parsed;
                }
            } catch (e) {
                // تجاهل أي خطأ إذا لم يكن JSON صالحًا
            }
        }
    });

    // ✅ 2️⃣ إنشاء العنصر في قاعدة البيانات بدون الملفات
    const document = await Model.create(req.body);

    // ✅ 3️⃣ تجميع الملفات حسب الحقل (fieldname)
    if (req.files) {
        const groupedFiles = req.files.reduce((acc, file) => {
            const fieldname = file.fieldname.replace(/\[\d+\]\[file\]/, ''); // إزالة [0][file] من اسم الحقل
            acc[fieldname] = acc[fieldname] || [];
            acc[fieldname].push(file);
            return acc;
        }, {});

        const formattedLinks = {};


        // ✅ 4️⃣ حفظ الملفات واسترجاع الروابط ديناميكيًا
        for (const [fieldname, files] of Object.entries(groupedFiles)) {
            const links = await Promise.all(files.map(file => saveFile(file, Model.collection.name, document._id, fieldname)));
            formattedLinks[fieldname] = links.length === 1 ? links[0] : links;
        }
        console.log("🚀 ~ exports.createOne= ~ formattedLinks:", formattedLinks);
        // ✅ 5️⃣ تحديث المستند بالروابط ديناميكيًا
        Object.assign(document, formattedLinks);

        // ✅ 6️⃣ التعامل مع الحقول المتداخلة بشكل ديناميكي
        Object.keys(req.body).forEach(key => {
            if (Array.isArray(req.body[key]) && formattedLinks[key]) {
                document[key] = document[key].map((item, index) => ({
                    ...item,
                    file: formattedLinks[key][index] || item.file,
                    // لو الملف موجود، حطه، لو مش موجود، خليه زي ما هو
                }));
            }
        });
        // تحديث الحقول المتداخلة (إضافة registration_date بدون ارتباط بالملفات)
        Object.keys(req.body).forEach(key => {
            if (Array.isArray(document[key])) {
                document[key] = document[key].map(item => ({
                    ...item,
                    registration_date: new Date() // يتم إضافته دائمًا لكل عنصر
                }));
            }
        });

        await document.save();
    }

    // ✅ 7️⃣ الإرجاع مع البيانات الجديدة
    res.status(201).json({
        status: 'success',
        message: "تم إنشاء العنصر بنجاح",
        data: document
    });
});


exports.getOne = (Model) => asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // إنشاء استعلام للبحث عن العنصر بواسطة الـ ID وتحديد الحقول المطلوبة
    const apiFeatures = new ApiFeatures(Model.findById(id), req.query)
        .limitFields()
        .populate();

    // تنفيذ الاستعلام
    const document = await apiFeatures.mongooseQuery;
    if (!document) {
        return next(new ApiError(`العنصر غير موجود`, 404));
    };
    res.status(200).json({ status: 'success', message: 'تم جلب البيانات بنجاح', data: document });
});

exports.getAll = (Model) => asyncHandler(async (req, res) => {
    let query = Model.find();
    const totalItems = await Model.countDocuments();
    // بناء الاستعلام باستخدام الفلاتر، البحث، الفرز، وتحديد الحقول
    const apiFeatures = new ApiFeatures(query, req.query)
        .populate()
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // تنفيذ الاستعلام
    let documents = await apiFeatures.mongooseQuery;
    // ✅ تصفية البيانات بعد جلبها، للبحث داخل الحقول الـ populated
    if (req.query.keyword) {
        const keyword = req.query.keyword.toLowerCase();
        documents = documents.filter(doc =>
            JSON.stringify(doc).toLowerCase().includes(keyword)
        );
    }
    const totalPages = Math.ceil(totalItems / apiFeatures.paginationResult?.limit);
    res.status(200).json({
        status: 'success',
        message: 'تم جلب جميع البيانات بنجاح',
        result: documents.length,
        totalPages: totalPages || undefined,
        totalItems,
        limit: apiFeatures.paginationResult?.limit,
        page: apiFeatures.paginationResult?.page,
        data: documents
    });
});

exports.updateOne = (Model, allowedFields = []) => asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Model.findById(id);

    if (!document) {
        return next(new ApiError(`العنصر غير موجود`, 404));
    }

    // استخراج الحقول المسموح بها فقط من البيانات المرسلة
    const updatedData = _.pick(req.body, allowedFields);

    // تحديث القيم الجديدة داخل المستند
    Object.assign(document, updatedData);

    // حفظ المستند المحدث
    const updatedDocument = await document.save();

    res.status(200).json({ status: 'success', message: 'تم تحديث البيانات بنجاح', data: updatedDocument });
});

exports.deleteOne = (Model) => asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Model.findByIdAndDelete(id);

    if (!document) {
        return next(new ApiError(`العنصر غير موجود`, 404));
    }

    res.status(204).json({ status: 'success', message: 'تم حذف العنصر بنجاح' });
});

exports.softDeleteOne = (Model) => asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const document = await Model.findById(id);

    if (!document) {
        return next(new ApiError("العنصر غير موجود", 404));
    }

    if (document.isDeleted) {
        const deletedAt = document.updateHistory?.find(change =>
            change.changes.some(c => c.field === "isDeleted")
        )?.updatedAt || "وقت غير معلوم";

        return next(new ApiError(`العنصر محذوف بالفعل منذ ${deletedAt}`, 400));
    }

    // تحديث بيانات الحذف
    document.isDeleted = true;
    document.deletedBy = req.user._id;
    document.deletedAt = Date.now();
    // إضافة سجل الحذف إلى updateHistory
    document.updateHistory.push({
        updatedBy: req.user._id,
        updatedAt: new Date(),
        changes: [
            { field: "isDeleted", oldValue: false, newValue: true },
            { field: "deletedBy", oldValue: null, newValue: req.user._id }
        ]
    });

    await document.save();

    res.status(200).json({
        status: "success",
        message: "تم الحذف الناعم للعنصر بنجاح",
        data: document
    });
});

exports.recoverSoftDeletedOne = (Model) => asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Model.findById(id);

    if (!document) {
        return next(new ApiError(`العنصر غير موجود`, 404));
    }

    if (!document.isDeleted) {
        return next(new ApiError(`العنصر لم يتم حذفه`, 400));
    }

    document.isDeleted = false;
    document.deletedBy = null;
    document.deletedAt = null;
    await document.save();

    res.status(200).json({ status: 'success', message: 'تم استرجاع العنصر بنجاح', data: document });
});
