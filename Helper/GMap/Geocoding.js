'use strict';

const request = require('request');
const _ = require('lodash');
const logger = require('../logger');

class GMap_Geocoding{

    constructor(){
        this._apiUrl = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + process.env.GOOGLE_WEB_API;
    }

    /**
     * get latitude and longitude from address
     * @param address
     * @param cb
     */
    getLatLonFromAddress(address, cb){
        this._requestHandler('address', address, cb);
    }

    /**
     * get detail address from latitude and longitude
     * @param latitude
     * @param longitude
     * @param cb
     */
    getAddressFromLatLon(latitude, longitude, cb){
        this._requestHandler('latlng', latitude + ',' + longitude, cb);
    }

    /**
     * get all results from address
     * @param address
     * @param cb
     */
    getResultFromAddress(address, cb){
        this._requestHandler('result_address', address, cb);
    }

    /**
     *
     * @param mode
     * @param value
     * @param cb
     * @private
     */
    _requestHandler(mode, value, cb){
        let key = [];
        let url = this._apiUrl;
        value = encodeURIComponent(value);
        switch (mode){
            case 'address':
                url += '&address=' + value;
                key = ['geometry', 'location'];
                break;
            case 'latlng':
                url += '&latlng=' + value;
                key = ['formatted_address'];
                break;
            case 'result_address':
                url += '&address=' + value;
                key = [];
                break;
        }

        request(url, (error, response, body)=>{
            if(error){
                logger.log('error', 'on getting request to url: %s | error: %s', this._apiUrl, error.message);
                return cb(error, null);
            }

            body = JSON.parse(body);

            if(_.size(body.results) === 0){
                logger.log('warn', 'no result found on request to url: %s', this._apiUrl);
                return cb(null, null);
            }

            let result = body.results[0];

            _.forEach(key, (k)=>{
                result = result[k];
            });

            cb(null, result);
        });
    }
}

module.exports = GMap_Geocoding;