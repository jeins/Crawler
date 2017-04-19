'use strict';

exports.run = (app)=>{
	app.use('/hadits', require('./Hadits/Controller'));
	app.use('/product', require('./CodeCheck/Controller'));
	app.use('/jadwalshalat', require('./JadwalShalat/Controller'));
	app.use('/quran', require('./Quran/Controller'));
};