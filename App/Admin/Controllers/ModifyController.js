'use strict';
const _ = require('lodash');
const Masjid = require('../../Masjid/Model').db();
const Market = require('../../HallalMarkets/Model').db();
const Restaurant = require('../../HallalRestaurants/Model').db();
const ModelTemplateController = require('./ModelTemplateController');

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

				_.isEmpty(template) ? cb(null, null) : cb(null, template);
				break;
			default:
				cb(null, null);
				break;
		}
	}

	_updateHandler(path, data, cb){
		cb(null, null);
	}

	_addHandler(path, data, cb){
		cb(null, null);
	}

	_deleteHandler(path, data, cb){
		cb(null, null);
	}
}

module.exports = ModifyController;