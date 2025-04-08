const express = require('express');
const companyServices = require('../services/companyServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');
const router = express.Router();


router.route('/')
    .post(verifyToken, authorize("add_company"), upload.any(), companyServices.createCompany)
    .get(verifyToken, authorize("view_companies"), companyServices.getAllCompanies);
router.route('/:id')
    .get(verifyToken, authorize("view_companies"), companyServices.getCompanyById)
    .put(verifyToken, authorize("update_company"), upload.any(), companyServices.updateCompany);

router.put('/soft-delete/:id', verifyToken, authorize("delete_companies"), companyServices.softDelete);


module.exports = router;