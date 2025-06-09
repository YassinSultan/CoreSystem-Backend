const express = require('express');
const reportsServices = require('../services/reportsServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const router = express.Router();

router.route('/')
    .get(verifyToken, authorize("download_reports"), reportsServices.getReports);
router.route('/all')
    .get(verifyToken, authorize("download_reports"), reportsServices.getAllReports);

module.exports = router;