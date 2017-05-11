'use strict';

const _ = require('lodash');

class DistanceCalculation {
    getNearestLocation() {
        return false;
    }

    /**
     *
     * @param latLonA
     * @param latLonB
     * @returns {number}
     */
    getDistanceFromLatLonInKm(latLonA, latLonB) {
        let lat1 = latLonA.latitude;
        let lon1 = latLonA.longitude;
        let lat2 = latLonB.latitude;
        let lon2 = latLonB.longitude;

        let R = 6371;
        let dLat = this._degTorad(lat2 - lat1);
        let dLon = this._degTorad(lon2 - lon1);
        let a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this._degTorad(lat1)) * Math.cos(this._degTorad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c;

        return Math.round(d * 1000) / 1000;
    }

    /**
     *
     * @param rad
     * @returns {string}
     */
    static getDistanceFromRadius(rad) {
        let res = (rad * 100).toFixed(2);

        if (res >= 1) res = res.toString() + ' km';
        else res = (1000 * res).toString() + ' m';

        return res;
    }

    /**
     *
     * @param deg
     * @returns {number}
     * @private
     */
    _degTorad(deg) {
        return deg * (Math.PI / 180)
    }
}

module.exports = DistanceCalculation;