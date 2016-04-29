/**
 * Created by soundstorm on 21.05.15.
 */
define([
        'text!templates/DividendPayments/list/ListTemplate.html',
        'helpers'
    ],

    function (PaymentListTemplate, helpers) {
        var PaymentListItemView = Backbone.View.extend({
            el: '#listTable',

            initialize: function (options) {
                this.collection = options.collection;
                this.page = options.page ? parseInt(options.page, 10) : 1;
                this.startNumber = (this.page - 1) * options.itemsNumber; //Counting the start index of list items
            },
            render    : function () {
                this.$el.append(_.template(PaymentListTemplate, {
                    paymentCollection: this.collection.toJSON(),
                    startNumber      : this.startNumber,
                    currencySplitter : helpers.currencySplitter
                }));
            }
        });

        return PaymentListItemView;
    });
