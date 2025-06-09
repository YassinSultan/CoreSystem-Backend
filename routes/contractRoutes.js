const express = require('express');
const contractServices = require('../services/contractServices.js');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');
const router = express.Router();

router.route('/')
    .post(verifyToken, authorize("add_contract"), upload.any(), contractServices.createContract)
    .get(verifyToken, authorize("view_contract"), contractServices.getAllContrats);
router.route('/:id')
    .get(verifyToken, authorize("view_contract"), contractServices.getOneContrat)
    .put(verifyToken, authorize("update_contract"), upload.any(), contractServices.updateContract);


router.put('/soft_delete/:id', verifyToken, authorize("delete_contract"), contractServices.softDeleteContrat);
router.put('/recover/:id', verifyToken, authorize("update_contract"), contractServices.recoverContrat);
module.exports = router;