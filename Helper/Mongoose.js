'use strict';

const mongoose = require('mongoose');
const logger = require('./Log');

exports.setup = ()=>{
    mongoose.Promise = global.Promise;
    mongoose.connect(process.env.MONGODB_URI);
    mongoose.connection.on('error', () => {
        logger.log('error', 'MongoDB connection error. Please make sure MongoDB is running.');
        process.exit();
    });
};