const express = require('express');
const authValidator = require('../validators/authValidator');
const authServices = require('../services/authServices');
const { verifyToken } = require('../middlewares/verifyToken');

const router = express.Router();

router.post('/login', authValidator.loginValidator, authServices.login);

router.get('/check-token', verifyToken, authServices.checkToken);
module.exports = router;