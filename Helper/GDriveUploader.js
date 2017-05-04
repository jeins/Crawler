'use strict';

const fs = require('fs');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const OAuth2 = google.auth.OAuth2;
const path = require('path');
const request = require('request');
const async = require('async');
const readline = require('readline');
const _ = require('lodash');
const logger = require('./Logger');

let imgNameWithTyp, imgTyp, _url, _folderName, _fileName;
const tmpPath = path.resolve(__dirname) + '/../.tmp/';
const gDriveTokenPath = tmpPath + 'gdrive_secret.json';
const gDriveScopes = ['https://www.googleapis.com/auth/drive'];
const gDriveApiVersion = 'v3';

exports.uploadImg = (url, folderName, fileName, cb) => {
    _url = url;
    _fileName = fileName;
    _folderName = folderName;

    try {
        fs.mkdirSync(tmpPath);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }

    async.waterfall([
        _downloadImageToTmp,
        _prepareUploader,
        _getFolderId,
        _uploadImgToGDrive,
        _getImageUrl,
        _cleanUp
    ], cb);
};

/**
 * prepare gdrive oauth token
 * @param callback
 * @private
 */
function _prepareUploader(callback) {
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
    );

    // Check if we have previously stored a token.
    fs.readFile(gDriveTokenPath, function (err, token) {
        if (err) {
            _getNewToken(oauth2Client, (result) => {
                callback(null, result);
            });
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(null, oauth2Client);
        }
    });
}

/**
 * get oauth token to access gdrive
 * @param oauth2Client
 * @param callback
 * @private
 */
function _getNewToken(oauth2Client, callback) {
    let authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: gDriveScopes
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function (code) {
        rl.close();
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                logger.log('error', 'error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            fs.writeFile(gDriveTokenPath, JSON.stringify(token), (err) => {
                if (err) throw err;

                callback(oauth2Client);
            });
        });
    });
}

/**
 * upload image to gdrive
 * @param auth
 * @param folderId
 * @param cb
 * @private
 */
function _uploadImgToGDrive(auth, folderId, cb) {
    let drive = google.drive({version: gDriveApiVersion, auth: auth});
    drive.files.create({
        resource: {
            name: imgNameWithTyp,
            mimeType: imgTyp,
            parents: [folderId]
        },
        media: {
            mimeType: imgTyp,
            body: fs.createReadStream(tmpPath + imgNameWithTyp)
        }
    }, (err, result) => {
        if (err) {
            logger.log('error', 'error on uploading image to drive, error message: %s', err.message);
            cb(err, null);
        } else {
            cb(null, auth, result.id);
        }
    });
}

/**
 * download the image, than save on tmp
 * @param cb
 * @private
 */
function _downloadImageToTmp(cb) {
    request.head(_url, function (err, res, body) {
        if (err) {
            return cb(err.message, null);
        }

        imgTyp = res.headers['content-type'];
        let typ = imgTyp.split('/');
        imgNameWithTyp = _fileName + '.' + typ[1];

        request(_url).pipe(fs.createWriteStream(tmpPath + imgNameWithTyp)).on('close', (error, result) => {
            if (error) {
                logger.log('error', 'error on downloading image from url: %s', _url);
                cb(err);
            } else {
                cb(null);
            }
        });
    });
}
/**
 * remove uploaded image from tmp
 * @param arg
 * @param cb
 * @private
 */
function _cleanUp(imgUrl, cb) {
    fs.unlink(tmpPath + imgNameWithTyp, (err) => {
        if (err) {
            logger.log('error', 'error on removing image on tmp path, error message: %s', err.message);
            cb(err, null);
        } else {
            cb(null, {done: true, imgName: imgNameWithTyp, imgUrl: imgUrl});
        }
    });
}

/**
 * get folder id by name
 * if not exist create it
 * @param auth
 * @param cb
 * @private
 */
function _getFolderId(auth, cb) {
    let drive = google.drive({version: gDriveApiVersion, auth: auth});
    let findFolder = (callback) => {
        drive.files.list({
            q: "name='" + _folderName + "' and mimeType='application/vnd.google-apps.folder'",
            fields: 'nextPageToken, files(id, name)',
            spaces: 'drive'
        }, (err, res) => {
            if (err) callback(err, null);
            else callback(null, res);
        });
    };
    let createFolder = (callback) => {
        drive.files.create({
            resource: {
                'name': _folderName,
                'mimeType': 'application/vnd.google-apps.folder'
            },
            fields: 'id'
        }, (err, file) => {
            if (err) callback(err, null);
            else callback(null, file.id);
        });
    };

    findFolder((err, res) => {
        if (err) return cb(err.message, null);
        if (!_.isEmpty(res.files)) return cb(null, auth, res.files[0].id);

        createFolder((err, folderId) => {
            if (err) return cb(err.message, null);
            cb(null, auth, folderId);
        });
    });
}

/**
 * get image url, change the image permissions on gdrive
 * @param auth
 * @param imgId
 * @param cb
 * @private
 */
function _getImageUrl(auth, imgId, cb) {
    let drive = google.drive({version: gDriveApiVersion, auth: auth});

    drive.permissions.create({
        resource: {
            'type': 'anyone',
            'role': 'reader'
        },
        fileId: imgId,
        fields: 'id',
    }, (err, res) => {
        if (err) cb(err, null);
        else cb(null, 'https://drive.google.com/open?id=' + imgId);
    });
}