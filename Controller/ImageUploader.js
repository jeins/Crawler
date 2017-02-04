'use strict';

const fs = require('fs');
const google = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const path = require('path');
const logger = require('../Helper/Logger');
const request = require('request');
const async = require('async');

let imgNameWithTyp, imgTyp, _url, _fileName;
const imgTmpPath = path.resolve(__dirname) + '/../log/';

exports.upload = (url, fileName, cb)=>{
    _url = url; _fileName = fileName;

    async.waterfall([
        _downloadImageToTmp,
        _prepareUploader,
        _upload,
        _removeTmpImg
    ], cb);
};

function _prepareUploader(arg, cb)
{
    let oauth2Client = new OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        ''
    );

    let drive = google.drive({ version: 'v3', auth: oauth2Client });

    // let tokenProvider = new GoogleTokenProvider({
    //     'refresh_token': process.env.GOOGLE_REFRESH_TOKEN,
    //     'client_id' : process.env.GOOGLE_CLIENT_ID,
    //     'client_secret': process.env.GOOGLE_CLIENT_SECRET
    // });

    // oauth2Client.getToken('4/y2Bo8US49X05BLTEqaLEabTIn_tdl0-1HiLk1Dyexjc', (err, accessToken)=>{
    //     if(err){
    //         logger.log('error', 'cant generate google access token, error message: %s', err.message);
    //         cb(err, null);
    //     }else{
    //         oauth2Client.setCredentials({
    //             access_token: 'ya29.GlvoA0ix0KbrrrwfriUsJY7LvylX08qifOuic-vJhYjRhpkRJAg6PY3IWO4ce0_y2-CQNCLEtOrj9KqnvMrxACBZCoSmfMLxRCtTqF5z1qKqpRC-sRqUkKeWQTjw'
    //         });
    //
    //         cb(null, drive);
    //     }
    // });
    oauth2Client.setCredentials({
        access_token: 'ya29.GlvoA0ix0KbrrrwfriUsJY7LvylX08qifOuic-vJhYjRhpkRJAg6PY3IWO4ce0_y2-CQNCLEtOrj9KqnvMrxACBZCoSmfMLxRCtTqF5z1qKqpRC-sRqUkKeWQTjw'
    });

    cb(null, drive);
}

function _upload(drive, cb)
{
    drive.files.create({
        resource: {
            name: imgNameWithTyp,
            mimeType: imgTyp
        },
        media: {
            mimeType: imgTyp,
            body: fs.createReadStream(imgTmpPath + imgNameWithTyp)
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

        request(_url).pipe(fs.createWriteStream(imgTmpPath + imgNameWithTyp)).on('close', (error, result)=>{
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
    fs.unlink(imgTmpPath + imgNameWithTyp, (err)=>{
        if(err){
            logger.log('error', 'error on removing image on tmp path, error message: %s', err.message);
            cb(err, null);
        } else{
            cb(null, {done: true});
        }
    });
}

