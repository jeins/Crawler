'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const dotenv = require('dotenv');

const logger = require('./Helper/Log');
const mongoose = require('./Helper/Mongoose');

dotenv.load({ path: '.env.example' });

const app = express();

mongoose.setup();

app.set('port', process.env.PORT || 3000);
app.set('host', process.env.HOST || 'localhost');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(errorHandler());

app.get('/version', (req, res)=>{
    logger.log('info', 'get version');
    res.json({version: process.env.VERSION || '1.0.0'});
});

// const CodeCheckProcessor = require('./Processor/CodeCheck');
// CodeCheckProcessor.run();

app.listen(app.get('port'), app.get('host'), ()=>{
    console.log('Service is running at http://%s:%d in %s mode', app.get('host'), app.get('port'), app.get('env'));
});

module.exports = app;