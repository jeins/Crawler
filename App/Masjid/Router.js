'use strict';

const express = require('express');
const _ = require('lodash');
const logger = require('../../Helper/Logger');
const Masjid = require('./Model').db();
const DistanceCalculation = require('../../Helper/DistanceCalculation');
const router = express.Router();

/**
 * @swagger
 * definitions:
 *   masjid_info:
 *     properties:
 *       name:
 *         type: string
 *       address:
 *         type: string
 *       distance:
 *         type: string
 */

/**
 * @swagger
 * /masjid/{total}/{lat}/{lon}:
 *   get:
 *     tags:
 *       - Masjid
 *     description: menampilkan masjid terdekat dari lokasi yang diberikan
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
 *         description: list masjid terdekat
 *         schema:
 *           $ref: '#/definitions/masjid_info'
 */
router.get('/:total/:lat/:lon', (req, res) => {
    let maxDistance = 100;
    let latitude = req.params.lat;
    let longitude = req.params.lon;
    let total = req.params.total;

    Masjid.aggregate([
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