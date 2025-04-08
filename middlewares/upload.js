const multer = require('multer');
const iconv = require('iconv-lite');

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const originalName = iconv.decode(Buffer.from(file.originalname, 'latin1'), 'utf8');
        file.originalname = originalName;
        cb(null, true);
    }
});

module.exports = upload;
