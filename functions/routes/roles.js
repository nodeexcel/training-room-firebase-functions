const router = require("express").Router();
const roleController = require('../controller/roles');
const auth = require('../middleware/auth');

router.post('/addRole', auth.verifyUser, roleController.createRole);
router.get('/getRoles', roleController.getRoles)

module.exports = router