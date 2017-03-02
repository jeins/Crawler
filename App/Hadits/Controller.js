'use strict';

const express = require('express');
const logger = require('../../Helper/Logger');
const Hadits = require('./Model');
const router = express.Router();

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
			res.json(params)
		}
	});
});

module.exports = router;