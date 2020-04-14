var _ = require('lodash');
var util = require('util')

const updateUserAdminDetails = async (uid, userdetails, teamData, teamid, admin) => {
    return new Promise((resolve, reject) => {
        userdetails.doc(uid).get().then(async (userDetailsData) => {
            if (!userDetailsData.data()) {
                let userData = {
                    active: true,
                    courses: {},
                    dashboard: {
                        last10teamedits: [],
                        last5usersadded: [],
                        usersonhold: [],
                        last5courseedits: []
                    },
                    courselist: [],
                    teamsnest: {},
                    teamslist: {},
                    teamsadminlist: [],
                    teamsadminnest: {}
                }
                userData['teamsadminlist'].push(teamid)

                userData['teamsadminnest'][teamid] = teamData
                await userdetails.doc(uid).set(userData);
                resolve('true')
            } else {
                let doc = userDetailsData.data();
                if (doc.teamsadminlist && doc.teamsadminlist.length) {
                    doc['teamsadminlist'].push(teamid)
                } else {
                    doc['teamsadminlist'] = []
                    doc['teamsadminlist'].push(teamid)
                }

                if (!doc['teamsadminnest'])
                    doc['teamsadminnest'] = {}

                doc['teamsadminnest'][teamid] = teamData
                doc['teamsadminlist'] = _.uniq(doc.teamsadminlist)
                await userdetails.doc(uid).set(doc);
                resolve('true')
            }
        }).catch(err => {
            console.log(err);

        })
    })
}

const updateUserDetailsForRemovedUser = async (uid, userdetails, teamid) => {
    return new Promise((resolve, reject) => {
        userdetails.doc(uid).get().then(async (userDetailsData) => {
            let doc = userDetailsData.data();
            doc['teamsadminlist'] = doc['teamsadminlist'].filter(val => val != teamid)
            doc["teamslist"] = doc['teamslist'].filter(val => val != teamid)
            delete doc['teamsnest'][teamid]
            delete doc['teamsadminnest'][teamid]
            await userdetails.doc(uid).update(doc);
            resolve('true')
        })
    })
}

module.exports.createTrigger = async (data, userdetails, teams, teamid) => {
    return new Promise(async (resolve, reject) => {
        try {
            let membersAdminList = data.admins;
            let memberTraineeList = Object.keys(data.trainees);
            let processArray = []
            if (data.parent) {
                teams.doc(data.parent).get().then(async (parentTeam) => {
                    let parentTeamData = parentTeam.data();
                    data['admins'].push(...parentTeamData.admins);
                    if (!parentTeamData.root) {
                        data['root'] = data.parent;
                    } else {
                        data['root'] = parentTeamData.root;
                    }
                    data['admins'] = _.uniq(data['admins'])
                    Object.keys(data.trainees).forEach(val => {
                        let arrayData = []
                        arrayData.concat(data.trainees[val].derived)
                        arrayData.push(teamid)
                        parentTeamData.trainees[val] = {
                            role: data.trainees[val].role,
                            derived: arrayData
                        }
                    })
                    await teams.doc(teamid).update(data);
                    await teams.doc(data.parent).update(parentTeamData)
                    let processArrayAdmin = []
                    data.admins.forEach(val => {
                        processArrayAdmin.push(updateUserForAdmins(teams, val, data, teamid, userdetails))
                    })
                    memberTraineeList.forEach(element => {
                        processArray.push(updateUserTraineeDetails(teams, element, userdetails, data, teamid, true))
                    });
                    Promise.all(processArray).then((response) => {
                        Promise.all(processArrayAdmin).then((response) => {
                            resolve('done')
                        }).catch(err => {
                            console.log(err)
                        })
                    }).catch(err => {
                        console.log(err)
                    })
                })
            } else {
                membersAdminList.forEach(element => {
                    processArray.push(updateUserAdminDetails(element, userdetails, data, teamid, true))
                });

                Promise.all(processArray).then((response) => {
                    processArray = []
                    memberTraineeList.forEach(element => {
                        processArray.push(updateUserTraineeDetails(teams, element, userdetails, data, teamid, true))
                    });
                    Promise.all(processArray).then((response) => {
                        resolve('done')
                    })
                })
            }
        } catch (error) {
            console.log(error);
        }
    })
}

// update team work

const getParentTeamId = (teams, teamId, nestArray, callback) => {
    try {
        teams.doc(teamId).get().then((teamRef) => {
            let teamData = teamRef.data();
            if (teamData.parent) {
                nestArray.push(teamId)
                getParentTeamId(teams, teamData.parent, nestArray, callback)
            } else {
                nestArray.push(teamId)
                callback(nestArray)
            }
        })
    } catch (error) {
        console.log(error);
    }
}

function unflatten(arr) {
    var tree = [],
        mappedArr = {},
        arrElem,
        mappedElem;

    // First map the nodes of the array to an object -> create a hash table.
    for (var i = 0, len = arr.length; i < len; i++) {
        arrElem = arr[i];
        mappedArr[arrElem.id] = arrElem;
        mappedArr[arrElem.id]['children'] = {};
    }


    for (var id in mappedArr) {
        if (mappedArr.hasOwnProperty(id)) {
            mappedElem = mappedArr[id];
            // If the element is not at the root level, add it to its parent array of children.
            if (mappedElem.parent) {
                let parent = mappedElem.parent;
                mappedArr[parent]['children'][mappedElem.id] = mappedElem;
            }
            // If the element is at the root level, add it to first level elements array.
            else {
                tree.push(mappedElem);
            }
        }
    }
    return tree;
}


const teamNestByTeamId = (teams, teamId, finalData, callback) => {
    try {
        teams.doc(teamId).get().then((parentTeamRef) => {
            teams.where("root", "==", teamId).get().then(async (teamsRef) => {
                let ParentData = parentTeamRef.data();
                ParentData['id'] = teamId;
                if (teamsRef.empty) {
                    finalData[teamId] = ParentData
                    callback(finalData)
                } else {
                    let data = [];

                    teamsRef.forEach(element => {
                        let object = element.data()
                        object['id'] = element.id;
                        data.push(object)
                    });
                    data.push(ParentData)
                    let teamNestData = await unflatten(data, ParentData, [])
                    finalData[teamId] = teamNestData[0];
                    callback(finalData)

                }
            })
        })
    } catch (error) {
        console.log(error);
    }
}

const removeExistingRootData = (root, data) => {
    return new Promise((resolve, reject) => {
        let teamsNest = Object.keys(data)
        teamsNest.forEach(val => {
            if (data[val].root == root || data[val].id == root) {
                delete data[val]
            }
        })
        resolve(data)
    })
}
const updateUserForAdmins = (teams, uid, teamData, teamid, userDetails) => {
    return new Promise((resolve, reject) => {
        try {
            userDetails.doc(uid).get().then(async (userData) => {
                if (userData.data()) {
                    let teamsadminlist = userData.data().teamsadminlist;
                    let teamsadminnest = userData.data().teamsadminnest;

                    teamsadminlist.push(teamid);
                    teamsadminlist = _.uniq(teamsadminlist)
                    let data = userData.data()
                    data['teamsadminlist'] = teamsadminlist;
                    if (!data.teamsadminnest) {
                        data['teamsadminnest'] = {}
                    }
                    let root = teamData.root ? teamData.root : teamid
                    teamNestByTeamId(teams, root, {}, async function (response) {
                        if (response && Object.keys(data.teamsadminnest).length) {
                            data["teamsadminnest"] = await removeExistingRootData(root, data.teamsadminnest);
                        }
                        createNest(response, uid, async function (response) {
                            data['teamsadminnest'][response.teamid] = response.data[response.teamid];
                            await userDetails.doc(uid).update({ teamsadminlist: teamsadminlist, teamsadminnest: data['teamsadminnest'] })
                            resolve("Done 2")
                        })
                    });
                } else {
                    let data = {
                        active: true,
                        courses: {},
                        dashboard: {
                            last10teamedits: [],
                            last5usersadded: [],
                            usersonhold: [],
                            last5courseedits: []
                        },
                        courselist: [],
                        teamsnest: {},
                        teamslist: {},
                        teamsadminlist: [],
                        teamsadminnest: {}
                    }

                    data.teamsadminlist.push(teamid);
                    if (!data.teamsadminnest) {
                        data['teamsadminnest'] = {}
                    }
                    let root = teamData.root ? teamData.root : teamid
                    teamNestByTeamId(teams, root, {}, async function (response) {
                        if (response && Object.keys(data.teamsadminnest).length) {
                            data["teamsadminnest"] = await removeExistingRootData(root, data.teamsadminnest);
                        }
                        createNest(response, uid, async function (response) {
                            data['teamsadminnest'][response.teamid] = response.data[response.teamid];
                            await userDetails.doc(uid).set(data)
                            resolve("Done 1")
                        })
                    });
                }
            })
        } catch (error) {
            console.log(error);
        }
    })
}

const updateUserTraineeDetails = async (teams, uid, userdetails, teamData, teamid, admin) => {
    return new Promise((resolve, reject) => {
        try {
            userdetails.doc(uid).get().then(async (userDetailsData) => {
                if (!userDetailsData.data()) {
                    let userData = {
                        active: true,
                        courses: {},
                        dashboard: {
                            last10teamedits: [],
                            last5usersadded: [],
                            usersonhold: [],
                            last5courseedits: []
                        },
                        courselist: [],
                        teamsnest: {},
                        teamslist: {},
                        teamsadminlist: [],
                        teamsadminnest: {}
                    }
                    userData['teamslist'][teamid] = teamData.trainees[uid];

                    userData['teamsnest'][teamid] = teamData
                    await userdetails.doc(uid).set(userData);
                    resolve('true')
                } else {
                    let doc = userDetailsData.data();
                    doc['teamslist'][teamid] = teamData.trainees[uid];
                    let root = teamData.root ? teamData.root : teamid
                    teamNestByTeamId(teams, root, {}, async function (response) {
                        if (response && Object.keys(data.teamsadminnest).length) {
                            data["teamsnest"] = await removeExistingRootData(root, data.teamsadminnest);
                        }
                        createNestForTrainee(response, uid, async function (response) {
                            doc['teamsnest'][response.teamid] = response.data[response.teamid];
                            await userdetails.doc(uid).update({ teamslist: doc.teamslist, teamsnest: doc.teamsnest });
                            resolve('true')
                        });
                    })

                }
            })
        } catch (error) {
            console.log(error);
        }
    })
}

const removeAdminFromTeam = async (teams, uid, userdetails, teamData, teamId) => {
    return new Promise(async (resolve, reject) => {
        try {
            userdetails.doc(uid).get().then(async (response) => {
                let data = response.data()
                data['teamsadminlist'] = _.remove(response.teamsadminlist, function (n) {
                    return n !== teamId;
                })
                delete data['teamsadminnest'][teamId];

                await userdetails.doc(uid).update({ teamsadminlist: data.teamsadminlist, teamsadminnest: data.teamsadminnest });

                resolve()
            })
        } catch (error) {
            console.log(error);
        }
    })
}

const removeTraineeFromTeam = async (teams, uid, userdetails, teamData, teamId) => {
    return new Promise(async (resolve, reject) => {
        try {
            userdetails.doc(uid).get().then(async (response) => {
                let data = response.data()
                delete data.teamslist[teamId];
                delete data.teamsnest[teamId];
                await userdetails.doc(uid).update({ teamslist: data.teamslist, teamsnest: data.teamsnest });

                resolve()
            })
        } catch (error) {
            console.log(error);
        }
    })
}
var fun = async function (temp1, uid, teamid) {
    return new Promise((resolve, reject) => {
        try {
            let keys = Object.keys(temp1);
            keys.forEach((key, i) => {
                if (temp1[key].admins.indexOf(uid) > -1 ) {
                    resolve({ data: temp1, status: true, teamid: key })
                } else {
                    if (keys.length - 1 == i) {
                        if (Object.keys(temp1[key].children).length)
                            resolve({ data: temp1[key].children, status: false })
                        else
                            resolve({ data: null, status: true })
                    }
                }
            })
        } catch (error) {
            console.log(error);
        }
    })
}
let createNest = async (data, uid,teamid, callback) => {
    try {
        let response = await fun(data, uid, teamid)
        if (response.status) {
            callback(response)
        } else {
            createNest(response.data, uid, callback)
        }
    } catch (error) {
        console.log(error);
    }
}

var funTrainee = async function (temp1, uid) {
    return new Promise((resolve, reject) => {
        try {
            let keys = Object.keys(temp1);
            keys.forEach((key, i) => {
                if (temp1[key].trainees[uid] && !temp1[key].trainees[uid].derived) {
                    resolve({ data: temp1, status: true, teamid: key })
                } else {
                    if (keys.length - 1 == i) {
                        if (Object.keys(temp1[key].children).length)
                            resolve({ data: temp1[key].children, status: false })
                        else
                            resolve({ data: null, status: true })
                    }
                }
            })
        } catch (error) {
            console.log(error);
        }
    })
}

let createNestForTrainee = async (data, uid, callback) => {
    try {
        let response = await funTrainee(data, uid)
        if (response.status) {
            callback(response)
        } else {
            createNestForTrainee(response.data, uid, callback)
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports.updateTeamTrigger = async (newData, oldData, teamid, teams, userDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            let removedAdmins = _.difference(oldData.admins, newData.admins);
            let addedAdmins = _.difference(newData.admins, oldData.admins);
            let memberTraineeList = Object.keys(newData.trainees);
            let oldMemberTraineeList = Object.keys(oldData.trainees);
            let removedTraineeList = _.difference(oldMemberTraineeList, memberTraineeList);
            let addedTraineeList = _.difference(memberTraineeList, oldMemberTraineeList);
            let processArrayAdmin = []
            let processArrayTrainee = [];
            let processArrayRemovedAdmins = [];

            // running for added admins
            if (addedAdmins.length) {
                addedAdmins.forEach(val => {
                    processArrayAdmin.push(updateUserForAdmins(teams, val, newData, teamid, userDetails))
                })
                console.log('====================================');
                console.log("added Admins", newData.admins);
                console.log('====================================');
            }
            // running for added Trainee list
            if (addedTraineeList.length) {
                addedTraineeList.forEach(val => {
                    processArrayTrainee.push(updateUserTraineeDetails(teams, val, userDetails, newData, teamid, false))
                })
                console.log('====================================');
                console.log("added Trainee", addedTraineeList);
                console.log('====================================');
            }

            if (removedAdmins.length) {
                removedAdmins.forEach(val => {
                    processArrayRemovedAdmins.push(removeAdminFromTeam(teams, val, userDetails, newData, teamid))
                })
                console.log('====================================');
                console.log("Removed Admins", removedAdmins);
                console.log('====================================');
            }

            let processArrayRemovedTrainee = []
            if (removedTraineeList.length) {
                removedTraineeList.forEach(val => {
                    if (val)
                        processArrayRemovedTrainee.push(removeTraineeFromTeam(teams, val, userDetails, newData, teamid))
                })

                console.log('====================================');
                console.log("Removed trainee", removedTraineeList);
                console.log('====================================');
            }

            Promise.all(processArrayAdmin).then((response) => {
                Promise.all(processArrayTrainee).then((response) => {
                    Promise.all(processArrayRemovedAdmins).then((response) => {
                        Promise.all(processArrayRemovedTrainee).then((response) => {
                            resolve()
                        }).catch(err => {
                            reject(err)
                        })
                    }).catch(err => {
                        reject(err)
                    })
                }).catch(err => {
                    reject(err)
                })
            }).catch(err => {
                reject(err)
            })
        } catch (error) {

        }
    })
}

module.exports.deleteTeamTrigger = async (data, teamId, userDetails, teams) => {
    return new Promise((resolve, reject) => {
        let teamData = JSON.parse(JSON.stringify(data))
        let admins = teamData.admins;
        let trainees = Object.keys(teamData.trainees);

        let membersList = [...admins, ...trainees];
        let processArray = []
        membersList.forEach(element => {
            processArray.push(updateUserDetailsForRemovedUser(element, userDetails, teamId))
        });

        Promise.all(processArray).then((response) => {
            resolve('done')
        });
    })
}