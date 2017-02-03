'use strict';

const winston = require('winston');
require('winston-daily-rotate-file');

exports.logger = new (winston.Logger)({
    transports: [
        new winston.transports.DailyRotateFile({
            filename: '../log',
            datePattern: 'yyyy-MM-dd.',
            prepend: true,
            level: process.env.ENV === 'development' ? 'debug' : 'info'
        })
    ]
});