define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/JobPositions/list/ListHeader.html',
    'views/JobPositions/CreateView',
    'views/JobPositions/list/ListItemView',
    'collections/JobPositions/filterCollection',
    'models/JobPositionsModel',
    'views/JobPositions/EditView',
    'views/Filter/FilterView',
    'common',
    'text!templates/stages.html'
], function (Backbone, $, _, listViewBase, listTemplate, createView, ListItemView, contentCollection, currentModel, EditView, filterView, common, stagesTamplate) {
    'use strict';

    var JobPositionsListView = listViewBase.extend({
        createView              : createView,
        listTemplate            : listTemplate,
        listItemView            : ListItemView,
        contentCollection       : contentCollection,
        filterView              : filterView,
        totalCollectionLengthUrl: '/JobPositions/totalCollectionLength',
        formUrl                 : "#easyErp/JobPositions/form/",
        contentType             : 'JobPositions',//needs in view.prototype.changeLocationHash

        events: {
            "click  .list td:not(.notForm)": "goToEditDialog",
            "click .stageSelect"           : "showNewSelect",
            "click .newSelectList li"      : "chooseOption"
        },

        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;
            _.bind(this.collection.showMore, this.collection);
            this.defaultItemsNumber = this.collection.namberToShow || 100;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.newCollection = options.newCollection;
            this.page = options.collection.page;
            this.filter = options.filter;

            this.render();

            this.getTotalLength(null, this.defaultItemsNumber, this.filter);
            this.contentCollection = contentCollection;
        },

        hideNewSelect: function () {
            $(".newSelectList").remove();  //ui tests
        },

        showNewSelect: function (e) {
            if ($(".newSelectList").is(":visible")) {
                this.hideNewSelect();
                return false;
            }

            $(e.target).parent().append(_.template(stagesTamplate, {stagesCollection: this.stages}));
            return false;

        },

        chooseOption: function (e) {
            var afterPage = '';
            var location = window.location.hash;
            var pageSplited = location.split('/p=')[1];
            if (pageSplited) {
                afterPage = pageSplited.split('/')[1];
                location = location.split('/p=')[0] + '/p=1' + '/' + afterPage;
            }
            var targetElement = $(e.target).parents("td");
            var id = targetElement.attr("id").replace("stages_", '');
            var obj = this.collection.get(id);
            obj.urlRoot = '/JobPositions';
            obj.save({
                workflow                : $(e.target).attr("id"),
                expectedRecruitment     : obj.toJSON().expectedRecruitment,
                totalForecastedEmployees: obj.toJSON().totalForecastedEmployees,
                numberOfEmployees       : obj.toJSON().numberOfEmployees
            }, {
                headers: {
                    mid: 39
                },
                patch  : true,
                success: function () {
                    Backbone.history.fragment = "";
                    Backbone.history.navigate(location, {trigger: true});
                }
            });
            this.hideNewSelect();
            return false;
        },

        pushStages: function (stages) {
            this.stages = stages;
        },

        render: function () {
            var self;
            var $currentEl;

            $('.ui-dialog ').remove();

            self = this;
            $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            var itemView = new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            });
            $currentEl.append(itemView.render());
            itemView.bind('incomingStages', itemView.pushStages, itemView);

            this.renderCheckboxes();

            common.populateWorkflowsList("Job positions", null, null, "/Workflows", null, function (stages) {
                self.stages = stages;
                itemView.trigger('incomingStages', stages);
            });

            this.renderPagination($currentEl, this);
            $currentEl.append("<div id='timeRecivingDataFromServer'>Created in " + (new Date() - this.startTime) + " ms</div>");
        },

        goToEditDialog: function (e) {
            e.preventDefault();
            var id = $(e.target).closest('tr').data("id");
            var model = new currentModel({validate: false});
            model.urlRoot = '/JobPositions/form';
            model.fetch({
                data   : {id: id},
                success: function (model) {
                    new EditView({model: model});
                },
                error  : function () {
                    App.render({
                        type   : 'error',
                        message: 'Please refresh browser'
                    });
                }
            });
        }
    });
    return JobPositionsListView;
});
