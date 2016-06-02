﻿define([
        'Backbone',
        'models/TasksModel',
        'constants'
    ],
    function (Backbone, TaskModel, CONSTANTS) {
        'use strict';

        var TasksCollection = Backbone.Collection.extend({
            model       : TaskModel,
            url         : CONSTANTS.URLS.TASKS,
            page        : null,
            namberToShow: null,
            viewType    : null,
            initialize  : function (options) {
                var that = this;
                this.startTime = new Date();
                this.parrentContentId = options ? options.parrentContentId : null;
                if (options && options.count) {
                    this.namberToShow = options.count;
                    this.count = options.count;
                    this.page = options.page || 1;
                }
                this.viewType = options.viewType;

               /* if (options && options.viewType) {
                    this.url += options.viewType;
                }*/
                this.fetch({
                    data   : options,
                    reset  : true,
                    success: function () {
                        that.page++;
                    },
                    error  : function (models, xhr) {
                        if (xhr.status == 401) {
                            Backbone.history.navigate('#login', {trigger: true});
                        }
                    }
                });
            },
            showMore    : function (options) {
                var that = this;
                var filterObject = {};
                if (options) {
                    for (var i in options) {
                        filterObject[i] = options[i];
                    }
                }
                if (options && options.page) {
                    this.page = options.page;
                }
                if (options && options.count) {
                    this.namberToShow = options.count;
                }
                filterObject.page = this.page;
                filterObject.count = this.namberToShow;
                filterObject.filter = (options) ? options.filter : {};
                filterObject.viewType = (options && options.viewType) ? options.viewType : this.viewType;
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
            },
            parse       : function (response) {
                return response.data;
            }
        });
        return TasksCollection;
    });