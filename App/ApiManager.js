'use strict';

exports.run = (app)=>{
	app.use('/hadits', require('./Hadits/Controller'));
	app.use('/product', require('./CodeCheck/Controller'));
};