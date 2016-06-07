define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/listViewBase',
    'text!templates/Holiday/list/ListHeader.html',
    'text!templates/Holiday/list/cancelEdit.html',
    'views/Holiday/CreateView',
    'views/Holiday/list/ListItemView',
    'models/HolidayModel',
    'collections/Holiday/filterCollection',
    'collections/Holiday/editCollection',
    'dataService',
    'constants',
    'async',
    'moment'
], function (Backbone,
             $,
             _,
             ListViewBase,
             listTemplate,
             cancelEdit,
             CreateView,
             ListItemView,
             HolidayModel,
             contentCollection,
             EditCollection,
             dataService,
             CONSTANTS,
             async,
             moment) {
    'use strict';

    var HolidayListView = ListViewBase.extend({
        page                    : null,
        sort                    : null,
        createView              : CreateView,
        listTemplate            : listTemplate,
        listItemView            : ListItemView,
        contentType             : CONSTANTS.HOLIDAY, // needs in view.prototype.changeLocationHash
        changedModels           : {},
        totalCollectionLengthUrl: '/holiday/totalCollectionLength',
        holidayId               : null,
        editCollection          : null,

        initialize: function (options) {
            $(document).off('click');

            this.CreateView = CreateView;

            this.startTime = options.startTime;
            this.collection = options.collection;
            this.parrentContentId = options.collection.parrentContentId;
            this.sort = options.sort;
            this.filter = options.filter;
            this.page = options.collection.currentPage;
            this.contentCollection = contentCollection;

            this.render();
        },

        events: {
            'click .checkbox'      : 'checked',
            'click td.editable'    : 'editRow',
            'click .oe_sortable'   : 'goSort',
            'change .editable '    : 'setEditable',
            'keydown input.editing': 'setChanges'
        },

        setChanges: function (e) {
            if (e.which === 13) {
                this.setChangedValueToModel();
            }
        },

        savedNewModel: function (modelObject) {
            var savedRow = this.$listTable.find('#false');
            var modelId;
            var checkbox = savedRow.find('input[type=checkbox]');
            var editedEl = savedRow.find('.editing');
            var editedCol = editedEl.closest('td');

            modelObject = modelObject.success;

            if (modelObject) {
                modelId = modelObject._id;
                savedRow.attr('data-id', modelId);
                checkbox.val(modelId);
                savedRow.removeAttr('id');
            }

            this.hideSaveCancelBtns();
            editedCol.text(editedEl.val());
            editedEl.remove();
            this.resetCollection(modelObject);
        },

        resetCollection: function (model) {
            if (model && model._id) {
                model = new HolidayModel(model);
                this.collection.add(model);
            } else {
                this.collection.set(this.editCollection.models, {remove: false});
            }
        },

        updatedOptions: function () {
            var savedRow = this.$listTable.find('#false');
            var editedEl = savedRow.find('.editing');
            var editedCol = editedEl.closest('td');

            this.hideSaveCancelBtns();

            editedCol.text(editedEl.val());
            editedEl.remove();

            this.resetCollection();
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

        saveItem: function () {
            var self = this;
            var model;
            var modelJSON;
            var date;
            var id;
            var errors = this.$el.find('.errorContent');
            var keys = Object.keys(this.changedModels);

            var filled = true;

            $('.editable').each(function (index, elem) {
                if (!$(elem).html()) {
                    filled = false;
                    return false;
                }
            });

            if (!filled) {
                return App.render({type: 'error', message: 'Fill all fields please'});
            }

            this.setChangedValueToModel();

            keys.forEach(function (id) {
                model = self.editCollection.get(id) || self.collection.get(id);
                modelJSON = model.toJSON();
                date = new Date(modelJSON.date);
                model.changed = self.changedModels[id];
                if (!self.changedModels[id].date) {
                    model.changed.date = date;
                }
                model.changed.year = moment(date).isoWeekYear();
                model.changed.week = moment(date).isoWeek();
            });

            if (errors.length) {
                return;
            }
            this.editCollection.save();

            keys.forEach(function (id) {
                delete self.changedModels[id];
                self.editCollection.remove(id);
            });
        },

        setChangedValueToModel: function () {
            var editedElement = this.$listTable.find('.editing');
            var editedCol;
            var editedElementRowId;
            var editedElementContent;
            var editedElementValue;
            var editModel;
            var editValue;

            if (editedElement.length) {
                editedCol = editedElement.closest('td');
                editedElementRowId = editedElement.closest('tr').data('id');
                editedElementContent = editedCol.data('content');
                editedElementValue = editedElement.val();

                if (editedElementRowId.length >= 24) {
                    editModel = this.collection.get(editedElementRowId) || this.editCollection.get(editedElementRowId);
                    editValue = editModel.get(editedElementContent);

                    if (editedElementValue !== editValue) {
                        if (!this.changedModels[editedElementRowId]) {
                            this.changedModels[editedElementRowId] = {};
                        }
                        this.changedModels[editedElementRowId][editedElementContent] = editedElementValue;
                    }
                } else {
                    if (!this.changedModels[editedElementRowId]) {
                        this.changedModels[editedElementRowId] = {};
                    }
                    this.changedModels[editedElementRowId][editedElementContent] = editedElementValue;
                }
                editedCol.text(editedElementValue);
                editedElement.remove();
            }
        },

        editRow: function (e) {
            var el = $(e.target);
            var tr = $(e.target).closest('tr');
            var holidayId = tr.data('id');
            var colType = el.data('type');
            var isDTPicker = colType !== 'input' && el.prop('tagName') !== 'INPUT';
            var tempContainer;
            var width;

            if (holidayId && el.prop('tagName') !== 'INPUT') {
                if (this.holidayId) {
                    this.setChangedValueToModel();
                }
                this.holidayId = holidayId;
            }

            if (isDTPicker) {
                tempContainer = (el.text()).trim();
                el.html('<input class="editing" type="text" value="' + tempContainer + '"  maxLength="255">');
                this.$el.find('.editing').datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true
                });
            } else {
                tempContainer = el.text();
                width = el.width() - 6;
                el.html('<input class="editing" type="text" value="' + tempContainer + '"  maxLength="255" style="width:' + width + 'px">');
            }

            return false;
        },

        setEditable: function (td) {
            if (!td.parents) {
                td = $(td.target);
            }

            td = td.closest('td');  // in case of no changing cancel after enter on input

            td.addClass('edited');

            if (this.isEditRows()) {
                // this.setChangedValueToModel(); in case of recursion
                this.setChangedValue();
            }

            return false;
        },

        setChangedValue: function () {
            if (!this.changed) {
                this.changed = true;
                this.showSaveCancelBtns();
            }
        },

        isEditRows: function () {
            var edited = this.$listTable.find('.edited');

            this.edited = edited;

            return !!edited.length;
        },

        showSaveCancelBtns: function () {
            var createBtnEl = $('#top-bar-createBtn');
            var saveBtnEl = $('#top-bar-saveBtn');
            var cancelBtnEl = $('#top-bar-deleteBtn');

            if (!this.changed) {
                createBtnEl.hide();
            }
            saveBtnEl.show();
            cancelBtnEl.show();

            return false;
        },

        render: function () {
            var self = this;
            var $currentEl = this.$el;
            $('.ui-dialog ').remove();

            $currentEl.html('');
            $currentEl.append(_.template(listTemplate));
            $currentEl.append(new ListItemView({
                collection : this.collection,
                page       : this.page,
                itemsNumber: this.collection.namberToShow
            }).render()); // added two parameters page and items number

            setTimeout(function () {
                self.editCollection = new EditCollection(self.collection.toJSON());
                self.editCollection.on('saved', self.savedNewModel, self);

                self.editCollection.on('updated', self.updatedOptions, self);

                self.$listTable = $('#listTable');
            }, 10);

            this.renderCheckboxes();

            this.renderPagination($currentEl, this);

            $currentEl.append('<div id="timeRecivingDataFromServer">Created in ' + (new Date() - this.startTime) + ' ms</div>');
        },

        renderContent: function () {
            var $currentEl = this.$el;
            var tBody = $currentEl.find('#listTable');
            var itemView = new ListItemView({
                collection : this.collection,
                page       : $currentEl.find('#currentShowPage').val(),
                itemsNumber: $currentEl.find('span#itemsNumber').text()
            });
            var pagenation = this.$el.find('.pagination');

            $('#checkAll').prop('checked', false);
            tBody.empty();

            tBody.append(itemView.render());
            if (this.collection.length === 0) {
                pagenation.hide();
            } else {
                pagenation.show();
            }
        },

        createItem: function () {
            var now = new Date();
            var startData = {
                date: now
            };

            var model = new HolidayModel(startData, {parse: true});

            startData._id = model.cid;

            if (!this.isNewRow()) {
                this.showSaveCancelBtns();
                this.editCollection.add(model);

                new CreateView(startData);
            }

            this.changed = true;
        },

        isNewRow: function () {
            var newRow = $('#false');

            return !!newRow.length;
        },

        deleteItemsRender: function (deleteCounter, deletePage) {
            var pagenation;
            var holder;
            var created;

            dataService.getData(this.collectionLengthUrl, {
                filter       : this.filter,
                newCollection: this.newCollection
            }, function (response, context) {
                context.listLength = response.count || 0;
            }, this);
            this.deleteRender(deleteCounter, deletePage, {
                filter          : this.filter,
                newCollection   : this.newCollection,
                parrentContentId: this.parrentContentId
            });

            holder = this.$el;

            if (deleteCounter !== this.collectionLength) {
                created = holder.find('#timeRecivingDataFromServer');
                created.before(new ListItemView({
                    collection : this.collection,
                    page       : holder.find('#currentShowPage').val(),
                    itemsNumber: holder.find('span#itemsNumber').text()
                }).render()); // added two parameters page and items number
            }

            pagenation = this.$el.find('.pagination');

            if (this.collection.length === 0) {
                pagenation.hide();
            } else {
                pagenation.show();
            }

            this.editCollection.reset(this.collection.models);
        },

        triggerDeleteItemsRender: function (deleteCounter) {
            this.deleteCounter = deleteCounter;
            this.deletePage = $('#currentShowPage').val();
            this.deleteItemsRender(deleteCounter, this.deletePage);
        },

        deleteItems: function () {
            var that = this;
            var mid = 39;
            var model;
            var localCounter = 0;
            var listTableChecked = $('#listTable input:checked');
            var count = listTableChecked.length;
            var value;

            this.collectionLength = this.collection.length;

            if (!this.changed) {

                $.each(listTableChecked, function (index, checkbox) {
                    value = checkbox.value;
                    that.changedModels = {};

                    if (value.length < 24) {
                        that.editCollection.remove(value);
                        that.editCollection.on('remove', function () {
                            this.listLength--;
                            localCounter++;

                            if (index === count - 1) {
                                that.triggerDeleteItemsRender(localCounter);
                            }

                        }, that);
                    } else {
                        model = that.collection.get(value);
                        model.destroy({
                            headers: {
                                mid: mid
                            },
                            wait   : true,
                            success: function () {
                                that.listLength--;
                                localCounter++;

                                if (index === count - 1) {
                                    that.triggerDeleteItemsRender(localCounter);
                                }
                            },

                            error: function (model, res) {
                                if (res.status === 403 && index === 0) {
                                    App.render({
                                        type   : 'error',
                                        message: 'You do not have permission to perform this action'
                                    });
                                }
                                that.listLength--;
                                localCounter++;
                                if (index === count - 1) {
                                    if (index === count - 1) {
                                        that.triggerDeleteItemsRender(localCounter);
                                    }
                                }

                            }
                        });
                    }
                });
            } else {
                this.cancelChanges();
            }
        },

        cancelChanges: function () {
            var self = this;
            var edited = this.edited;
            var collection = this.collection;
            var copiedCreated;
            var dataId;

            async.each(edited, function (el, cb) {
                var tr = $(el).closest('tr');
                var trId = tr.attr('id');
                var rowNumber = tr.find('[data-content="number"]').text();
                var id = tr.data('id');
                var template = _.template(cancelEdit);
                var model;

                if (!id || (id.length < 24)) {
                    self.hideSaveCancelBtns();
                    return cb('Empty id');
                }

                model = collection.get(id);
                model = model.toJSON();
                model.index = rowNumber;
                if (!trId) {
                    tr.replaceWith(template({holiday: model}));
                } else {
                    tr.remove();
                }
                cb();
            }, function (err) {
                if (!err) {
                    self.hideSaveCancelBtns();
                    if (!err) {
                        self.editCollection = new EditCollection(collection.toJSON());
                        self.editCollection.on('saved', self.savedNewModel, self);
                        self.editCollection.on('updated', self.updatedOptions, self);
                    }
                }
            });

            copiedCreated = this.$el.find('#false');
            dataId = copiedCreated.attr('data-id');
            this.editCollection.remove(dataId);
            delete this.changedModels[dataId];
            copiedCreated.remove();

            this.createdCopied = false;

            self.changedModels = {};
        }

    });

    return HolidayListView;
});
