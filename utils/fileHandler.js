const fs = require("fs").promises;
const path = require("path");
const slugify = require("slugify");

const UPLOAD_FOLDER = "uploads"; // المجلد الرئيسي لحفظ الملفات
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "pdf", "docx", "xlsx", "mp4", "dwg"]);
const MAX_FILE_SIZE = 1000 * 1024 * 1024;

const port = process.env.PORT || 8000;
const baseUrl = `http://127.0.0.1:${port}`;

// التحقق من أن نوع الملف مسموح به
const allowedFile = (file) => {
    const ext = path.extname(decodeURIComponent(file.originalname)).toLowerCase().slice(1);
    return ALLOWED_EXTENSIONS.has(ext);
};

// حفظ الملف وإرجاع المسار
const saveFile = async (file, category, primaryId, subDir = "") => {
    try {
        if (!file || !decodeURIComponent(file.originalname)) throw new Error("لم يتم إرسال ملف");

        if (!allowedFile(file)) throw new Error("نوع الملف غير مدعوم");

        if (file.size > MAX_FILE_SIZE) throw new Error("حجم الملف كبير جدًا");

        // إنشاء المجلد (uploads/category/id/subDir)
        const folderPath = path.resolve(UPLOAD_FOLDER, category.toString(), primaryId.toString(), subDir.toString());
        await fs.mkdir(folderPath, { recursive: true });

        // تأمين اسم الملف
        const originalName = path.parse(decodeURIComponent(file.originalname)).name;
        const ext = path.extname(decodeURIComponent(file.originalname));
        const securedName = slugify(originalName, {
            lower: true, strict: true,
            locale: 'ar', // إضافة دعم اللغة العربية
            remove: /[*+~.()'"!:@]/g
        });
        const filename = `${securedName}-${Date.now()}${ext}`;

        // المسار النهائي لحفظ الملف
        const filePath = path.join(folderPath, filename);

        // حفظ الملف
        await fs.writeFile(filePath, file.buffer);

        // الرابط الكامل للملف للعرض أو التحميل
        const fileUrl = `${baseUrl}/${UPLOAD_FOLDER}/${category}/${primaryId}/${subDir}/${filename}`.replace(/\\/g, "/");

        return fileUrl;
    } catch (error) {
        throw new Error(`فشل في حفظ الملف: ${error.message}`);
    }
};

// حذف الملف
const deleteFile = async (fileUrl) => {
    try {
        if (!fileUrl.startsWith(baseUrl)) {
            console.error("❌ الرابط غير صحيح:", fileUrl);
            return false;
        }

        // تحويل الـ URL إلى مسار محلي
        let filePath = fileUrl.replace(baseUrl, ""); // إزالة الجزء الأساسي من الرابط
        filePath = decodeURIComponent(filePath); // فك تشفير المسار إذا كان يحتوي على أحرف مشفرة

        // إنشاء المسار النهائي
        const projectRoot = path.resolve(__dirname, "..");
        filePath = path.join(projectRoot, filePath);

        // التأكد من أن الملف داخل مجلد "uploads" لمنع أي حذف عشوائي
        if (!filePath.includes(path.join(projectRoot, UPLOAD_FOLDER))) {
            console.error(`🚫 لا يمكن حذف الملفات خارج '${UPLOAD_FOLDER}'`);
            return false;
        }

        // التحقق مما إذا كان الملف موجودًا ثم حذفه
        try {
            await fs.access(filePath); // التأكد من أن الملف موجود
            await fs.unlink(filePath); // حذف الملف
            return true;
        } catch (error) {
            console.error(`⚠️ الملف غير موجود أو لا يمكن الوصول إليه: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ خطأ أثناء حذف الملف: ${error.message}`);
        return false;
    }
};
const deleteFolder = async (category, primaryId) => {
    try {
        if (!category || !primaryId) {
            console.error("❌ يجب توفير `category` و `primaryId`");
            return false;
        }

        // إنشاء المسارات الرئيسية
        const projectRoot = path.resolve(__dirname, "..");
        const folderPath = path.join(projectRoot, UPLOAD_FOLDER, category, primaryId.toString());
        const categoryPath = path.join(projectRoot, UPLOAD_FOLDER, category);

        // التحقق مما إذا كان المجلد موجودًا
        try {
            await fs.access(folderPath);
        } catch {
            console.error(`⚠️ المجلد غير موجود: ${folderPath}`);
            return false;
        }

        // حذف مجلد `primaryId`
        await fs.rm(folderPath, { recursive: true, force: true });
        console.log(`✅ تم حذف المجلد: ${folderPath}`);

        // التحقق مما إذا كانت `category` فارغة بعد الحذف
        const remainingItems = await fs.readdir(categoryPath);
        if (remainingItems.length === 0) {
            await fs.rmdir(categoryPath); // حذف `category` إذا أصبحت فارغة
            console.log(`🗑️ تم حذف الفئة الفارغة: ${category}`);
        }

        return true;
    } catch (error) {
        console.error(`❌ خطأ أثناء حذف المجلد: ${error.message}`);
        return false;
    }
};
module.exports = { saveFile, deleteFile, deleteFolder };