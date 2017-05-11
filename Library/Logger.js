'use strict';

const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

const logPath = path.resolve(__dirname) + '/../logs';

module.exports = new (winston.Logger)({
    transports: [
        new winston.transports.DailyRotateFile({
            filename: path.join(logPath, './log'),
            datePattern: 'yyyy-MM-dd.',
            prepend: true,
            level: process.env.ENV === 'development' ? 'debug' : 'info'
        }),
        new (winston.transports.Console)({
            colorize: 'all'
        })
    ]
});