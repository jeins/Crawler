'use strict';

const mongoose = require('mongoose');
const async = require('async');
const logger = require('../../Helper/Logger');
const _ = require('lodash');
const DistanceCalculation = require('../../Helper/DistanceCalculation');

let db, distanceCalc;
const Market = function () {
    db = mongoose.model('Market', new mongoose.Schema({
        id: String,
        name: String,
        country: String,
        city: String,
        address: String,
        coordinates: {
            type: [],
            get: (coordinates) => {
                return {
                    latitude: coordinates[0], 
                    longitude: coordinates[1]
                }
            },
            set: (coordinates) => {
                return [
                    Number(coordinates.latitude), 
                    Number(coordinates.longitude)
                ];
            }
        },
        url: String,
        crawledAt: Date
    }));

    distanceCalc = new DistanceCalculation();
};

Market.prototype.db = function(){
    return db;
};

Market.prototype.checkIfDataExist = function (name, city, country, coordinates, cb) {
    let where = {name: name, city: city, country: country};
    let query = db.where(where);

    query.find((err, doc)=>{
        if (err) {
            logger.log('error', 'error on check existing of market, request: %s | error message: %s', JSON.stringify(where), err.message);
            return cb(err, null);
        }

        if (doc) {
            let exist = false;
            _.forEach(doc, (d)=>{
                let distanceInKm = distanceCalc.getDistanceFromLatLonInKm(d.coordinates, coordinates);

                if(distanceInKm < 0.3){
                    exist = true;
                    return false;
                }
            });

            cb(null, {exist: exist});
        } else cb(null, {exist: false});
    });
};

Market.prototype.checkThenSaveData = function(result, mainCb){
    async.waterfall([
        async.apply(this.checkIfDataExist, result.name, result.city, result.country, result.coordinates),
        (res, cb)=>{
            if (!res.exist) {
                let newRestaurant = db(result);

                newRestaurant.save((err) => {
                    if (err) {
                        logger.log('error', 'error add data to db, url: %s | error message: %s', result.url, err.message);
                        return cb(err, null);
                    }

                    logger.log('info', 'added market information, name: %s | url: %s', result.name, result.url);
                    cb(null, true);
                });
            } else {
                logger.log('warn', 'market information already exist, name: %s | url: %s', result.name, result.url);
                cb(null, false);
            }
        }
    ], (err, res) => {
        mainCb(err, res);
    });
};

module.exports = new Market();
