module.exports.createCourseTrigger   = async (data, userdetails, courseId) => {
    return new Promise((resolve, reject) => {
        let course = JSON.parse(JSON.stringify(data))
        let userId = course.UID;
        userdetails.doc(userId).get().then(async (userDetailsData) => {
            let doc = userDetailsData.data();
            doc['courses'][courseId] = data;
            doc['courselist'].push(courseId);
            await userdetails.doc(userId).update(doc);
            resolve('true')
        })
    })
}


module.exports.updateCourseTrigger = async (newData, oldData, courseId, userdetails) => {
    return new Promise((resolve, reject) => {
        if (newData.UID == oldData.UID) {
            userdetails.doc(newData.UID).get().then(async (userDetailsData) => {
                let doc = userDetailsData.data();
                doc['courses'][courseId] = newData;
                await userdetails.doc(newData.UID).update(doc);
                resolve('true')
            })
        } else {
            if (newData.UID) {
                userdetails.doc(newData.UID).get().then(async (userDetailsData) => {
                    let doc = userDetailsData.data();
                    doc['courses'][courseId] = newData;
                    doc['courselist'].push(courseId);
                    await userdetails.doc(newData.UID).update(doc);
                    if(oldData.UID){
                        userdetails.doc(oldData.UID).get().then(async (userDetailsData) => {
                            let doc = userDetailsData.data();
                            delete doc['courses'][courseId];
                            doc['courselist'] = doc['courselist'].filter(val => val != courseId)
                            await userdetails.doc(oldData.UID).update(doc);
                            resolve('true')
                        })
                    }else{
                        resolve('true')
                    }
                })
            } else {
                userdetails.doc(oldData.UID).get().then(async (userDetailsData) => {
                    let doc = userDetailsData.data();
                    delete doc['courses'][courseId];
                    doc['courselist'] = doc['courselist'].filter(val => val != courseId)
                    await userdetails.doc(oldData.UID).update(doc);
                    resolve('true')
                })
            }
        }
    })
}