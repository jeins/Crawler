'use strict';

const async = require('async');
const cron = require('cron');
const _ = require('lodash');

const CodeCheckProcessor = require('./CodeCheck/Processor');
const HaditsProcessor = require('./Hadits/Processor');
const QuranProcessor = require('./Quran/Processor');
const HallalRestaurantsProcessor = require('./HallalRestaurants/Processor');
const MurottalProcessor = require('./Murottal/Processor');

let registerProcessor = [
    {processor: CodeCheckProcessor, run: false, tracker: false},
    {processor: HaditsProcessor, run: false, tracker: false},
    {processor: QuranProcessor, run: false},
    {processor: HallalRestaurantsProcessor, run: false, tracker: false},
    {processor: MurottalProcessor, run: false}
];

/**
 * register the processor
 * the default function to run the processor is run(cb);
 */
exports.run = ()=>{
    let run = [];

    _.forEach(registerProcessor, (pro)=>{
        if(_.has(pro, 'run') && pro.run){
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
        if(_.has(pro, 'tracker') && pro.tracker){
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