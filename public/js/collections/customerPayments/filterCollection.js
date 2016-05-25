/**
 * Created by soundstorm on 21.05.15.
 */
define([
        'Backbone',
        'models/PaymentModel',
        'constants'
    ],
    function (Backbone, PaymentModel, CONSTANTS) {
        'use strict';

        var PaymentCollection = Backbone.Collection.extend({
            model       : PaymentModel,
            url         : CONSTANTS.URLS.PAYMENTCUSTOMERS,
            page        : null,
            namberToShow: null,
            viewType    : null,
            contentType : null,

            showMore: function (options) {
                var that = this;
                var filterObject = options || {};

                filterObject.page = (options && options.page) ? options.page : this.page;
                filterObject.count = (options && options.count) ? options.count : this.namberToShow;
                filterObject.viewType = (options && options.viewType) ? options.viewType : this.viewType;
                filterObject.contentType = (options && options.contentType) ? options.contentType : this.contentType;

                if (options && options.url) {
                    this.url = options.url;
                    delete options.url;
                } /*else if (options && options.viewType) {
                    this.url += options.viewType;
                }*/

                this.fetch({
                    data   : filterObject,
                    waite  : true,
                    success: function (models) {
                        that.page += 1;
                        that.trigger('showmore', models);
                    },
                    error  : function () {
                        App.render({
                            type   : 'error',
                            message: 'Some Error.'
                        });
                    }
                });
            },

            initialize: function (options) {
                this.startTime = new Date();
                var that = this;
                this.namberToShow = options.count;
                this.viewType = options.viewType;
                this.contentType = options.contentType;
                this.count = options.count;
                this.page = options.page || 1;

                if (options && options.url) {
                    this.url = options.url;
                    delete options.url;
                } else if (options && options.viewType) {
                    this.url += options.viewType;
                }

                this.fetch({
                    data   : options,
                    reset  : true,
                    success: function () {
                        that.page++;
                    },
                    error  : function (models, xhr) {
                        if (xhr.status === 401) {
                            Backbone.history.navigate('#login', {trigger: true});
                        }
                    }
                });
            },

            parse: function (payments) {
                /*_.map(quotations, function (quotation) {
                 quotation.orderDate = common.utcDateToLocaleDate(quotation.orderDate);
                 if(quotation.expectedDate){
                 quotation.expectedDate = common.utcDateToLocaleDate(quotation.expectedDate);
                 }

                 return quotation;
                 });*/

                return payments;
            }
        });
        return PaymentCollection;
    });