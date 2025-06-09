const express = require('express');
const supplyOrderServices = require('../services/supplyOrderServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');
const router = express.Router();


router.route('/')
    .post(verifyToken, authorize("create_supplyOrder"), upload.any(), supplyOrderServices.createSupplyOrder)
    .get(verifyToken, authorize("view_supplyOrder"), supplyOrderServices.getAllSupplyOrders);

router.route('/:id')
    .get(verifyToken, authorize("view_supplyOrder"), supplyOrderServices.getOneSupplyOrder)
    .put(verifyToken, authorize("update_supplyOrder"), upload.any(), supplyOrderServices.updateSupplyOrder);

router.put('/soft_delete/:id', verifyToken, authorize("delete_supplyOrder"), supplyOrderServices.softDeleteSupplyOrder);
router.put('/recover/:id', verifyToken, authorize("update_supplyOrder"), supplyOrderServices.recoverSupplyOrder);


module.exports = router;