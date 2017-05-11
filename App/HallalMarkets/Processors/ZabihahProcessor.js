'use strict';

/**
 * README:
 * target: https://www.zabihah.com/reg/uFbDwx42Uj
 * TODO: add more document
 */

const _ = require('lodash');
const cheerio = require('cheerio');
const request = require('request');
const async = require('async');
const moment = require('moment');
const uuid = require('uuid/v1');
const logger = require('../../../Library/Logger');
const Model = require('../Model');

const TAG = 'HallalMarketFromZabihah';
const mainUrl = 'https://www.zabihah.com';
const targetUrl = 'https://www.zabihah.com/reg/uFbDwx42Uj';

exports.run = (mainCb) => {
    async.waterfall([
        walkingOnHomeToGetCityList,
        walkingOnCityToGetMarketList,
        walkingOnMarketToGetInfomation
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
            let splitAnchor = $(anchor).attr('href').split('/');

            urlWithCityList[i] = {
                url: '/sub/' + splitAnchor[splitAnchor.length - 1] + '?t=m',
                city: $(anchor).text()
            };
        });

        logger.log('info', 'finish walking on home, targetUrl: %s | total city: %s', targetUrl, _.size(urlWithCityList));
        cb(null, urlWithCityList);
    });
}


/**
 * get all market list from specific city
 * exp: [{city: 'Berlin', url: '/sub/AQf3owRxQY?t=m'}]
 * @param urlCityList
 * @param cb
 */
function walkingOnCityToGetMarketList(urlCityList, cb) {
    let marketWithCityList = [];

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

            marketWithCityList.push({
                city: urlCity.city,
                urlList: tmpUrlList
            });

            logger.log('info', 'finish walking on city %s, url: %s | total markets: %s', urlCity.city, url, _.size(tmpUrlList));

            cb2(null, marketWithCityList);
        });
    }, (err, res) => {
        logger.log('info', 'finish walking on all city');

        cb(null, marketWithCityList);
    });
}

/**
 * get and save all market information from specific city
 * exp: [{city: 'Berlin', urlList: ['https://www.zabihah.com/biz/Wedding/Bolu-Wedding-3/oDdmincqZV']}]
 * @param urlMarketWithCityList
 * @param cb
 */
function walkingOnMarketToGetInfomation(urlMarketWithCityList, cb) {
    async.mapSeries(urlMarketWithCityList, (urlMarketWithCity, cb2) => {
        let city = urlMarketWithCity.city;
        let urlList = urlMarketWithCity.urlList;

        async.mapSeries(urlList, (url, cb3) => {
            request(url, (error, response, html) => {
                if (error) {
                    logger.log('error', 'error walking on market, url: %s | error message: %s', url, error.message);
                    return cb3(error.message, null);
                }

                let $ = cheerio.load(html);
                let result = {};

                if ($('script[type="text/javascript"]').first().text().includes('mob/404')) {
                    logger.log('warn', 'site not found, url: %s', url);

                    return cb3(null, false);
                }

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
                result.city = city;
                result.country = 'Germany'; //TODO: static?
                result.address = $('.bodyLink').first().text();
                result.url = url;
                result.crawledAt = moment().toISOString();

                Model.checkThenSaveData(result, cb3);
            });
        }, cb2);
    }, cb);
}