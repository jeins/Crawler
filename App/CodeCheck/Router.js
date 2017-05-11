'use strict';

const express = require('express');
const _ = require('lodash');
const logger = require('../../Library/Logger');
const Product = require('./Model');
const router = express.Router();
const ProductController = require('./Controllers/ProductController');

const haramIngredients = [
    'bier', 'rind', 'fleisch', 'wein',
    'ethylalkohol', 'alkohol', 'alcohol', 'e441',
    'schweinefleisch', 'speck', 'schwein', 'gelatine', 'speisegelatine',
    'rindfleisch', 'hunfleisch', 'hähnchenbrust',
    'e921', 'l-cystin', 'e920', 'l-cystein', 'e542', 'knochenphosphate',
    'e471', 'e471a', 'e471b', 'e471c', 'e471d', 'e471e', 'e471f',
    'e422', 'glycerin', 'e407', 'carrageen', 'e392', 'rosmarinextrakt',
    'e120', 'cochenille', 'karminsäure', 'weinhaltiger'
];

/**
 * @swagger
 * definitions:
 *   product_s:
 *     properties:
 *       title:
 *         type: string
 *       imageUrl:
 *         type: string
 *       ingredient:
 *         type: string
 *       status:
 *         type: string
 */

/**
 * @swagger
 * /product/haram:
 *   get:
 *     tags:
 *       - ProductInfo
 *     description: menampilkan informasi list komposisi haram
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: haram komposisi
 */
router.get('/haram', (req, res)=>{
    res.json(haramIngredients);
});

/**
 * @swagger
 * /product/{eanCode}:
 *   get:
 *     tags:
 *       - ProductInfo
 *     description: menampilkan informasi sebuah product berdasarkan ean-code
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: eanCode
 *         description: product ean-code
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: product info
 *         schema:
 *           $ref: '#/definitions/product_s'
 */
router.get('/:eanCode', (req, res) => {
    let eanCode = req.params.eanCode;

    Product.findOne({eanCode: eanCode}, (err, product) => {
        if (err) res.status(500).send(err);
        else if (product) {
            res.json(getResults(product));
        } else {
            ProductController.directSearchToCodeCheck(eanCode, null, (err, prod)=>{
                if(err) res.status(500).send(err);

                if(prod){
                    if(_.has(prod, 'notAllowed') && prod.notAllowed){
                        res.json(prod);
                    } else{
                        res.json(getResults(prod));
                    }
                } else{
                    res.status(404).json({notFound: true, eanCode: eanCode});
                }
            });
        }
    });
});

function getResults(product) {
    let result = {
        title: product.title,
        imageUrl: product.imageUrl,
    };

    _.merge(result, checkProductStatus(product));

    return result;
}

function checkProductStatus(prod) {
    let result = {status: 'hallal', ingredient: ''};
    let allowedKeys = ['ingredient', 'haramCategory', 'furtherInformation', 'haramIngredient'];
    let checkHandler = [
        checkProductByCategoryLv(prod),
        checkProductByIngredients(prod.ingredient),
        checkProductByFurtherInformation(prod.otherInfo)
    ];

    _.forEach(checkHandler, (val) => {
        if (val.status === 'haram') result.status = val.status;
        _.forEach(allowedKeys, (allowedKey)=>{
            if(val[allowedKey]) result[allowedKey] = val[allowedKey];
        });
    });

    return result;
}

function checkProductByIngredients(ingredient) {
    let status = 'hallal';
    let arrHaramIngredient = [];
    
    if(ingredient){
        ingredient = ingredient.toLowerCase();

        _.forEach(haramIngredients, (haramIngredient) => {
            let isSingleWord = new RegExp('\\b' + haramIngredient + '\\b').test(ingredient);

            if (_.includes(ingredient, haramIngredient) && isSingleWord) {
                status = 'haram';
                ingredient = highlightHaramIngredients(ingredient, haramIngredient);
                arrHaramIngredient.push(haramIngredient);
            }
        });
    }

    return {ingredient: ingredient, haramIngredient: _.join(arrHaramIngredient, ', '), status: status};
}

function checkProductByCategoryLv(prod) {
    let categoryLv = ['firstLvCategory', 'secondLvCategory', 'thirdLvCategory'];
    let status = 'hallal';
    let haramCat = '';

    _.forEach(categoryLv, (cat) => {
        if (prod[cat]) {
            _.forEach(haramIngredients, (haramIngredient) => {
                if (_.includes(prod[cat], haramIngredient)) {
                    status = 'haram';
                    haramCat = haramIngredient;
                    return false;
                }
            });
        }
    });

    return {status: status, haramCategory: haramCat};
}

function checkProductByFurtherInformation(furtherInformation){
    let status = 'hallal';

    if(furtherInformation){
        furtherInformation = furtherInformation.toLowerCase();

        _.forEach(haramIngredients, (haramIngredient) => {
            let isSingleWord = new RegExp('\\b' + haramIngredient + '\\b').test(furtherInformation);

            if ((_.includes(furtherInformation, haramIngredient) && isSingleWord) || _.includes(furtherInformation, 'fleisch')) {
                status = 'haram';
                furtherInformation = highlightHaramIngredients(furtherInformation, haramIngredient);
            }
        });
    }

    if(status === 'hallal') furtherInformation = '';

    return {status: status, furtherInformation: furtherInformation};
}

function highlightHaramIngredients(ingredient, haramIngredient) {
    let hightlight = '###';
    let tmpSplit = ingredient.split(',');

    _.forEach(tmpSplit, (text, i) => {
        text = text.trim().replace('.', '');

        if (_.includes(text, haramIngredient) && !_.includes(text, hightlight)) {
            tmpSplit[i] = hightlight + text + hightlight;
        } else tmpSplit[i] = text;
    });

    return _.replace(_.replace(tmpSplit.join(', '), /\*/g, ''), /###/g, '*');
}

module.exports = router;