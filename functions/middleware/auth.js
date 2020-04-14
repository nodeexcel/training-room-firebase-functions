const userRole = require('../services/getUserRole')

module.exports = {
    verifyUser: (req, res, next) => {
        try {
            req.admin.auth().verifyIdToken(req.headers.authorization, true)
                .then(async (decodedToken) => {
                    req.user = decodedToken;
                    // req.user['role'] = await userRole.getUserRole(req.userRoles, req.role, req.user.uid)
                    return next()
                }).catch((error) => { 
                    console.log(error);
                                       
                    return res.status(402).send(error)
                });
        } catch (error) {
            return res.status(402).send(error)
        }
    }
}