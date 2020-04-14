const router = require("express").Router();
const templateController = require('../controller/template');
const auth = require('../middleware/auth');

router.post('/addTemplate', auth.verifyUser, templateController.addTemplate);
router.get('/getTemplate', auth.verifyUser, templateController.listAllTemplate);
router.put('/updateTemplate', auth.verifyUser, templateController.updateTemplate);
router.get('/getTemplateByTeam/:teamId', auth.verifyUser, templateController.getTemplateByTeamId);
router.get('/getTemplateById/:templateId', auth.verifyUser, templateController.getTemplateByTemplateId);
router.get('/getTemplateByUser', auth.verifyUser, templateController.getTemplateByUser);

module.exports = router