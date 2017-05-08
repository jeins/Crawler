'use strict';

const request = require('request');
const util = require('util');
const fs = require('fs');
const path = require('path');
const _ =require('lodash');
const cheerio = require('cheerio');

const allowedProductCategories = [
    'essen', 'getraenke', 'babynahrung', 'babygetraenke', 'baby_gesundheit',
    'alternativmedizin', 'medikamente', 'vitamine_mineralstoffe', 'nahrungsergaenzung_aufbaunahrung'
];

class ProductController
{
    /**
	 *
     * @param eanCode
     * @param cb
     */
	static directSearchToCodeCheck(eanCode, cb)
	{
		let searchUrl = 'http://www.codecheck.info/product.search?q=%s';
		let url = util.format(searchUrl, eanCode);

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
        	let urlParam = productUrl.split('/');

        	result.title = this._clean($('.page-title-headline').find('h1').text());
    	    result.firstLvCategory = urlParam[2];
		    result.secondLvCategory = urlParam[3];
		    result.thirdLvCategory = (!urlParam[4].includes('ean_') && !urlParam[4].includes('id_')) ? urlParam[4] : '';

		    if(!this._isCategoryAllowed([result.firstLvCategory, result.secondLvCategory, result.thirdLvCategory])){
		    	return cb(null, {notAllowed: true});
			}

        	$(productInfoList).find('.product-info-item').each((i, product) => {
	            let label = $(product).find('p:nth-child(1)').text();
	            let value = this._clean($(product).find('p:nth-child(2)').text());

	            switch (label) {
	                case 'Inhaltsstoffe / techn. Angaben':
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
	static _isCategoryAllowed(categories){
		let isAllowed = false;

		_.forEach(categories, (category)=>{
			if(_.includes(allowedProductCategories, category)){
				isAllowed = true;

				return false;
			}
		});

		return isAllowed;
	}
}

module.exports = ProductController;