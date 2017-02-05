'use strict';

const async = require('async');
const CodeCheckProcessor = require('./CodeCheck/Processor');

/**
 * register the processor
 * the default function to run the processor is run(cb);
 */
exports.run = ()=>{
    let registerProcessor = [
        CodeCheckProcessor
    ];

    async.map(registerProcessor, (processor, cb)=>{
        processor.run(cb);
    }, (error, result)=>{
        if(error){
            console.log(error.message);
        } else{
            console.log(result);
        }
    });
};