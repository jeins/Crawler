'use strict';

const mongoose = require('mongoose');
const logger = require('../../Helper/Logger');
const DisLocCalculation = require('../../Helper/DistanceLocationCalculation');

let db;
const Restaurant = function () {
    db = mongoose.model('Restaurant', new mongoose.Schema({
        id: String,
        name: String,
        country: String,
        city: String,
        adress: {
            type: String,
            get: (address) => {
                try {
                    return JSON.parse(address);
                } catch (e) {
                    return address;
                }
            },
            set: (address) => {
                return JSON.stringify(address);
            }
        },
        geoLocation: {
            type: String,
            get: (latLon) => {
                try {
                    return JSON.parse(latLon);
                } catch (e) {
                    return latLon;
                }
            },
            set: (latLon) => {
                return JSON.stringify(latLon);
            }
        },
        cuisine: [],
        url: String,
        otherInfo: String,
        crawledAt: Date
    }));
};

Restaurant.prototype = {
    db: () => {
        return db;
    },

    checkIfDataExist: (name, city, country, geoLocation, url, cb) => {
        let where = {name: name, city: city, country: country, url: url};
        let query = db.where(where);

        query.findOne(function (err, doc) {
            if (err) {
                logger.log('error', 'error on check existing of restaurant, request: %s | error message: %s', JSON.stringify(where), err.message);
                return cb(err, null);
            }

            if (doc) {
                //let distanceInKm = DisLocCalculation.getDistanceFromLatLonInKm(doc.geoLocation, geoLocation);

                let exist = true;//(distanceInKm < 2);

                cb(null, {exist: exist});
            } else cb(null, {exist: false});
        });
    }
};

module.exports = new Restaurant();
