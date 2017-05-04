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
const logger = require('../../../Helper/Logger');
const Model = require('../Model');
const Geocoding = require('../../../Helper/GMap/Geocoding');

const mainUrl = 'https://www.moscheesuche.de/';
const TAG = 'MasjidFromMoscheeSuche';
let geoCoding = new Geocoding();

exports.run = (mainCb) => {

    async.waterfall([
        walkingOnHomeToGetCityList,
        walkingOnCityToGetMasjidList,
        walkingOnMasjidToGetMoreInformation
    ], (err, res) => {
        logger.log('info', 'stop walking on %s', TAG);

        mainCb(err, res);
    });
};

function walkingOnHomeToGetCityList(cb){
    logger.log('info', 'start job %s to walking on , targetUrl: %s', TAG, mainUrl);

    request(mainUrl, (error, response, html)=>{
    	if(error){
    		logger.log('error', 'error walking on home, url: %s | error message: %s', mainUrl, error.message);
        	return cb(error.message, null);
    	}

    	let $ = cheerio.load(html);
        let urlWithCityList = [];
    	let arrList = $('.list-group').find('.list-group-item');

    	_.forEach(arrList, (list)=>{
    		if($(list).html().includes('/moschee/stadt')){
    			urlWithCityList.push({
    				city: $(list).find('a').text(),
    				url: $(list).find('a').attr('href')
    			});
    		}
    	});

        logger.log('info', 'finish walking on home, targetUrl: %s | total city: %s', mainUrl, _.size(urlWithCityList));
        cb(null, urlWithCityList);
    });
}


function walkingOnCityToGetMasjidList(urlCityList, cb){
	let masjidBasicInfoList = [];

	async.mapSeries(urlCityList, (urlCity, cb2) => {
        let url = mainUrl + urlCity.url;

        request(url, (error, response, html)=>{
        	if(error){
	        	logger.log('error', 'error walking on city, url: %s | error message: %s', url, error.message);
	            return cb2(error.message, null);
        	}

    		let $ = cheerio.load(html);
			let arrList = $('#content').find('.mosque');
            let tmp = [];

			_.forEach(arrList, (list)=>{
				let street = $(list).find('.hidden-sm-up').text();
				let district = $(list).find('.hidden-xs-down').last().text();

				if(street.includes(' oder ')){
					let streetSplit = street.split(' oder ');
					street = streetSplit[0];
				}

				tmp.push({
					url: $(list).find('a').attr('href'),
					name: $(list).find('a').text(),
					street: street,
				 	district: (_.isEmpty(district)) ? '' : district
				});
			});

			masjidBasicInfoList.push({
				city: urlCity.city,
				data: tmp
			});

            logger.log('info', 'finish walking on city %s, total masjid: %s', urlCity.city, _.size(tmp));
            cb2(null, masjidBasicInfoList);
        });
	}, (err, res) => {
        logger.log('info', 'finish walking on all city');

        cb(null, masjidBasicInfoList);
    });
}


function walkingOnMasjidToGetMoreInformation(masjidBasicInfoList, cb){	
    async.mapSeries(masjidBasicInfoList, (masjidBasicInfo, cb2) => {
    	let city = masjidBasicInfo.city;
    	let masjidInfoList = masjidBasicInfo.data;

    	async.mapSeries(masjidInfoList, (masjidInfo, cb3) => {
    		logger.log('info', 'start walking on masjid %s', masjidInfo.name);

    		geoCoding.getResultFromAddress(masjidInfo.street + ',' + masjidInfo.district + ',' + city, (err, response)=>{
    			if(err){
    				logger.log('error', 'by getting geo information from google masjidInfo: %s | error: %s', JSONS.stringify(masjidInfo), err.message);
    				return cb3(err, null);
    			}

    			if(response){
		        	let result = {
		    			id: uuid(),
		    			name: masjidInfo.name,
		    			country: 'Germany',
		    			city: city,
		    			street: masjidInfo.street,
		    			url: mainUrl + masjidInfo.url,
		    			address: response.formatted_address,
		    			crawledAt: moment().toISOString()
		    		};

		    		_.forEach(response.address_components, (addressComp)=>{
		    			if(addressComp.types[0] === 'postal_code'){
		    				result.plz = addressComp.short_name;

		    				return false;
		    			}
		    		});

		    		result.coordinates = {
		    			latitude: response.geometry.location.lat,
		    			longitude: response.geometry.location.lng
		    		};


					Model.checkThenSaveData(result, cb3);
    			} else{
    				logger.log('error', 'something wrong, cannot save masjid info url: %s', mainUrl + masjidInfo.url);
    				cb3(null, false);
    			}
    		});
    	}, cb2);
    }, cb);
}