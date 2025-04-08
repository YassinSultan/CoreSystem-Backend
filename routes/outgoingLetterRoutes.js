const express = require('express');
const outgoingLetterServices = require('../services/outgoingLetterServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
    .post(verifyToken, authorize("add_outgoing_letter"), upload.any(), outgoingLetterServices.createOutgoingLetter)
    .get(verifyToken, authorize("view_outgoing_letters"), outgoingLetterServices.getAllOutgoingLetters);

router.route('/:id')
    .get(verifyToken, authorize("view_outgoing_letters"), outgoingLetterServices.getOneOutgoingLetter)
    .put(verifyToken, authorize("update_outgoing_letter"), upload.any(), outgoingLetterServices.updateOutgoingLetter);

router.route('/soft_delete/:id')
    .put(verifyToken, authorize("delete_outgoing_letter"), outgoingLetterServices.softDeleteOutgoingLetter);

router.route('/recover/:id')
    .put(verifyToken, authorize("update_outgoing_letter"), outgoingLetterServices.recoverOutgoingLetter);

module.exports = router;