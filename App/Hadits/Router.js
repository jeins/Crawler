'use strict';

const express = require('express');
const logger = require('../../Helper/Logger');
const Hadits = require('./Model');
const router = express.Router();

/**
 * @swagger
 * /hadits/:
 *   get:
 *     tags:
 *       - Hadits
 *     description: menampilkan list perawi
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: perawi hadits
 */
router.get('/', (req, res)=>{
	Hadits.find().distinct('perawi', (err, data)=>{
        if(err) res.status(500).send(err);
        else{
        	res.json(data);
		}
	})
});

/**
 * @swagger
 * /hadits/{perawi}:
 *   get:
 *     tags:
 *       - Hadits
 *     description: menampilkan total hadits yang tersedia berdasarkan perawi
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: perawi
 *         description: nama perawi hadits
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: perawi dengan total hadits yang tersedia
 */
router.get('/:perawi', (req, res)=>{
	let perawi = req.params.perawi;
	let params = {perawi: perawi};

	Hadits.count(params, (err, count)=>{
		if(err) res.status(500).send(err);
		else{
			params['totalHadits'] = count;

			res.json(params);
		}
	});
});

/**
 * @swagger
 * /hadits/{perawi}/{nrHadits}:
 *   get:
 *     tags:
 *       - Hadits
 *     description: menampilkan hadits berdasarkan perawi dan nomor hadits
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: perawi
 *         description: nama perawi hadits
 *         in: path
 *         required: true
 *         type: string
 *       - name: nrHadits
 *         description: nama perawi hadits
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: perawi dengan total hadits yang tersedia
 */
router.get('/:perawi/:nrHadits', (req, res)=>{
	let perawi = req.params.perawi;
	let nrHadits = req.params.nrHadits;
	let params = {
		perawi: perawi,
		nrHadits: nrHadits
	};

	Hadits.findOne(params, 'contentArab contentIndo', (err, hadits)=>{
		if(err) res.status(500).send(err);
		else if(hadits){
			params['contentArab'] = decodeURIComponent(escape(hadits.contentArab));
			params['contentIndo'] = hadits.contentIndo;

			res.json(params);
		} else{
			params['notFound'] = true;
			res.status(404).json(params)
		}
	});
});

module.exports = router;