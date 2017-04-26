'use strict';

const request = require('request');
const _ = require('lodash');

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
     *
     * @param mode
     * @param value
     * @param cb
     * @private
     */
    _requestHandler(mode, value, cb){
        let key = [];
        switch (mode){
            case 'address':
                this._apiUrl += '&address=' + value;
                key = ['geometry', 'location'];
                break;
            case 'latlng':
                this._apiUrl += '&latlng=' + value;
                key = ['formatted_address'];
                break;
        }

        request(this._apiUrl, (error, response, body)=>{
            if(error){
                return cb(error, null);
            }

            body = JSON.parse(body);

            if(_.size(body.results) === 0){
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