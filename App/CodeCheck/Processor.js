'use strict';

/**
 * README:
 * target: codecheck.info
 * processor akan bekerja sesuai dengan perintah yang tertulis pada job.json
 * informasi pada job.json terdiri dari nama function dan kebutuhan parameter dari setiap function, sebagai contoh:
 *
 *  {
 *      "method": "_walkingOnProduct",
 *      "url": "/essen/backzutaten_suessungsmittel/backaroma/ean_7610188127081/id_396127/Patissier_Geriebene_Zitronenschale.pro"
 *  }
 *
 * perintah diatas dapat diartikan processor akan menjalankan function _walkingOnProduct dengan parameter product url yang diberikan
 */

const _ = require('lodash');
const cheerio = require('cheerio');
const request = require('request');
const async = require('async');
const moment = require('moment');
const uuid = require('uuid/v1');
const path = require('path');
const util = require('util');
const fs = require('fs');
const logger = require('../../Helper/Logger');
const GDriveUploader = require('../../Helper/GDriveUploader');
const Model = require('./Model');

const TAG = 'ProductFromCodeCheck';
const jobFile = path.resolve(__dirname) + '/job.json';
const mainUrl = 'http://www.codecheck.info';
const maxPage = '100';
let job;

/**
 * main craw
 * @param mainCb
 */
exports.run = (mainCb)=>{
    async.waterfall([
        (cb)=>{
            _job('read', (error, result)=>{
                if(error) cb(error, null);
                else cb(null, true);
            });
        },
        (arg, cb)=>{
            if(!_.isEmpty(job.todo)){
                let index = 0;

                async.mapSeries(job.todo, (todo, cb2)=>{
                    logger.log('info', 'job start %s, method: %s | url: %s', TAG, todo.method, todo.url);

                    let jobDoc = (error, result)=>{
                        todo.timestamp = moment().toISOString();

                        delete job.todo[index];
                        index++;

                        if(error){
                            logger.log('error', 'job failed %s, method: %s | url: %s', TAG, todo.method, todo.url);
                            job.failed.push(todo);
                            cb2(null, false);
                        }
                        else {
                            logger.log('info', 'job completed %s, method: %s | url: %s', TAG, todo.method, todo.url);
                            job.completed.push(todo);
                            cb2(null, result);
                        }
                    };

                    switch (todo.method){
                        case '_walkingOnHome':
                            _walkingOnHome((error, result)=>{jobDoc(error, result);});
                            break;
                        case '_walkingOnCategory':
                            _walkingOnCategory(todo.url, (error, result)=>{jobDoc(error, result);});
                            break;
                        case '_walkingOnProductList':
                            _walkingOnProductList(todo.url, todo.allPage, todo.start, todo.end, (error, result)=>{jobDoc(error, result);});
                            break;
                        case '_walkingOnProduct':
                            _walkingOnProduct(todo.url, (error, result)=>{jobDoc(error, result);});
                            break;
                    }
                }, (error, result)=>{
                    if(error) cb(error, null);
                    else cb(null, result);
                });
            } else{
                logger.log('info', 'nothing to do on job %s ', TAG);
                mainCb(null, false);
            }
        },
        (arg, cb)=>{
            _job('write', (error, result)=>{
                if(error) cb(error, null);
                else cb(null, arg);
            });
        }
    ], mainCb);
};

/**
 * main tracker
 * @param mainCb
 */
exports.tracker = (mainCb)=>{
    logger.log('info', 'tracker on %s is starting', TAG);

    async.waterfall([
        (cb)=>{
            _walkingOnNewProductList(cb);
        }
    ], mainCb);
};

/**
 * read or write job documentation
 * @param readOrWrite
 * @param cb
 * @private
 */
function _job(readOrWrite, cb)
{
    if(readOrWrite === 'read'){
        fs.readFile(jobFile, (err, data)=>{
            if(err) {
                console.error(err.message);
                return cb(err, null);
            }

            job = JSON.parse(data);
            logger.log('info', 'read job %s', TAG);
            cb(null, true);
        });
    } else if(readOrWrite === 'write'){
        job.todo = _.remove(job.todo, (todo)=>{
            return todo === null;
        });

        fs.writeFile(jobFile, JSON.stringify(job, null, 4), (err, data)=>{
            if(err) {
                console.error(err.message);
                return cb(err, null);
            }

            logger.log('info', 'job %s has been finished', TAG);
            cb(null, true);
        });
    }
}

function _walkingOnHome(cb)
{
    let url = 'http://www.codecheck.info/essen.kat';
}

/**
 * uri => /essen/__category__.kat
 * exp => /essen/backzutaten_suessungsmittel.kat
 * @param categoryUrl
 * @param cb
 * @private
 */
function _walkingOnCategory(categoryUrl, cb)
{
    categoryUrl = mainUrl + categoryUrl;
    logger.log('info', 'start walking on category, url: %s', categoryUrl);

    request(categoryUrl, (error, response, html)=>{
        if(error) {
            logger.log('error', 'error walking on category, url: %s | error message: %s', url, error.message);
            return cb(error.message, null);
        }

        let $ = cheerio.load(html);
        let productListUrls = [];

        $('.float-group').find('.cell-text.category').each((i, category)=>{
            let categoryAnchor = $(category).find('a')[0];
            let url = $(categoryAnchor).attr('href');
            let tmpPage = $(category).find('.c.secondary').text().split(' ')[0];
            let maxPage = Math.ceil(tmpPage / 50) + 1;

            productListUrls.push({url: url, maxPage: maxPage});
        });

        async.mapSeries(productListUrls, (productListUrl, cb2)=>{
            _walkingOnProductList(productListUrl.url, false, 1, productListUrl.maxPage, (error, result)=>{
                if(error) return cb(error, null);

                cb2(error, result);
            });
        }, (error, result)=>{
            if(error) return cb(error, null);

            logger.log('info', 'finish walking on category, url: %s', categoryUrl);
            cb(null, result);
        });
    });
}

/**
 * uri => /essen/__category__/__productList__.kat
 * exp => /essen/backzutaten_suessungsmittel/backaroma.kat
 * @param productListUrl
 * @param allPage
 * @param start
 * @param end
 * @param cb
 * @private
 */
function _walkingOnProductList(productListUrl, allPage, start, end, cb)
{
    async.mapSeries(_getPage(allPage, start, end), (page, cb2)=>{
        if(allPage) page++;
        let previousPage = (page !== 1) ? page - 1 : page;

        productListUrl = (productListUrl.includes("page")) ?
            productListUrl.replace('/page' + previousPage, '/page' + page):
            mainUrl + productListUrl.replace('.kat', util.format('/page%d.kat', page));

        logger.log('info', 'start walking on product list, url: %s', productListUrl);

        request(productListUrl, (error, response, html)=>{
            if(error) {
                logger.log('error', 'error walking on product list, url: %s | error message: %s', productListUrl, error.message);
                return cb(error.message, null);
            }

            let $ = cheerio.load(html);
            let products = $('.float-group').find('.cell.products');
            let productsLength = products.length;


            if(productsLength === 0) {
                if(page == 1){
                    logger.log('warn', 'no product found on, url: %s', productListUrl);
                }
                return cb2(null, true);
            }

            let productUrls = [];
            products.each((i, product)=>{
                productUrls.push($(product).find('.cell-image.products a').attr('href'));
            });

            async.mapSeries(productUrls, (productUrl, cb3)=>{
                _walkingOnProduct(productUrl, (error, result)=>{
                    cb3(error, result);
                });
            }, (error, result)=>{
                if(error) return cb(error, null);

                cb2(error, result);
            });
        });
    }, (error, result)=>{
        if(error) return cb(error.message, null);

        logger.log('info', 'finish walking on product list, url: %s', productListUrl);
        cb(error, result);
    });
}

/**
 * uri => /essen/__category__/__productList__/__product__.pro
 * exp => /essen/backzutaten_suessungsmittel/backaroma/ean_42256199/id_1418316153/Alnatura_Orangenschale_gerieben.pro
 * @param productUrl
 * @param cb
 * @private
 */
function _walkingOnProduct(productUrl, cb)
{
    let urlParam = productUrl.split('/');
    let firstLvCategory = urlParam[2];
    let secondLvCategory = urlParam[3]; 
    let haveThirdLvCategory = (!urlParam[4].includes('ean_') && !urlParam[4].includes('id_'));
    let thirdLvCategory = (haveThirdLvCategory) ? urlParam[4] : '';

    if(!haveThirdLvCategory && urlParam[1] === 'getraenke'){
        firstLvCategory = urlParam[1];
        secondLvCategory = urlParam[2];

        if(!urlParam[3].includes('ean_') && !urlParam[3].includes('id_')){
            thirdLvCategory = urlParam[3];
            haveThirdLvCategory = true;
        }
    }

    productUrl = mainUrl + productUrl;
    logger.log('info', 'start walking on product information, url: %s', productUrl);

    request(productUrl, (error, response, html)=>{
        if(error) {
            logger.log('error', 'error walking on product information, url: %s | error message: %s', productUrl, error.message);
            return cb(error.message, null);
        }

        let $ = cheerio.load(html);

        let result = {};
        let productInfoList = $('.product-info-item-list');

        result.id = uuid();
        result.title = _clean($('.page-title-headline').find('h1').text());
        result.imageSrc = mainUrl + $('.product-image').find('img').attr('src');
        result.urlSrc = productUrl;
        result.firstLvCategory = firstLvCategory;
        result.secondLvCategory = secondLvCategory;

	    if(haveThirdLvCategory) result.thirdLvCategory = thirdLvCategory;

        result.crawledAt = moment().toISOString();
        result.nutritionInfo = [];

        if(_.isEmpty(result.title) || result.title === '') {
            logger.log('error', 'cant record data from url: %s', productUrl);
            return cb(null, false);
        }

        $(productInfoList).find('.nutrition-facts tr').each((i, nutrition)=>{
            let label = _clean($(nutrition).find('td:nth-child(1)').text());
            let value = _clean($(nutrition).find('td:nth-child(2)').text());

            result.nutritionInfo.push(JSON.stringify({label: label, value: value}));
        });

        $(productInfoList).find('.product-info-item').each((i, product)=>{
            let label = $(product).find('p:nth-child(1)').text();
            let value = _clean($(product).find('p:nth-child(2)').text());

            switch (label){
                case 'Kategorie':
                    result.category = value;
                    break;
                case 'Menge / Grösse':
                    result.quantity = value;
                    break;
                case 'Strichcode-Nummer':
                    result.eanCode = value;
                    break;
                case 'Inhaltsstoffe / techn. Angaben':
                    result.ingredient = value;
                    break;
                case 'Label / Gütesiegel':
                    result.seal = value;
                    break;
                case 'Zusatzinformationen':
                    result.otherInfo = value;
                    break;
                case 'Herkunft':
                    result.origin = value;
                    break;
                case 'Hersteller / Vertrieb':
                    result.producer = value;
                    break;
                case 'Marke':
                    result.brand = value;
                    break;
                // case 'Hersteller (gemäss Strichcode-Verwaltung GS1)':
                //     result.producer_according_barcode_management = value;
                //     break;
                case 'Letzte Änderung':
                    result.updatedAt = value;
                    break;
                case 'Erfasst':
                    result.createdAt = value;
                    break;
            }
        });

        _checkIsProductExist(result.eanCode, (err, isExist)=>{
            if(err) return cb(err, null);

            if(isExist){
                logger.log('warn', 'product is exist, ean code: %s', result.eanCode);
                return cb(null, false);
            } else{
                let pathName = (haveThirdLvCategory) ? thirdLvCategory : secondLvCategory;
                GDriveUploader.uploadImg(result.imageSrc, pathName, result.id, (error, res)=>{
                    if(!error && res.done){
                        result.image = res.imgName;
                        result.imageUrl = res.imgUrl;
                    }

                    let newFood = Model(result);
                    newFood.save((err)=>{
                        if(err){
                            logger.log('error', 'error add data to db, url: %s | error message: %s', productUrl, error);
                            return cb(err, null);
                        }

                        logger.log('info', 'finish walking on product information, url: %s', productUrl);
                        //logger.log('warn', JSON.stringify(result));
                        cb(null, true);
                    });
                });
            }
        });
    });
}

function _walkingOnNewProductList(cb)
{
    async.mapSeries(_.times(maxPage, String), (page, cb2)=>{
        page++;
        let url = mainUrl + '/community/neue-produkte/' + page;

        request(url, (error, response, html)=>{
            if(error) {
                logger.log('error', 'error walking on new product list, url: %s | error message: %s', url, error.message);
                return cb(error.message, null);
            }

            let $ = cheerio.load(html);
            let selectedPage = $('.nums').find('span').first().text();

            if(selectedPage != page) {
                logger.log('warn', 'selected page not found, url: %s | current page: %d', url, selectedPage);
                return cb(null, false);
            }

            let productUrls = [];
            $('.area.new-products-row').each((i, product)=>{
                let isFood = $(product).html().includes('/essen/');
                let isDrink = $(product).html().includes('/getraenke/');
                let isEanCodeNotNull = true;

                $(product).find('.row').each((j, row)=>{
                    if($(row).text().includes('Strichcode-Nummer') && $(row).text().includes('Bitte erfassen')){
                        isEanCodeNotNull = false;
                    }
                });

                if((isFood || isDrink) && isEanCodeNotNull){
                    productUrls.push($(product).find('.nf').attr('href'));
                }
            });

            async.mapSeries(productUrls, (productUrl, cb3)=>{
                _walkingOnProduct(productUrl, cb3);
            }, cb2);
        });
    }, cb);
}

function _walkingOnUpdateProduct(maxDate, cb)
{
    let maxPage = 200;
    async.mapSeries(_.times(maxPage, String), (page, cb2)=>{
        page++;
        let url = mainUrl + '/community/letzte-aenderungen/' + page;

        request(url, (error, response, html)=>{
            if(error) {
                logger.log('error', 'error walking on updated product list, url: %s | error message: %s', url, error.message);
                return cb(error.message, null);
            }


            
        });
    }, cb);
}

function _checkIsProductExist(eanCode, cb){
    let query  = Model.where({eanCode: eanCode});

    query.findOne(function (err, doc) {
        if(err){
            logger.log('error', 'error on check existing of ean code, ean code: %s | error message: %s', eanCode, err.message);
            return cb(err, null);
        }

        if(doc){
            cb(null, true);
        } else cb(null, false);
    });
}

function _getPage(allPage, start, end)
{
    if(allPage) return _.times(maxPage, String);

    let page = [];
    for(let i=start; i <= end; i++) page.push(i);

    return page;
}

function _clean(str)
{
    return str.replace(/(\r\n|\n|\r|\t)/gm,"");
}
