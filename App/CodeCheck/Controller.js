'use strict';

const express = require('express');
const _ = require('lodash');
const logger = require('../../Helper/Logger');
const Product = require('./Model');
const router = express.Router();

router.get('/:eanCode', (req, res)=>{
	let eanCode = req.params.eanCode;
	let result = 'eanCode title ingredient imageUrl';

	Product.findOne({eanCode: eanCode}, result, (err, product)=>{
		if(err) res.status(500).send(err);
		else if(product){
			let productIngredientStatus = checkProduct(product.ingredient);
			let result = {
				eanCode: product.eanCode,
				title: product.title,
				imageUrl: product.imageUrl,
				ingredient: productIngredientStatus.ingredient,
				status: productIngredientStatus.status
			};

			res.json(result);
		} else{
			res.json({notFound: true, eanCode: eanCode});
		}
	});
});

function checkProduct(ingredient){
	let status = 'hallal';
	let haramIngredients = [
		'bier', 'rind', 'fleisch',
		'ethylalkohol', 'alkohol', 'schwein', 'gelatine', 'e441',
		'e921', 'l-cystin', 'e920', 'l-cystein', 'e542', 'knochenphosphate',
		'e471', 'e471a', 'e471b', 'e471c', 'e471d', 'e471e', 'e471f', 
		'e422', 'glycerin', 'e407', 'carrageen', 'e392', 'rosmarinextrakt', 
		'e120', 'cochenille', 'karminsäure'
	];
	ingredient = ingredient.toLowerCase();

	_.forEach(haramIngredients, (haramIngredient)=>{
		if(_.includes(ingredient, haramIngredient)){
			status = 'haram';
			ingredient = highlightHaramIngredients(ingredient, haramIngredient);
		}
	});

	return {ingredient: ingredient, status: status};
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