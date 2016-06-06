﻿define([
        'Backbone',
        'jQuery',
        'Underscore',
        "text!templates/Opportunities/EditTemplate.html",
        "text!templates/Opportunities/editSelectTemplate.html",
        "text!templates/history.html",
        'views/selectView/selectView',
        'views/Assignees/AssigneesView',
        'views/Notes/NoteView',
        'views/Notes/AttachView',
        "common",
        "custom",
        "populate",
        "dataService",
        'constants',
        'helpers'
    ],
    function (Backbone, $, _, EditTemplate, editSelectTemplate, historyTemplate, selectView, AssigneesView, noteView, attachView, common, custom, populate, dataService, CONSTANTS, helpers) {
        "use strict";
        var EditView = Backbone.View.extend({
            el             : "#content-holder",
            contentType    : "Opportunities",
            template       : _.template(EditTemplate),
            historyTemplate: _.template(historyTemplate),

            initialize: function (options) {
                _.bindAll(this, "render", "saveItem", "deleteItem");
                this.currentModel = options.model;
                this.currentModel.urlRoot = "/Opportunities";
                this.responseObj = {};
                this.elementId = options ? options.elementId : null;

                this.render();
            },

            events: {
                "click .breadcrumb a, #lost, #won"                 : "changeWorkflow",
                "click #tabList a"                                 : "switchTab",
                'keydown'                                          : 'keydownHandler',
                'click .dialog-tabs a'                             : 'changeTab',
                "click .newSelectList li:not(.miniStylePagination)": "chooseOption",
                "click .current-selected"                          : "showNewSelect",
                "click"                                            : "hideNewSelect"
            },

            hideNewSelect: function () {
                $(".newSelectList").hide();

                if (this.selectView) {
                    this.selectView.remove();
                }
            },

            showNewSelect: function (e) {
                var $target = $(e.target);
                e.stopPropagation();

                if ($target.attr('id') === 'selectInput') {
                    return false;
                }

                if (this.selectView) {
                    this.selectView.remove();
                }

                this.selectView = new selectView({
                    e          : e,
                    responseObj: this.responseObj
                });

                $target.append(this.selectView.render().el);

                return false;
            },

            chooseOption: function (e) {
                var holder = $(e.target).parents("dd").find(".current-selected");
                holder.text($(e.target).text()).attr("data-id", $(e.target).attr("id"));
                if (holder.attr("id") === 'customerDd') {
                    this.selectCustomer($(e.target).attr("id"));
                }
            },

            changeTab: function (e) {
                var holder = $(e.target);
                var n;
                var dialogHolder;

                holder.closest(".dialog-tabs").find("a.active").removeClass("active");
                holder.addClass("active");
                n = holder.parents(".dialog-tabs").find("li").index(holder.parent());
                dialogHolder = $(".dialog-tabs-items");
                dialogHolder.find(".dialog-tabs-item.active").removeClass("active");
                dialogHolder.find(".dialog-tabs-item").eq(n).addClass("active");
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

            getWorkflowValue: function (value) {
                var workflows = [];

                for (var i = 0, max = value.length; i < max; i++) {
                    workflows.push({name: value[i].name, status: value[i].status});
                }

                return workflows;
            },

            selectCustomer: function (id) {
                dataService.getData(CONSTANTS.URLS.CUSTOMERS, {
                    id: id
                }, function (response, context) {
                    var customer = response.data[0];
                    if (customer.type == 'Person') {
                        context.$el.find('#first').val(customer.name.first);
                        context.$el.find('#last').val(customer.name.last);

                        context.$el.find('#company').val('');
                    } else {
                        context.$el.find('#company').val(customer.name.first);

                        context.$el.find('#first').val('');
                        context.$el.find('#last').val('');

                    }
                    context.$el.find('#email').val(customer.email);
                    context.$el.find('#phone').val(customer.phones.phone);
                    context.$el.find('#mobile').val(customer.phones.mobile);
                    context.$el.find('#street').val(customer.address.street);
                    context.$el.find('#city').val(customer.address.city);
                    context.$el.find('#state').val(customer.address.state);
                    context.$el.find('#zip').val(customer.address.zip);
                    context.$el.find('#country').val(customer.address.country);
                }, this);

            },

            /*switchTab: function (e) {  ui tests
                e.preventDefault();
                var link = this.$("#tabList a");
                if (link.hasClass("selected")) {
                    link.removeClass("selected");
                }
                var index = link.index($(e.target).addClass("selected"));
                this.$(".tab").hide().eq(index).show();
            },*/

            saveItem: function () {
                var self = this;

                var mid = 39;

                var name = $.trim($("#name").val());
                var viewType = custom.getCurrentVT();
                var expectedRevenueValue = $.trim($("#expectedRevenueValue").val());
                var expectedRevenueProgress = $.trim($("#expectedRevenueProgress").val());
                if (expectedRevenueValue !== (this.currentModel.get('expectedRevenue')).value.toString()) {
                    var expectedRevenue = {
                        value   : expectedRevenueValue,
                        currency: '$',
                        progress: expectedRevenueProgress
                    };
                }

                var customerId = this.$("#customerDd").data("id");
                customerId = customerId ? customerId : null;

                var email = $.trim($("#email").val());

                var salesPersonId = this.$("#salesPersonDd").data("id");
                salesPersonId = salesPersonId ? salesPersonId : null;

                var currentSalesPerson = this.currentModel.get('salesPerson');

                var salesTeamId = this.$("#salesTeamDd").data("id");
                salesTeamId = salesTeamId ? salesTeamId : null;

                var nextActionDate = $.trim(this.$el.find("#nextActionDate").val());
                var nextActionDescription = $.trim(this.$el.find("#nextActionDescription").val());
                var nextAction = {
                    date: nextActionDate,
                    desc: nextActionDescription
                };

                var expectedClosing = $.trim(this.$el.find("#expectedClosing").val());

                var priority = $("#priorityDd").text();

                var internalNotes = $.trim($("#internalNotes").val());

                var address = {};
                $("dd").find(".address").each(function () {
                    var el = $(this);
                    address[el.attr("name")] = el.val();
                });

                var first = $.trim($("#first").val());
                var last = $.trim($("#last").val());
                var contactName = {
                    first: first,
                    last : last
                };

                var func = $.trim($("#func").val());

                var phone = $.trim($("#phone").val());
                var mobile = $.trim($("#mobile").val());
                var fax = $.trim($("#fax").val());
                var phones = {
                    phone : phone,
                    mobile: mobile,
                    fax   : fax
                };

                var workflow = this.$("#workflowDd").data("id");
                workflow = workflow ? workflow : null;

                var active = ($("#active").is(":checked")) ? true : false;

                var optout = ($("#optout").is(":checked")) ? true : false;

                var reffered = $.trim($("#reffered").val());

                var usersId = [];
                var groupsId = [];
                $(".groupsAndUser tr").each(function () {
                    if ($(this).data("type") == "targetUsers") {
                        usersId.push($(this).data("id"));
                    }
                    if ($(this).data("type") == "targetGroups") {
                        groupsId.push($(this).data("id"));
                    }

                });
                var whoCanRW = this.$el.find("[name='whoCanRW']:checked").val();
                var data = {
                    name           : name,
                    customer       : customerId,
                    email          : email,
                    salesTeam      : salesTeamId,
                    nextAction     : nextAction,
                    expectedClosing: expectedClosing,
                    priority       : priority,
                    internalNotes  : internalNotes,
                    address        : address,
                    contactName    : contactName,
                    func           : func,
                    phones         : phones,
                    active         : active,
                    optout         : optout,
                    reffered       : reffered,
                    groups         : {
                        owner: $("#allUsersSelect").data("id"),
                        users: usersId,
                        group: groupsId
                    },
                    whoCanRW       : whoCanRW
                };
                var currentWorkflow = this.currentModel.get('workflow');

                if (expectedRevenue) {
                    data.expectedRevenue = expectedRevenue;
                }

                if (currentWorkflow && currentWorkflow._id && (currentWorkflow._id != workflow)) {
                    data['workflow'] = workflow;
                    data['sequence'] = -1;
                    data['sequenceStart'] = this.currentModel.toJSON().sequence;
                    data['workflowStart'] = currentWorkflow._id;
                }

                if (currentSalesPerson && currentSalesPerson._id && salesPersonId && (currentSalesPerson._id !== salesPersonId)) {
                    data['salesPerson'] = salesPersonId;
                } else if (!currentSalesPerson && salesPersonId) {
                    data['salesPerson'] = salesPersonId;
                }


                var oldWorkFlow = this.currentModel.get('workflow')._id;
                this.currentModel.set(data);
                this.currentModel.save(this.currentModel.changed, {
                    headers: {
                        mid: mid
                    },
                    patch  : true,
                    success: function (model, result) {
                        model = model.toJSON();
                        result = result.result;
                        var editHolder = self.$el;
                        switch (viewType) {
                            case 'list':
                            {
                                var tr_holder = $("tr[data-id='" + model._id + "'] td");
                                tr_holder.parent().attr("class", "stage-" + self.$("#workflowDd").text().toLowerCase())
                                tr_holder.eq(3).text(name);
                                tr_holder.eq(4).text(parseInt(expectedRevenueValue));
                                if (customerId) {
                                    tr_holder.eq(5).text(self.$("#customerDd").text());
                                } else {
                                    tr_holder.eq(5).text("");
                                }
                                tr_holder.eq(6).text(nextAction.date);
                                tr_holder.eq(7).text(nextAction.desc);
                                tr_holder.eq(8).find("a").text(self.$("#workflowDd").text());
                                if (salesPersonId) {
                                    tr_holder.eq(9).text(self.$("#salesPersonDd").text());
                                } else {
                                    tr_holder.eq(9).text("");
                                }
                                Backbone.history.fragment = "";
                                Backbone.history.navigate(window.location.hash.replace("#", ""), {trigger: true});

                            }
                                break;
                            case 'kanban':
                            {
                                var kanban_holder = $("#" + model._id);
                                var expectedRevenueHolder = kanban_holder.find('.opportunity-header h3');
                                kanban_holder.find(".opportunity-header h4").text(name);
                                if (parseFloat(expectedRevenueValue) !== 0) {
                                    expectedRevenueHolder.text(helpers.currencySplitter(expectedRevenueValue));
                                    expectedRevenueHolder.addClass('dollar');
                                } else {
                                    expectedRevenueHolder.text('');
                                    expectedRevenueHolder.removeClass('dollar');
                                }
                                kanban_holder.find(".opportunity-content p.right").text(nextAction.date);
                                if (customerId) {
                                    kanban_holder.find(".opportunity-content p.left").eq(0).text(self.$("#customerDd").text());
                                } else {
                                    kanban_holder.find(".opportunity-content p.left").eq(0).text("");
                                }
                                if (salesPersonId) {
                                    kanban_holder.find(".opportunity-content p.left").eq(1).text(self.$("#salesPersonDd").text());
                                } else {
                                    kanban_holder.find(".opportunity-content p.left").eq(1).text("");
                                }

                                if (result && result.sequence) {
                                    $("#" + data.workflowStart).find(".item").each(function () {
                                        var seq = $(this).find(".inner").data("sequence");
                                        if (seq > data.sequenceStart) {
                                            $(this).find(".inner").attr("data-sequence", seq - 1);
                                        }
                                    });
                                    kanban_holder.find(".inner").attr("data-sequence", result.sequence);
                                }
                                if (data.workflow) {
                                    $(".column[data-id='" + data.workflow + "']").find("#forContent").append(kanban_holder);
                                    var counter = $(".column[data-id='" + data.workflow + "']").closest(".column").find(".totalCount");
                                    counter.html(parseInt(counter.html()) + 1);
                                    counter = $(".column[data-id='" + data.workflowStart + "']").closest(".column").find(".totalCount");
                                    counter.html(parseInt(counter.html()) - 1);

                                    self.countTotalAmountForWorkflow(data.workflowStart);
                                    self.countTotalAmountForWorkflow(data.workflow);
                                } else {
                                    self.countTotalAmountForWorkflow(currentWorkflow._id);
                                }
                            }
                                break;
                            case 'form':
                            {
                                var holder = $("#opportunities .compactList");
                                holder.find("p a#" + model._id).text(name);
                                holder.find("div").eq(0).find("p").eq(1).text("$" + expectedRevenueValue);
                                holder.find("div").eq(1).find("p").eq(0).text(nextAction.date);
                                holder.find("div").eq(1).find("p").eq(1).text(self.$("#workflowDd").text());
                            }
                        }
                        self.hideDialog();
                    },
                    error  : function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            },

            countTotalAmountForWorkflow: function (workflowId) {
                var column = $('td[data-id="' + workflowId + '"]');
                var oldColumnContainer = $('td[data-id="' + workflowId + '"] #forContent h3');

                var sum = 0;
                oldColumnContainer.each(function (item) {
                    var value = $(this).text().replace(/\s/g, '');
                    sum += parseFloat(value) || 0;
                });
                column.find('.totalAmount').text(helpers.currencySplitter(sum.toString()));
            },

            hideDialog: function () {
                $(".edit-dialog").remove();
                $(".add-group-dialog").remove();
                $(".add-user-dialog").remove();
            },

            deleteItem: function (event) {
                var mid = 39;
                event.preventDefault();
                var self = this;
                var answer = confirm("Really DELETE items ?!");

                if (answer == true) {
                    this.currentModel.urlRoot = "/Opportunities";
                    this.currentModel.destroy({
                        headers: {
                            mid: mid
                        },
                        success: function (model) {
                            model = model.toJSON();

                            var viewType = custom.getCurrentVT();
                            switch (viewType) {
                                case 'list':
                                {
                                    $("tr[data-id='" + model._id + "'] td").remove();

                                }
                                    break;
                                case 'form':
                                {
                                    $("a#" + model._id).parents("li").remove();

                                }
                                    break;
                                case 'kanban':
                                {
                                    $("#" + model._id).remove();
                                    var wId = model.workflow._id;
                                    var newTotal = ($("td[data-id='" + wId + "'] .totalCount").html() - 1);
                                    $("td[data-id='" + wId + "'] .totalCount").html(newTotal);

                                    self.countTotalAmountForWorkflow(wId);
                                }
                            }
                            self.hideDialog();
                        },
                        error  : function (model, xhr) {
                            self.errorNotification(xhr);
                        }
                    });
                }
            },

            renderHistory: function () {
                var self = this;
                var historyString;

                historyString = self.historyTemplate({history: self.model.get('history')});
                self.$el.find('.history-container').html(historyString);
            },

            render: function () {
                var formString = this.template({
                    model: this.currentModel.toJSON()
                });
                var self = this;
                var model = this.currentModel.toJSON();
                var notDiv;

                this.$el = $(formString).dialog({
                    closeOnEscape: false,
                    dialogClass  : "edit-dialog",
                    width        : 900,
                    buttons      : {
                        save  : {
                            text : "Save",
                            class: "btn",
                            click: self.saveItem
                        },
                        cancel: {
                            text : "Cancel",
                            class: "btn",
                            click: self.hideDialog
                        },
                        delete: {
                            text : "Delete",
                            class: "btn",
                            click: self.deleteItem
                        }
                    }
                });
                notDiv = this.$el.find('#divForNote');
                notDiv.append(
                    new noteView({
                        model: this.currentModel
                    }).render().el);

                notDiv.append(
                    new attachView({
                        model    : this.currentModel,
                        url      : "/uploadOpportunitiesFiles",
                        elementId: this.elementId
                    }).render().el
                );
                notDiv = this.$el.find('.assignees-container');
                notDiv.append(
                    new AssigneesView({
                        model: this.currentModel,
                    }).render().el
                );

                self.renderHistory();

                $('#nextActionDate').datepicker({dateFormat: "d M, yy", minDate: new Date()});
                $('#expectedClosing').datepicker({dateFormat: "d M, yy", minDate: new Date()});

                dataService.getData('/opportunities/priority', {}, function (priorities) {
                    priorities = _.map(priorities.data, function (priority) {
                        priority.name = priority.priority;

                        return priority;
                    });
                    self.responseObj['#priorityDd'] = priorities;
                });
                populate.get2name("#customerDd", CONSTANTS.URLS.CUSTOMERS, {}, this, false, true);
                dataService.getData('/employees/getForDD', {isEmployee: true}, function (employees) {
                    employees = _.map(employees.data, function (employee) {
                        employee.name = employee.name.first + ' ' + employee.name.last;

                        return employee;
                    });

                    self.responseObj['#salesPersonDd'] = employees;
                });
                populate.getWorkflow("#workflowDd", "#workflowNamesDd", CONSTANTS.URLS.WORKFLOWS_FORDD, {id: "Opportunities"}, "name", this);
                populate.get("#salesTeamDd", CONSTANTS.URLS.DEPARTMENTS_FORDD, {}, "name", this, false, true);


                if (model.groups) {
                    if (model.groups.users.length > 0 || model.groups.group.length) {
                        $(".groupsAndUser").show();
                        model.groups.group.forEach(function (item) {
                            $(".groupsAndUser").append("<tr data-type='targetGroups' data-id='" + item._id + "'><td>" + item.name + "</td><td class='text-right'></td></tr>");
                            $("#targetGroups").append("<li id='" + item._id + "'>" + item.name + "</li>");
                        });
                        model.groups.users.forEach(function (item) {
                            $(".groupsAndUser").append("<tr data-type='targetUsers' data-id='" + item._id + "'><td>" + item.login + "</td><td class='text-right'></td></tr>");
                            $("#targetUsers").append("<li id='" + item._id + "'>" + item.login + "</li>");
                        });

                    }
                }
                // this.delegateEvents(this.events);
                return this;
            }

        });
        return EditView;
    });
