const router = require("express").Router();
const courseController = require('../controller/course');
const auth = require('../middleware/auth');

router.post('/addcourse',auth.verifyUser, courseController.addCourse);

module.exports = router