'use strict';

const _ = require('lodash');

const DistanceLocationCalculation = function(){};

DistanceLocationCalculation.prototype = {
	getNearestLocation: ()=>{
		return false;
	},

	getDistanceFromLatLonInKm: (latLonA, latLonB)=>{
		let lat1 = latLonA.latitude;
		let lon1 = latLonA.longitude;
		let lat2 = latLonB.latitude;
		let lon2 = latLonB.longitude;

		var R = 6371;
		var dLat = _degTorad(lat2-lat1);
		var dLon = _degTorad(lon2-lon1);
		var a =
				Math.sin(dLat/2) * Math.sin(dLat/2) +
				Math.cos(_degTorad(lat1)) * Math.cos(_degTorad(lat2)) *
				Math.sin(dLon/2) * Math.sin(dLon/2)
			;
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		var d = R * c;

		return Math.round(d*1000)/1000;
	}
};

function _degTorad(deg) {
	return deg * (Math.PI/180)
}

module.exports = new DistanceLocationCalculation();