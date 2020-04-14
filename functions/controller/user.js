var serviceAccount = require("../AuthFirebase.json");
const path = require('path');
const fs = require('fs');
const Busboy = require('busboy');
const uuid = require('uuid');

module.exports = {
    addUser: async (req, res, next) => {
        try {
            let user = await req.admin.auth().createUser({
                email: req.body.email,
                password: req.body.password,
                displayName: `${req.body.firstName} ${req.body.lastName}`,
                phoneNumber: req.body.phoneNumber
            })
            let teamData = {
                "active": true,
                "createdAt": new Date(),
                "updatedAt": new Date(),
                "createdBy": user.uid,
                "name": req.body.teamName,
                "admins": {},
                "trainees": {}
            }

            teamData[user.uid] = { triggerignore: false }
            // let team = await req.team.doc(uuid.v4()).set(data);
            let userdetails = {
                active: true,
                courses: {},
                teamslist: [],
                organisation: req.body.organisation,
                address: req.body.address,
                DOB: req.body.DOB,
                dashboard: {
                    last10teamedits: [],
                    last5usersadded: [],
                    usersonhold: [],
                    last5courseedits: []
                },
                courselist: [],
                teamsnest: {}
            }
            await req.admin.firestore().collection('userdetails').doc(user.uid).set(userdetails)
            await req.team.doc(uuid.v4()).set(teamData)
            res.send({
                status: 1,
                data: user
            })
        } catch (error) {
            console.log(JSON.stringify(error));

            res.send({
                status: 0,
                error: error
            })
        }
    },

    updateProfileImage: async (req, res, next) => {
        try {
            if (req.method === 'POST') {
                const busboy = new Busboy({
                    headers: req.headers
                });

                let bucket = req.admin.storage().bucket(serviceAccount.storageUrl)
                let filepath = ""
                let fileMime = ""
                let name = ""
                // This callback will be invoked for each file uploaded
                busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
                    filepath = path.join(__dirname, '../uploads/' + filename);
                    fileMime = mimetype
                    name = filename
                    await file.pipe(fs.createWriteStream(filepath));
                });

                // This callback will be invoked after all uploaded files are saved.
                busboy.on('finish', async () => {
                    bucket.upload(filepath, {
                        destination: '/images/' + name,
                        public: true,
                        metadata: {
                            contentType: fileMime,
                            cacheControl: "public, max-age=300"
                        }
                    }, async (err, response) => {
                        if (!err) {
                            fs.unlink(filepath, async (err) => {
                                if (!err) {

                                    await req.admin.auth().updateUser(req.user.user_id, {
                                        photoURL: response.metadata.mediaLink
                                    })
                                    res.send({
                                        data: response.metadata,
                                        message: "File SuccessFully Uploaded"
                                    })
                                }
                            })
                        } else {
                            throw err
                        }
                    });
                });
                busboy.end(req.rawBody);
            }
        } catch (error) {
            res.status(400).send(error)
        }
    },

    getUserProfile: async (req, res, next) => {
        try {
            let userDetails = await req.userDetails.doc(req.user.uid).get()
            if (!userDetails.exists) {
                console.log("No Details found");
            } else {
                req.user['userdetails'] = userDetails.data()
            }
            res.send({
                status: 1,
                data: req.user
            })
        } catch (error) {
            res.status(400).send(error)
        }
    },

    getUserLists: async (req, res, next) => {
        try {
            let users = await req.admin.auth().listUsers(1000, req.query.pageToken);
            res.send({
                status: 1,
                data: users
            })
        } catch (error) {
            res.status(400).send(error)
        }
    },

    deleteUser: async (req, res, next) => {
        try {
            let userResponse = await req.admin.auth().deleteUser(req.body.uid)
            res.send({
                status: 1,
                message: "user record is removed"
            })
        } catch (error) {
            res.send({
                status: 0,
                error: error
            })
        }
    },

    checkPhone: async (req, res, next) => {
        try {
            req.admin.auth().getUserByPhoneNumber(req.body.phoneNumber)
                .then(function (userRecord) {
                    if (userRecord.uid) {
                        res.send({
                            status: 1,
                            data: userRecord.uid
                        })
                    }
                })
                .catch(function (error) {
                    res.send({
                        status: 0,
                        data: null,
                        message: "User Record Not Exists"
                    })
                });
        } catch (error) {
            res.send({
                status: 0,
                error: error
            })
        }
    },

    getUserCourses: async (req, res, next) => {
        try {
            let userId = req.query.UID || req.user.uid
            let data = await req.course.where('UID', '==', userId).get()
            let courses = []
            if (data.empty) {
                return res.send({
                    status: 1,
                    data: [],
                    message: "No courses assigned to the user"
                })
            } else {
                data.forEach(doc => {
                    let response = {
                        id: doc.id,
                        title: doc.data().courseData.title
                    };
                    courses.push(response);
                })
                return res.send({
                    status: 1,
                    data: courses
                })
            }
        } catch (error) {
            return res.send({
                status: 1,
                error: error
            })
        }
    },

    getUserTeams: async (req, res, next) => {
        try {
            let teamRef = await req.team.where('admins', 'array-contains', req.user.uid).get();
            let teams = []
            if (teamRef.empty) {
                return res.send({ status: 1, data: teams })
            }

            teamRef.forEach(doc => {
                let data = doc.data();
                data['id'] = doc.id
                teams.push(data);
            });
            return res.send({ status: 1, data: teams })
        } catch (error) {
            return res.send({
                status: 1,
                error: error
            })
        }
    }
}