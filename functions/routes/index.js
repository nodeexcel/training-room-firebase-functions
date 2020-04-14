const router = require("express").Router();

router.use('/user', require('./user'));
router.use('/teams', require('./teams'));
router.use('/roles', require('./roles'));
router.use('/video', require('./video'));
router.use('/template', require('./template'));
router.use('/course', require('./course'));
router.use('/sample', require('./addsampledata'));

module.exports = router