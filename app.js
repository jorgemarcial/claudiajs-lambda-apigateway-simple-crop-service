var ApiBuilder = require('claudia-api-builder'),
AWS = require('aws-sdk'),
S3 = new AWS.S3({
  signatureVersion: 'v4',
}),
Sharp = require('sharp')
api = new ApiBuilder();

module.exports = api;

api.post('/crop', function (request) {
    'use strict';
    let crops = request.body.crops
    let bucket = request.body.bucket
    let fileKey = request.body.fileKey

    return S3.getObject({Bucket: bucket, Key: fileKey}).promise()
        .then(
            file => Promise.all(crops.map(_crop => {
                return Sharp(file.Body)
                .resize(_crop.width, _crop.height)
                .toFormat(_crop.format)
                .toBuffer()
                .then(_buffer => {
                    return { 
                        config: _crop,
                        buffer: _buffer
                    }
                })
            }))
        )
        .then(_croppedFiles => {
            return Promise.all(_croppedFiles.map(_cropFile => {
                return  S3.putObject({
                    Body: _cropFile.buffer,
                    Bucket: bucket,
                    ContentType: _cropFile.config.contentType,
                    Key: _cropFile.config.folder+fileKey
                }).promise()                        
            }))

        })
        .then()
        .catch(err => console.log(err))
        
}, { success: 200 });