const express = require('express');
const abstractServices = require('../services/abstractServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');
const router = express.Router();

router.route('/')
    .post(verifyToken, authorize("add_abstract"), upload.any(), abstractServices.createAbstract)
    .get(verifyToken, authorize("view_abstract"), abstractServices.getAllAbstract);
router.route('/:id')
    .get(verifyToken, authorize("view_abstract"), abstractServices.getOneAbstract)
    .put(verifyToken, authorize("edit_abstract"), upload.any(), abstractServices.updateAbstract);

router.route('/leadership/:id')
    .put(verifyToken, authorize("edit_abstract"), upload.any(), abstractServices.updateAbstractLeaderShip);;
router.route('/management/:id')
    .put(verifyToken, authorize("edit_abstract"), upload.any(), abstractServices.updateAbstractManagement);;
router.route('/financial/:id')
    .put(verifyToken, authorize("edit_abstract"), upload.any(), abstractServices.updateAbstractFinancial);;
router.route('/central/:id')
    .put(verifyToken, authorize("edit_abstract"), upload.any(), abstractServices.updateAbstractCentral);;

router.put('/soft_delete/:id', verifyToken, authorize("delete_abstract"), abstractServices.softDeleteAbstract);
router.put('/recover/:id', verifyToken, authorize("update_abstract"), abstractServices.recoverAbstract);


module.exports = router;