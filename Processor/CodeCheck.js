'use strict';

const _ = require('lodash');
const cheerio = require('cheerio');
const request = require('request');
const async = require('async');
const moment = require('moment');
const uuid = require('uuid/v1');
const util = require('util');


const mainUrl = 'http://www.codecheck.info';
const maxPage = '100';

exports.run = ()=>{
    _walkingOnCategory((error, result)=>{
        if(error) console.log(error.message);
        else console.log(result);
    });
};

function _walkingOnHome()
{
    let url = 'http://www.codecheck.info/essen.kat';

}

function _walkingOnCategory(cb)
{
    let url = 'http://www.codecheck.info/essen/backzutaten_suessungsmittel.kat';

    request(url, (error, response, html)=>{
        if(error) return cb(error.message, null);

        let $ = cheerio.load(html);
        let productListUrls = [];

        $('.float-group').find('.category').each((i, category)=>{
            let categoryAnchor = $(category).find('a')[0];

            productListUrls.push($(categoryAnchor).attr('href'));
        });

        async.mapSeries(productListUrls, (productListUrl, next)=>{
            _walkingOnProductList(productListUrl, (error, result)=>{
                if(error) return cb(error.message, null);

                next(error, result);
            });
        }, (error, result)=>{
            if(error) cb(error, null);
            else cb(null, result);
        });
    });
}

function _walkingOnProductList(productListUrl, cb)
{
    async.mapSeries(_.times(maxPage, String), (page, cb2)=>{
        page++;
        productListUrl = mainUrl + productListUrl.replace('.kat', util.format('/page%d.kat', page));

        request(productListUrl, (error, response, html)=>{
            if(error) return cb(error.message, null);

            let $ = cheerio.load(html);
            let products = $('.float-group').find('.cell.products');
            let productsLength = products.length;


            if(productsLength === 0) return cb2(null, true);

            let productUrls = [];
            products.each((i, product)=>{
                productUrls.push($(product).find('.cell-image.products a').attr('href'));
            });

            async.mapSeries(productUrls, (productUrl, cb3)=>{
                _walkingOnProduct(productUrl, (error, result)=>{
                    cb3(error, result);
                });
            }, (error, result)=>{
                if(error) return cb(error.message, null);

                cb2(error, result);
            });
        });
    }, (error, result)=>{
        if(error) return cb(error.message, null);

        cb(error, result);
    });
}

function _walkingOnProduct(productUrl, cb)
{
    request(mainUrl + productUrl, (error, response, html)=>{
        if(error) return cb(error.message, null);

        let $ = cheerio.load(html);

        let result = {};
        let productInfoList = $('.product-info-item-list');

        result.title = _clean($('.page-title-headline').find('h1').text());
        result.nutrition_info = _clean($(productInfoList).find('.nutrition-facts').text());
        result.image = mainUrl + $('.product-image').find('img').attr('src');

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
console.log(result);
process.exit();
        cb(null, true);
    });
}

function _clean(str)
{
    return str.replace(/(\r\n|\n|\r|\t)/gm,"");
}