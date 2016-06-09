define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/listViewBase',
    'views/selectView/selectView',
    'text!templates/wTrack/list/ListHeader.html',
    'text!templates/wTrack/list/cancelEdit.html',
    'text!templates/wTrack/list/forWeek.html',
    'views/wTrack/CreateView',
    'views/wTrack/list/ListItemView',
    'views/salesInvoice/wTrack/CreateView',
    'models/wTrackModel',
    'collections/wTrack/filterCollection',
    'collections/wTrack/editCollection',
    'views/Filter/FilterView',
    'views/wTrack/list/createJob',
    'common',
    'dataService',
    'populate',
    'async',
    'custom',
    'moment',
    'constants',
    'helpers/keyCodeHelper',
    'helpers/employeeHelper',
    'helpers/overTime',
    'helpers/isOverTime'
], function (Backbone,
             _,
             $,
             ListViewBase,
             selectView,
             listTemplate,
             cancelEdit,
             forWeek,
             CreateView,
             ListItemView,
             WTrackCreateView,
             CurrentModel,
             ContentCollection,
             EditCollection,
             FilterView,
             CreateJob,
             common,
             dataService,
             populate,
             async,
             custom,
             moment,
             CONSTANTS,
             keyCodes,
             employeeHelper,
             setOverTime,
             isOverTime) {
    'use strict';

    var wTrackListView = ListViewBase.extend({
        CreateView              : CreateView,
        listTemplate            : listTemplate,
        ListItemView            : ListItemView,
        ContentCollection       : ContentCollection,
        FilterView              : FilterView,
        setOverTime             : setOverTime,
        contentType             : 'wTrack',
        viewType                : 'list',
        responseObj             : {},
        wTrackId                : null, // need for edit rows in listView
        totalCollectionLengthUrl: '/wTrack/totalCollectionLength',
        $listTable              : null, // cashedJqueryEllemnt
        editCollection          : null,
        selectedProjectId       : [],
        genInvoiceEl            : null,
        changedModels           : {},
        exportToCsvUrl          : '/wTrack/exportToCsv',
        exportToXlsxUrl         : '/wTrack/exportToXlsx',

        initialize: function (options) {
            this.startTime = options.startTime;
            this.collection = options.collection;
            this.filter = options.filter;
            this.sort = options.sort;
            this.defaultItemsNumber = this.collection.pageSize || 100;
            this.newCollection = options.newCollection;
            this.deleteCounter = 0;
            this.page = options.collection.currentPage;

            this.render();

            // this.getTotalLength(null, this.defaultItemsNumber, this.filter);
            this.ContentCollection = ContentCollection;
            this.stages = [];
        },

        events: {
            'click .stageSelect'                               : 'showNewSelect',
            'click tr.enableEdit td.editable:not(.disabled)'   : 'editRow',
            'click td.disabled'                                : 'notify',
            'click .newSelectList li:not(.miniStylePagination)': 'chooseOption',
            'change .autoCalc'                                 : 'autoCalc',
            'change .editable'                                 : 'setEditable',
            'keydown input.editing'                            : 'keyDown',
            click                                              : 'removeInputs'
        },

        removeInputs: function () {
            // this.setChangedValueToModel();
            if (this.selectView) {
                this.selectView.remove();
            }
        },

        validateRow: function ($tr, cb) {
            var wTrackId = $tr.attr('data-id');
            var edited = !!$tr.attr('data-edited');
            var wTrack = this.editCollection.get(wTrackId) || this.collection.get(wTrackId);

            if (!edited) {
                this.checkVacHolMonth($tr, wTrack, cb);
            }
        },

        generateJob: function (e) {
            var target = $(e.target);
            var id = target.closest('tr').attr('data-id');
            var wTrackModel = this.editCollection.get(id) || this.collection.get(id);
            var model = this.projectModel || wTrackModel.get('project');
            var projectsDdContainer = $('#projectDd');

            if (!model) {
                projectsDdContainer.css('color', 'red');

                return App.render({
                    type   : 'error',
                    message: CONSTANTS.SELECTP_ROJECT
                });
            }

            new CreateJob({
                model     : model,
                wTrackView: this
            });

            return false;
        },

        generatedWtracks: function () {
            var self = this;
            var tr = this.$listTable.find('.false');
            var projectId = tr.find('[data-content="project"]').attr('data-id');

            dataService.getData('/jobs/getForDD', {projectId: projectId, all: true}, function (jobs) {

                self.responseObj['#jobs'] = jobs;

                tr.find('[data-content="jobs"]').addClass('editable');
            });
        },

        keyDown: function (e) {
            var code = e.keyCode;
            var $target = $(e.target);
            var $tr = $target.closest('tr');
            var $td = $target.closest('td');

            $tr.attr('data-edited', true);

            if (keyCodes.isEnter(code)) {
                this.autoCalc(e);
                // this.calculateCost(e, this.wTrackId);
                this.setChangedValueToModel();
                this.showSaveCancelBtns();

                e.stopPropagation();
            } else if (!keyCodes.isDigitOrDecimalDot(code) && !keyCodes.isBspaceAndDelete(code)) {
                e.preventDefault();
            } else {
                this.setEditable($td);
            }
        },

        /* generateInvoice: function () {
         var selectedWtracks = this.$el.find('input.listCB:checked');
         var wTracks = [];
         var self = this;
         var project;
         var assigned;
         var customer;
         var total = 0;
         var revenue;

         async.each(selectedWtracks, function (el, cb) {
         var id = $(el).val();
         var model = self.collection.get(id);
         var reven = model.get('revenue');

         if (typeof reven !== 'number') {
         model.set({revenue: parseFloat(reven) * 100});
         }

         revenue = reven.toString().replace('$', '');
         revenue = parseFloat(revenue);

         if (typeof reven === 'number') {
         revenue = revenue / 100;
         }

         total += revenue;

         if (!project) {
         project = model.get('project');
         assigned = project.salesmanager;
         customer = project.customer;
         }

         wTracks.push(model.toJSON());
         cb();
         }, function (err) {
         if (!err) {
         new wTrackCreateView({
         wTracks : wTracks,
         project : project,
         assigned: assigned,
         customer: customer,
         total   : total
         });
         }
         });
         },*/

        hideGenerateCopy: function () {
            // $('#top-bar-generateBtn').hide();
            $('#top-bar-copyBtn').hide();
            $('#top-bar-createBtn').show();
        },

        copyRow: function (e) {
            var self = this;
            var checkedRows = this.$el.find('input.listCB:checked:not(#checkAll)');
            var length = checkedRows.length;
            var selectedWtrack;
            var target;
            var id;
            var row;
            var model;
            var _model;
            var tdsArr;
            var cid;
            var hours;
            var message;
            var projectWorkflow;
            var i;

            this.$el.find('#checkAll').prop('checked', false);

            this.hideGenerateCopy();
            this.changed = true;
            this.createdCopied = true;

            for (i = length - 1; i >= 0; i--) {
                selectedWtrack = checkedRows[i];
                target = $(selectedWtrack);
                id = target.val();
                row = target.closest('tr');
                model = self.collection.get(id) ? self.collection.get(id) : self.editCollection.get(id);
                hours = (model.changed && model.changed.worked) ? model.changed.worked : model.get('worked');
                $(selectedWtrack).attr('checked', false);
                projectWorkflow = $.trim(row.find('[data-content="workflow"]').text());

                if ((model.toJSON().workflow && model.toJSON().workflow.name !== 'Closed') || (projectWorkflow !== 'Closed')) {
                    model.set({
                        isPaid : false,
                        amount : 0,
                        cost   : 0,
                        revenue: 0
                    });
                    model = model.toJSON();

                    delete model._id;

                    _model = new CurrentModel(model);

                    this.showSaveCancelBtns();
                    this.editCollection.add(_model);

                    cid = _model.cid;

                    if (!this.changedModels[cid]) {
                        this.changedModels[cid] = model;
                    }

                    this.$el.find('#listTable').prepend('<tr class="false enableEdit" data-id="' + cid + '">' + row.html() + '</tr>');
                    row = this.$el.find('.false');

                    tdsArr = row.find('td');
                    $(tdsArr[0]).find('input').val(cid);
                    $(tdsArr[1]).text('New');
                } else {
                    message = "You can't copy tCard with closed project.";
                    App.render({
                        type   : 'error',
                        message: message
                    });
                }
            }
        },

        autoCalc: function (e, $tr) {
            var worked = 0;
            var $el;
            var input;
            var days;
            var wTrackId;
            var value;
            var calcEl;
            var workedEl;
            var i;

            if (e) {
                $el = $(e.target);
            }

            if (!$el && !$tr) {
                input = this.$listTable.find('input.editing');
                $tr = input.closest('tr');
            }

            $tr = $tr || $el.closest('tr');
            input = input || $tr.find('input.editing');
            days = $tr.find('.autoCalc');
            wTrackId = $tr.attr('data-id');
            workedEl = $tr.find('[data-content="worked"]');

            function eplyDefaultValue(el) {
                var value = el.text();

                if (value === '') {
                    if (el.children('input').length) {
                        value = input.val() || '0'; // in case of empty input

                    } else {
                        value = '0';
                    }
                }

                return value;
            }

            for (i = days.length - 1; i >= 0; i--) {
                calcEl = $(days[i]);

                value = eplyDefaultValue(calcEl);

                worked += parseInt(value, 10);
            }

            workedEl.text(worked);

            if (!this.changedModels[wTrackId]) {
                this.changedModels[wTrackId] = {};
            }

            this.changedModels[wTrackId].worked = worked;
        },

        setEditable: function (td) {
            var tr;

            if (!td.parents) {
                td = $(td.target).closest('td');
            }

            tr = td.parents('tr');

            tr.addClass('edited');
            // td.addClass('edited');

            if (this.isEditRows()) {
                this.setChangedValue();
            }

            return false;
        },

        isEditRows: function () {
            var edited = this.$listTable.find('.edited');

            this.edited = edited;

            return !!edited.length;
        },

        setChangedValueToModel: function ($tr) {
            var editedElement = this.$listTable.find('.editing');
            var $editedCol;
            var editedElementRowId;
            var editedElementContent;
            var editedElementValue;
            var self = this;
            var $days;
            var weeks;

            function funcForWeek(cb) {
                var year = editedElement.closest('tr').find('[data-content="year"]').text();
                var weeks = custom.getWeeks(editedElementValue, year);

                cb(null, weeks);
            }

            if (navigator.userAgent.indexOf('Firefox') > -1) {
                this.setEditable(editedElement);
            }

            if ($tr) {
                editedElementRowId = $tr.attr('data-id');
                $days = $tr.find('td.autoCalc');

                if (!this.changedModels[editedElementRowId]) {
                    this.changedModels[editedElementRowId] = {};
                }

                $days.each(function () {
                    var $el = $(this);
                    var day = $el.attr('data-content');
                    var value = $el.text() || 0;

                    self.changedModels[editedElementRowId][day] = value;
                });

            } else if (editedElement.length) {
                $editedCol = editedElement.closest('td');
                $tr = editedElement.closest('tr');
                editedElementRowId = $tr.attr('data-id');
                editedElementContent = $editedCol.data('content');
                editedElementValue = editedElement.val();

                // editWtrackModel = this.editCollection.get(editedElementRowId);

                if (!this.changedModels[editedElementRowId]) {
                    this.changedModels[editedElementRowId] = {};
                }

                this.changedModels[editedElementRowId][editedElementContent] = editedElementValue;

                if (editedElementContent === 'month') {
                    async.parallel([funcForWeek], function (err, result) {
                        if (err) {
                            console.log(err);
                        }

                        weeks = result[0];
                        editedElement.closest('tr').find('[data-content="week"]').text(weeks[0].week);
                        $editedCol.text(editedElementValue);
                        editedElement.remove();

                        self.changedModels[editedElementRowId].week = weeks[0].week;

                        self.checkVacHolMonth($tr, false, function () {
                            self.setChangedValueToModel($tr);
                        });
                    });
                } else {
                    $editedCol.text(editedElementValue);
                    editedElement.remove();
                }

            }
        },

        editRow: function (e) {
            var el = $(e.target);
            var $td = el.closest('td');
            var self = this;
            var $tr = $(e.target).closest('tr');
            var isEdited = !!$tr.attr('data-edited');
            var $input = $tr.find('td:not([data-content="month"]) input.editing');
            var wTrackId = $tr.attr('data-id');
            var colType = el.data('type');
            var content = el.data('content');
            var isSelect = colType !== 'input' && el.prop('tagName') !== 'INPUT';
            var isWeek = el.attr('data-content') === 'week';
            var isType = el.attr('data-content') === 'type';
            var isYear = el.attr('data-content') === 'year';
            var isMonth = el.attr('data-content') === 'month';
            var isDay = el.hasClass('autoCalc');
            var isOvertime = $tr.hasClass('overtime');
            var month = $tr.find('[data-content="month"]').text() || $tr.find('.editing').val();
            var year = $tr.find('[data-content="year"]').text() || $tr.find('.editing').val();

            var editCb = function () {
                var maxValue = 100;
                var tempContainer;
                var width;
                var value;
                var insertedInput;
                var weeks;
                var template;
                var currentYear;
                var previousYear;
                var nextYear;
                var maxlength;
                var projectId = $tr.find('[data-content="project"]').attr('data-id');
                var holiday = $td.is('.H, .V, .P, .S, .E, [data-content="6"], [data-content="7"]');


                if ($td.hasClass('disabled')) {
                    return false;
                }

                year = year.slice(0, 4);


                if (!isOvertime && holiday) {
                    App.render({
                        type   : 'error',
                        message: 'Please create Overtime tCard'
                    });
                    return false;
                }

                if (wTrackId && el.prop('tagName') !== 'INPUT') {
                    this.wTrackId = wTrackId;
                    this.setChangedValueToModel();
                }

                if (el.hasClass('editing')) {  // added in case of double click on el
                    return false;
                }

                if (isSelect) {
                    if (content === 'jobs') {
                        if (!projectId && !projectId.length) {
                            App.render({
                                type   : 'error',
                                message: 'Please choose a project before'
                            });

                            return false;
                        }
                        dataService.getData('/jobs/getForDD', {
                            projectId: projectId,
                            all      : true
                        }, function (jobs) {
                            self.responseObj['#jobs'] = jobs;
                            self.showNewSelect(e);
                            return false;
                        });
                    } else if (isType) {
                        el.append('<ul class="newSelectList"><li>OR</li><li>OT</li></ul>');

                        return false;
                    } else {
                        this.showNewSelect(e);
                        return false;
                    }
                } else if (isWeek) {
                    weeks = custom.getWeeks(month, year);

                    template = _.template(forWeek);

                    el.append(template({
                        weeks: weeks
                    }));

                    // this.calculateCost(e, wTrackId);
                } else if (isYear) {
                    currentYear = parseInt(moment().year(), 10);
                    previousYear = currentYear - 1;
                    nextYear = currentYear + 1;

                    width = el.width() - 6;
                    el.append('<ul class="newSelectList"><li>' + previousYear + '</li><li>' + currentYear + '</li><li>' + nextYear + '</li></ul>');

                    //  this.calculateCost(e, wTrackId);
                } else if (el.attr('id') === 'selectInput') {
                    return false;
                } else {
                    tempContainer = el.text();
                    width = el.width() - 6;
                    el.html('<input class="editing" type="text" value="' + tempContainer + '"  maxLength="4" style="width:' + width + 'px">');

                    insertedInput = el.find('input');
                    insertedInput.focus();

                    isOverTime(el);
                    insertedInput[0].setSelectionRange(0, insertedInput.val().length);

                    this.autoCalc(e);
                    /* if (wTrackId) {
                     this.calculateCost(e, wTrackId);
                     }*/
                }

                return false;
            };

            editCb = editCb.bind(this);

            e.stopPropagation();

            if (!$input.length && isDay && !isEdited) {
                this.validateRow($tr, editCb);
            } else {
                editCb();
            }
        },

        notify: function () {
            App.render({
                type   : 'notify',
                message: 'This day from another month'
            });
        },

        /* calculateCost: function (e, wTrackId) {
         var self = this;
         var tr = $(e.target).closest('tr');
         var profit = tr.find('[data-content="profit"]');
         var revenueVal = tr.find('[data-content="revenue"]').text();
         var profitVal = tr.find('[data-content="profit"]').text();
         var expenseCoefficient;
         var baseSalaryValue;
         var editWtrackModel;
         var fixedExpense;
         var costElement;
         var employeeId;
         var trackWeek;
         var month;
         var hours;
         var calc;
         var year;

         if (!this.changedModels[wTrackId]) {
         this.changedModels[wTrackId] = {};
         }

         costElement = $(e.target).closest('tr').find('[data-content="cost"]');
         month = (tr.find('[data-content="month"]').text()) ? tr.find('[data-content="month"]').text() : tr.find('.editing').val();

         if (wTrackId.length < 24) {
         employeeId = this.changedModels[wTrackId].employee._id || $(e.target).attr("data-id");

         year = (tr.find('[data-content="year"]').text()) ? tr.find('[data-content="year"]').text() : tr.find('.editing').val();
         trackWeek = tr.find('[data-content="worked"]').text();

         } else {
         editWtrackModel = this.collection.get(wTrackId);
         this.editCollection.add(editWtrackModel);

         employeeId = editWtrackModel.attributes.employee && editWtrackModel.attributes.employee._id ? editWtrackModel.attributes.employee._id : editWtrackModel.attributes.employee;

         year = (tr.find('[data-content="year"]').text()) ? tr.find('[data-content="year"]').text() : tr.find('.editing').val();
         trackWeek = tr.find('[data-content="worked"]').text();
         }

         async.parallel([getMonthData], function callback(err, results) {
         var baseSalary = results[0];
         var coefficients = (results[1] && results[1][0]) || {};

         if (err || !baseSalary || !coefficients) {
         costElement.text('');
         costElement.addClass('money');
         costElement.text('0.00');

         //profitVal = (parseFloat(revenueVal) - 0).toFixed(2);
         //profit.text(profitVal);

         self.changedModels[wTrackId].cost = 0;
         //self.changedModels[wTrackId].profit = parseFloat(profitVal) * 100;

         return 0;
         }

         baseSalaryValue = parseFloat(baseSalary);
         expenseCoefficient = parseFloat(coefficients.expenseCoefficient);
         fixedExpense = parseInt(coefficients.fixedExpense);
         hours = parseInt(coefficients.hours);

         calc = ((((baseSalaryValue * expenseCoefficient) + fixedExpense) / hours) * trackWeek).toFixed(2);

         costElement.text('');
         costElement.addClass('money');
         costElement.text(calc);

         //profitVal = (parseFloat(revenueVal) - parseFloat(calc)).toFixed(2);
         //profit.text(profitVal);

         self.changedModels[wTrackId].cost = parseFloat(calc);
         //self.changedModels[wTrackId].profit = parseFloat(profitVal) * 100;

         return calc;
         });

         function getBaseSalary(callback) {
         dataService.getData('/employees/getByMonth',
         {
         month: month,
         year : year,
         _id  : employeeId
         }, function (response, context) {

         if (response.error) {
         return callback(response.error);
         }

         callback(null, response.data);

         }, this);

         }

         function getMonthData(callback) {

         dataService.getData('/monthHours/list', {month: month, year: year}, function (response, context) {

         if (response.error) {
         return callback(response.error);
         }

         callback(null, response);

         }, this);
         }

         return false;
         },*/

        chooseOption: function (e) {
            var self = this;
            var target = $(e.target);
            var textVal = target.text();
            var targetElement = target.parents('td');
            var tr = target.parents('tr');
            var modelId = tr.attr('data-id');
            var id = target.attr('id');
            var attr = targetElement.attr('id') || targetElement.data('content');
            var elementType = '#' + attr;
            var jobs = {};
            var salesManager;
            var assignedContainer;
            var project;
            var employee;
            var department;
            var changedAttr;
            var week;
            var year;
            var $job;

            var element = _.find(this.responseObj[elementType], function (el) {
                return el._id === id;
            });

            var editWtrackModel = this.editCollection.get(modelId) || this.collection.get(modelId);
            var needCheckVacHol = elementType === '#employee' || elementType === '#week' || elementType === '#year';

            if (!this.changedModels[modelId]) {
                if (!editWtrackModel.id) {
                    this.changedModels[modelId] = editWtrackModel.attributes;
                } else {
                    this.changedModels[modelId] = {};
                }
            }

            changedAttr = this.changedModels[modelId];

            if (id !== 'createJob') {

                if (elementType === '#project') {
                    this.projectModel = element;

                    salesManager = element.salesmanager ? element.salesmanager.name.first + ' ' + element.salesmanager.name.last : '';
                    assignedContainer = tr.find('[data-content="assigned"]');
                    assignedContainer.text(salesManager);
                    targetElement.attr('data-id', id);
                    $job = tr.find('[data-content="jobs"]');
                    $job.text('');

                    tr.find('[data-content="workflow"]').text(element.workflow.name);
                    tr.find('[data-content="customer"]').text(element.customer.name.first + ' ' + element.customer.name.last);

                    project = element._id;

                    changedAttr.project = project;

                    dataService.getData('/jobs/getForDD', {projectId: project, all: true}, function (jobs) {
                        var _job = jobs ? jobs[0] : {name: ''};

                        _job = _job || {name: ''};
                        self.responseObj['#jobs'] = jobs;

                        $job.text(_job.name);

                        if (!_job._id) {
                            $job.addClass('errorContent editable');
                            $job.removeAttr('data-id');
                        } else {
                            $job.removeClass('errorContent');
                            $job.addClass('editable');
                            $job.attr('data-id', _job._id);

                            changedAttr.jobs = _job._id;
                        }
                    });

                } else if (elementType === '#jobs') {
                    jobs = element._id;

                    changedAttr.jobs = jobs;

                    tr.find('[data-content="jobs"]').removeClass('errorContent');
                } else if (elementType === '#type') {
                    changedAttr._type = textVal === 'OT' ? 'overtime' : 'ordinary';
                    this.setOverTime(textVal, tr);
                } else if (elementType === '#employee') {
                    tr.find('[data-content="department"]').text(element.department.name);

                    employee = element._id;

                    department = element.department._id;

                    changedAttr.employee = employee;
                    changedAttr.department = department;

                    targetElement.attr('data-id', employee);


                    // this.calculateCost(e, wTrackId);
                    tr.find('[data-content="department"]').removeClass('errorContent');
                } else if (elementType === '#department') {
                    department = element._id;

                    changedAttr.department = department;
                } else if (elementType === '#week') {
                    changedAttr.week = textVal;
                } else if (elementType === '#year') {
                    changedAttr.year = textVal;
                }

                targetElement.removeClass('errorContent');
                targetElement.text(textVal);
            } else if (id === 'createJob') {
                self.generateJob(e);
            }

            this.hideNewSelect();
            this.setEditable(targetElement);

            if (needCheckVacHol) {
                this.checkVacHolMonth(tr, editWtrackModel, function () {
                    self.setChangedValueToModel(tr);
                });
            }

            return false;
        },

        checkVacHolMonth: function ($targetTr, wTrack, cb) {
            // todo add spiner load
            var self = this;
            var $employee = $targetTr.find('[data-content="employee"]');
            var employeeId = $employee.attr('data-id');
            var year = $targetTr.find('[data-content="year"]').text();
            var month = $targetTr.find('[data-content="month"]').text();
            var week = $targetTr.find('[data-content="week"]').text();
            var dateByWeek = year * 100 + parseInt(week, 10);
            var _$days = $targetTr.find('.autoCalc');

            _$days.removeClass();
            _$days.addClass('editable autoCalc');

            if (wTrack && wTrack.get('dateByWeek') !== dateByWeek) {
                wTrack = null;
            }

            employeeHelper.getNonWorkingDaysByWeek(year, week, month, employeeId, wTrack,
                function (nonWorkingDays, self) {
                    var days = Object.keys(nonWorkingDays);
                    var length = days.length - 1;
                    var isOverTime;
                    var _class;
                    var isDefaultHours;
                    var $el;
                    var day;
                    var value;
                    var i;

                    for (i = length; i >= 0; i--) {
                        day = days[i];
                        _class = '';

                        if (day) {
                            value = nonWorkingDays[day];
                            $el = $targetTr.find('[data-content="' + day + '"]');
                            isOverTime = $el.closest('tr').hasClass('overtime');
                            isDefaultHours = day !== '7' && day !== '6' /* && value === '' */ && _class !== 'disabled' && !wTrack;

                            if (value) {

                                if (!isFinite(value)) {
                                    _class = value;
                                    value = 0;
                                }

                                $el.addClass(_class);

                                if (_class !== 'disabled') {
                                    if (!isOverTime) { // in case of rewriting existing values for OT
                                        $el.text(value);
                                    }
                                } else {
                                    $el.text('');
                                }
                            } else if (isDefaultHours) {
                                $el.text(8);
                            } else {
                                $el.text('');
                            }
                        }
                    }

                    self.autoCalc(null, $targetTr);

                    if (cb && typeof cb === 'function') {
                        cb();
                    }
                }, self);
        },

        checked: function (e) {
            e.stopPropagation();
            var $thisEl = this.$el;
            var rawRows;
            var $checkedEls;
            var checkLength;
            var changedRows = Object.keys(this.changedModels);

            if (this.collection.length > 0) {
                $checkedEls = $thisEl.find('input.listCB:checked');

                checkLength = $checkedEls.length;
                rawRows = $checkedEls.closest('.false');

                this.checkProjectId(e, checkLength);

                if (checkLength > 0) {
                    $('#top-bar-deleteBtn').show();
                    $('#top-bar-createBtn').hide();

                    $('#checkAll').prop('checked', false);
                    if (checkLength === this.collection.length) {
                        $('#checkAll').prop('checked', true);
                    }
                } else {
                    $('#top-bar-deleteBtn').hide();
                    $('#top-bar-createBtn').show();
                    $('#checkAll').prop('checked', false);
                }

                if (rawRows.length !== 0 && rawRows.length !== checkLength) {
                    this.$saveBtn.hide();
                } else {
                    this.$saveBtn.show();
                }

                if (changedRows.length) {
                    this.$saveBtn.show();
                } else {
                    this.$saveBtn.hide();
                }
            }

            this.setAllTotalVals();
        },

        saveItem: function () {
            var errors = this.$el.find('.errorContent');
            var model;
            var id;

            this.setChangedValueToModel();
            //this.autoCalc();

            for (id in this.changedModels) {
                model = this.editCollection.get(id) || this.collection.get(id);

                if (model) {
                    model.changed = this.changedModels[id];
                }
            }

            if (errors.length) {
                return false;
            }

            this.editCollection.save();
            this.$el.find('.edited').removeClass('edited');
        },

        savedNewModel: function (modelObjects) {
            var $savedRow = this.$listTable.find(".false[data-id='" + modelObjects.cid + "']"); // additional selector for finding old row by cid (in case of multiply copying)
            var $checkbox = $savedRow.find('input[type=checkbox]');
            var modelId;

            // modelObject = modelObject.success;

            modelObjects.forEach(function (modelObject) { // now only one element from list? because we hav ot checkbox
                modelId = modelObject._id;
                $savedRow.attr('data-id', modelId);
                $savedRow.removeClass('false');
                $checkbox.val(modelId);
                $savedRow.removeAttr('id');
            });

            this.hideSaveCancelBtns();
            // this.hideOvertime();
            this.resetCollection(modelObjects);
        },

        /* hideOvertime: function () {
         this.$el.find('#overtime input').attr('checked', false);
         this.$el.find('#overtime').hide();
         }, */

        resetCollection: function (models) {
            var id;

            if (models && models.length) {
                // model = new CurrentModel(model);
                this.collection.add(models);
            } else {
                this.collection.set(this.editCollection.models, {remove: false});
            }

            for (id in this.changedModels) {
                delete this.changedModels[id];
                this.editCollection.remove(id);
            }

            this.editCollection.add(this.collection.models);
        },

        updatedOptions: function () {
            this.hideSaveCancelBtns();
            this.resetCollection();
        },

        showNewSelect: function (e, prev, next) {
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

        hideNewSelect: function (e) {
            // $(".newSelectList").remove();

            if (this.selectView) {
                this.selectView.remove();
            }
        },

        bindingEventsToEditedCollection: function (context) {
            if (context.editCollection) {
                context.editCollection.unbind();
            }
            context.editCollection = new EditCollection(context.collection.toJSON());
            context.editCollection.on('saved', context.savedNewModel, context);
            context.editCollection.on('updated', context.updatedOptions, context);
        },

        setChangedValue: function () {
            if (!this.changed) {
                this.changed = true;
                this.showSaveCancelBtns();
            }
        },

        isNewRow: function () {
            var newRow = $('.false');

            return !!newRow.length;
        },

        createItem: function () {
            var now = new Date();
            var year = now.getFullYear();
            var month = now.getMonth() + 1;
            var week = now.getWeek();
            // var rate = 3;
            var startData = {
                year        : year,
                month       : month,
                week        : week,
                //rate        : rate,
                projectModel: null,
                _type       : 'ordinary'
            };

            // this.$el.find('#overtime').show();

            var model = new CurrentModel(startData);

            startData.cid = model.cid;

            if (!this.isNewRow()) {
                this.showSaveCancelBtns();
                this.editCollection.add(model);

                new this.CreateView(startData);
            } else {
                App.render({
                    type   : 'notify',
                    message: 'Please confirm or discard changes befor create a new item'
                });
            }

            this.createdCopied = true;
            this.changed = true;
        },

        showSaveCancelBtns: function () {
            var saveBtnEl = $('#top-bar-saveBtn');
            var cancelBtnEl = $('#top-bar-deleteBtn');
            var createBtnEl = $('#top-bar-createBtn');

            if (!this.changed) {
                createBtnEl.hide();
            }
            saveBtnEl.show();
            cancelBtnEl.show();
            createBtnEl.hide();

            return false;
        },

        hideSaveCancelBtns: function () {
            var createBtnEl = $('#top-bar-createBtn');
            var saveBtnEl = $('#top-bar-saveBtn');
            var cancelBtnEl = $('#top-bar-deleteBtn');

            this.changed = false;

            saveBtnEl.hide();
            cancelBtnEl.hide();
            createBtnEl.show();

            return false;
        },

        checkProjectId: function (e, checkLength) {
            var totalCheckLength = $('input.checkbox:checked').length;
            var element = e.target ? e.target : e;
            var checked = element ? element.checked : true;
            var targetEl = $(element);
            var tr = targetEl.closest('tr');
            var wTrackId = tr.attr('data-id');
            var model = this.collection.get(wTrackId);
            var projectContainer = tr.find('td[data-content="project"]');
            var projectId = projectContainer.attr('data-id');

            if (checkLength >= 1) {
                this.copyEl.show();
            } else {
                this.copyEl.hide();
            }

            if (!checkLength || !model || model.get('isPaid')) {
                this.selectedProjectId = [];

                return false;
            }

            if (checked) {
                this.selectedProjectId.push(projectId);
            } else if (totalCheckLength > 0 && this.selectedProjectId.length > 1) {
                this.selectedProjectId = _.without(this.selectedProjectId, projectId);
            }

            this.selectedProjectId = _.uniq(this.selectedProjectId);
        },

        getAutoCalcField: function (idTotal, dataRow, money) {
            var footerRow = this.$el.find('#listFooter');

            var checkboxes = this.$el.find('#listTable .listCB:checked');

            var totalTd = $(footerRow).find('#' + idTotal);
            var rowTdVal = 0;
            var row;
            var rowTd;

            $(checkboxes).each(function (index, element) {
                row = $(element).closest('tr');
                rowTd = row.find('[data-content="' + dataRow + '"]');

                rowTdVal += parseFloat(rowTd.html() || 0) * 100;
            });

            if (money) {
                totalTd.text((rowTdVal / 100).toFixed(2));
            } else {
                totalTd.text(rowTdVal / 100);
            }
        },

        setAllTotalVals: function (e) {
            //e.stopPropagation();

            this.getAutoCalcField('hours', 'worked');
            this.getAutoCalcField('monHours', '1');
            this.getAutoCalcField('tueHours', '2');
            this.getAutoCalcField('wedHours', '3');
            this.getAutoCalcField('thuHours', '4');
            this.getAutoCalcField('friHours', '5');
            this.getAutoCalcField('satHours', '6');
            this.getAutoCalcField('sunHours', '7');
        },

        deleteItemsRender: function (deleteCounter, deletePage) {
            var pagenation;
            var holder;

            dataService.getData(this.collectionLengthUrl, {
                filter       : this.filter,
                newCollection: this.newCollection
            }, function (response, context) {
                context.listLength = response.count || 0;
                //context.getTotalLength(null, context.defaultItemsNumber, context.filter);
                context.fetchSortCollection({});

            }, this);
            //this.deleteRender(deleteCounter, deletePage, {
            //    filter: this.filter,
            //    newCollection: this.newCollection,
            //    parrentContentId: this.parrentContentId
            //});

            holder = this.$el;

            if (deleteCounter !== this.collectionLength) {
                var created = holder.find('#timeRecivingDataFromServer');
                created.before(
                    new ListItemView({
                        collection : this.collection,
                        page       : holder.find("#currentShowPage").val(),
                        itemsNumber: holder.find("span#itemsNumber").text()
                    }).render());//added two parameters page and items number
            }

            pagenation = this.$el.find('.pagination');

            if (this.collection.length === 0) {
                pagenation.hide();
            } else {
                pagenation.show();
            }

            this.editCollection.reset(this.collection.models);

            this.hideGenerateCopy();
        },

        triggerDeleteItemsRender: function (deleteCounter) {
            this.deleteCounter = deleteCounter;
            this.deletePage = $("#currentShowPage").val();

            this.deleteItemsRender(deleteCounter, this.deletePage);
        },

        /*deleteItems: function() {
            var $currentEl = this.$el;
            var self = this;
        },
*/
        deleteItems: function () {
            var $currentEl = this.$el;
            var that = this;
            var mid = 39;
            var model;
            var localCounter = 0;
            var $checked = $('#listTable input:checked');
            var count = $checked.length;
            var message;
            var enableDelete = true;

            this.collectionLength = this.collection.length;

            if (!this.changed) {
                var answer = confirm('Really DELETE items ?!');
                var value;

                if (answer === true) {

                    App.startPreload();

                    $.each($checked, function (index, checkbox) {
                        value = checkbox.value;

                        if (value.length < 24) {
                            that.editCollection.remove(value);
                            that.editCollection.on('remove', function () {
                                this.listLength--;
                                localCounter++;

                                if (localCounter === count) {
                                    that.triggerDeleteItemsRender(localCounter);
                                }

                            }, that);
                        } else {
                            model = that.collection.get(value);
                            enableDelete = model.toJSON().workflow && model.toJSON().workflow.name !== 'Closed';

                            if (!model.toJSON().workflow) {
                                if ($.trim($currentEl.find('[data-id="' + value + '"]').find('[data-content="workflow"]').text()) !== 'Closed') {
                                    enableDelete = true;
                                }
                            }

                            if (enableDelete) {
                                model.destroy({
                                    headers: {
                                        mid: mid
                                    },
                                    wait   : true,
                                    success: function () {
                                        that.listLength--;
                                        localCounter++;

                                        if (localCounter === count) {
                                            that.triggerDeleteItemsRender(localCounter);
                                        }
                                    },
                                    error  : function (model, res) {
                                        if (res.status === 403 && index === 0) {
                                            App.render({
                                                type   : 'error',
                                                message: "You do not have permission to perform this action"
                                            });
                                        }
                                        that.listLength--;
                                        localCounter++;

                                        if (localCounter === count) {
                                            that.triggerDeleteItemsRender(localCounter);
                                        }
                                    }
                                });
                            } else {
                                message = "You can't delete tCard with closed project.";

                                App.render({
                                    type   : 'error',
                                    message: message
                                });

                                localCounter++;

                                if (localCounter === count) {
                                    that.triggerDeleteItemsRender(localCounter);
                                }
                            }

                        }
                    });


                }
            } else {
                this.cancelChanges();
            }
        },

        cancelChanges: function () {
            var self = this;
            var edited = this.edited;
            var collection = this.collection;
            var editedCollectin = this.editCollection;
            var copiedCreated;
            var dataId;
            var enable;

            async.each(edited, function (el, cb) {
                var tr = $(el).closest('tr');
                var rowNumber = tr.find('[data-content="number"]').text();
                var id = tr.attr('data-id');
                var template = _.template(cancelEdit);
                var model;

                if (!id) {
                    return cb('Empty id');
                } else if (id.length < 24) {
                    tr.remove();
                    model = self.changedModels;

                    if (model) {
                        delete model[id];
                    }

                    return cb();
                }

                model = collection.get(id);
                model = model.toJSON();
                model.startNumber = rowNumber;
                enable = model && model.workflow.name !== 'Closed' ? true : false;
                tr.replaceWith(template({model: model, enable: enable}));
                cb();
            }, function (err) {
                if (!err) {
                    /*self.editCollection = new EditCollection(collection.toJSON());*/
                    self.bindingEventsToEditedCollection(self);
                    self.hideSaveCancelBtns();
                    self.copyEl.hide();
                }
            });

            if (this.createdCopied) {
                copiedCreated = this.$el.find('.false');
                // this.hideOvertime();
                copiedCreated.each(function () {
                    dataId = $(this).attr('data-id');
                    self.editCollection.remove(dataId);
                    delete self.changedModels[dataId];
                    $(this).remove();
                });

                this.createdCopied = false;
            }

            self.changedModels = {};
            self.responseObj['#jobs'] = [];
        },

        render: function () {
            var self = this;
            var $currentEl = this.$el;
            var pagenation;
            var checkedInputs;
            var allInputs;

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render());// added two parameters page and items number

            this.renderPagination($currentEl, this);

            $currentEl.append("<div id='timeRecivingDataFromServer'>Created in " + (new Date() - this.startTime) + " ms</div>");

            $('#checkAll').click(function () {
                var checkLength;

                allInputs = $('.listCB');
                allInputs.prop('checked', this.checked);
                checkedInputs = $('input.listCB:checked');

                if (self.collection.length > 0) {
                    checkLength = checkedInputs.length;

                    if (checkLength > 0) {
                        $('#top-bar-deleteBtn').show();
                        $('#top-bar-copyBtn').show();
                        $('#top-bar-createBtn').hide();

                        if (checkLength === self.collection.length) {
                            checkedInputs.each(function (index, element) {
                                self.checkProjectId(element, checkLength);
                            });

                            $('#checkAll').prop('checked', true);
                        }
                    } else {
                        $('#top-bar-deleteBtn').hide();
                        $('#top-bar-createBtn').show();
                        // self.genInvoiceEl.hide();
                        self.copyEl.hide();
                        $('#checkAll').prop('checked', false);
                    }
                }

                self.setAllTotalVals();
            });

            dataService.getData(CONSTANTS.URLS.PROJECTS_GET_FOR_WTRACK, {inProgress: true}, function (res) {
                self.responseObj['#project'] = res.data;
            });

            dataService.getData(CONSTANTS.URLS.EMPLOYEES_GETFORDD, {devDepartments: true}, function (employees) {
                employees = _.map(employees.data, function (employee) {
                    employee.name = employee.name.first + ' ' + employee.name.last;

                    return employee;
                });

                self.responseObj['#employee'] = employees;
            });

            dataService.getData(CONSTANTS.URLS.DEPARTMENTS_FORDD, {devDepartments: true}, function (departments) {
                departments = _.map(departments.data, function (department) {
                    department.name = department.name;

                    return department;
                });

                self.responseObj['#department'] = departments;
            });

            this.renderFilter();

            setTimeout(function () {
                /* self.editCollection = new EditCollection(self.collection.toJSON());
                 self.editCollection.on('saved', self.savedNewModel, self);
                 self.editCollection.on('updated', self.updatedOptions, self);*/
                self.bindingEventsToEditedCollection(self);
                self.$listTable = $('#listTable');
            }, 10);

            this.copyEl = $('#top-bar-copyBtn');
            this.$saveBtn = $('#top-bar-saveBtn');

            return this;
        }
    });

    return wTrackListView;
});
