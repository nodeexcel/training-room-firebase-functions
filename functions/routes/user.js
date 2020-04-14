const router = require("express").Router();
const userController = require('../controller/user');
const auth = require('../middleware/auth');

router.post('/register', userController.addUser);
router.post('/updateProfileImage', auth.verifyUser, userController.updateProfileImage);
router.get('/getUserProfile', auth.verifyUser, userController.getUserProfile);
router.get('/listAllUser', auth.verifyUser, userController.getUserLists);
router.delete('/deleteUser', auth.verifyUser, userController.deleteUser);
router.post('/getUserWithPhone', userController.checkPhone);

router.get('/getUserCourses', auth.verifyUser, userController.getUserCourses);
router.get('/getUserTeams', auth.verifyUser, userController.getUserTeams);

module.exports = router