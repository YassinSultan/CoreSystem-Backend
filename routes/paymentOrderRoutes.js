const express = require('express');
const paymentOrderServices = require('../services/paymentOrderServices.js');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');
const router = express.Router();

router.route('/')
    .post(verifyToken, authorize("add_paymentOrder"), upload.any(), paymentOrderServices.createPaymentOrder)
    .get(verifyToken, authorize("view_paymentOrder"), paymentOrderServices.getAllPaymentOrders);
router.route('/:id')
    .get(verifyToken, authorize("view_paymentOrder"), paymentOrderServices.getOnePaymentOrder)
    .put(verifyToken, authorize("update_paymentOrder"), upload.any(), paymentOrderServices.updatePaymentOrder);


router.put('/soft_delete/:id', verifyToken, authorize("delete_paymentOrder"), paymentOrderServices.softDeletePaymentOrder);
router.put('/recover/:id', verifyToken, authorize("update_paymentOrder"), paymentOrderServices.recoverPaymentOrder);

module.exports = router;