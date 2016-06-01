var express = require('express');
var router = express.Router();
var opportunityHandler = require('../handlers/opportunity');
var authStackMiddleware = require('../helpers/checkAuth');
var MODULES = require('../constants/modules');

module.exports = function (models, event) {
    'use strict';

    var handler = new opportunityHandler(models, event);
    var moduleId = MODULES.OPPORTUNITIES;
    var accessStackMiddlware = require('../helpers/access')(moduleId, models);

    router.get('/', authStackMiddleware, accessStackMiddlware, handler.getByViewType);
    router.get('/totalCollectionLength', authStackMiddleware, accessStackMiddlware, handler.totalCollectionLength);
    router.get('/getFilterValues', authStackMiddleware, accessStackMiddlware, handler.getFilterValues);
    router.get('/OpportunitiesForMiniView', authStackMiddleware, accessStackMiddlware, handler.opportunitiesForMiniView);
    router.get('/getLengthByWorkflows', authStackMiddleware, accessStackMiddlware, handler.getLengthByWorkflows);
    router.get('/priority', authStackMiddleware, accessStackMiddlware, handler.getLeadsPriority);
    router.post('/', authStackMiddleware, accessStackMiddlware, handler.create);
    router.post('/createLeadFromSite', handler.addNewLeadFromSite);
    router.patch('/:id', authStackMiddleware, accessStackMiddlware, handler.updateOnlySelectedFields);
    router.put('/:id', authStackMiddleware, accessStackMiddlware, handler.update);
    router.delete('/:id', authStackMiddleware, accessStackMiddlware, handler.remove);

    return router;
};