define([
    'Backbone',
    'Underscore',
    'text!templates/ChartOfAccount/CreateTemplate.html'
], function (Backbone, _, CreateTemplate) {
    'use strict';

    var CreateView = Backbone.View.extend({
        el      : '#chartOfAccount',
        template: _.template(CreateTemplate),

        initialize: function (options) {
            this.render(options);
        },

        render: function (options) {
            this.$el.prepend(this.template(options));

            return this;
        }

    });

    return CreateView;
});
