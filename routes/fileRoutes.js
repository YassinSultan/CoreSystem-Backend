const express = require('express');
const { getFile } = require('../services/fileServices'); // استدعاء الخدمة
const router = express.Router();

router.get('/*', getFile); // استخدام دالة الخدمة

module.exports = router;
