const router = require("express").Router();
const teamController = require('../controller/teams');
const auth = require('../middleware/auth');

router.post('/addTeam',auth.verifyUser, teamController.addTeam);
router.get('/getTeams', auth.verifyUser, teamController.getAllTeams);
router.put('/updateTeam', auth.verifyUser, teamController.updateTeams);
router.delete('/deleteTeam', auth.verifyUser, teamController.deleteTeam);
router.post('/getTeamById', auth.verifyUser, teamController.getTeamById);

module.exports = router