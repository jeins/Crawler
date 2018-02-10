'use strict';

const express = require('express');
const _ = require('lodash');
const logger = require('../../Library/Logger');
const Product = require('./Model');
const router = express.Router();
const ProductController = require('./Controllers/ProductController');
const ProductStatusController = require('./Controllers/ProductStatusController');

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
    res.json(ProductStatusController.getHaramIngredients());
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
        else if (_.has(product, 'ingredient') && product.ingredient) {
            res.json(ProductStatusController.runAllCheckProduct(product));
        } else {
            ProductController.directSearchToCodeCheck(eanCode, null, (err, prod)=>{
                if(err) res.status(500).send(err);

                if(prod){
                    if(_.has(prod, 'notAllowed') && prod.notAllowed){
                        res.json(prod);
                    } else{
                        res.json(ProductStatusController.runAllCheckProduct(prod));
                    }
                } else{
                    res.status(404).json({notFound: true, eanCode: eanCode});
                }
            });
        }
    });
});

module.exports = router;