const functions = require('firebase-functions');
const cors = require("cors")
const express = require("express")
const bodyParser = require('body-parser');
const routes = require('./routes');
/* Express with CORS */
const app = express()
var admin = require("firebase-admin");
var serviceAccount = require("./AuthFirebase.json");
app.use(express.json({
  limit: '500mb',
  extended: true
}))
app.use(bodyParser.urlencoded({
  limit: '500mb',
  parameterLimit: 50000,
  extended: true,
}));

app.use(cors({
  origin: true
}))
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tr-staging-8964c.firebaseio.com"
});
admin.firestore().settings({
  timestampsInSnapshots: true
})

app.use('*', async (req, res, next) => {
  try {
    req.admin = admin;
    req.team = admin.firestore().collection('teams');
    req.role = admin.firestore().collection('roles');
    req.userRoles = admin.firestore().collection('userRoles');
    req.courseTemplate = admin.firestore().collection('coursetemplates');
    req.course = admin.firestore().collection('course');
    req.userDetails = admin.firestore().collection('userdetails');
    return next()
  } catch (error) {
    return res.status(400).send(error)
  }
})

app.use("/", routes)

const api = functions.https.onRequest(app)

// team triggers 

const team = require('./triggers/team');

const teamTrigger = functions.firestore.document('teams/{id}').onCreate(async (snap, context) => {
  await team.createTrigger(snap.data(), admin.firestore().collection('userdetails'), admin.firestore().collection('teams'), context.params.id)
});

const teamUpdateTrigger = functions.firestore.document('teams/{id}').onUpdate(async (change, context) => {
  const newValue = change.after.data();
  const previousValue = change.before.data();
  await team.updateTeamTrigger(newValue, previousValue, context.params.id, admin.firestore().collection('teams'), admin.firestore().collection('userdetails'))
});

const teamDeleteTrigger = functions.firestore.document('teams/{id}').onDelete(async (snap, context) => {
  await team.deleteTeamTrigger(snap.data(), context.params.id, admin.firestore().collection('userdetails'), admin.firestore().collection('teams'))
});

// course triggers
const course = require('./triggers/course')
const courseCreateTrigger = functions.firestore.document('course/{id}').onCreate(async (snap, context) => {
  await course.createCourseTrigger(snap.data(), admin.firestore().collection('userdetails'), context.params.id)
});

const courseUpdateTrigger = functions.firestore.document('course/{id}').onUpdate(async (change, context) => {
  const newValue = change.after.data();
  const previousValue = change.before.data();
  await course.updateCourseTrigger(newValue, previousValue, context.params.id, admin.firestore().collection('userdetails'))
});


// course template update
const coursetemplate = require('./triggers/coursetemplate');
const courseTemplateUpdateTrigger = functions.firestore.document('coursetemplates/{id}').onUpdate(async (change, context) => {
  const newValue = change.after.data();
  const previousValue = change.before.data();
  await coursetemplate.updateCourseTemplateTrigger(newValue, previousValue, context.params.id, admin.firestore().collection('course'))
});

const courseTemplateCreateTrigger = functions.firestore.document('coursetemplates/{id}').onCreate(async (snap, context) => {
  await course.createCourseTrigger(snap.data(), admin.firestore().collection('userdetails'), context.params.id)
});

module.exports = {
  api,
  teamTrigger,
  teamUpdateTrigger,
  teamDeleteTrigger,
  courseCreateTrigger,
  courseUpdateTrigger,
  courseTemplateUpdateTrigger
}