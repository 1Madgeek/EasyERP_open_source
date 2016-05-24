var express = require('express');
var router = express.Router();
var WtrackHandler = require('../handlers/dashboard');
var redisStore = require('../helpers/redisClient');
var moment = require('../public/js/libs/moment/moment');
var CONSTANTS = require('../constants/mainConstants');
var MODULES = require('../constants/modules');
var authStackMiddleware = require('../helpers/checkAuth');

module.exports = function (models) {
    'use strict';
    var moduleHRId = MODULES.DASHBOARD_HR;
    var moduleVacationId = MODULES.DASHBOARD_VACATION;
    var accessStackMiddlwareHR = require('../helpers/access')(moduleHRId, models);
    var accessStackMiddlwareVacation = require('../helpers/access')(moduleVacationId, models);
    var handler = new WtrackHandler(models);

    function cacheRetriver(req, res, next) {
        console.time('cash');
        var query = req.query;
        var filter = query.filter || {};
        var key;
        var startDate;
        var endDate;
        var startByWeek;
        var endByWeek;
        var needRefresh = !!query.refresh;

        if (filter.startDate && filter.endDate) {
            startDate = new Date(filter.startDate);
            startDate = moment(startDate);
            endDate = new Date(filter.endDate);
            endDate = moment(endDate);
        } else {
            startDate = moment().subtract(CONSTANTS.DASH_VAC_WEEK_BEFORE, 'weeks');
            endDate = moment().add(CONSTANTS.DASH_VAC_WEEK_AFTER, 'weeks');
        }

        startByWeek = startDate.isoWeekYear() * 100 + startDate.isoWeek();
        endByWeek = endDate.isoWeekYear() * 100 + endDate.isoWeek();

        delete filter.startDate;
        delete filter.endDate;

        key = startByWeek + '_' + endByWeek + '_' + JSON.stringify(filter);

        redisStore.readFromStorage('dashboardVacation', key, function (err, result) {
            if (needRefresh || !result) {
                filter.startDate = startDate;
                filter.endDate = endDate;

                return next();
            }
            try {
                result = JSON.parse(result);
                res.status(200).send(result);
                console.timeEnd('cash');
            } catch (exc){
                return next();
            }
        });
    }

    router.get('/vacation', authStackMiddleware, accessStackMiddlwareVacation, cacheRetriver, handler.composeForVacation);
    //router.get('/vacation', handler.getFromCache);
    router.get('/hr', authStackMiddleware, accessStackMiddlwareHR, handler.composeForHr);

    return router;
};