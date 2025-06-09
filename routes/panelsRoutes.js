const express = require('express');
const panelsServices = require('../services/panelsServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');
const router = express.Router();


router.route('/')
    .post(verifyToken, authorize("add_panel"), upload.any(), panelsServices.createPanel)
    .get(verifyToken, authorize("get_panels"), panelsServices.getAllPanels);

router.route('/:id')
    .get(verifyToken, authorize("view_panel"), panelsServices.getOnePanel)
    .put(verifyToken, authorize("update_panel"), upload.any(), panelsServices.updatePanel);


router.put('/:id/v2', verifyToken, authorize("add_panel-v2"), upload.any(), panelsServices.updatePanelV2);

router.put('/soft_delete/:id', verifyToken, authorize("delete_panel"), panelsServices.softDeletePanel);
router.put('/recover/:id', verifyToken, authorize("update_panel"), panelsServices.recoverPanel);
module.exports = router;