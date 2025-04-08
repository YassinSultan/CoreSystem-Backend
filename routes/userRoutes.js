const express = require('express');
const userServices = require('../services/userServices');
const { verifyToken, authorize } = require('../middlewares/verifyToken');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
    .post(verifyToken, authorize("add user"), upload.any(), userServices.createUser)
    .get(verifyToken, authorize("view users"), userServices.getAllUsers);

router.route('/profile')
    .get(verifyToken, userServices.getUserProfile)
    .put(verifyToken, upload.single('profileImage'), userServices.updateUserProfile);

router.route('/:userId')
    .put(verifyToken, authorize("update user"), upload.single('profileImage'), userServices.updateUser)
    .get(verifyToken, authorize("view users"), userServices.getSpecificUser)
    .delete(verifyToken, authorize("admin_only"), userServices.hardDeleteUser);;

router.put('/soft-delete/:userId', verifyToken, authorize("delete user"), userServices.softDeleteUser);
router.put('/recover/:userId', verifyToken, authorize("update user"), userServices.recoverUser);


module.exports = router;