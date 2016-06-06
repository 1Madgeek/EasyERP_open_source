var express = require('express');
var router = express.Router();
var Handler = require('../handlers/campaigns');

module.exports = function (models) {
    'use strict';
    var handler = new Handler(models);

    router.get('/', handler.getForDd);

    return router;
};
