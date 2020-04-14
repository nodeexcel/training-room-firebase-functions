
// call when new team is created
const _ = require('lodash');
module.exports.createTrigger = async (data, userdetails, teams, teamid) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.parent) {

                // if parent doesn't exist in new team update triggerignore to false and set root as his id
                let adminsArray = Object.keys(data.admins);
                adminsArray.forEach(val => {
                    data['admins'][val] = { triggerignore: false }
                })
                await teams.doc(teamid).update({ root: teamid, admins: data.admins, updatedAt: new Date() })
                resolve("Done")
            } else {
                teams.doc(data.parent).get().then(async (parentTeam) => {
                    // get admins of parent team 
                    let parentTeamData = parentTeam.data();
                    let adminsArray = Object.keys(parentTeamData.admins);
                    adminsArray.forEach(val => {
                        data['admins'][val] = { triggerignore: false }
                    })
                    if (!parentTeamData.root) {
                        data['root'] = data.parent;
                    } else {
                        data['root'] = parentTeamData.root;
                    }

                    //updating trainees to parent team
                    Object.keys(data.trainees).forEach(val => {
                        let arrayData = []
                        arrayData.concat(data.trainees[val].derived)
                        arrayData.push(teamid)
                        parentTeamData.trainees[val] = {
                            role: data.trainees[val].role,
                            derived: arrayData
                        }
                    })

                    data['updatedAt'] = (new Date()).getTime()
                    parentTeamData['updatedAt'] = new Date()

                    //updating added team with parent admins
                    await teams.doc(teamid).update(data);
                    // updating the parent with newly added trainee
                    await teams.doc(data.parent).update(parentTeamData);
                    resolve()
                })
            }
        } catch (error) {
            console.log(error);
        }
    })
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

var filterNestForAdmins = async function (temp1, uid) {
    return new Promise((resolve, reject) => {
        try {
            let keys = Object.keys(temp1);
            keys.forEach((key, i) => {
                if (temp1[key].admins[uid]) {
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


var filterNestForTrainees = async function (temp1, uid) {
    return new Promise((resolve, reject) => {
        try {
            let keys = Object.keys(temp1);
            keys.forEach((key, i) => {
                if (temp1[key].trainees[uid]) {
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


const checkIfParentNestExist = async (teams, teamsArray, teamid, callback) => {
    if (_.includes(teamsArray, teamid)) {
        callback(true)
    } else {
        let teamref = await teams.doc(teamid).get()
        let teamData = teamref.data();
        if (teamData.parent !== "" || !teamData.parent) {
            callback(false)
        } else {
            checkIfParentNestExist(teams, teamsArray, teamData.parent, callback)
        }
    }
}

let createNestForAdmins = async (data, uid, callback) => {
    try {
        let response = await filterNestForAdmins(data, uid)
        if (response.status) {
            callback(response)
        } else {
            createNestForAdmins(response.data, uid, callback)
        }
    } catch (error) {
        console.log(error);
    }
}

let createNestForTrainee = async (data, uid, callback) => {
    try {
        let response = await filterNestForTrainees(data, uid)
        if (response.status) {
            callback(response)
        } else {
            createNestForTrainee(response.data, uid, callback)
        }
    } catch (error) {
        console.log(error);
    }
}

const updateUserForAdmins = (teams, uid, teamData, teamid, userDetails) => {
    return new Promise((resolve, reject) => {
        try {
            userDetails.doc(uid).get().then(async (userData) => {
                if (userData.data()) {
                    let teamsadminlist = userData.data().teamsadminlist;
                    let teamsadminnest = userData.data().teamsadminnest;
                    // if the updated team have some parent already exist in userdetails adminslist 
                    checkIfParentNestExist(teams, teamsadminlist, teamid, function (response) {
                        if (response) {
                            resolve()
                        } else {
                            teamsadminlist.push(teamid);
                            teamsadminlist = _.uniq(teamsadminlist)
                            let data = userData.data()
                            data['teamsadminlist'] = teamsadminlist;
                            if (!data.teamsadminnest) {
                                data['teamsadminnest'] = {}
                            }
                            let root = teamData.root ? teamData.root : teamid
                            //creating nested list of a root team
                            teamNestByTeamId(teams, root, {}, async function (response) {
                                createNestForAdmins(response, uid, async function (response) {
                                    data['teamsadminnest'][response.teamid] = response.data[response.teamid];
                                    await userDetails.doc(uid).update({ teamsadminlist: teamsadminlist, teamsadminnest: data['teamsadminnest'] })
                                    resolve("Done 2")
                                })
                            });
                        }
                    })

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
                        createNest(response, uid, async function (response) {
                            data['teamsadminnest'][response.teamid] = response.data[response.teamid];
                            console.log('====================================');
                            console.log(response);
                            console.log('====================================');
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


const removeAdminFromTeam = async (uid, userdetails, teamId) => {
    return new Promise(async (resolve, reject) => {
        try {
            userdetails.doc(uid).get().then(async (response) => {
                let data = response.data()
                delete data['teamsadminnest'][teamId];
                delete data['teamsadminlist'][teamId];
                await userdetails.doc(uid).update({ teamsadminlist: data.teamsadminlist, teamsadminnest: data.teamsadminnest });

                resolve()
            })
        } catch (error) {
            console.log(error);
        }
    })
}


const updateUserTraineeDetails = async (teams, uid, userdetails, teamData, teamid) => {
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


// const updateParentTeam = (teams, uid, )
module.exports.updateTeamTrigger = async (newData, oldData, teamid, teams, userDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            // fetching all list of admins in updated teams
            let adminsData = Object.keys(newData.admins);
            let oldAdminsData = Object.keys(oldData.admins);

            // list of removed admins in updated team
            let removedAdmins = _.difference(oldAdminsData, adminsData);

            let listOfAdmins = adminsData.filter(val => {
                return newData.admins[val].triggerignore == false
            })

            let traineesData = Object.keys(newData.trainees).filter(val => {
                return (!newData.trainees[val].derived || (newData.trainees[val].derived.length <= 0))
            });

            let processArray = [];
            if (newData.parent) {
                let parentTeamRef = await teams.doc(newData.parent).get();
                let parentTeamData = parentTeamRef.data();
                let parentAdmins = Object.keys(parentTeamData.admins);
                let newDataAdmins = Object.keys(newData.admins);
                parentAdmins.forEach(val => {
                    if (!_.includes(newDataAdmins, val)) {
                        newData.admins[val] = { triggerignore: false }
                    }
                })


                Object.keys(newData.trainees).forEach(val => {
                    if (newData.trainees[val].derived && newData.trainees[val].derived.length) {
                        if (parentTeamData.trainees[val]) {
                            let derivedTeams = [...parentTeamData.trainees[val].derived, ...newData.trainees[val].derived]
                            parentTeamData.trainees[val]['derived'] = _.uniq(derivedTeams)
                        } else {
                            parentTeamData.trainees[val] = { role: newData.trainees[val].role, derived: newData.trainees[val].derived }
                        }
                    } else {
                        parentTeamData.trainees[val] = { role: newData.trainees[val].role, derived: [teamid] }
                    }
                })

                if (!_.isEqual(parentTeamData, parentTeamRef.data()))
                    await teams.doc(newData.parent).update(parentTeamData)

            }

            if (listOfAdmins.length) {
                listOfAdmins.forEach(val => {
                    processArray.push(updateUserForAdmins(teams, val, newData, teamid, userDetails))
                })
            }



            if (removedAdmins.length) {
                removeAdmin.forEach(val => {
                    processArray.push(removeAdminFromTeam(val, userDetails, teamid))
                })
            }

            if (traineesData.length) {
                trainessProcessArray = [];
                traineesData.forEach(val => {
                    processArray.push(updateUserTraineeDetails(teams, val, userDetails, newData, teamid))
                })

            }

            await Promise.all(processArray)
            await teams.doc(teamid).update(newData);
            resolve()

        } catch (error) {
            console.log('====================================');
            console.log(error);
            console.log('====================================');
        }
    })
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