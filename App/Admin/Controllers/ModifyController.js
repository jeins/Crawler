'use strict';
const _ = require('lodash');
const Masjid = require('../../Masjid/Model').db();
const Market = require('../../HallalMarkets/Model').db();
const Restaurant = require('../../HallalRestaurants/Model').db();
const ModelTemplateController = require('./ModelTemplateController');
const ProductStatusController = require('../../CodeCheck/Controllers/ProductStatusController');

class ModifyController extends ModelTemplateController
{
	requestHandler(request, path, data, cb){
		switch(request){
			case 'update':
				this._updateHandler(path, data, cb);
				break;
			case 'add':
				this._addHandler(path, data, cb);
				break;
			case 'delete':
				this._deleteHandler(path, data, cb);
				break;
			case 'template':
				let template = this.getTemplateToAddData(path);

				_.isEmpty(template) ? cb(null, {err: 'template for selectede path not found'}) : cb(null, template);
				break;
			default:
				cb(null, {err: 'request not allowed'});
				break;
		}
	}

	_updateHandler(path, data, cb){
		cb(null, {err: 'request not allowed'});
	}

	_addHandler(path, data, cb){
		switch(path){
			case 'haramIngredient':
				ProductStatusController.addHaramIngredients(data, cb);
				break;
			default:
				cb(null, {err: 'request not allowed'});
				break;
		}
	}

	_deleteHandler(path, data, cb){
		cb(null, {err: 'request not allowed'});
	}
}

module.exports = ModifyController;