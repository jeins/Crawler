'use strict';

const Authorization = require('../Middleware/Authorization');

exports.run = (app) => {
    app.use('/hadits', require('./Hadits/Router'));
    app.use('/product', require('./CodeCheck/Router'));
    app.use('/jadwalshalat', require('./JadwalShalat/Router'));
    app.use('/quran', require('./Quran/Router'));
    app.use('/murottal', require('./Murottal/Router'));
    app.use('/restaurant', require('./HallalRestaurants/Router'));
    app.use('/market', require('./HallalMarkets/Router'));
    app.use('/masjid', require('./Masjid/Router'));

    // routes with middleware
    app.use('/admin', Authorization, require('./Admin/Router'));
};