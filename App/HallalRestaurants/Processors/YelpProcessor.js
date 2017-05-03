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
const YelpClientController = require('../Controllers/YelpClientController');

const TAG = 'HallalRestaurantFromYelp';
const mainUrl = 'https://www.yelp.de';
const yelp = new YelpClientController();

//https://www.yelp.com/developers/documentation/v2/neighborhood_list
const availableDECity = [
	'Berlin', 'München', 'Nürnberg', 'Frankfurt am Main',
	'Hamburg', 'Hannover', 'Düsseldorf', 'Köln'
];

exports.run = (cb)=>{
	async.waterfall([
        walkingOnCityGetAllData,
        walkingOnDataGetAllInformation
    ], (err, res) => {
        logger.log('info', 'stop walking on %s', TAG);

        cb(err, res);
    });
}

function walkingOnCityGetAllData(cb){
	let dataByCity = [];

	async.mapSeries(availableDECity, (city, cb2)=>{
		yelp.search({term: 'halal', location: city, locale: 'de_DE'})
			.then((data)=>{
            	logger.log('info', 'finish walking on city, city: %s | total data: ', city, data.total);
				dataByCity.push({city: city, data: data.businesses, total: data.total});
				cb2(null, true);
			})
			.catch((err)=>{
            	logger.log('error', 'error walking on city, city: %s | error message: %s', city, err.message);
				cb2(err, null);
			});
	}, (err, res)=>{
		if(err) cb(err, null);
		else cb(null, dataByCity);
	})
}

function walkingOnDataGetAllInformation(dataByCity, cb){
	async.mapSeries(dataByCity, (dbc, cb2)=>{
		async.mapSeries(dbc.data, (data, cb3)=>{
			let cuisine = [];

			_.forEach(data.categories, (cat)=>{
				if(cat.title !== 'Halal') cuisine.push(cat.title);
			});

			let result = {
				id: uuid(),
				name: data.name,
				country: 'Germany', //TODO: static?
				city: dbc.city,
				address: _.join(data.location.display_address, ', '),
				addressData: data.location,
				coordinates: data.coordinates,
				cuisine: cuisine,
				url: data.url,
				otherInfo: JSON.stringify(data)
			};

			logger.log('info', 'start walking on restaurant, name: %s | url: %s', data.name, data.url);

			Model.checkThenSaveData(result, cb3);
		}, cb2);
	}, cb);
}