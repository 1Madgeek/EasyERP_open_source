﻿define([
        'Backbone',
        'Underscore',
        'text!templates/salesOrder/list/ListTemplate.html',
        'text!templates/salesOrder/wTrack/ListTemplate.html',
        'helpers'
    ],

    function (Backbone, _, listTemplate, listForWTrack, helpers) {
        var OrderListItemView = Backbone.View.extend({
            el: '#listTable',

            initialize: function (options) {
                this.collection = options.collection;
                this.page = options.page ? parseInt(options.page, 10) : 1;
                this.startNumber = (this.page - 1) * options.itemsNumber;
            },

            render    : function (options) {
                var el = (options && options.thisEl) ? options.thisEl : this.$el;

                el.append(_.template(listForWTrack, {
                    orderCollection: this.collection.toJSON(),
                    startNumber    : this.startNumber,
                    currencySplitter: helpers.currencySplitter,
                    currencyClass: helpers.currencyClass
                }));
            }
        });

        return OrderListItemView;
    });
