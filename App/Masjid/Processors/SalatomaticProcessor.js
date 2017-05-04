'use strict';

/**
 * README:
 * target: https://www.salatomatic.com/reg/uFbDwx42Uj
 * TODO: add more document
 */

const _ = require('lodash');
const cheerio = require('cheerio');
const request = require('request');
const async = require('async');
const moment = require('moment');
const uuid = require('uuid/v1');
const logger = require('../../../Helper/Logger');
const Model = require('../Model');

const TAG = 'MasjidFromSalatomatic';
const mainUrl = 'https://www.salatomatic.com';
const targetUrl = 'https://www.salatomatic.com/reg/uFbDwx42Uj';

exports.run = (mainCb) => {
    async.waterfall([
        walkingOnHomeToGetCityList,
        walkingOnCityToGetMasjidList,
        walkingOnMasjidToGetInfomation
    ], (err, res) => {
        logger.log('info', 'stop walking on %s', TAG);

        mainCb(err, res);
    });
};

/**
 * get all city list on specific country
 * @param cb
 */
function walkingOnHomeToGetCityList(cb) {
    logger.log('info', 'start job %s to walking on , targetUrl: %s', TAG, targetUrl);

    request(targetUrl, (error, response, html) => {
        if (error) {
            logger.log('error', 'error walking on home, url: %s | error message: %s', mainUrl, error.message);
            return cb(error.message, null);
        }

        let $ = cheerio.load(html);
        let urlWithCityList = [];

        $('a[href*="/sub/"]').each((i, d) => {
            let anchor = $(d).parent().find('a');

            urlWithCityList[i] = {
                url: $(anchor).attr('href'),
                city: $(anchor).text()
            };
        });

        logger.log('info', 'finish walking on home, targetUrl: %s | total city: %s', targetUrl, _.size(urlWithCityList));
        cb(null, urlWithCityList);
    });
}


/**
 * get all masjid list from specific city
 * exp: [{city: 'Berlin', url: '/spc/Berlin/Ensar-Moschee-Cami/iVg4DLyb7l'}]
 * @param urlCityList
 * @param cb
 */
function walkingOnCityToGetMasjidList(urlCityList, cb){
	let masjidWithCityList = [];

    async.mapSeries(urlCityList, (urlCity, cb2) => {
        let url = mainUrl + urlCity.url;

        request(url, (error, response, html) => {
            if (error) {
                logger.log('error', 'error walking on city, url: %s | error message: %s', url, error.message);
                return cb2(error.message, null);
            }

            let $ = cheerio.load(html);
            let tmpUrlList = [];

            $('.titleBS').find('a').each((i, uri) => {
                tmpUrlList[i] = $(uri).attr('href');
            });

            masjidWithCityList.push({
                city: urlCity.city,
                urlList: tmpUrlList
            });

            logger.log('info', 'finish walking on city %s, url: %s | total masjid: %s', urlCity.city, url, _.size(tmpUrlList));

            cb2(null, masjidWithCityList);
        });
    }, (err, res) => {
        logger.log('info', 'finish walking on all city');

        cb(null, masjidWithCityList);
    });
}

/**
 * get and save all masjid information from specific city
 * exp: [{city: 'Berlin', urlList: ['/spc/Berlin/Ensar-Moschee-Cami/iVg4DLyb7l']}]
 * @param urlMasjidWithCityList
 * @param cb
 */
function walkingOnMasjidToGetInfomation(urlMasjidWithCityList, cb) {
    async.mapSeries(urlMasjidWithCityList, (urlMasjidWithCity, cb2) => {
        let city = urlMasjidWithCity.city;
        let urlList = urlMasjidWithCity.urlList;

        async.mapSeries(urlList, (url, cb3) => {
            url = mainUrl + url;
            request(url, (error, response, html) => {
                if (error) {
                    logger.log('error', 'error walking on masjid, url: %s | error message: %s', url, error.message);
                    return cb3(error.message, null);
                }

                let $ = cheerio.load(html);
                let result = {};

                if($('script[type="text/javascript"]').first().text().includes('mob/404') || _.isEmpty($('script[type="application/ld+json"]').text())){
                    logger.log('warn', 'site not found, url: %s', url);
                    return cb3(null, false);
                }

                let objLdApp = JSON.parse($('script[type="application/ld+json"]').text());
                $('script[type="text/javascript"]').each((i, script) => {
                    script = $(script).text();
                    if (script.includes('LatLng')) {
                        let latLon = script.substring(
                            script.lastIndexOf("LatLng(") + 1,
                            script.lastIndexOf("LatLng(") + 50).match(/[+-]?([0-9]*[.])?[0-9]+/g);

                        result.coordinates = {
                            latitude: latLon[0],
                            longitude: latLon[1]
                        };
                    }
                });

                result.id = uuid();
                result.name = $('.titleBL').text();
                result.city = (_.has(objLdApp.address, 'addressLocality')) ? objLdApp.address.addressLocality : city;
                result.country = 'Germany'; //TODO: static?
                result.plz = objLdApp.address.postalCode;
                result.street = objLdApp.address.streetAddress;
                result.address = result.street + ', ' + result.plz + ', ' + objLdApp.address.addressLocality;
                result.url = url;
                result.crawledAt = moment().toISOString();

                Model.checkThenSaveData(result, cb3);
            });
        }, cb2);
    }, cb);
}