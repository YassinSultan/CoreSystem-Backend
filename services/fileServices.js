const path = require('path');
const fs = require('fs');

exports.getFile = (req, res) => {
    const filePath = path.join(__dirname, '..', req.path); // إنشاء المسار الكامل للملف

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "الملف غير موجود." });
    }

    if (req.query.download === 'true') {
        res.download(filePath); // تحميل الملف
    } else {
        res.sendFile(filePath); // عرض الملف في المتصفح
    }
};
