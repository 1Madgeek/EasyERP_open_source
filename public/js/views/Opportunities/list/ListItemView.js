﻿define([
        'Backbone',
        'Underscore',
        'text!templates/Opportunities/list/ListTemplate.html',
        'common',
    'helpers'
], function (Backbone, _, OpportunitiesListTemplate, common) {
        var OpportunitiesListItemView = Backbone.View.extend({
            el: '#listTable',

            initialize: function (options) {
                this.collection = options.collection;
                this.page = options.page ? parseInt(options.page, 10) : 1;
                this.startNumber = (this.page - 1) * options.itemsNumber; //Counting the start index of list items
            },
            render    : function () {
                var self = this;
                this.$el.append(_.template(OpportunitiesListTemplate, {
                    opportunitiesCollection: this.collection.toJSON(),
                    startNumber            : this.startNumber,
                    currencySplitter       : helpers.currencySplitter
                }));
            }
        });

        return OpportunitiesListItemView;
    });
