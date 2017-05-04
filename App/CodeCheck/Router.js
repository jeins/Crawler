'use strict';

const express = require('express');
const _ = require('lodash');
const logger = require('../../Helper/Logger');
const Product = require('./Model');
const router = express.Router();

const haramIngredients = [
    'bier', 'rind', 'fleisch', 'wein',
    'ethylalkohol', 'alkohol', 'e441',
    'schweinefleisch', 'speck', 'schwein', 'gelatine', 'speisegelatine',
    'e921', 'l-cystin', 'e920', 'l-cystein', 'e542', 'knochenphosphate',
    'e471', 'e471a', 'e471b', 'e471c', 'e471d', 'e471e', 'e471f',
    'e422', 'glycerin', 'e407', 'carrageen', 'e392', 'rosmarinextrakt',
    'e120', 'cochenille', 'karminsäure'
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
            let productStatus = checkProductStatus(product);
            let result = {
                title: product.title,
                imageUrl: product.imageUrl,
                ingredient: productStatus.ingredient,
                status: productStatus.status
            };

            if (productStatus.haramCategory) result.haramCategory = productStatus.haramCategory;

            res.json(result);
        } else {
            res.status(404).json({notFound: true, eanCode: eanCode});
        }
    });
});

function checkProductStatus(prod) {
    let result = {status: 'hallal', ingredient: ''};
    let checkHandler = [
        checkProductByIngredients(prod.ingredient),
        checkProductByCategoryLv(prod)
    ];

    _.forEach(checkHandler, (val) => {
        if (val.status === 'haram') result.status = val.status;
        if (val.ingredient) result.ingredient = val.ingredient;
        if (val.haramCategory) result.haramCategory = val.haramCategory;
    });

    return result;
}

function checkProductByIngredients(ingredient) {
    let status = 'hallal';
    ingredient = ingredient.toLowerCase();

    _.forEach(haramIngredients, (haramIngredient) => {
        let isSingleWord = new RegExp('\\b' + haramIngredient + '\\b').test(ingredient);

        if (_.includes(ingredient, haramIngredient) && isSingleWord) {
            status = 'haram';
            ingredient = highlightHaramIngredients(ingredient, haramIngredient);
        }
    });

    return {ingredient: ingredient, status: status};
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

function highlightHaramIngredients(ingredient, haramIngredient) {
    let hightlight = '*';
    let tmpSplit = ingredient.split(',');

    _.forEach(tmpSplit, (text, i) => {
        text = text.trim().replace('.', '');

        if (_.includes(text, haramIngredient) && !_.includes(text, hightlight)) {
            tmpSplit[i] = hightlight + text + hightlight;
        } else tmpSplit[i] = text;
    });

    return tmpSplit.join(', ');
}

module.exports = router;