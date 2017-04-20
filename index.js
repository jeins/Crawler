'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const corsMiddleware = require('./Middleware/Cors');
const logger = require('./Helper/Logger');
const mongoose = require('./Helper/Mongoose');
const swagger = require('./Helper/Swagger');
const AppManager = require('./App/Manager');
const ApiManager = require('./App/ApiManager');

dotenv.load({ path: '.env' });

const app = express();

app.set('port', process.env.PORT || 3000);
app.set('host', process.env.HOST || 'localhost');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(errorHandler());
app.use(corsMiddleware);

mongoose.setup();
swagger.setup(app);

AppManager.run();
AppManager.runTracker();
ApiManager.run(app);

app.use(express.static(__dirname + '/public/doc'));

app.all('*', (req, res)=>{
	res.redirect('/index.html');
	/*
    logger.log('info', 'get version');
    res.json({version: process.env.VERSION || '1.0.0'});*/
});

app.listen(app.get('port'), app.get('host'), ()=>{
    console.log('Service is running at http://%s:%d in %s mode', app.get('host'), app.get('port'), app.get('env'));
});

module.exports = app;