'use strict';

const request = require('request');
const util = require('util');
const fs = require('fs');
const path = require('path');
const _ =require('lodash');
const cheerio = require('cheerio');
const GDriveUploader = require('../../../Library/GoogleApi/GDriveUploader');
const Model = require('../Model');
const logger = require('../../../Library/Logger');

const allowedProductCategories = [
    'essen', 'getraenke', 'babynahrung', 'babygetraenke', 'baby_gesundheit',
    'alternativmedizin', 'medikamente', 'vitamine_mineralstoffe', 'nahrungsergaenzung_aufbaunahrung'
];

class ProductController
{
	static saveProduct(product, cb) {
		let pathName = product.thirdLvCategory ? product.thirdLvCategory : product.secondLvCategory;
		GDriveUploader.uploadImg(product.imageSrc, pathName, product.id, (error, res) => {
				if (!error && res.done) {
					product.image = res.imgName;
					product.imageUrl = res.imgUrl;
				}

				let newFood = Model(product);
				newFood.save((err) => {
						if (err) {
								logger.log('error', 'error add data to db, url: %s | error message: %s', product.urlSrc, error);
								return cb(err, null, product);
						}

						logger.log('info', 'finish save product %s', JSON.stringify(product));
						//logger.log('warn', JSON.stringify(result));
						return cb(null, true, product);
				});
		});
	}

    /**
	 *
     * @param eanCode
     * @param cb
     */
	static directSearchToCodeCheck(eanCode, productUrl, cb)
	{
		let url = 'http://www.codecheck.info/' + productUrl;

		if(!productUrl){
			let searchUrl = 'http://www.codecheck.info/product.search?q=%s';
			url = util.format(searchUrl, eanCode);
		}

		request(url, (error, response, html)=>{
			if(error){
				// TODO: add logger
				console.log(error.message);
				return cb(error.message, null);
			}

			let $ = cheerio.load(html);

			if(!$('.page-title-headline').text()){
				return cb(null, null);
			}

			let result = {ingredient: '', otherInfo: ''};
        	let productInfoList = $('.product-info-item-list');
        	let productUrl = $('#newAdvantage').attr('action');

        	if(!productUrl){
        		productUrl = $('.search-result').find('.title').first().find('a').attr('href');

        		return this.directSearchToCodeCheck(null, productUrl, cb);
        	}

        	let urlParam = productUrl.split('/');

        	result.title = this._clean($('.page-title-headline').find('h1').text());
    	    result.firstLvCategory = urlParam[2];
		    result.secondLvCategory = urlParam[3];
		    result.thirdLvCategory = (!urlParam[4].includes('ean_') && !urlParam[4].includes('id_')) ? urlParam[4] : '';

		    if (urlParam[1] === 'getraenke') {
		        result.firstLvCategory = urlParam[1];
		        result.secondLvCategory = urlParam[2];

		        if (!urlParam[3].includes('ean_') && !urlParam[3].includes('id_')) {
		            result.thirdLvCategory = urlParam[3];
		        }
		    }

		    if(!this._isCategoryAllowed(productUrl)){
		    	return cb(null, {notAllowed: true});
			}

        	$(productInfoList).find('.product-info-item').each((i, product) => {
	            let label = $(product).find('p:nth-child(1)').text();
	            let value = this._clean($(product).find('p:nth-child(2)').text());

	            switch (label) {
	                case 'Inhaltsstoffe / techn. Angaben*':
	                    result.ingredient = value;
	                    break;
	                case 'Zusatzinformationen':
	                    result.otherInfo = value;
	                    break;
	            }
	        });

	        if(result.ingredient){
				this.createJob(productUrl, '_walkingOnProduct');
	        }

        	cb(null, result);
		});
	}

    /**
	 *
     * @param url
     * @param method
     */
	static createJob(url, method)
	{
		const jobFile = path.resolve(__dirname) + '/../job.json';
		let job;

		fs.readFile(jobFile, (err, data) => {
            if (err) {
                console.error(err.message);
                return cb(err, null);
            }

            job = JSON.parse(data);

            let jobIsExist = false;

            _.forEach(job.todo, (todo)=>{
            	if(todo.url === url) {
            		jobIsExist = true;
            		return false;
            	}
            });

            if(!jobIsExist) {
            	job.todo.push({
	            	method: method,
	            	url: url
	            });

	            fs.writeFile(jobFile, JSON.stringify(job, null, 4), (err, data) => {
		            if (err) {
		                console.error(err.message);
		                return false;
		            }
		        });
            }
        });
	}

    /**
	 *
     * @param str
     * @returns {*|string|void|XML}
     * @private
     */
	static _clean(str) {
		return str.replace(/(\r\n|\n|\r|\t)/gm, "");
	}

    /**
	 *
     * @param categories
     * @returns {boolean}
     * @private
     */
	static _isCategoryAllowed(url){
		let isAllowed = false;

		_.forEach(allowedProductCategories, (category)=>{
			if(url.includes(category)){
				isAllowed = true;

				return false;
			}
		});

		return isAllowed;
	}
}

module.exports = ProductController;