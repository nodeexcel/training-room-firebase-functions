const router = require("express").Router();
const videoController = require('../controller/video');
const auth = require('../middleware/auth');

router.post('/uploadVideo', auth.verifyUser, videoController.uploadVideo);

module.exports = router