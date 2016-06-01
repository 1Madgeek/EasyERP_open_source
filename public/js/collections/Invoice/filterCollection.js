﻿define([
        'Backbone',
        'models/InvoiceModel',
        'constants'
    ],
    function (Backbone, InvoiceModel, CONSTANTS) {
        'use strict';

        var InvoiceCollection = Backbone.Collection.extend({
            model       : InvoiceModel,
            url         : CONSTANTS.URLS.INVOICE,
            page        : null,
            namberToShow: null,
            viewType    : null,
            contentType : null,

            initialize: function (options) {
                var regex = /^sales/;
                var that = this;

                this.startTime = new Date();
                this.namberToShow = options.count;
                this.viewType = options.viewType;
                this.contentType = options.contentType;
                this.page = options.page || 1;

                this.filter = options.filter;

                if (regex.test(this.contentType)) {
                    options.forSales = true;
                }

                if (options && options.contentType && !(options.filter)) {
                    options.filter = {};
                    if (regex.test(this.contentType)) {
                        options.filter = {
                            'forSales': {
                                key  : 'forSales',
                                value: ['true']
                            }
                        };
                    } else {
                        options.filter = {
                            'forSales': {
                                key  : 'forSales',
                                value: ['false']
                            }
                        };
                    }
                }

                if (options && options.url) {
                    this.url = options.url;
                    delete options.url;
                } /* else if (options && options.viewType) {
                    this.url += options.viewType;
                }*/

                this.fetch({
                    data   : options,
                    reset  : true,
                    success: function (newCollection) {
                        that.page++;

                        if (App.invoiceCollection) {
                            App.invoiceCollection.reset(newCollection.models);
                        }
                    },
                    error  : function (models, xhr) {
                        if (xhr.status === 401) {
                            Backbone.history.navigate('#login', {trigger: true});
                        }
                        if (xhr.status === 403) {
                            App.render({
                                type   : 'error',
                                message: 'No access'
                            });
                        }
                    }
                });
            },

            showMore: function (options) {
                var that = this;
                var regex = /^sales/;
                var filterObject = options || {};

                filterObject.page = (options && options.page) ? options.page : this.page;
                filterObject.count = (options && options.count) ? options.count : this.namberToShow;
                filterObject.viewType = (options && options.viewType) ? options.viewType : this.viewType;
                filterObject.contentType = (options && options.contentType) ? options.contentType : this.contentType;
                filterObject.filter = options ? options.filter : {};

                if (regex.test(this.contentType)) {
                    filterObject.forSales = true;
                }

                if (options && options.contentType && !(options.filter)) {
                    options.filter = {};

                    if (regex.test(this.contentType)) {
                        filterObject.filter.forSales = true;
                    }
                }

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
                            message: "Some Error."
                        });
                    }
                });
            }
        });
        return InvoiceCollection;
    });