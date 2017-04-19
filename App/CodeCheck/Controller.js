'use strict';

const express = require('express');
const _ = require('lodash');
const logger = require('../../Helper/Logger');
const Product = require('./Model');
const router = express.Router();

const haramIngredients = [
	'bier', 'rind', 'fleisch', 'wein',
	'ethylalkohol', 'alkohol', 'schwein', 'gelatine', 'e441',
	'e921', 'l-cystin', 'e920', 'l-cystein', 'e542', 'knochenphosphate',
	'e471', 'e471a', 'e471b', 'e471c', 'e471d', 'e471e', 'e471f', 
	'e422', 'glycerin', 'e407', 'carrageen', 'e392', 'rosmarinextrakt', 
	'e120', 'cochenille', 'karminsäure'
];

router.get('/:eanCode', (req, res)=>{
	let eanCode = req.params.eanCode;

	Product.findOne({eanCode: eanCode}, (err, product)=>{
		if(err) res.status(500).send(err);
		else if(product){
			let productStatus = checkProductStatus(product);
			let result = {
				eanCode: product.eanCode,
				title: product.title,
				imageUrl: product.imageUrl,
				ingredient: productStatus.ingredient,
				status: productStatus.status
			};

			if(productStatus.haramCategory) result.haramCategory = productStatus.haramCategory;

			res.json(result);
		} else{
			res.json({notFound: true, eanCode: eanCode});
		}
	});
});

function checkProductStatus(prod){
	let result = {status: 'hallal', ingredient: ''};
	let checkHandler = [
		checkProductByIngredients(prod.ingredient),
		checkProductByCategoryLv(prod)
	];

	_.forEach(checkHandler, (val)=>{
		if(val.status === 'haram') result.status = val.status;
		if(val.ingredient) result.ingredient = val.ingredient;
		if(val.haramCategory) result.haramCategory = val.haramCategory;
	});

	return result;
}

function checkProductByIngredients(ingredient){
	let status = 'hallal';
	ingredient = ingredient.toLowerCase();

	_.forEach(haramIngredients, (haramIngredient)=>{
		let isSingleWord = new RegExp( '\\b' + haramIngredient + '\\b').test(ingredient);
		
		if(_.includes(ingredient, haramIngredient) && isSingleWord){
			status = 'haram';
			ingredient = highlightHaramIngredients(ingredient, haramIngredient);
		}
	});

	return {ingredient: ingredient, status: status};
}

function findWord(word, str) {
  return str.split(' ').some(function(w){return w === word})
}

function checkProductByCategoryLv(prod){
	let categoryLv = ['firstLvCategory', 'secondLvCategory', 'thirdLvCategory'];
	let status = 'hallal';
	let haramCat = '';

	_.forEach(categoryLv, (cat)=>{
		if(prod[cat]){
			_.forEach(haramIngredients, (haramIngredient)=>{
				if(_.includes(prod[cat], haramIngredient)){
					status = 'haram';
					haramCat = haramIngredient;
					return false;
				}
			});
		}
	});

	return {status: status, haramCategory: haramCat};
}

function highlightHaramIngredients(ingredient, haramIngredient){
	let hightlight = '*';
	let tmpSplit = ingredient.split(',');

	_.forEach(tmpSplit, (text, i)=>{
		text = text.trim().replace('.', '');

		if(_.includes(text, haramIngredient) && !_.includes(text, hightlight)) {
			tmpSplit[i] = hightlight + text + hightlight;
		} else tmpSplit[i] = text;
	});

	return tmpSplit.join(', ');
}

module.exports = router;