const express = require('express');
const estimateServices = require('../services/estimateServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');
const router = express.Router();


router.route('/')
    .post(verifyToken, authorize("add_estimate"), upload.any(), estimateServices.createEstimate)
    .get(verifyToken, authorize("view_estimate"), estimateServices.getAllEstimates);

router.route('/:id')
    .get(verifyToken, authorize("view_estimate"), estimateServices.getOneEstimate)
    .put(verifyToken, authorize("update_estimate"), upload.any(), estimateServices.updateEstimate);
router.route('/:id/step/:stepNumber')
    .put(verifyToken, authorize("update_estimate"), upload.any(), estimateServices.updateEstimateStep);

router.put('/soft_delete/:id', verifyToken, authorize("delete_estimate"), estimateServices.softDeleteEstimate);
router.put('/recover/:id', verifyToken, authorize("update_estimate"), estimateServices.recoverEstimate);
router.put('/cancel/:id', verifyToken, authorize("cancel_estimate"), upload.any(), estimateServices.cancelEstimate);
router.put('/contract/:id', verifyToken, authorize("contract_estimate"), upload.any(), estimateServices.contractEstimate);
router.put('/complete/:id', verifyToken, authorize("complete_estimate"), upload.any(), estimateServices.completeEstimate);
router.put('/restudy/:id', verifyToken, authorize("restudy_estimate"), upload.any(), estimateServices.restudyEstimate);


module.exports = router;