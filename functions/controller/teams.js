const uuid = require('uuid');

module.exports = {
    addTeam: async (req, res, next) => {
        try {
            let data = req.body;
            let teamId = uuid.v4();
            let setDoc = await req.team.doc(teamId).set(data);

            res.send({
                status: 1,
                data: setDoc
            })
        } catch (error) {
            console.log(error);

            res.send(error)
        }
    },

    getAllTeams: async (req, res, next) => {
        let teamsRef = await req.admin.firestore().collection('teams').where('active', '==', true).get();
        if (teamsRef.empty) {
            res.send({
                status: 1,
                data: []
            })
        } else {
            let data = [];

            teamsRef.forEach(element => {
                let object = element.data()
                object['id'] = element.id;
                data.push(object)
            });

            res.send({
                status: 1,
                data: data
            })
        }
    },

    updateTeams: async (req, res, next) => {
        try {
            req.team.doc(req.body.id).get().then(async (data) => {
                let doc = req.body;
                delete doc.id;
                let teamData = data.data();

                if (teamData.admins && (teamData.admins.indexOf(req.user.uid) != -1)) {
                    await req.team.doc(data.id).update(doc);
                    res.send({
                        status: 1,
                        message: "Team successfully updated"
                    })
                } else {
                    res.send({
                        status: 0,
                        message: "your are not authorized to update the team, only team admin can update the team"
                    })
                }
            });

        } catch (error) {
            res.send({
                status: 0,
                error: error
            })
        }
    },

    deleteTeam: async (req, res, next) => {
        try {
            req.team.doc(req.body.id).get().then(async (data) => {
                let teamData = data.data();
                console.log(JSON.stringify(teamData));
                if(!teamData){
                   return res.send({
                        status: 1,
                        message: "Team data not found"
                    })
                }
                if (teamData.admins && (teamData.admins.indexOf(req.user.uid) != -1)) {
                    let deleteDoc = await req.team.doc(req.body.id).delete();
                    res.send({
                        status: 1,
                        message: "Team successfully updated"
                    })
                } else {
                    res.send({
                        status: 0,
                        message: "your are not authorized to update the team, only team admin can update the team"
                    })
                }
            });
        } catch (error) {
            res.send({
                status: 0,
                error: error
            })
        }
    },
    getTeamById: async (req, res, next) => {
        req.team.doc(req.body.id).get().then((response) => {
            res.send(response.data())
        })
    },
    addNewUser: async (req, res, next) => {
        try {
            req.team.doc(req.body.id).get().then(async (data) => {
                let doc = req.body;

                console.log(data);

                // delete doc.id;
                // await req.team.doc(data.id).update(doc);

                res.send({
                    status: 1,
                    message: "Team successfully updated"
                })
            });
        } catch (error) {
            res.send({
                status: 0,
                error: error
            })
        }
    }
}