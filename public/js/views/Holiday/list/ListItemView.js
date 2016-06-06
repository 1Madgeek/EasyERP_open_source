﻿define([
    'Backbone',
    'Underscore',
    'text!templates/Holiday/list/ListTemplate.html'
], function (Backbone, _, listTemplate) {
    'use strict';

    var HolidayListItemView = Backbone.View.extend({
        el: '#listTable',

        initialize: function (options) {
            this.collection = options.collection;
            this.page = options.page ? parseInt(options.page, 10) : 1;
            this.startNumber = (this.page - 1) * options.itemsNumber;
        },

        render: function () {
            var result = this.collection.toJSON();
            this.$el.append(_.template(listTemplate, {holidayCollection: result}));
        }
    });

    return HolidayListItemView;
});
