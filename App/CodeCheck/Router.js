'use strict';

const axios = require('axios');
const express = require('express');
const _ = require('lodash');
const logger = require('../../Library/Logger');
const Product = require('./Model');
const router = express.Router();
const ProductController = require('./Controllers/ProductController');
const ProductStatusController = require('./Controllers/ProductStatusController');
const GDriveUploader = require('../../Library/GoogleApi/GDriveUploader');

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

    Product.findOne({eanCode: eanCode, ingredient: { $ne: null }}, (err, product) => {
        if (product && product.ingredient) {
            res.json(ProductStatusController.runAllCheckProduct(product));
        } else{
            axios({
                method: 'POST',
                url: process.env.CRAWLER_URL+'/api/product/',
                data: { eanCode: eanCode },
                timeout: 50000,
              }).then((response) => {
                  const { data } = response;

                    if (data && data.data && data.allowedProduct) {
                        ProductController.saveProduct(data.data, (err, success, newData) => {
                            if (success) {
                                res.json(ProductStatusController.runAllCheckProduct(newData));
                            } else {
                                res.status(404).json({notFound: true, eanCode: eanCode});
                            }
                        });
                    } else if(data && data.data.title && !data.allowedProduct) {
                        res.json({notAllowed: true, title: data.data.title});
                    } else {
                        res.status(404).json({notFound: true, eanCode: eanCode});
                    }
                }).catch((err) => {
                    console.log(err);
                    res.status(404).json({notFound: true, eanCode: eanCode});
                });
        }
    });
});

router.post('/product', (req, res) => {
    let { product} = req.body;

    if (product) {
        ProductController.saveProduct(product, (err, success) => {
            if (success) {
                res.json({success: true});
            } else {
                res.status(404).json({success: false});
            }
        });
    } else {
        res.status(404).json({success: false});
    }
})

module.exports = router;