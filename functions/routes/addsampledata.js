const router = require("express").Router();
const sampleDataController = require('../controller/addSampleData');

router.post('/addSampleData', sampleDataController.addSampleData);


module.exports = router