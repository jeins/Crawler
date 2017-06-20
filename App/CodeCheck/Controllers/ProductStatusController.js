'use strict';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const haramIngredientsFile = path.resolve(__dirname) + '/../haramIngredients.json';

class ProductStatusController
{
	constructor(){
		this._readHaramIngredientsData((err, data)=>{
			if(err) return console.log(err);

			this.haramIngredients = data;
		})
	}

	getHaramIngredients(){
		return this.haramIngredients;
	}

	runAllCheckProduct(product) {
	    let result = {
	        title: product.title,
	        imageUrl: product.imageUrl,
	    };

	    _.merge(result, this.checkProductStatus(product));

	    return result;
	}

	checkProductStatus(prod) {
	    let result = {status: 'hallal', ingredient: ''};
	    let allowedKeys = ['ingredient', 'haramCategory', 'furtherInformation', 'haramIngredient'];
	    let checkHandler = [
	        this.checkProductByCategoryLv(prod),
	        this.checkProductByIngredients(prod.ingredient),
	        this.checkProductByFurtherInformation(prod.otherInfo)
	    ];

	    _.forEach(checkHandler, (val) => {
	        if (val.status === 'haram') result.status = val.status;
	        _.forEach(allowedKeys, (allowedKey)=>{
	            if(val[allowedKey]) result[allowedKey] = val[allowedKey];
	        });
	    });

	    return result;
	}

	checkProductByIngredients(ingredient) {
	    let status = 'hallal';
	    let arrHaramIngredient = [];
	    
	    if(ingredient){
	        ingredient = ingredient.toLowerCase();

	        _.forEach(this.haramIngredients, (haramIngredient) => {
	            let isSingleWord = new RegExp('\\b' + haramIngredient + '\\b').test(ingredient);

	            if (_.includes(ingredient, haramIngredient) && isSingleWord) {
	                status = 'haram';
	                ingredient = this.highlightHaramIngredients(ingredient, haramIngredient);
	                arrHaramIngredient.push(haramIngredient);
	            }
	        });
	    }

	    return {ingredient: ingredient, haramIngredient: _.join(arrHaramIngredient, ', '), status: status};
	}

	checkProductByCategoryLv(prod) {
	    let categoryLv = ['firstLvCategory', 'secondLvCategory', 'thirdLvCategory'];
	    let status = 'hallal';
	    let haramCat = '';

	    _.forEach(categoryLv, (cat) => {
	        if (prod[cat]) {
	            _.forEach(this.haramIngredients, (haramIngredient) => {
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

	checkProductByFurtherInformation(furtherInformation){
	    let status = 'hallal';

	    if(furtherInformation){
	        furtherInformation = furtherInformation.toLowerCase();

	        _.forEach(this.haramIngredients, (haramIngredient) => {
	            let isSingleWord = new RegExp('\\b' + haramIngredient + '\\b').test(furtherInformation);

	            if ((_.includes(furtherInformation, haramIngredient) && isSingleWord) || _.includes(furtherInformation, 'fleisch')) {
	                status = 'haram';
	                furtherInformation = this.highlightHaramIngredients(furtherInformation, haramIngredient);
	            }
	        });
	    }

	    if(status === 'hallal') furtherInformation = '';

	    return {status: status, furtherInformation: furtherInformation};
	}

	highlightHaramIngredients(ingredient, haramIngredient) {
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

	addHaramIngredients(newHaramIngredient, cb){
		if(_.includes(this.haramIngredients, newHaramIngredient)){
			cb(null, {err: newHaramIngredient + ' is already exist'});
		} else{
			this.haramIngredients.push(newHaramIngredient);
			this._writeHaramIngredientsData(cb);
		}
	}

	_readHaramIngredientsData(cb){
		fs.readFile(haramIngredientsFile, (err, data) => {
            if (err) {
                console.error(err.message);
                return cb(err, null);
            }

            cb(null, JSON.parse(data).ingredients);
        });
	}

	_writeHaramIngredientsData(cb){
		fs.writeFile(haramIngredientsFile, JSON.stringify({ingredients: this.haramIngredients}, null, 4), (err, data) => {
            if (err) {
                console.error(err.message);
                return cb(err, null);
            }

            cb(null, "finish added data");
        });
	}
}

module.exports = new ProductStatusController();