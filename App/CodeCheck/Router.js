'use strict';

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

    Product.findOne({eanCode: eanCode}, (err, product) => {
        if (_.has(product, 'ingredient') && product.ingredient) {
            res.json(ProductStatusController.runAllCheckProduct(product));
        } else{
            res.status(404).json({notFound: true, eanCode: eanCode});
        }
    });
});

router.post('/product-image', (req, res) => {
    let id = req.body.id;
    let imageUrl = req.body.imageUrl;
    let pathName = req.body.pathName;
    let token = req.body.token;
    let adminToken = process.env.ADMIN_TOKEN;

    if (token === adminToken) {
        GDriveUploader.uploadImg(imageUrl, pathName, id, (error, uploadRes) => {
            if (!error && uploadRes.done) {
                return res.json({image: uploadRes.imgName, imageUrl: uploadRes.imgUrl});
            } else {
                return res.status(404).json({success: false});
            }  
        });
    } else {
        res.status(404).json({success: false});
    }
})

module.exports = router;