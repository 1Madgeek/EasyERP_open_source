/**
 * Created by liliya on 17.09.15.
 */
define([
        'Backbone',
        'jQuery',
        'Underscore',
        'text!templates/Projects/form/FormTemplate.html',
        'text!templates/Projects/projectInfo/DetailsTemplate.html',
        'text!templates/Projects/projectInfo/proformRevenue.html',
        'text!templates/Projects/projectInfo/jobsWTracksTemplate.html',
        'text!templates/Projects/projectInfo/invoiceStats.html',
        'text!templates/Projects/projectInfo/proformaStats.html',
        'views/Projects/projectInfo/journalEntriesForJob/dialogView',
        'views/selectView/selectView',
        'views/salesOrder/EditView',
        'views/salesQuotation/EditView',
        'views/salesInvoice/EditView',
        'views/Proforma/EditView',
        'views/Projects/EditView',
        'views/Notes/NoteView',
        'views/Notes/AttachView',
        'views/Assignees/AssigneesView',
        'views/Projects/projectInfo/wTracks/wTrackView',
        'views/Projects/projectInfo/projectMembers/projectMembersList',
        'views/Projects/projectInfo/payments/paymentView',
        'views/Projects/projectInfo/invoices/invoiceView',
        'views/Projects/projectInfo/proformas/proformaView',
        'views/Projects/projectInfo/quotations/quotationView',
        'views/Projects/projectInfo/wTracks/generateWTrack',
        'views/Projects/projectInfo/orders/orderView',
        'collections/wTrack/filterCollection',
        'collections/Quotation/filterCollection',
        'collections/salesInvoice/filterCollection',
        'collections/customerPayments/filterCollection',
        'collections/Jobs/filterCollection',
        'collections/Proforma/filterCollection',
        'collections/projectMembers/editCollection',
        'models/QuotationModel',
        'models/InvoiceModel',
        'text!templates/Notes/AddAttachments.html',
        'common',
        'populate',
        'custom',
        'dataService',
        'async',
        'helpers'],
    function (Backbone,
              $,
              _,
              ProjectsFormTemplate,
              DetailsTemplate,
              ProformRevenueTemplate,
              jobsWTracksTemplate,
              invoiceStats,
              proformaStats,
              ReportView,
              selectView,
              EditViewOrder,
              editViewQuotation,
              editViewInvoice,
              editViewProforma,
              EditView,
              noteView,
              attachView,
              AssigneesView,
              wTrackView,
              ProjectMembersView,
              PaymentView,
              InvoiceView,
              ProformaView,
              QuotationView,
              GenerateWTrack,
              oredrView,
              wTrackCollection,
              quotationCollection,
              invoiceCollection,
              paymentCollection,
              jobsCollection,
              proformaCollection,
              projectMembersCol,
              quotationModel,
              invoiceModel,
              addAttachTemplate,
              common,
              populate,
              custom,
              dataService,
              async,
              helpers) {
        'use strict';

        var View = Backbone.View.extend({
            el               : '#content-holder',
            contentType      : 'Projects',
            proformRevenue   : _.template(ProformRevenueTemplate),
            invoiceStatsTmpl : _.template(invoiceStats),
            proformaStatsTmpl: _.template(proformaStats),

            events: {
                'click .chart-tabs'                                                                                       : 'changeTab',
                'click .deleteAttach'                                                                                     : 'deleteAttach',
                'click #health a:not(.disabled)'                                                                          : 'showHealthDd',
                'click #health ul li div:not(.disabled)'                                                                  : 'chooseHealthDd',
                'click .newSelectList li:not(.miniStylePagination):not(.disabled)'                                        : 'chooseOption',
                'click .current-selected:not(.disabled)'                                                                  : 'showNewSelect',
                'click #createItem'                                                                                       : 'createDialog',
                'click #createJob'                                                                                        : 'createJob',
                'change input:not(.checkbox, .check_all, .statusCheckbox, #inputAttach, #noteTitleArea)': 'showSaveButton',  // added id for noteView
                'change #description'                                                                                     : 'showSaveButton',
                'click #jobsItem td:not(.selects, .remove, a.quotation, a.invoice)'                                       : 'renderJobWTracks',
                'mouseover #jobsItem'                                                                                     : 'showRemoveButton',
                'mouseleave #jobsItem'                                                                                    : 'hideRemoveButton',
                'click .fa.fa-trash'                                                                                      : 'removeJobAndWTracks',
                'dblclick td.editableJobs'                                                                                : 'editRow',
                'click #saveName'                                                                                         : 'saveNewJobName',
                'keydown input.editing '                                                                                  : 'keyDown',
                click                                                                                                     : 'hideSelect',
                keydown                                                                                                   : 'keydownHandler',
                'click a.quotation'                                                                                       : 'viewQuotation',
                'click a.invoice'                                                                                         : 'viewInvoice',
                'click a.proforma'                                                                                        : 'viewProforma',
                "click .report"                                                                                           : "showReport",
            },

            initialize: function (options) {
                var eventChannel = {};
                _.extend(eventChannel, Backbone.Events);

                App.projectInfo = App.projectInfo || {};
                App.projectInfo.projectId = options.model.get('_id');

                this.eventChannel = eventChannel;
                this.formModel = options.model;
                this.id = this.formModel.id;
                this.formModel.urlRoot = '/Projects/';
                this.salesManager = this.formModel.get('salesmanager');
                this.responseObj = {};
                this.proformValues = {};

                this.listenTo(eventChannel, 'newPayment', this.newPayment);
                this.listenTo(eventChannel, 'paymentRemoved', this.newPayment);

                this.listenTo(eventChannel, 'elemCountChanged', this.renderTabCounter);

                this.listenTo(eventChannel, 'newProforma', this.createProforma);
                this.listenTo(eventChannel, 'proformaRemove', this.createProforma);
                this.listenTo(eventChannel, 'savedProforma', this.createProforma);

                this.listenTo(eventChannel, 'quotationUpdated', this.getQuotations);
                this.listenTo(eventChannel, 'quotationRemove', this.getQuotations);

                this.listenTo(eventChannel, 'orderRemove', this.getOrders);
                this.listenTo(eventChannel, 'orderUpdate', this.getOrders);

                this.listenTo(eventChannel, 'invoiceRemove', this.newPayment);
                this.listenTo(eventChannel, 'invoiceUpdated', this.getInvoice);
                this.listenTo(eventChannel, 'invoiceReceive', this.newInvoice);
            },

            viewQuotation: function (e) {
                var self = this;
                var target = e.target;
                var id = $(target).attr('data-id');
                var model;
                var type = $(target).closest('tr').find('#type').text();
                var onlyView = false;

                e.stopPropagation();
                if (type === 'Quoted') {
                    model = new quotationModel({validate: false});

                    model.urlRoot = '/quotation/form/' + id;
                    model.fetch({
                        success: function (model) {
                            new editViewQuotation({
                                model         : model,
                                redirect      : true,
                                pId           : self.id,
                                projectManager: self.salesManager
                            });
                        },
                        error  : function (xhr) {
                            App.render({
                                type   : 'error',
                                message: 'Please refresh browser'
                            });
                        }
                    });
                } else {
                    model = new quotationModel({validate: false});

                    model.urlRoot = '/Order/form/' + id;
                    model.fetch({
                        success: function (model) {

                            if (type === 'Invoiced') {
                                onlyView = true;
                            }

                            new EditViewOrder({
                                model         : model,
                                redirect      : true,
                                onlyView      : onlyView,
                                projectManager: self.salesManager
                            });
                        },
                        error  : function (xhr) {
                            App.render({
                                type   : 'error',
                                message: 'Please refresh browser'
                            });
                        }
                    });
                }
            },

            viewInvoice: function (e) {
                var self = this;
                var target = e.target;
                var id = $(target).attr('data-id');
                var model = new invoiceModel({validate: false});

                e.stopPropagation();

                model.urlRoot = '/Invoice/form';
                model.fetch({
                    data   : {
                        id       : id,
                        currentDb: App.currentDb
                    },
                    success: function (model) {
                        new editViewInvoice({
                            model       : model,
                            notCreate   : true,
                            redirect    : true,
                            eventChannel: self.eventChannel
                        });
                    },
                    error  : function () {
                        App.render({
                            type   : 'error',
                            message: 'Please refresh browser'
                        });
                    }
                });
            },

            viewProforma: function (e) {
                var self = this;
                var target = e.target;
                var id = $(target).attr('data-id');
                var model = new invoiceModel({validate: false});

                e.stopPropagation();

                model.urlRoot = '/Invoice/form';
                model.fetch({
                    data   : {
                        id       : id,
                        currentDb: App.currentDb
                    },
                    success: function (model) {
                        new editViewProforma({
                            model       : model,
                            notCreate   : true,
                            redirect    : true,
                            eventChannel: self.eventChannel
                        });
                    },
                    error  : function () {
                        App.render({
                            type   : 'error',
                            message: 'Please refresh browser'
                        });
                    }
                });
            },

            keyDown: function (e) {
                if (e.which === 13) {
                    this.saveNewJobName(e);
                }
            },

            showReport: function (e) {
                App.startPreload();

                var tr = $(e.target).closest('tr');
                var id = tr.attr('data-id');

                new ReportView({_id: id});

            },

            editRow: function (e) {
                var el = $(e.target);
                var tr = $(e.target).closest('tr');
                var tempContainer;
                var editedElement;
                var editedCol;
                var editedElementValue;
                var insertedInput;

                if (el.prop('tagName') !== 'INPUT') {
                    editedElement = $('#projectTeam').find('.editing');

                    if (editedElement.length) {
                        editedCol = editedElement.closest('td');
                        editedElementValue = editedElement.val();

                        editedCol.text(editedElementValue);
                        editedElement.remove();
                    }
                }

                tempContainer = el.text();
                el.html('<input class="editing" type="text" maxlength="32" value="' + tempContainer + '">' + "<a href='javascript;' class='fa fa-check' title='Save' id='saveName'></a>");

                insertedInput = el.find('input');
                insertedInput.focus();
                insertedInput[0].setSelectionRange(0, insertedInput.val().length);

                return false;
            },

            saveNewJobName: function (e) {
                e.preventDefault();

                var nameRegExp = /^[a-zA-Z0-9\s][a-zA-Z0-9-,\s\.\/\s]+$/;
                var self = this;
                var _id = window.location.hash.split('form/')[1];
                var id = $(e.target).parents('td').closest('tr').attr('data-id');
                var name = $(e.target).prev('input').val() ? $(e.target).prev('input').val() : $(e.target).val();

                var data = {_id: id, name: name};
                if (nameRegExp.test(name)) {
                    dataService.postData('/jobs/update', data, function (err, result) {
                        if (err) {
                            return console.log(err);
                        }

                        $('#saveName').hide();

                        $(e.target).parents('td').text(name);

                        $(e.target).prev('input').remove();

                        var filter = {
                            'projectName': {
                                key  : 'project._id',
                                value: [_id],
                                type : 'ObjectId'
                            }
                        };

                        self.wCollection.showMore({count: 50, page: 1, filter: filter});

                    });
                } else {
                    App.render({
                        type   : 'error',
                        message: 'Please, enter Job name!'
                    });
                }
            },

            recalcTotal: function (id) {
                var jobsItems = this.jobsCollection.toJSON();
                var rate;

                var job = _.find(jobsItems, function (element) {
                    return element._id === id;
                });

                var budgetTotal = job.budget.budgetTotal;

                var totalHours = this.$el.find('#totalHours');
                var totalCost = this.$el.find('#totalCost');
                var totalRevenue = this.$el.find('#totalRevenue');
                var totalProfit = this.$el.find('#totalProfit');
                var totalRate = this.$el.find('#totalRate');

                var newHours = totalHours.attr('data-value') - budgetTotal.hoursSum;
                var newCost = totalCost.attr('data-value') - budgetTotal.costSum;
                var newRevenue = totalRevenue.attr('data-value') - budgetTotal.revenueSum;
                var newProfit = totalProfit.attr('data-value') - budgetTotal.profitSum;

                totalHours.text(helpers.currencySplitter(newHours.toFixed()));
                totalCost.text(helpers.currencySplitter(newCost.toFixed()));
                totalRevenue.text(helpers.currencySplitter(newRevenue.toFixed()));
                totalProfit.text(helpers.currencySplitter(newProfit.toFixed()));

                rate = isNaN((totalRevenue.attr('data-value') / totalHours.attr('data-value'))) ? 0 : (totalRevenue.attr('data-value') / totalHours.attr('data-value'));

                totalRate.text(helpers.currencySplitter(rate.toFixed(2)));

                totalHours.attr('data-value', newHours);
                totalCost.attr('data-value', newCost);
                totalRevenue.attr('data-value', newRevenue);
                totalProfit.attr('data-value', newProfit);
                totalRate.attr('data-value', rate);
            },

            removeJobAndWTracks: function (e) {
                var self = this;
                var _id = window.location.hash.split('form/')[1];
                var id = $(e.target).attr('id');
                var tr = $(e.target).closest('tr');

                var data = {_id: id};

                var answer = confirm('Really delete Job ?!');

                if (answer === true) {
                    dataService.postData('/jobs/remove', data, function (err, result) {
                        if (err) {
                            return console.log(err);
                        }

                        tr.remove();

                        self.renderJobWTracks(e);

                        self.recalcTotal(id);

                        var filter = {
                            'projectName': {
                                key  : 'project._id',
                                value: [_id],
                                type : 'ObjectId'
                            }
                        };

                        self.wCollection.showMore({count: 50, page: 1, filter: filter});

                    });
                }
            },

            hideRemoveButton: function (e) {
                var target = e.target;
                var tr = $(target).parents('tr');
                var removeItem = tr.find('.fa.fa-trash');

                removeItem.addClass('hidden');
            },

            showRemoveButton: function (e) {
                var target = e.target;
                var tr = $(target).parents('tr');
                var removeItem = tr.find('.fa.fa-trash').not('.notRemovable');

                removeItem.removeClass('hidden');
            },

            renderJobWTracks: function (e) {
                var target = e.target;
                var jobId = $(target).parents('tr').attr('data-id');
                var jobContainer = $(target).parents('tr');
                var template = _.template(jobsWTracksTemplate);
                var jobsItems = this.jobsCollection.toJSON();
                var icon = $(jobContainer).find('.expand');
                var subId = 'subRow-row' + jobId;
                var subRowCheck = $('#' + subId);
                var name = $(target).parents('tr').find('#jobsName').text();

                var job = _.find(jobsItems, function (element) {
                    return element._id === jobId;
                });

                if (icon.html() === '-') {
                    icon.html('+');
                    $(subRowCheck).hide();
                } else {
                    icon.html('-');
                    $('<tr id=' + subId + ' class="subRow">' +
                        '<td colspan="13" id="subRow-holder' + jobId + '"></td>' +
                        '</tr>').insertAfter(jobContainer);
                    $('#subRow-holder' + jobId).append(template({
                        jobStatus       : job.type,
                        jobItem         : job,
                        currencySplitter: helpers.currencySplitter
                    }));

                }
                $('#createItem').attr('data-value', name);

            },

            createDialog: function (e) {
                var jobs = {};

                jobs._id = $(e.target).attr('data-id');
                jobs.name = $(e.target).attr('data-value');

                if (this.generatedView) {
                    this.generatedView.undelegateEvents();
                }

                this.generatedView = new GenerateWTrack({
                    model           : this.formModel,
                    wTrackCollection: this.wCollection,
                    jobs            : jobs
                });
            },

            createJob: function () {
                this.wCollection.unbind();
                this.wCollection.bind('reset', this.renderContent, this);
                this.wCollection.bind('showmore', this.showMoreContent, this);

                if (this.generatedView) {
                    this.generatedView.undelegateEvents();
                }

                this.generatedView = new GenerateWTrack({
                    model           : this.formModel,
                    wTrackCollection: this.wCollection,
                    createJob       : true
                });

                App.projectInfo.currentTab = 'timesheet';
            },

            notHide: function () {
                return false;
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

            saveItem: function () {
                var thisEl = this.$el;
                var validation = true;
                var self = this;
                var mid = 39;
                var projectName = $.trim(thisEl.find('#projectName').val());
                var projectShortDesc = $.trim(thisEl.find('#projectShortDesc').val());
                var customer = {};
                var workflow = {};

                var projecttype = thisEl.find('#projectTypeDD').data('id');
                var paymentTerm = thisEl.find('#payment_terms').data('id');
                var paymentMethod = thisEl.find('#payment_method').data('id');
                var $userNodes = $('#usereditDd option:selected');
                //var startDate = $.trim(thisEl.find('#StartDate').val());
                //var endDate = $.trim(thisEl.find('#EndDate').val());
                var users = [];

                var budget = this.formModel.get('budget');

                var usersId = [];
                var groupsId = [];

                var whoCanRW = thisEl.find("[name='whoCanRW']:checked").val();
                var health = thisEl.find('#health a').data('value');
                //var _targetEndDate = $.trim(thisEl.find('#EndDateTarget').val());
                var description = $.trim(thisEl.find('#description').val());
                var data = {
                    projectName     : projectName,
                    projectShortDesc: projectShortDesc,
                    customer        : customer ? customer : null,
                    workflow        : workflow ? workflow : null,
                    projecttype     : projecttype ? projecttype : '',
                    description     : description,
                    paymentTerms    : paymentTerm,
                    paymentMethod   : paymentMethod,
                    teams           : {
                        users: users
                    },
                    groups          : {
                        owner: $('#allUsersSelect').data('id'),
                        users: usersId,
                        group: groupsId
                    },
                    whoCanRW        : whoCanRW,
                    health          : health,
                    //StartDate       : startDate,
                    //EndDate         : endDate,
                    //TargetEndDate   : _targetEndDate,
                    budget          : budget
                };

                customer._id = thisEl.find('#customerDd').data('id');
                customer.name = thisEl.find('#customerDd').text();

                workflow._id = thisEl.find('#workflowsDd').data('id');
                workflow.name = thisEl.find('#workflowsDd').text();

                $userNodes.each(function (key, val) {
                    users.push({
                        id  : val.value,
                        name: val.innerHTML
                    });
                });

                $(".groupsAndUser tr").each(function () {
                    if ($(this).data("type") == "targetUsers") {
                        usersId.push($(this).data("id"));
                    }
                    if ($(this).data('type') == 'targetGroups') {
                        groupsId.push($(this).data('id'));
                    }

                });

                if (validation) {
                    this.formModel.save(data, {
                        headers: {
                            mid: mid
                        },
                        success: function (model) {
                            var url = window.location.hash;

                            self.hideSaveButton();

                            //Backbone.history.fragment = '';
                            //Backbone.history.navigate(url, {trigger: true});
                            App.render({
                                type   : 'notify',
                                message: 'Data was changed, please refresh browser'
                            });
                        },
                        error  : function (model, xhr) {
                            self.errorNotification(xhr);
                        }

                    });
                }
            },

            chooseOption: function (e) {
                var id;
                var data;
                var attrId = $(e.target).parents("td").find(".current-selected").attr('id');

                $('.newSelectList').hide();

                if ($(e.target).parents('dd').find('.current-selected').length) {
                    $(e.target).parents('dd').find('.current-selected').text($(e.target).text()).attr('data-id', $(e.target).attr('id'));
                } else {
                    id = $(e.target).parents('td').closest('tr').attr('data-id');

                    if (attrId === 'workflow') {
                        data = {_id: id, workflowId: $(e.target).attr('id')};
                    } else if (attrId === 'type') {
                        data = {_id: id, type: $(e.target).text()};
                    }

                    $(e.target).parents('td').find('.current-selected').text($(e.target).text()).attr('data-id', $(e.target).attr('id'));

                    dataService.postData('/jobs/update', data, function (err, result) {
                        if (err) {
                            return console.log(err);
                        }

                    });
                }

                this.showSaveButton();
            },

            hideNewSelect: function () {
                $('.newSelectList').hide();
                $('#health ul').hide();

            },

            nextSelect: function (e) {
                this.showNewSelect(e, false, true);
            },

            prevSelect: function (e) {
                this.showNewSelect(e, true, false);
            },

            chooseHealthDd: function (e) {
                var target = $(e.target);

                target.parents('#health').find('a').attr('class', target.attr('class')).attr('data-value', target.attr('class').replace('health', '')).parent().find('ul').toggle();

                this.showSaveButton();
            },

            showHealthDd: function (e) {
                $(e.target).parent().find('ul').toggle();
                return false;
            },

            changeTab: function (e) {
                var target = $(e.target);
                var $aEllement = target.closest('a');
                var n;
                var dialogHolder;

                App.projectInfo = App.projectInfo || {};

                App.projectInfo.currentTab = $aEllement.attr('id').slice(0, -3);  // todo id

                target.closest('.chart-tabs').find('a.active').removeClass('active');
                $aEllement.addClass('active');
                n = target.parents('.chart-tabs').find('li').index($aEllement.parent());
                dialogHolder = $('.dialog-tabs-items');
                dialogHolder.find('.dialog-tabs-item.active').removeClass('active');
                dialogHolder.find('.dialog-tabs-item').eq(n).addClass('active');
            },

            keydownHandler: function (e) {
                switch (e.which) {
                    case 13:
                        this.showSaveButton();
                        break;
                    default:
                        break;
                }
            },

            hideDialog: function () {
                $('.edit-project-dialog').remove();
                $('.add-group-dialog').remove();
                $('.add-user-dialog').remove();
            },

            fileSizeIsAcceptable: function (file) {
                if (!file) {
                    return false;
                }
                return file.size < App.File.MAXSIZE;
            },

            hideSelect: function () {
                $('#health').find('ul').hide(); // added for hiding list if element in isnt chosen

                if (this.selectView) {
                    this.selectView.remove();
                }
            },

            showSaveButton: function () {
                $("#top-bar-saveBtn").show();
            },

            hideSaveButton: function () {
                $('#top-bar-saveBtn').hide();
            },

            renderProjectInfo: function (cb) {
                var self = this;
                var _id = window.location.hash.split('form/')[1];
                var filter = {
                    project: {
                        key  : 'project._id',
                        value: [_id]
                    }
                };

                this.jobsCollection = new jobsCollection({
                    viewType : 'list',
                    filter   : filter,
                    projectId: _id,
                    count    : 50
                });

                this.jobsCollection.bind('reset add remove', self.renderJobs, self);

                cb();
            },

            renderJobs: function () {
                var template = _.template(DetailsTemplate);
                var container = this.$el.find('#forInfo');
                var formModel = this.formModel.toJSON();
                var self = this;
                var _id = window.location.hash.split('form/')[1];
                var key = 'jobs_projectId:' + _id;
                var jobsCollection = custom.retriveFromCash(key);
                var budgetTotal;

                var projectTeam = _.filter(this.jobsCollection.toJSON(), function (el) {
                    return el.project._id === _id;
                });

                if (!jobsCollection || !jobsCollection.length) {
                    custom.cacheToApp(key, this.jobsCollection, true);
                }

                this.projectValues = {
                    revenue: 0,
                    profit : 0,
                    cost   : 0
                };

                projectTeam.forEach(function (projectTeam) {
                    if (projectTeam && projectTeam.budget && projectTeam.budget.budgetTotal) {
                        budgetTotal = projectTeam.budget.budgetTotal;
                        self.projectValues.revenue += budgetTotal.revenueSum || 0;
                        self.projectValues.cost += budgetTotal.costSum || 0;
                        self.projectValues.profit = self.projectValues.revenue - self.projectValues.cost;
                        /*self.projectValues.profit += budgetTotal ? (budgetTotal.revenueSum - budgetTotal.costSum) : 0;*/
                    }
                });

                this.projectValues.markUp = ((this.projectValues.profit / this.projectValues.cost) * 100);

                if (!isFinite(this.projectValues.markUp)) {
                    self.projectValues.markUp = 0;
                }

                this.projectValues.radio = ((this.projectValues.profit / this.projectValues.revenue) * 100);

                if (!isFinite(this.projectValues.radio)) {
                    this.projectValues.radio = 0;
                }

                container.html(template({
                        jobs            : projectTeam,
                        bonus           : formModel.budget.bonus ? formModel.budget.bonus : [],
                        projectValues   : self.projectValues,
                        currencySplitter: helpers.currencySplitter,
                        contentType     : self.contentType
                    })
                );

                this.renderProformRevenue();
                this.getInvoiceStats();
                this.getProformaStats();
            },

            getWTrack: function (cb) {
                var self = this;
                var callback = _.once(cb);

                var _id = window.location.hash.split('form/')[1];

                var filter = {
                    projectName: {
                        key  : 'project._id',
                        value: [_id],
                        type : 'ObjectId'
                    }
                };

                this.wCollection = new wTrackCollection({
                    viewType: 'list',
                    filter  : filter,
                    count   : 100
                });

                function createView() {
                    var gridStart = $('#grid-start').text();
                    callback();

                    var startNumber = gridStart ? (parseInt(gridStart, 10) < 1) ? 1 : parseInt(gridStart, 10) : 1;
                    var itemsNumber = parseInt($('.selectedItemsNumber').text(), 10) || 'all';
                    var defaultItemsNumber = itemsNumber || self.wCollection.namberToShow;
                    if (self.wTrackView) {
                        self.wTrackView.undelegateEvents();
                    }

                    this.wTrackView = new wTrackView({
                        model             : self.wCollection,
                        defaultItemsNumber: defaultItemsNumber,
                        filter            : filter,
                        startNumber       : startNumber,
                        project           : self.formModel
                    });
                }

                function showMoreContent(newModels) {
                    self.wCollection.reset(newModels.toJSON());
                }

                this.wCollection.bind('reset', createView);
                this.wCollection.bind('showmore', showMoreContent);
            },

            showMoreContent: function (newModels) {
                var self = this;
                var _id = window.location.hash.split('form/')[1];
                var gridStart = $('#grid-start').text();

                var startNumber = gridStart ? (parseInt(gridStart, 10) < 1) ? 1 : parseInt(gridStart, 10) : 1;

                var filter = {
                    projectName: {
                        key  : 'project._id',
                        value: [_id],
                        type : 'ObjectId'
                    }
                };

                if (self.wTrackView) {
                    self.wTrackView.undelegateEvents();
                }

                this.wTrackView = new wTrackView({
                    model      : self.wCollection,
                    filter     : filter,
                    startNumber: startNumber,
                    project    : self.formModel
                });

                this.wCollection.bind('reset', this.createView);
            },

            getInvoiceStats: function (cb) {
                //ToDo optimize
                var _id = window.location.hash.split('form/')[1];
                var self = this;
                var filter = {
                    project: {
                        key  : 'project._id',
                        value: [_id]
                    }
                };
                dataService.getData('invoice/stats/project', {filter: filter}, function (response) {
                    if (response && response.success) {
                        self.renderInvoiceStats(response.success);
                    } else {

                        App.stopPreload();
                    }

                    if (typeof cb === 'function') {
                        cb();
                    }
                });
            },

            getProformaStats: function (cb) {
                //ToDo optimize
                var _id = window.location.hash.split('form/')[1];
                var self = this;
                var filter = {
                    project: {
                        key  : 'project._id',
                        value: [_id]
                    }
                };
                dataService.getData('proforma/stats/project', {filter: filter}, function (response) {
                    if (response && response.success) {
                        self.renderProformaStats(response.success);
                    } else {

                        App.stopPreload();
                    }

                    if (typeof cb === 'function') {
                        cb();
                    }
                });
            },

            renderInvoiceStats: function (data) {
                var statsContainer = this.$el.find('#invoiceStatsContainer');

                statsContainer.html(this.invoiceStatsTmpl({
                        invoceStats     : data.invoices,
                        invoceStat      : data,
                        currencySplitter: helpers.currencySplitter,
                        currencyClass: helpers.currencyClass
                    })
                );
            },

            renderProformaStats: function (data) {
                var statsContainer = this.$el.find('#proformaStatsContainer');

                statsContainer.html(this.proformaStatsTmpl({
                        invoceStats     : data.invoices,
                        invoceStat      : data,
                        currencySplitter: helpers.currencySplitter,
                        currencyClass: helpers.currencyClass
                    })
                );
            },

            createView: function () {
                var gridStart = $('#grid-start').text();
                var startNumber = gridStart ? (parseInt(gridStart, 10) < 1) ? 1 : parseInt(gridStart, 10) : 1;

                if (this.wTrackView) {
                    this.wTrackView.undelegateEvents();
                }

                this.wTrackView = new wTrackView({
                    model      : this.wCollection,
                    filter     : filter,
                    startNumber: startNumber
                }).render();
            },

            getInvoice: function (cb) {
                var self = this;
                var _id = window.location.hash.split('form/')[1];
                var filter = {
                    project: {
                        key  : 'project._id',
                        value: [_id]
                    }
                };
                var callback;

                self.iCollection = new invoiceCollection({
                    count      : 50,
                    viewType   : 'list',
                    contentType: 'salesInvoice',
                    filter     : filter
                });

                function createView() {
                    var payments = [];

                    //App.invoiceCollection = self.iCollection;

                    new InvoiceView({
                        model       : self.iCollection,
                        filter      : filter,
                        eventChannel: self.eventChannel
                    });

                    self.iCollection.toJSON().forEach(function (element) {
                        if (element.payments) {
                            element.payments.forEach(function (payment) {
                                payments.push(payment);
                            });
                        }
                    });

                    self.payments = self.payments || {};
                    self.payments.fromInvoces = payments;

                    self.renderTabCounter();

                    if (cb) {
                        callback();
                    }
                }

                callback = _.once(cb);

                self.iCollection.unbind();
                self.iCollection.bind('reset', createView);

            },

            getProforma: function (cb, quotationId) {
                var self = this;
                var _id = window.location.hash.split('form/')[1];
                var filter = {
                    project: {
                        key  : 'project._id',
                        value: [_id]
                    }
                };
                var callback;

                self.pCollection = new proformaCollection({
                    count      : 50,
                    viewType   : 'list',
                    contentType: 'proforma',
                    filter     : filter
                });

                function createView() {
                    var proformaView;
                    var payments = [];

                    //App.proformaCollection = self.pCollection;

                    proformaView = new ProformaView({
                        el          : '#proforma',
                        model       : self.pCollection,
                        filter      : filter,
                        eventChannel: self.eventChannel
                    });

                    if (quotationId) {
                        proformaView.showDialog(quotationId);
                    }

                    self.pCollection.toJSON().forEach(function (element) {
                        if (element.payments) {
                            element.payments.forEach(function (payment) {
                                payments.push(payment);
                            });
                        }
                    });

                    self.payments = self.payments || {};
                    self.payments.fromProformas = payments;

                    if (typeof(cb) === 'function') {
                        callback();
                    }
                }

                callback = _.once(cb);

                self.pCollection.unbind();
                self.pCollection.bind('reset', createView);

            },

            getPayments: function (activate) {
                var self = this;
                var payFromInvoice;
                var payFromProforma;
                var payments;

                self.payments = self.payments || {};
                payFromInvoice = self.payments.fromInvoces || [];
                payFromProforma = self.payments.fromProformas || [];

                payments = payFromInvoice.concat(payFromProforma);

                var filterPayment = {
                    name: {
                        key  : '_id',
                        value: payments
                    }
                };

                self.payCollection = new paymentCollection({
                    count      : 50,
                    viewType   : 'list',
                    contentType: 'customerPayments',
                    filter     : filterPayment
                });

                self.payCollection.unbind();
                self.payCollection.bind('reset', createPayment);

                function createPayment() {
                    var data = {
                        model       : self.payCollection,
                        filter      : filterPayment,
                        activate    : activate,
                        eventChannel: self.eventChannel
                    };

                    new PaymentView(data);

                    self.renderTabCounter();
                }
            },

            getProjectMembers: function (cb) {
                var self = this;

                self.pMCollection = new projectMembersCol({
                    project: self.formModel.id
                });

                self.pMCollection.bind('reset', createPM);

                function createPM() {

                    var data = {
                        collection: self.pMCollection,
                        project   : self.formModel
                    };

                    if (cb) {
                        cb();
                    }

                    new ProjectMembersView(data).render();
                }
            },

            getQuotations: function (cb) {
                var _id = window.location.hash.split('form/')[1];
                var self = this;

                var filter = {
                    projectName: {
                        key  : 'project._id',
                        value: [_id]
                    }
                };

                this.qCollection = new quotationCollection({
                    count      : 50,
                    viewType   : 'list',
                    contentType: 'salesQuotation',
                    filter     : filter
                });

                function createView() {

                    if (cb) {
                        cb();
                    }

                    new QuotationView({
                        collection      : self.qCollection,
                        projectId       : _id,
                        customerId      : self.formModel.toJSON().customer._id,
                        salesManager    : self.salesManager,
                        filter          : filter,
                        model           : self.formModel,
                        wTrackCollection: self.wCollection,
                        createJob       : true,
                        eventChannel    : self.eventChannel
                    }).render();

                    self.renderTabCounter();

                };

                this.qCollection.bind('reset', createView);
                this.qCollection.bind('add', self.renderProformRevenue);
                this.qCollection.bind('remove', self.renderProformRevenue);
            },

            getOrders: function (cb) {
                var self = this;
                var _id = window.location.hash.split('form/')[1];

                var filter = {
                    projectName: {
                        key  : 'project._id',
                        value: [_id]
                    },
                    isOrder    : {
                        key  : 'isOrder',
                        value: ['true']
                    }
                };

                this.ordersCollection = new quotationCollection({
                    count      : 50,
                    viewType   : 'list',
                    contentType: 'salesOrder',
                    filter     : filter
                });

                function createView() {
                    if (cb) {
                        cb();
                    }

                    new oredrView({
                        collection    : self.ordersCollection,
                        projectId     : _id,
                        customerId    : self.formModel.toJSON().customer._id,
                        projectManager: self.salesManager,
                        filter        : filter,
                        eventChannel  : self.eventChannel
                    });

                    self.renderTabCounter();

                }

                function showMoreContent(newModels) {
                    self.ordersCollection.reset(newModels.toJSON());
                }

                this.ordersCollection.bind('reset', createView);
                this.ordersCollection.bind('add', self.renderProformRevenue);
                this.ordersCollection.bind('showmore', showMoreContent);
            },

            renderProformRevenue: function (cb) {
                var self = this;
                var proformContainer = this.$el.find('#proformRevenueContainer');

                var qCollectionJSON = this.qCollection.toJSON();
                var ordersCollectionJSON = this.ordersCollection.toJSON();
                var jobsCollection = this.jobsCollection.toJSON();

                var sum = 0;
                var orderSum = 0;
                var jobSum = 0;
                var jobsCount = 0;

                ordersCollectionJSON.forEach(function (element) {
                    if (element.paymentInfo) {
                        orderSum += parseFloat(element.paymentInfo.total);
                    }
                });

                qCollectionJSON.forEach(function (element) {
                    if (element.paymentInfo) {
                        sum += parseFloat(element.paymentInfo.total);
                    }
                });

                jobsCollection.forEach(function (element) {
                    if (element.type === 'Not Quoted') {
                        if (element.budget.budgetTotal && (element.budget.budgetTotal.revenueSum !== 0)) {
                            jobSum += parseFloat(element.budget.budgetTotal.revenueSum);
                            jobsCount++;
                        }
                    }
                });

                this.proformValues.quotations = {
                    count: qCollectionJSON.length,
                    sum  : sum
                };

                this.proformValues.orders = {
                    count: ordersCollectionJSON.length,
                    sum  : orderSum
                };

                this.proformValues.jobs = {
                    count: jobsCount,
                    sum  : jobSum
                };

                proformContainer.html(this.proformRevenue({
                        proformValues   : self.proformValues,
                        currencySplitter: helpers.currencySplitter,
                        currencyClass: helpers.currencyClass
                    })
                );

                if (typeof cb === 'function') {
                    cb();
                }
            },

            renderTabCounter: function () {
                var $tabs = $('.countable');
                var $table;
                var count;
                var id;

                $tabs.each(function () {
                    var $tab = $(this);

                    id = $tab.attr('id');
                    id = id.replace('Tab', '');
                    $table = $('#' + id).find('tbody tr');
                    count = $table.length;
                    $tab.find('span').text(' (' + count + ')');
                });
            },

            editItem: function () {
                var self = this;
                var inputs = $(':input[readonly="readonly"]');
                var textArea = $('.projectDescriptionEdit');
                var selects = $('.disabled');

                selects.removeClass('disabled');

                inputs.attr('readonly', false);
                textArea.attr('readonly', false);

                $('#StartDate').datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true,
                    onSelect   : function () {
                        var endDate = $('#StartDate').datepicker('getDate');
                        endDate.setDate(endDate.getDate());
                        $('#EndDateTarget').datepicker('option', 'minDate', endDate);
                    }
                });
                $('#EndDate').datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true,
                    onSelect   : function () {
                        var endDate = $('#StartDate').datepicker('getDate');
                        endDate.setDate(endDate.getDate());
                        $('#EndDateTarget').datepicker('option', 'minDate', endDate);
                    }
                });
                $('#EndDateTarget').datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true,
                    minDate    : (self.formModel.StartDate) ? self.formModel.StartDate : 0
                });
                $('#StartDate').datepicker('option', 'disabled', false);
                $('#EndDate').datepicker('option', 'disabled', false);
                $('#EndDateTarget').datepicker('option', 'disabled', false);

                $('#top-bar-saveBtn').show();
                $('#createQuotation').show();
            },

            deleteItems: function () {
                var mid = 39;

                this.formModel.urlRoot = '/Projects';
                this.formModel.destroy({
                    headers: {
                        mid: mid
                    },
                    success: function () {
                        Backbone.history.navigate('#easyErp/Projects/thumbnails', {trigger: true});
                    }
                });

            },

            activeTab: function () {
                var tabs;
                var activeTab;
                var dialogHolder;
                var tabId;
                var dialogsDiv = $('#dialogContainer').is(':empty');

                if (dialogsDiv && App.projectInfo && App.projectInfo.currentTab && App.projectInfo.currentTab !== 'overview') {
                    tabId = App.projectInfo.currentTab;
                    tabs = $('.chart-tabs');
                    activeTab = tabs.find('.active');

                    activeTab.removeClass('active');
                    tabs.find('#' + tabId + 'Tab').addClass('active');

                    dialogHolder = $('.dialog-tabs-items');
                    dialogHolder.find('.dialog-tabs-item.active').removeClass('active');
                    dialogHolder.find('div#' + tabId).closest('.dialog-tabs-item').addClass('active'); // added selector div in case finding bad element
                }
            },

            newPayment: function () {
                var self = this;
                var paralellTasks;

                paralellTasks = [
                    self.getProforma,
                    self.getInvoice,
                    self.renderProformRevenue,
                    self.getInvoiceStats,
                    self.getProformaStats
                ];

                App.startPreload();

                async.parallel(paralellTasks, function () {
                    self.getPayments(true);
                    App.stopPreload();
                });

            },

            newInvoice: function () {
                var self = this;
                var paralellTasks;

                paralellTasks = [
                    self.getInvoiceStats,
                    self.getOrders
                ];

                App.startPreload();

                async.parallel(paralellTasks, function () {
                    App.stopPreload();
                });

            },

            createProforma: function (quotationId) {
                var self = this;
                var paralellTasks;

                paralellTasks = [
                    self.renderProformRevenue,
                    self.getProforma,
                    self.getProformaStats
                ];
                App.startPreload();

                async.parallel(paralellTasks, function () {
                    self.getProforma(null, quotationId);
                    self.activeTab();
                    self.renderTabCounter();
                    if (!quotationId) {
                        App.stopPreload();
                    }
                });

            },

            render: function () {
                var formModel = this.formModel.toJSON();
                var assignees;
                var paralellTasks;
                var self = this;
                var templ = _.template(ProjectsFormTemplate);
                var thisEl = this.$el;
                var notesEl;
                var atachEl;
                var notDiv;
                var container;
                var accessData = App.currentUser && App.currentUser.profile && App.currentUser.profile.profileAccess || [];

                App.startPreload();

                notesEl = new noteView({
                    model: this.formModel
                }).render().el;

                atachEl = new attachView({
                    model: this.formModel,
                    url  : '/uploadProjectsFiles'
                }).render().el;

                thisEl.html(templ({
                    model: formModel
                }));

                App.projectInfo = App.projectInfo || {};
                App.projectInfo.currentTab = App.projectInfo.currentTab ? App.projectInfo.currentTab : 'overview';

                populate.get('#projectTypeDD', '/projectType', {}, 'name', this, false, true);
                populate.get2name('#customerDd', '/Customer', {}, this, false, false);
                populate.getWorkflow('#workflowsDd', '#workflowNamesDd', '/WorkflowsForDd', {id: 'Projects'}, 'name', this);
                populate.getWorkflow('#workflow', '#workflowNames', '/WorkflowsForDd', {id: 'Jobs'}, 'name', this);
                populate.get("#payment_terms", "/paymentTerm", {}, 'name', this, true, true);
                populate.get("#payment_method", "/paymentMethod", {}, 'name', this, true, true);

                notDiv = this.$el.find('#divForNote');
                notDiv.html(notesEl);
                notDiv.append(atachEl);

                this.formModel.bind('chooseAssignee', this.showSaveButton);

                assignees = thisEl.find('#assignees-container');
                assignees.html(
                    new AssigneesView({
                        model: this.formModel
                    }).render().el
                );

                _.bindAll(this, 'getQuotations', 'getProjectMembers', 'getOrders', 'getWTrack', 'renderProformRevenue', 'renderProjectInfo', 'renderJobs', 'getInvoice', 'getInvoiceStats', 'getProformaStats', 'getProforma');

                paralellTasks = [this.renderProjectInfo, this.getQuotations, this.getOrders];

                accessData.forEach(function(accessElement) {
                    //todo move dom elems removal to template
                    if (accessElement.module === 64) {
                        if (accessElement.access.read) {
                            paralellTasks.push(self.getInvoice);
                            paralellTasks.push(self.getProforma);
                        } else {
                            thisEl.find('#invoicesTab').parent().remove();
                            thisEl.find('div#invoices').parent().remove();
                            thisEl.find('#proformaTab').parent().remove();
                            thisEl.find('div#proforma').parent().remove();
                            thisEl.find('#paymentsTab').parent().remove();
                            thisEl.find('div#payments').parent().remove();


                            self.getPayments = function() {};
                            self.getInvoiceStats = function() {};
                            self.getProformaStats = function() {};
                        }
                    }

                    if (accessElement.module === 75) {
                        if (accessElement.access.read) {
                            paralellTasks.push(self.getWTrack);
                        } else {
                            thisEl.find('#timesheetTab').parent().remove();
                            thisEl.find('div#timesheet').parent().remove();
                        }
                    }

                    if (accessElement.module === 72) {
                        if (accessElement.access.read) {
                            paralellTasks.push(self.getProjectMembers);
                        } else {
                            thisEl.find('#projectMembersTab').parent().remove();
                            thisEl.find('div#projectMembers').parent().remove();
                        }
                    }

                });

                if (!accessData.length) {
                    paralellTasks.push(self.getInvoice);
                    paralellTasks.push(self.getProforma);
                    paralellTasks.push(self.getWTrack);
                    paralellTasks.push(self.getProjectMembers);
                }

                async.parallel(paralellTasks, function (err, result) {
                    self.getPayments();
                    App.stopPreload();
                    self.renderProformRevenue();
                    self.activeTab();
                });

                $('#top-bar-deleteBtn').hide();
                $('#createQuotation').show();

                $('#StartDate').datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true,
                    onSelect   : function () {
                        var endDate = $('#StartDate').datepicker('getDate');
                        endDate.setDate(endDate.getDate());
                        $('#EndDateTarget').datepicker('option', 'minDate', endDate);
                        $('#EndDate').datepicker('option', 'minDate', endDate); // added minDate after selecting new startDate

                        self.showSaveButton();
                    }
                });
                $('#EndDate').datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true,
                    minDate    : $('#StartDate').datepicker('getDate'), //added minDate at start
                    onSelect   : function () {
                        var endDate = $('#StartDate').datepicker('getDate');
                        endDate.setDate(endDate.getDate());
                        $('#EndDateTarget').datepicker('option', 'minDate', endDate);

                        self.showSaveButton();
                    }
                });
                $('#EndDateTarget').datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true,
                    minDate    : (self.formModel.StartDate) ? self.formModel.StartDate : 0
                });

                return this;

            }
        });

        return View;
    });
