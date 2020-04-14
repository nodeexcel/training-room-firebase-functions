const uuid = require('uuid');
const fs = require('fs');
const Busboy = require('busboy');
var serviceAccount = require("../AuthFirebase.json");
const path = require('path');
var multiparty = require('multiparty');

module.exports = {
    addCourse: async (req, res, next) => {
        try {
            let uid = uuid.v4()
            let response = await req.course.doc(uid).set(req.body);
            req.body['id'] = uid;
            res.send({
                status: 1,
                message: "Course added Successfully",
                data: req.body
            });
        } catch (error) {
            console.log(error);
            
            res.send(error)
        }
    },  

    getAllCourses: async (req, res, next) => {
        try {
            let teamsRef = await req.course.get();
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
            res.status(400).send(error)
        }
    },
    
    updateCourse: async (req, res, next) => {
        try {
            let id = req.body.id;
            delete req.body.id;
            let response = await req.course.doc(id).update(req.body);
            res.send({
                status: 1,
                message: "template updated successfully"
            })
        } catch (error) {
            res.send(error)
        }
    },

    getCourseDetailsById: async (req, res, next) => {
        try {
            req.course.doc(req.params.courseId).get().then(async (data) => {
                let response = data.data();
                response['id'] = req.params.courseId;
                res.send({
                    status: 1,
                    data: response
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