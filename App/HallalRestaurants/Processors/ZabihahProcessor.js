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

const TAG = 'HallalRestaurantFromZabihah';
const mainUrl = 'https://www.zabihah.com';
const targetUrl = 'https://www.zabihah.com/reg/uFbDwx42Uj';

exports.run = (mainCb) => {
    async.waterfall([
        walkingOnHomeToGetCityList,
        walkingOnCityToGetRestaurantList,
        walkingOnRestaurantToGetInfomation
    ], (err, res) => {
        logger.log('info', 'stop walking on $s', TAG);

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
            let anchor = $(d).parent().find('a')

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
 * get all restaurant list from specific city
 * exp: [{city: 'Berlin', url: '/sub/Germany/Berlin/AQf3owRxQY'}]
 * @param urlCityList
 * @param cb
 */
function walkingOnCityToGetRestaurantList(urlCityList, cb) {
    let restaurantsWithCityList = [];

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

            restaurantsWithCityList.push({
                city: urlCity.city,
                urlList: tmpUrlList
            });

            logger.log('info', 'finish walking on city, url: %s | total restaurants: %s', url, _.size(tmpUrlList));

            cb2(null, restaurantsWithCityList);
        });
    }, (err, res) => {
        logger.log('info', 'finish walking on all city');

        cb(null, restaurantsWithCityList);
    });
}

/**
 * get and save all restaurant information from specific city
 * exp: [{city: 'Berlin', urlList: ['https://www.zabihah.com/biz/Berlin/Adonis-Imbiss/Gdajx3T1i7']}]
 * @param urlRestaurantWithCityList
 * @param cb
 */
function walkingOnRestaurantToGetInfomation(urlRestaurantWithCityList, cb) {
    async.mapSeries(urlRestaurantWithCityList, (urlRestaurantWithCity, cb2) => {
        let city = urlRestaurantWithCity.city;
        let urlList = urlRestaurantWithCity.urlList;

        async.mapSeries(urlList, (url, cb3) => {
            request(url, (error, response, html) => {
                if (error) {
                    logger.log('error', 'error walking on restaurant, url: %s | error message: %s', url, error.message);
                    return cb3(error.message, null);
                }

                let $ = cheerio.load(html);
                let result = {};

                if ($('script[type="text/javascript"]').first().text().includes('mob/404')) {
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
                result.name = objLdApp.name;
                result.city = (_.has(objLdApp.address, 'addressLocality')) ? objLdApp.address.addressLocality : city;
                result.country = 'Germany'; //TODO: static?
                result.address = objLdApp.address.streetAddress + ', ' + objLdApp.address.addressLocality + ', ' + objLdApp.address.addressRegion + ', ' + objLdApp.address.postalCode;
                result.addressData = objLdApp.address;
                result.cuisine = objLdApp.servesCuisine;
                result.url = url;
                result.crawledAt = moment().toISOString();
                result.otherInfo = JSON.stringify(objLdApp);

                Model.checkIfDataExist(result.name, result.city, result.country, result.coordinates, (err, res) => {
                    if (!res.exist) {
                        let newRestaurant = Model.db()(result);

                        newRestaurant.save((err) => {
                            if (err) {
                                logger.log('error', 'error add data to db, url: %s | error message: %s', url, error);
                                return cb3(err, null);
                            }

                            logger.log('info', 'finish walking on restaurant information, url: %s', url);
                            cb3(null, true);
                        });
                    } else {
                        logger.log('warn', 'restaurant information already exist, url: %s', url);
                        cb3(null, false);
                    }
                });
            });
        }, cb2);
    }, cb);
}