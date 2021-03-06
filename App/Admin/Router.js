'use strict';

const express = require('express');
const router = express.Router();

const ModifyController = require('./Controllers/ModifyController');

router.post('/modify', (req, res) => {
	let modifyController = new ModifyController();

	modifyController.requestHandler(
		req.body.request, 
		req.body.path,
		req.body.data,
		(error, result)=>{
			if(error) return res.status(500).send({allowed: true, success: false, message: error});
			if(!result || result.err) return res.status(400).json({allowed: true, success: false, message: result.err});

			res.json(result);
		}
	);
});

module.exports = router;