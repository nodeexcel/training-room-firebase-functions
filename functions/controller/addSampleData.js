const uuid = require('uuid');

module.exports = {
    addSampleData: async (req, res, next) => {
        try {
            let data = req.body;

            let setDoc = await req.admin.firestore().collection('userdetails').doc('FCwdQEHm6bRIU7o3wS1kCzIgLsG3').set(data);

            res.send({
                status: 1,
                message: "New data is stored",
                data: data
            })
        } catch (error) {            
            res.send(error)
        }
    },
}