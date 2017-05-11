'use strict';

const request = require('request');
const async = require('async');
const logger = require('../../Library/Logger');
const Murottal = require('./Model');

class MurottalProcessor {
    constructor() {
        this.apiUrl = 'http://mp3quran.net/api/_indonesia.php';
    }

    run(cb) {
        request(this.apiUrl, (error, response, body) => {
            if (error) {
                logger.log('error', 'error walking api m3quran, url: %s | error message: %s', this.apiUrl, error.message);
                return cb(error.message, null);
            }

            body = JSON.parse(body);

            async.mapSeries(body.reciters, (reciter, cb2) => {
                let result = {
                    name: reciter.name,
                    url: reciter.Server,
                    riwayat: reciter.rewaya,
                    totalSurat: reciter.count,
                    listSurat: reciter.suras
                };

                let newData = Murottal(result);
                newData.save((err) => {
                    if (err) {
                        logger.log('error', 'error add data to db, url: %s | error message: %s', this.apiUrl, error);
                        return cb2(err, null);
                    }

                    logger.log('info', 'finish walking on murottal information, url: %s', this.apiUrl);
                    cb2(null, true);
                });
            }, cb);
        });
    }
}

module.exports = new MurottalProcessor();