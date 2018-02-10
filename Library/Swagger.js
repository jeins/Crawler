'use strict';
const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

exports.setup = (app) => {
    let swaggerDefinition = {
        info: {
            title: '',
            version: process.env.VERSION
        },
        host: process.env.API_URL,
        basePath: '/',
    };

    // options for the swagger docs
    let options = {
        // import swaggerDefinitions
        swaggerDefinition: swaggerDefinition,
        // path to the API docs
        apis: ['./App/*/Router.js'],
    };

    // initialize swagger-jsdoc
    let swaggerSpec = swaggerJSDoc(options);

    app.get('/doc', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
};