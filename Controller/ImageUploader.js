'use strict';

const fs = require('fs');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const OAuth2 = google.auth.OAuth2;
const path = require('path');
const request = require('request');
const async = require('async');
const logger = require('../Helper/Logger');
var readline = require('readline');

let imgNameWithTyp, imgTyp, _url, _fileName;
const tmpPath = path.resolve(__dirname) + '/../.tmp/';
const gDriveTokenPath = tmpPath + 'gdrive_secret.json';
const gDriveScopes = ['https://www.googleapis.com/auth/drive'];

exports.upload = (url, fileName, cb)=>{
    _url = url; _fileName = fileName;

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
        _upload,
        _removeTmpImg
    ], cb);
};

function _prepareUploader(arg, callback)
{
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
    );

    // Check if we have previously stored a token.
    fs.readFile(gDriveTokenPath, function(err, token) {
        if (err) {
            _getNewToken(oauth2Client, (result)=>{
                console.log(result);
                callback(null, result);
            });
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(null, oauth2Client);
        }
    });
}

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
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            fs.writeFile(gDriveTokenPath, JSON.stringify(token), (err)=>{
                if(err) throw err;

                callback(oauth2Client);
            });
        });
    });
}

function _upload(auth, cb)
{
    let drive = google.drive({ version: 'v3', auth: auth});
    drive.files.create({
        resource: {
            name: imgNameWithTyp,
            mimeType: imgTyp
        },
        media: {
            mimeType: imgTyp,
            body: fs.createReadStream(tmpPath + imgNameWithTyp)
        }
    }, (err, result)=>{
        if(err){
            logger.log('error', 'error on uploading image to drive, error message: %s', err.message);
            cb(err, null);
        } else{
            cb(null, result);
        }
    });
}

function _downloadImageToTmp(cb)
{
    request.head(_url, function(err, res, body){
        imgTyp = res.headers['content-type'];
        let typ = imgTyp.split('/');
        imgNameWithTyp = _fileName + '.' + typ[1];

        request(_url).pipe(fs.createWriteStream(tmpPath + imgNameWithTyp)).on('close', (error, result)=>{
            if(error){
                logger.log('error', 'error on downloading image from url: %s', _url);
                cb(err, null);
            } else{
                cb(null, result);
            }
        });
    });
}

function _removeTmpImg(arg, cb)
{
    fs.unlink(tmpPath + imgNameWithTyp, (err)=>{
        if(err){
            logger.log('error', 'error on removing image on tmp path, error message: %s', err.message);
            cb(err, null);
        } else{
            cb(null, {done: true, imgName: imgNameWithTyp});
        }
    });
}

