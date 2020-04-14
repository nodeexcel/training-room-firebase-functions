const uuid = require('uuid');
const fs = require('fs');
const Busboy = require('busboy');
var serviceAccount = require("../AuthFirebase.json");
const path = require('path');
module.exports = {
    uploadVideo: async (req, res, next) => {
        try {
            const busboy = new Busboy({
                headers: req.headers
            });

            let bucket = req.admin.storage().bucket(serviceAccount.storageUrl)
            let filepath = ""
            let fileMime = ""
            let name = ""
            // This callback will be invoked for each file uploaded
            busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
                filepath = path.join(__dirname, '../uploads/' + filename);
                fileMime = mimetype
                name = filename
                await file.pipe(fs.createWriteStream(filepath));
            });

            // This callback will be invoked after all uploaded files are saved.
            busboy.on('finish', async () => {
                bucket.upload(filepath, {
                    destination: '/videos/' + name,
                    public: true,
                    metadata: {
                        contentType: fileMime,
                        cacheControl: "public, max-age=300"
                    }
                }, async (err, response) => {
                    if (!err) {
                        fs.unlink(filepath, async (err) => {
                            if (!err) {
                                await req.admin.auth().updateUser(req.user.user_id, {
                                    photoURL: response.metadata.mediaLink
                                })
                                res.send({
                                    data: response.metadata,
                                    message: "File SuccessFully Uploaded"
                                })
                            }
                        })
                    } else {
                        throw err
                    }
                });
            });

            busboy.end(req.rawBody);
        } catch (error) {            
            res.send(error)
        }
    }
}