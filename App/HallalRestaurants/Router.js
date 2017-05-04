'use strict';

const express = require('express');
const _ = require('lodash');
const logger = require('../../Helper/Logger');
const Restaurant = require('./Model').db();
const DistanceCalculation = require('../../Helper/DistanceCalculation');
const router = express.Router();

/**
 * @swagger
 * definitions:
 *   restaurant_info:
 *     properties:
 *       name:
 *         type: string
 *       address:
 *         type: string
 *       distance:
 *         type: string
 *   restaurant_lokasi:
 *     properties:
 *       name:
 *         type: string
 *       address:
 *         type: string
 *       coordinates:
 *         type: string
 */

/**
 * @swagger
 * /restaurant/{str}:
 *   get:
 *     tags:
 *       - Restaurant
 *     description: menampilkan lokasi map berdasarkan nama restaurant atau alamat
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: str
 *         description: string bisa berupa nama restaurant atau alamat
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: list restaurant terdekat
 *         schema:
 *           $ref: '#/definitions/restaurant_lokasi'
 */
router.get('/:str', (req, res) => {
    let str = new RegExp(req.params.str, "i");

    Restaurant.find({$or: [{'name': str}, {'address': str}, {'addressData': str}]})
        .select('name address coordinates')
        .exec((err, data) => {
            if (err) return res.status(500).send(err);

            if (_.size(data) > 1) {
                let result = [];

                _.forEach(data, (d) => {
                    result.push({name: d.name, address: d.address});
                });

                res.json({
                    success: false,
                    data: result,
                    info: 'menemukan banyak nama, masukkan alamat agar lebih jelas'
                });
            } else if (_.size(data) === 1) {
                data = data[0];
                res.json({
                    success: true,
                    name: data.name,
                    address: data.address,
                    latitude: data.coordinates.latitude,
                    longitude: data.coordinates.longitude
                });
            } else {
                res.json({success: false, info: 'nama restaurant / alamat tidak ditemukan'});
            }
        });
})

/**
 * @swagger
 * /restaurant/{total}/{lat}/{lon}:
 *   get:
 *     tags:
 *       - Restaurant
 *     description: menampilkan restaurant hallal terdekat
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: total
 *         description: jumlah data yang ingin ditampilkan
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
 *         description: list restaurant terdekat
 *         schema:
 *           $ref: '#/definitions/restaurant_info'
 */
router.get('/:total/:lat/:lon', (req, res) => {
    let maxDistance = 100;
    let latitude = req.params.lat;
    let longitude = req.params.lon;
    let total = req.params.total;

    Restaurant.aggregate([
            {
                "$geoNear": {
                    "near": [Number(latitude), Number(longitude)],
                    "num": Number(total),
                    "maxDistance": maxDistance,
                    "distanceField": "calculated"
                }
            },
            {
                "$sort": {
                    "calculated": 1
                }
            }
        ],
        (err, data) => {
            if (err) res.status(500).send(err);
            else {
                let result = [];

                _.forEach(data, (d) => {
                    result.push({
                        name: d.name,
                        address: d.address,
                        distance: DistanceCalculation.getDistanceFromRadius(d.calculated),
                        url: d.url,
                        coordinates: d.coordinates
                    });
                });

                res.json(result);
            }
        }
    );
});

module.exports = router;