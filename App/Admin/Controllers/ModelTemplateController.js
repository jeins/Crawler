'use strict';

class ModelTemplateController
{
	getTemplateToAddData(path) {
		let templateJson = {};

		switch(path.toLowerCase()){
			case 'masjid':
			case 'market':
			case 'restaurant':
				templateJson = this.getTemplateWithLocation();
				break;
		}

		return templateJson;
	}

	getTemplateWithLocation() {
		return {
			locationPath: 'masjid/market/restaurant',
			name: '',
			street: '',
			plz: '',
			city: '',
			country: 'Germany' // current country germany
		};
	}
}

module.exports = ModelTemplateController;