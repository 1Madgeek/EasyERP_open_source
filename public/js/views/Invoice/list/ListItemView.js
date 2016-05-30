﻿define([
    'Backbone',
    'Underscore',
    'text!templates/Invoice/list/ListTemplate.html'
], function (Backbone, _, listTemplate) {
    'use strict';

    var InvoiceListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            this.page = options.page ? parseInt(options.page, 10) : 1;
            this.startNumber = (this.page - 1) * options.itemsNumber;
        },

        render: function () {
            this.$el.append(_.template(listTemplate, {
                invoiceCollection: this.collection.toJSON(),
                startNumber      : this.startNumber
            }));
        }
    });

    return InvoiceListItemView;
});
