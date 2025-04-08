const express = require('express');
const incomingLetterServices = require('../services/incomingLetterServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const upload = require('../middlewares/upload');
const router = express.Router();

router.route('/')
    .post(verifyToken, authorize("add_outgoing_letter"), upload.any(), incomingLetterServices.createIncomingLetter)
    .get(verifyToken, authorize("view_incoming_letters"), incomingLetterServices.getAllIncomingLetters);

router.route('/:id')
    .get(verifyToken, authorize("view_incoming_letters"), incomingLetterServices.getOneIncomingLetter)
    .put(verifyToken, authorize("update_incoming_letter"), upload.any(), incomingLetterServices.updateIncomingLetter);

router.put('/soft_delete/:id', verifyToken, authorize("delete_incoming_letter"), incomingLetterServices.softDeleteIncomingLetter);
router.put('/recover/:id', verifyToken, authorize("update_incoming_letter"), incomingLetterServices.recoverIncomingLetter);


module.exports = router;