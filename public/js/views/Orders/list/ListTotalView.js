define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/Orders/list/ListTotal.html'
], function (Backbone, _, $, listTemplate) {
    'use strict';
    var OrderListTotalView = Backbone.View.extend({
        el: '#listTotal',

        getTotal: function () {
            var result = {unTaxed: 0, total: 0, cellSpan: this.cellSpan};

            this.element.find('.unTaxed').each(function () {
                result.unTaxed += parseFloat($(this).text());
            });
            this.element.find('.total').each(function () {
                result.total += parseFloat($(this).text());
            });
            this.element.find('.paid').each(function () {
                result.paid += parseFloat($(this).text());
            });
            this.element.find('.balance').each(function () {
                result.balance += parseFloat($(this).text());
            });

            return result;
        },

        initialize: function (options) {
            this.element = options.element;
            this.cellSpan = options.cellSpan;
        },

        render: function () {
            if (this.$el.find('tr').length > 0) {
                this.$el.find('#unTaxed').text(this.getTotal().unTaxed.toFixed(2));
                this.$el.find('#total').text(this.getTotal().total.toFixed(2));
            } else {
                this.$el.append(_.template(listTemplate, this.getTotal()));
            }
        }
    });

    return OrderListTotalView;
});
