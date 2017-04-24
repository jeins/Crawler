'use strict';

const express = require('express');
const moment = require('moment');
const Praytimes = require('./Praytimes');
const router = express.Router();
/**
 * @swagger
 * definitions:
 *   jadwalshalat_s:
 *     properties:
 *       date:
 *         type: string
 *       subuh:
 *         type: string
 *       terbit:
 *         type: string
 *       dzuhur:
 *         type: string
 *       ashr:
 *         type: string
 *       marghrib:
 *         type: string
 *       isya:
 *         type: string
 */

/**
 * @swagger
 * /jadwalshalat/{lat}/{lon}:
 *   get:
 *     tags:
 *       - JadwalShalat
 *     description: menampilkan jadwal shalat pada hari ini
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: lat
 *         description: koordinat Latitude
 *         in: path
 *         required: true
 *         type: number
 *       - name: lon
 *         description: koordinat Longitude
 *         in: path
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: jadwal shalat hari ini
 *         schema:
 *           $ref: '#/definitions/jadwalshalat_s'
 */
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

/**
 * @swagger
 * /jadwalshalat/{num}/{lat}/{lon}:
 *   get:
 *     tags:
 *       - JadwalShalat
 *     description: menampilkan jadwal shalat berdasarkan jumlah hari sebelum atau yang akan datang
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: num
 *         description: angka dari hari sebelum(negativ) atau yang akan datang(positif)
 *         in: path
 *         required: true
 *         type: number
 *       - name: lat
 *         description: koordinat Latitude
 *         in: path
 *         required: true
 *         type: number
 *       - name: lon
 *         description: koordinat Longitude
 *         in: path
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: hasil jadwal shalat
 *         schema:
 *           $ref: '#/definitions/jadwalshalat_s'
 */
router.get('/:num/:lat/:lon', (req, res)=>{
	let num = req.params.num;
	let date = (num < 0) ? 
				moment().subtract(num.replace('-', ''), 'days') : 
				moment().add(num, 'days');
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