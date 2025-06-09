const express = require('express');
const confinementServices = require('../services/confinementServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');
const router = express.Router();

router.route('/')
    .post(verifyToken, authorize("add_confinement"), upload.any(), confinementServices.createConfinement)
    .get(verifyToken, authorize("view_confinement"), confinementServices.getAllConfinements);
router.route('/:id')
    .get(verifyToken, authorize("view_confinement"), confinementServices.getOneConfinement)
    .put(verifyToken, authorize("update_confinement"), upload.any(), confinementServices.updateConfinement);


router.put('/soft_delete/:id', verifyToken, authorize("delete_confinement"), confinementServices.softDeleteConfinement);
router.put('/recover/:id', verifyToken, authorize("update_confinement"), confinementServices.recoverConfinement);

module.exports = router;