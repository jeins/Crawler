'use strict';

const async = require('async');
const CodeCheckProcessor = require('./CodeCheck/Processor');
const HaditsProcessor = require('./Hadits/Processor');
const cron = require('cron');

/**
 * register the processor
 * the default function to run the processor is run(cb);
 */
exports.run = ()=>{
    let registerProcessor = [
        CodeCheckProcessor,
        HaditsProcessor
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

/**
 * register the tracker cron job
 */
exports.runTracker = ()=>{
    // register cron job
    let ccpJob = cron.job("0 0 */8 * * *", ()=>{
        CodeCheckProcessor.tracker((error, result)=>{
            if(error){
                console.log(error.message);
            } else{
                console.log(result);
            }
        });
    });

    // start cron jon
    ccpJob.start();
};