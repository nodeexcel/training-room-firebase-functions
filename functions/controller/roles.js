const uuid = require('uuid');

module.exports = {
    createRole: async (req, res, next) => {
        try {
            let data = {
                name: req.body.name,
                createdBy: req.user.uid,
                active: true
            }

            let setDoc = await req.role.doc(uuid.v4()).set(data);

            res.send({
                status: 1,
                message: "New Role Is Added"
            })
        } catch (error) {
            res.send(error)
        }
    },

    getRoles: async (req, res, next) => {
        try {
            let teamsRef = await req.role.get();
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
        } catch (error) {
            res.send(error)
        }
    },
}