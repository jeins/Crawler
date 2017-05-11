'use strict';

const _ = require('lodash');

module.exports = (req, res, next) => {
	let adminUser = process.env.ADMIN_USERS || null;
	let uid = req.body.uid;
	let request = req.body.request;
	let path = req.body.path;
	let data = req.body.data;

	if(!uid || !_.includes(adminUser, uid)){
		return res.status(401).json({allowed: false, success: false, message: 'user not allowed'});
	}

	if(!request || !path || !data){
		return res.status(400).json({allowed: true, success: false, message: 'request not allowed'});
	}

    next();
};