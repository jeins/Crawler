'use strict';

/**
 * README:
 * API-ID: http://api.globalquran.com/complete/id.indonesian?key=4d5da0a9965cc59f8db8a03cf777dea4&format=json
 * API-AR: http://api.globalquran.com/complete/quran-simple?key=4d5da0a9965cc59f8db8a03cf777dea4&format=json
 */

const async = require('async');
const _ = require('lodash');
const moment = require('moment');
const request = require('request');
const util = require('util');
const logger = require('../../Helper/Logger');
const Model = require('./Model');
const TAG = 'QURAN';

exports.run = () => {
    let url = 'http://api.globalquran.com/complete/%s?key=4d5da0a9965cc59f8db8a03cf777dea4&format=json';
    let keys = ['id.indonesian', 'quran-simple'];
    let objContentID;
    let objContentAR;

    logger.log('info', 'job start get %s data', TAG);

    async.mapSeries(keys, (key, cb) => {
        request(util.format(url, key), (error, response, body) => {
            if (error) {
                logger.log('error', 'error on request api, url: ', util.format(url, key));
                return false;
            }

            if (key.includes('id')) {
                objContentID = JSON.parse(body);
                cb(null, true);
            } else {
                objContentAR = JSON.parse(body);
                cb(null, true);
            }
        });
    }, (err, res) => {
        _.forEach(objContentID.quran[keys[0]], (val, i) => {
            let result = {
                surat: val.surah,
                ayat: val.ayah,
                contentIndo: val.verse,
                contentArab: _encodeUtf8(objContentAR.quran[keys[1]][i]['verse'])
            };

            let quran = new Model(result);
            quran.save((err) => {
                if (err) {
                    logger.log('error', 'error add quran data to db, data: %s | error message: %s', JSON.stringify(result), error.message);
                    return false;
                }
            });

            logger.log('info', 'added quran data %s', JSON.stringify(result));
        });
    });
};

function _encodeUtf8(s) {
    return unescape(encodeURIComponent(s));
}