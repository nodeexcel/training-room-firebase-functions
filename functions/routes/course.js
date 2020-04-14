const router = require("express").Router();
const courseController = require('../controller/course');
const auth = require('../middleware/auth');

router.post('/addcourse',auth.verifyUser, courseController.addCourse);
router.get('/getCourses', courseController.getAllCourses);
router.put('/updateCourse', auth.verifyUser, courseController.updateCourse)
router.get('/getCourseDetails/:courseId', courseController.getCourseDetailsById);

module.exports = router