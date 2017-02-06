'use strict';

/**
 * README:
 * target: rowahu.info
 * key / perawi yang tersedia : bukhari, muslim, ahmad, tirmidzi, nasai, darimi, malik, ibnu_majah, abu_daud
 * berikut adalah contoh perintah yang dapat diberikan pada job.json:
 *  {
 *      "method": "_walkingOnPerawiWithHaditsNr",
 *      "perawi": "bukhari",
 *      "nrHadits" : 1
 *  }
 */

const fs = require('fs');
const async = require('async');
const _ = require('lodash');
const moment = require('moment');
const request = require('request');
const cheerio = require('cheerio');
const path = require('path');
const logger = require('../../Helper/Logger');
const Model = require('./Model');

const TAG = 'HaditsFromRawahu';
const jobFile = path.resolve(__dirname) + '/job.json';
const mainUrl = 'http://rowahu.info/hadits/';
const totalHadits = {bukhari: 7008, muslim: 5362, ahmad: 26363, tirmidzi: 3891,
    nasai: 5662, darimi: 3357, malik: 1594, ibnu_majah: 4332, abu_daud: 4590};
let job;

/**
 * main
 * @param cb
 */
exports.run = (mainCb)=>{
    async.waterfall([
        (cb)=>{
            _job('read', (error, result)=>{
                if(error) cb(error, null);
                else cb(null, result);
            });
        },
        (arg, cb)=>{
            if(!_.isEmpty(job.todo)){
                let index = 0;

                async.mapSeries(job.todo, (todo, cb2)=>{
                    logger.log('info', 'job start %s, method: %s', TAG, todo.method);

                    let jobDoc = (error, result)=>{
                        todo.timestamp = moment().toISOString();

                        delete job.todo[index];
                        index++;

                        if(error){
                            logger.log('error', 'job failed %s, method: %s', TAG, todo.method);
                            job.failed.push(todo);
                            cb2(null, false);
                        }
                        else {
                            logger.log('info', 'job completed %s, method: %s', TAG, todo.method);
                            job.completed.push(todo);
                            cb2(null, result);
                        }
                    };

                    switch (todo.method){
                        case '_walkingOnPerawi':
                            _walkingOnPerawi(todo.perawi, todo.start, todo.end, (error, result)=>{jobDoc(error, result);});
                            break;
                        case '_walkingOnPerawiWithHaditsNr':
                            _walkingOnPerawiWithHaditsNr(todo.perawi, todo.nrHadits, (error, result)=>{jobDoc(error, result);});
                            break;
                    }
                }, (error, result)=>{
                    if(error) cb(error, null);
                    else cb(null, result);
                });
            } else{
                logger.log('info', 'nothing to do on job %s ', TAG);
                mainCb(null, false);
            }
        },
        (arg, cb)=>{
            _job('write', (error, result)=>{
                if(error) cb(error, null);
                else cb(null, result);
            });
        }
    ], mainCb);
};

/**
 * read or write job documentation
 * @param readOrWrite
 * @param cb
 * @private
 */
function _job(readOrWrite, cb)
{
    if(readOrWrite === 'read'){
        fs.readFile(jobFile, (err, data)=>{
            if(err) {
                console.error(err.message);
                return cb(err, null);
            }

            job = JSON.parse(data);
            logger.log('info', 'read job %s', TAG);
            cb(null, true);
        });
    } else if(readOrWrite === 'write'){
        job.todo = _.remove(job.todo, (todo)=>{
            return todo === null;
        });

        fs.writeFile(jobFile, JSON.stringify(job, null, 4), (err, data)=>{
            if(err) {
                console.error(err.message);
                return cb(err, null);
            }

            logger.log('info', 'job %s has been finished', TAG);
            cb(null, true);
        });
    }
}

/**
 *
 * @param perawi
 * @param start
 * @param end
 * @param cb
 * @private
 */
function _walkingOnPerawi(perawi, start, end, cb)
{
    if(end > totalHadits[perawi]) end = totalHadits[perawi];

    async.mapSeries(_getPage(start, end), (nrHadits, cb2)=>{
        _walkingOnPerawiWithHaditsNr(perawi, nrHadits, cb2);
    }, cb);
}

/**
 *
 * @param perawi
 * @param nrHadits
 * @param cb
 * @private
 */
function _walkingOnPerawiWithHaditsNr(perawi, nrHadits, cb)
{
    let url = mainUrl + perawi + '/' + nrHadits;
    logger.log('info', 'start walking to get hadits, perawi: %s | nrHadits: %s | url: %s', perawi, nrHadits, url);

    request(url, (error, response, html)=>{
        if(error) {
            logger.log('error', 'error walking on get hadits, url: %s | error message: %s', url, error.message);
            return cb(error.message, null);
        }

        let $ = cheerio.load(html);
        let content = $('.content');
        let result = {};

        result.perawi = perawi;
        result.nrHadits = nrHadits;
        result.contentArab = _clean(_encodeUtf8(_clean($(content).find('.content__arabic').text())));
        result.contentIndo = _clean($(content).find('.content__translate').text());

        let addHadits = Model(result);
        addHadits.save((err)=>{
            if(err){
                logger.log('error', 'error add data to db, url: %s | error message: %s', url, error.message);
                return cb(err.message, null);
            }

            logger.log('info', 'finish walking hadits, perawi: %s | nrHadits: %s | url: %s', perawi, nrHadits, url);
            logger.log('warn', JSON.stringify(result));
            cb(null, result);
        });
    });
}

function _getPage(start, end)
{
    let page = [];
    for(let i=start; i <= end; i++) page.push(i);

    return page;
}

function _clean(str)
{
    return str.replace(/(\r\n|\n|\r|\t)/gm,"").trim();
}

function _encodeUtf8(s)
{
    return unescape(encodeURIComponent(s));
}