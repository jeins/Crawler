'use strict';

const express = require('express');
const moment = require('moment');
const Praytimes = require('./Praytimes');
const router = express.Router();

router.get('/:lat/:lon', (req, res)=>{
	let latitude = req.params.lat;
	let longitude = req.params.lon;
	let times = Praytimes.getTimes(new Date(), [latitude, longitude]);

	res.json({
		date: moment().format('DD.MM.YYYY'),
		subuh: times.fajr,
		terbit: times.sunrise,
		dzuhur: times.dhuhr,
		ashr: times.asr,
		maghrib: times.maghrib,
		isya: times.isha
	});
});

router.get('/:time/:lat/:lon', (req, res)=>{
	let time = req.params.time;
	let date = (time < 0) ? 
				moment().subtract(time.replace('-', ''), 'days') : 
				moment().add(time, 'days');
	let latitude = req.params.lat;
	let longitude = req.params.lon;
	let times = Praytimes.getTimes(date.toDate(), [latitude, longitude]);

	res.json({
		date: date.format('DD.MM.YYYY'),
		subuh: times.fajr,
		terbit: times.sunrise,
		dzuhur: times.dhuhr,
		ashr: times.asr,
		maghrib: times.maghrib,
		isya: times.isha
	});
});

module.exports = router;