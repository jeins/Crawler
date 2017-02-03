'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const errorHandler = require('errorhandler');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.load({ path: '.env.example' });

const app = express();

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', () => {
    console.log('MongoDB connection error. Please make sure MongoDB is running.');
    process.exit();
});

app.set('port', process.env.PORT || 3000);
app.set('host', process.env.HOST || 'localhost');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(errorHandler());

app.get('/version', (req, res)=>{
    res.json({version: process.env.VERSION || '1.0.0'});
});

// const CodeCheckProcessor = require('./Processor/CodeCheck');
// CodeCheckProcessor.run();

app.listen(app.get('port'), app.get('host'), ()=>{
    console.log('Service is running at http://%s:%d in %s mode', app.get('host'), app.get('port'), app.get('env'));
});

module.exports = app;