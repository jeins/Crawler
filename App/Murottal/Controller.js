'use strict';

const express = require('express');
const _ = require('lodash');
const router = express.Router();
const Murottal = require('./Model');

/**
 * @swagger
 * /murottal/:
 *   get:
 *     tags:
 *       - Murottal
 *     description: menampilkan list qari beserta total surat yang tersedia
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: list qari dan total surat
 */
router.get('/', (req, res)=>{
    let q = Murottal.find();
    q.select('name totalSurat');
    q.exec((err, data)=>{
        if(err) res.status(500).send(err);

        res.json(data);
    });
});

/**
 * @swagger
 * /murottal/{name}/{surat}:
 *   get:
 *     tags:
 *       - Murottal
 *     description: menampilkan murottal dengan qari dan surat tertentu
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: name
 *         description: nama qari
 *         in: path
 *         required: true
 *         type: string
 *       - name: surat
 *         description: surat AlQuran
 *         in: path
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: hasil
 */
//TODO:: not finished
router.get('/:name/:surat', (req, res)=>{
    let name = req.params.name;
    let surat = req.params.surat;

    let q = Murottal.find({name: name});
    q.where('likes').in(['name']);
    q.exec((err, data) => {
        if(err) return res.status(500).send(err);
        console.log(data);

        if(_.size(data) > 1){
            let name = [];

            _.forEach(data, (d)=>{
                name.push(d.name);
            });

            res.json(
                {
                    success: false,
                    name: name,
                    info: 'nama kurang spesifik'
                });
        } else{
            let arrAvailableSurat = data.listSurat.split(',');

            if(_.findIndex(arrAvailableSurat, surat) !== -1){
                res.json({
                    success: true,
                    name: data.name,
                    url: data.url + '/' + ('000' + surat).substr(-3) + '/.mp3'
                });
            } else{
                res.json({
                    success: false,
                    name: data.name,
                    info: 'nr. surat tidak ditemukan'
                });
            }
        }
    });
});

module.exports = router;