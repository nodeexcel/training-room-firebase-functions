module.exports.getUserRole = (userRole, roles, Uid) => {
    return new Promise((resolve, reject) => {
        try {
            let userRef = userRole.doc(Uid);
            userRef.get().then(doc => {
                if (!doc.exists) {
                    console.log('No such document!');
                    resolve(nulll)
                } else {
                    roles.doc(doc.data().role).get().then((data) => {
                        if (!doc.exists) {
                            console.log('No such document!');
                            resolve(null)
                        } else {
                            resolve(data.data().name)
                        }
                    }).catch(err => {
                        reject(err)
                    })
                }
            }).catch(err => {
                reject(err)
            })
        } catch (error) {
            throw error
        }
    })
}