'use strict';

const async = require('async');

const processors = [
    'ZabihahProcessor'
];

exports.run = () => {
    async.map(processors, (processor, cb) => {
        require('./' + processor).run(cb);
    }, (error, result) => {
        if (error) {
            console.log(error.message);
        } else {
            console.log(result);
        }
    });
};

exports.tracker = () => {
    async.map(processors, (processor, cb) => {
        require('./' + processor).tracker(cb);
    }, (error, result) => {
        if (error) {
            console.log(error.message);
        } else {
            console.log(result);
        }
    });
};