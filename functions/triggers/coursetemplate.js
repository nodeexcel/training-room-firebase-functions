
const updateCourse = async (newData, courseId, course) => {
    return new Promise(async (resolve, reject) => {
        await course.doc(courseId).update(newData);
        resolve('true')
    })
}


module.exports.updateCourseTemplateTrigger = async (newData, oldData, templateId, course) => {
    return new Promise((resolve, reject) => {
        course.where('templateId', '==', templateId).get().then(snapshot => {
            if (snapshot.empty) {
                resolve();
            }
            let courseData = []
            snapshot.forEach(doc => {
                let element = doc.data();
                element['courseData'] = newData;
                courseData.push(updateCourse(element, doc.id, course))
            });
            Promise.all(courseData).then((response) => {
                resolve('true')
            })
        })
    })
}