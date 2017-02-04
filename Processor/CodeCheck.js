'use strict';

const _ = require('lodash');
const cheerio = require('cheerio');
const request = require('request');
const async = require('async');
const moment = require('moment');
const uuid = require('uuid/v1');
const util = require('util');
const logger = require('../Helper/Logger');


const mainUrl = 'http://www.codecheck.info';
const maxPage = '100';

exports.run = ()=>{
    let categoryUrl = mainUrl + '/essen/backzutaten_suessungsmittel.kat';
    // _walkingOnCategory(categoryUrl, (error, result)=>{
    //     if(error) console.log(error.message);
    //     else console.log(result);
    // });
//     let productListUrl = '/essen/brotaufstriche/schoko_nuss_milchcremes.kat';
//     _walkingOnProductList(productListUrl, false, 15, 15, (error, result)=>{
//             if(error) console.log(error.message);
//             else console.log(result);
//     })
};

function _walkingOnHome()
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
    logger.log('info', 'start walking on category, url: %s', categoryUrl);

    request(categoryUrl, (error, response, html)=>{
        if(error) {
            logger.log('error', 'error walking on category, url: %s | error message: %s', url, error.message);
            return cb(error.message, null);
        }

        let $ = cheerio.load(html);
        let productListUrls = [];

        $('.float-group').find('.category').each((i, category)=>{
            let categoryAnchor = $(category).find('a')[0];

            productListUrls.push($(categoryAnchor).attr('href'));
        });

        async.mapSeries(productListUrls, (productListUrl, cb2)=>{
            _walkingOnProductList(productListUrl, true, 0, 0, (error, result)=>{
                if(error) return cb2(error.message, null);

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
        productListUrl = mainUrl + productListUrl.replace('.kat', util.format('/page%d.kat', page));

        logger.log('info', 'start walking on product list, url: %s', productListUrl);

        request(productListUrl, (error, response, html)=>{
            if(error) {
                logger.log('error', 'error walking on product list, url: %s | error message: %s', productListUrl, error.message);
                return cb(error.message, null);
            }

            let $ = cheerio.load(html);
            let products = $('.float-group').find('.cell.products');
            let productsLength = products.length;


            if(productsLength === 0) return cb2(null, true);

            let productUrls = [];
            products.each((i, product)=>{
                productUrls.push($(product).find('.cell-image.products a').attr('href'));
            });

            async.mapSeries(productUrls, (productUrl, cb3)=>{
                _walkingOnProduct(mainUrl + productUrl, (error, result)=>{
                    cb3(error, result);
                });
            }, (error, result)=>{
                if(error) return cb(error.message, null);

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
    logger.log('info', 'start walking on product information, url: %s', productUrl);

    request(productUrl, (error, response, html)=>{
        if(error) {
            logger.log('error', 'error walking on product information, url: %s | error message: %s', productUrl, error.message);
            return cb(error.message, null);
        }

        let $ = cheerio.load(html);

        let result = {};
        let productInfoList = $('.product-info-item-list');

        result.title = _clean($('.page-title-headline').find('h1').text());
        result.image = mainUrl + $('.product-image').find('img').attr('src');
        result.nutrition_info = [];

        $(productInfoList).find('.nutrition-facts tr').each((i, nutrition)=>{
            let label = _clean($(nutrition).find('td:nth-child(1)').text());
            let value = _clean($(nutrition).find('td:nth-child(2)').text());

            result.nutrition_info.push({label: label, value: value});
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
                    result.ean_code = value;
                    break;
                case 'Inhaltsstoffe / techn. Angaben':
                    result.ingredient = value;
                    break;
                case 'Label / Gütesiegel':
                    result.seal = value;
                    break;
                case 'Zusatzinformationen':
                    result.other_info = value;
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
                case 'Hersteller (gemäss Strichcode-Verwaltung GS1)':
                    result.producer_according_barcode_management = value;
                    break;
                case 'Letzte Änderung':
                    result.updated_at = value;
                    break;
                case 'Erfasst':
                    result.created_at = value;
                    break;
            }
        });

        logger.log('info', 'finish walking on product information, url: %s', productUrl);
        logger.log('warn', JSON.stringify(result));
        cb(null, true);
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
