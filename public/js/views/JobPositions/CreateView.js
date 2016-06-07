define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/JobPositions/CreateTemplate.html',
   /* 'collections/Departments/DepartmentsCollection',
    'collections/Workflows/WorkflowsCollection',*/
    'models/JobPositionsModel',
    'views/Assignees/AssigneesView',
    /* 'common',*/
    'populate',
    'constants'
], function (Backbone, $, _, CreateTemplate, /* DepartmentsCollection, WorkflowsCollection,*/ JobPositionsModel, AssigneesView, /* common,*/ populate, CONSTANTS) {
    'use strict';

    var CreateView = Backbone.View.extend({
        el         : '#content-holder',
        contentType: 'JobPositions',
        template   : _.template(CreateTemplate),

        initialize: function () {
            _.bindAll(this, 'saveItem', 'render');
            this.model = new JobPositionsModel();
            this.responseObj = {};
            this.render();
        },

        events: {
            'change #workflowNames'                                           : 'changeWorkflows',
            keydown                                                           : 'keydownHandler',
            'click .dialog-tabs a'                                            : 'changeTab',
            'click .current-selected'                                         : 'showNewSelect',
            'click .newSelectList li:not(.miniStylePagination)'               : 'chooseOption',
            'click .newSelectList li.miniStylePagination'                     : 'notHide',
            'click .newSelectList li.miniStylePagination .next:not(.disabled)': 'nextSelect',
            'click .newSelectList li.miniStylePagination .prev:not(.disabled)': 'prevSelect',
            click                                                             : 'hideNewSelect'
        },

        notHide: function () {
            return false;
        },

        showNewSelect: function (e, prev, next) {
            populate.showSelect(e, prev, next, this);
            return false;
        },

        chooseOption: function (e) {
            $(e.target).parents('dd').find('.current-selected').text($(e.target).text()).attr('data-id', $(e.target).attr('id'));
            $('.newSelectList').hide();
        },

        nextSelect: function (e) {
            this.showNewSelect(e, false, true);
        },

        prevSelect: function (e) {
            this.showNewSelect(e, true, false);
        },

        hideNewSelect: function () {
            $('.newSelectList').hide();
        },

        keydownHandler: function (e) {
            switch (e.which) {
                case 27:
                    this.hideDialog();
                    break;
                default:
                    break;
            }
        },

        changeTab: function (e) {
            var holder = $(e.target);
            var n;
            var dialogHolder;

            holder.closest('.dialog-tabs').find('a.active').removeClass('active');
            holder.addClass('active');
            n = holder.parents('.dialog-tabs').find('li').index(holder.parent());
            dialogHolder = $('.dialog-tabs-items');
            dialogHolder.find('.dialog-tabs-item.active').removeClass('active');
            dialogHolder.find('.dialog-tabs-item').eq(n).addClass('active');
        },

        getWorkflowValue: function (value) {
            var i;
            var workflows = [];
            for (i = 0; i < value.length; i++) {
                workflows.push({name: value[i].name, status: value[i].status});
            }
            return workflows;
        },

        changeWorkflows: function () {
            var name = this.$('#workflowNames option:selected').val();
            var value = this.workflowsCollection.findWhere({name: name}).toJSON().value;
        },

        saveItem: function () {
            var afterPage = '';
            var location = window.location.hash;
            var pageSplited = location.split('/p=')[1];

            var self = this;
            var mid = 39;
            var name = $.trim($('#name').val());
            var expectedRecruitment = parseInt($.trim($('#expectedRecruitment').val()), 10);
            var description = $.trim($('#description').val());
            var requirements = $.trim($('#requirements').val());
            var workflow = this.$('#workflowsDd').data('id');
            var department = this.$('#departmentDd').data('id') || null;
            var usersId = [];
            var groupsId = [];
            var whoCanRW = this.$el.find('[name="whoCanRW"]:checked').val();

            if (pageSplited) {
                afterPage = pageSplited.split('/')[1];
                location = location.split('/p=')[0] + '/p=1' + '/' + afterPage;
            }

            $('.groupsAndUser tr').each(function () {
                if ($(this).data('type') === 'targetUsers') {
                    usersId.push($(this).data('id'));
                }
                if ($(this).data('type') === 'targetGroups') {
                    groupsId.push($(this).data('id'));
                }
            });

            this.model.save({
                name               : name,
                expectedRecruitment: expectedRecruitment,
                description        : description,
                requirements       : requirements,
                department         : department,
                workflow           : workflow,

                groups: {
                    owner: $('#allUsersSelect').data('id'),
                    users: usersId,
                    group: groupsId
                },

                whoCanRW: whoCanRW
            }, {
                headers: {
                    mid: mid
                },
                wait   : true,
                success: function () {
                    self.hideDialog();
                    Backbone.history.fragment = '';
                    Backbone.history.navigate(location, {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        hideDialog: function () {
            $('.create-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
        },

        render: function () {
            var notDiv;
            var self = this;
            var formString = this.template({});
            this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Edit Job position',
                width        : '900',
                buttons      : [
                    {
                        text : 'Create',
                        click: function () {
                            self.saveItem();
                        }
                    },

                    {
                        text : 'Cancel',
                        click: function () {
                            $(this).dialog().remove();
                        }
                    }]

            });
            this.$el.find('#expectedRecruitment').spinner({
                min: 0,
                max: 9999
            });

            notDiv = this.$el.find('.assignees-container');
            notDiv.append(
                new AssigneesView({
                    model: this.currentModel
                }).render().el
            );
            populate.get('#departmentDd', CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, 'name', this, true, true);
            populate.getWorkflow('#workflowsDd', '#workflowNamesDd', CONSTANTS.URLS.WORKFLOWS_FORDD, {id: 'Job positions'}, 'name', this, true);
            this.delegateEvents(this.events);
            return this;
        }
    });
    return CreateView;
});
