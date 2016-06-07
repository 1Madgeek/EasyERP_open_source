define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/Leads/TopBarTemplate.html',
    'custom',
    'common'
], function (Backbone, $, _, ContentTopBarTemplate, Custom, common) {
    var TopBarView = Backbone.View.extend({
        el         : '#top-bar',
        contentType: 'Leads',
        actionType : null, // Content, Edit, Create
        template   : _.template(ContentTopBarTemplate),

        events: {
            'click a.changeContentView'    : 'changeContentViewType',
            'click ul.changeContentIndex a': 'changeItemIndex',
            'click #top-bar-deleteBtn'     : 'deleteEvent',
            'click #top-bar-discardBtn'    : 'discardEvent',
            'click #top-bar-editBtn'       : 'editEvent',
            'click #top-bar-createBtn'     : 'createEvent'
        },

        createEvent: function (event) {
            event.preventDefault();
            this.trigger('createEvent');
        },

        changeContentViewType: function (e) {
            Custom.changeContentViewType(e, this.contentType, this.collection);
        },

        changeItemIndex: function (e) {
            Custom.changeItemIndex(e, 'Content', this.contentType, this.collection);
        },

        initialize: function (options) {
            this.actionType = options.actionType;
            if (this.actionType !== 'Content') {
                Custom.setCurrentVT('form');
            }
            if (options.collection) {
                this.collection = options.collection;
                this.collection.bind('reset', _.bind(this.render, this));
            }
            this.render();
        },

        render: function () {
            var viewType;
            $('title').text(this.contentType);
            viewType = Custom.getCurrentVT();
            this.$el.html(this.template({viewType: viewType, contentType: this.contentType}));
            common.displayControlBtnsByActionType(this.actionType, viewType);
            return this;
        },

        editEvent: function (event) {
            event.preventDefault();
            this.trigger('editEvent');
        },

        deleteEvent: function (event) {
            var answer;
            event.preventDefault();
            answer = confirm('Really DELETE items ?!');
            if (answer === true) {
                this.trigger('deleteEvent');
            }
        },

        discardEvent: function (event) {
            event.preventDefault();
            Backbone.history.navigate('home/content-' + this.contentType, {trigger: true});
        }
    });

    return TopBarView;
});
