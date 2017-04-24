'use strict';

const async = require('async');
const cron = require('cron');
const _ = require('lodash');

const CodeCheckProcessor = require('./CodeCheck/Processor');
const HaditsProcessor = require('./Hadits/Processor');
const QuranProcessor = require('./Quran/Processor');
const HallalRestaurantsProcessor = require('./HallalRestaurants/Processor');

let registerProcessor = [
    {processor: CodeCheckProcessor, run: true, tracker: true},
    {processor: HaditsProcessor, run: false, tracker: false},
    {processor: QuranProcessor, run: false, tracker: false},
    {processor: HallalRestaurantsProcessor, run: false, tracker: false}
];

/**
 * register the processor
 * the default function to run the processor is run(cb);
 */
exports.run = ()=>{
    let run = [];

    _.forEach(registerProcessor, (pro)=>{
        if(pro.run){
            run.push(pro.processor);
        }
    });

    async.map(run, (processor, cb)=>{
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
    let tracker = [];

    _.forEach(registerProcessor, (pro)=>{
        if(pro.tracker){
            tracker.push(pro.processor);
        }
    });

    async.map(tracker, (processor, cb)=>{
        cron.job("0 0 */8 * * *", ()=>{
            processor.tracker(cb);
        }).start();
    }, (error, result)=>{
        if(error){
            console.log(error.message);
        } else{
            console.log(result);
        }
    });
};