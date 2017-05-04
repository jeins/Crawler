'use strict';

const request = require('request-promise');

const baseUrl = 'https://api.yelp.com/v3/';

class YelpClientController {

    constructor() {
        this.appId = process.env.YELP_CLIENT_ID;
        this.appSecret = process.env.YELP_CLIENT_SECRET;
        this.accessToken = '';
    }

    getAccessToken() {
        if (this.accessToken) {
            return Promise.resolve(this.accessToken);
        } else {
            return request({
                method: 'POST',
                uri: 'https://api.yelp.com/oauth2/token',
                form: {
                    client_id: this.appId,
                    client_secret: this.appSecret,
                    grant_type: 'client_credentials'
                }
            }).then((response) => {
                this.accessToken = JSON.parse(response).access_token;
                return this.accessToken;
            });
        }
    }

    get(resource, params) {
        params = (typeof params === 'undefined') ? {} : params;

        return this.getAccessToken().then((token) => {
            return request({
                uri: baseUrl + resource + jsonToQueryString(params),
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            }).then((response) => {
                return JSON.parse(response);
            }).catch((err) => {
                // Handles expired access token
                if (err.statusCode == 401) {
                    this.accessToken = null;
                    return this.get(resource, params);
                }
                throw err;
            });
        });
    }

    search(params) {
        return this.get('businesses/search', params);
    }

    phoneSearch(params) {
        return this.get('businesses/search/phone', params);
    }

    transactionSearch(transactionType, params) {
        return this.get(`transactions/${transactionType}/search`, params);
    }

    business(id) {
        return this.get(`businesses/${id}`, undefined);
    }

    reviews(id) {
        return this.get(`businesses/${id}/reviews`, undefined);
    }

    autocomplete(params) {
        return this.get('autocomplete', params);
    }
}

function jsonToQueryString(json) {
    return '?' +
        Object.keys(json).map(function (key) {
            if (key === 'price') {
                return key + '=' + json[key];
            } else {
                return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
            }
        }).join('&');
}

module.exports = YelpClientController;