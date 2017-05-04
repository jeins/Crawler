'use strict';

exports.run = (app)=>{
	app.use('/hadits', require('./Hadits/Router'));
	app.use('/product', require('./CodeCheck/Router'));
	app.use('/jadwalshalat', require('./JadwalShalat/Router'));
	app.use('/quran', require('./Quran/Router'));
	app.use('/murottal', require('./Murottal/Router'));
	app.use('/restaurant', require('./HallalRestaurants/Router'));
};