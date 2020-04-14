const uuid = require('uuid');


const getTemplateByTeamId = (teamId, courseTemplate) => {
    return new Promise(async (resolve, reject) => {
        let templateData = await courseTemplate.where('teams', 'array-contains', teamId).get();

        let templates = []
        if (templateData.empty) {
            console.log('No matching documents.');
            resolve([])
        }

        templateData.forEach(doc => {
            let data = doc.data();
            data['id'] = doc.id
            templates.push(data);
        });

        resolve(templates)
    })
}
module.exports = {
    addTemplate: async (req, res, next) => {
        try {
            let response = await req.courseTemplate.doc(uuid.v4()).set(req.body);
            res.send({
                status: 1,
                message: `template added successfully`
            });
        } catch (error) {
            res.send(error)
        }
    },

    updateTemplate: async (req, res, next) => {
        try {
            let id = req.body.id;
            delete req.body.id;
            let response = await req.courseTemplate.doc(id).update(req.body);
            res.send({
                status: 1,
                message: "template updated successfully"
            })
        } catch (error) {
            res.send(error)
        }
    },

    listAllTemplate: async (req, res, next) => {
        let teamsRef = await req.courseTemplate.get();
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

    getTemplateByTeamId: async (req, res, next) => {
        try {

            let teamId = req.params.teamId;

            let templateData = await req.courseTemplate.where('teams', 'array-contains', teamId).get();

            let templates = []
            if (templateData.empty) {
                console.log('No matching documents.');
                return res.send({ status: 1, data: templates })
            }

            templateData.forEach(doc => {
                let data = doc.data();
                data['id'] = doc.id
                templates.push(data);
            });
            res.send({ status: 1, data: templates })
        } catch (error) {
            console.log(error);

        }
    },

    getTemplateByTemplateId: async (req, res, next) => {
        try {
            let id = req.params.templateId;
            req.courseTemplate.doc(id).get().then(async (data) => {
                let response = data.data();
                response['id'] = id;
                res.send({
                    status: 1,
                    data: response
                })
            });
        } catch (error) {
            console.log(error);

            res.send(error)
        }
    },

    getTemplateByUser: async (req, res, next) => {
        try {
            let teamsRef = await req.team.where('admins', 'array-contains', req.user.uid).get();
            let teams = []
            let templateProcess = []
            if (teamsRef.empty) {
                res.send({ status: 1, data: [], message: "logged in user not associated with any team" })
            } else {
                teamsRef.forEach(doc => {
                    let data = doc.data();
                    data['id'] = doc.id
                    templateProcess.push(getTemplateByTeamId(doc.id, req.courseTemplate));
                    teams.push(data);
                });
            }
            Promise.all(templateProcess).then((response) => {
                let templates = []
                response.forEach(val => {
                    templates.push(...val);
                })

                res.send({ status: 1, data: templates })
            })

        } catch (error) {
            console.log(error);
        }
    }
}
