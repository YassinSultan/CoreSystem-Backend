const express = require('express');
const materialServices = require('../services/materialServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');
const router = express.Router();


router.route('/')
    .post(verifyToken, authorize("add_material"), upload.any(), materialServices.createMaterial)
    .get(verifyToken, authorize("get_materials"), materialServices.getAllMaterial);

router.route('/:id')
    .get(verifyToken, authorize("view_material"), materialServices.getOneMaterial)
    .put(verifyToken, authorize("update_material"), upload.any(), materialServices.updateMaterial);


router.put('/soft_delete/:id', verifyToken, authorize("delete_material"), materialServices.softDeleteMaterial);
router.put('/recover/:id', verifyToken, authorize("update_material"), materialServices.recoverMaterial);
module.exports = router;

router.post('/assignment-operators',
    materialServices.contractAssignmentOperators
);