define([
        'Underscore',
        'jQuery',
        'views/listViewBase',
        'text!templates/inventoryReport/list/ListHeader.html',
        'views/inventoryReport/list/ListItemView',
        'views/Filter/FilterView',
        'collections/inventoryReport/filterCollection',
        'constants',
        'helpers',
        'dataService',
        'common',
        'moment',
        'custom'
    ],

    function (_, $, listViewBase, listTemplate, ListItemView, filterView, contentCollection, CONSTANTS, helpers, dataService, common, moment, custom) {
        'use strict';

        var ListView = listViewBase.extend({
            listTemplate            : listTemplate,
            listItemView            : ListItemView,
            filterView              : filterView,
            contentCollection       : contentCollection,
            totalCollectionLengthUrl: '/journal/journalEntry/totalCollectionInventory/',
            contentType             : CONSTANTS.INVENTORYREPORT,

            initialize: function (options) {
                $(document).off("click");

                this.startTime = options.startTime;
                this.collection = options.collection;
                _.bind(this.collection.showMore, this.collection);
                this.defaultItemsNumber = this.collection.namberToShow || 100;
                this.newCollection = options.newCollection;
                this.page = options.collection.page;
                var dateRange = custom.retriveFromCash('inventoryReportDateRange');

                this.filter = options.filter || custom.retriveFromCash('inventoryReport.filter');

                if (!this.filter) {
                    this.filter = {};
                }

                if (!this.filter.startDate) {
                    this.filter.startDate = {
                        key  : 'startDate',
                        value: new Date(dateRange.startDate)
                    };
                    this.filter.endDate = {
                        key  : 'endDate',
                        value: new Date(dateRange.endDate)
                    };
                }

                this.startDate = new Date(this.filter.startDate.value);
                this.endDate = new Date(this.filter.endDate.value);

                this.render();

                custom.cacheToApp('inventoryReport.filter', this.filter);

                this.contentCollection = contentCollection;
                this.getTotalLength(null, this.defaultItemsNumber, this.filter);
            },

            changeDateRange: function () {
                var itemsNumber = $("#itemsNumber").text();
                var stDate = $('#startDate').val();
                var enDate = $('#endDate').val();

                this.startDate = new Date(stDate);
                this.endDate = new Date(enDate);

                if (!this.filter) {
                    this.filter = {};
                }

                this.filter.startDate = {
                    key  : 'startDate',
                    value: stDate
                };

                this.filter.endDate = {
                    key  : 'endDate',
                    value: enDate
                };

                var searchObject = {
                    page     : 1,
                    startDate: stDate,
                    endDate  : enDate,
                    filter   : this.filter
                };

                this.collection.showMore(searchObject);
                this.changeLocationHash(1, itemsNumber, this.filter);

                App.filter = this.filter;

                custom.cacheToApp('inventoryReport.filter', this.filter);
            },

            showFilteredPage: function (filter) {
                var itemsNumber = $("#itemsNumber").text();

                this.startTime = new Date();
                this.newCollection = false;

                this.filter = Object.keys(filter).length === 0 ? {} : filter;

                custom.cacheToApp('inventoryReport.filter', this.filter);

                this.changeLocationHash(1, itemsNumber, filter);
                this.collection.showMore({
                    count    : itemsNumber,
                    page     : 1,
                    filter   : filter,
                    startDate: this.startDate,
                    endDate  : this.endDate
                });
                this.getTotalLength(null, this.defaultItemsNumber, this.filter);
            },

            showMoreContent: function (newModels) {
                var holder = this.$el;
                var itemView;
                var page = holder.find("#currentShowPage").val();

                holder.find("#listTable").empty();

                itemView = new this.listItemView({
                    collection : newModels,
                    page       : page,
                    itemsNumber: this.defaultItemsNumber
                });

                holder.append(itemView.render());

                itemView.undelegateEvents();

                this.getTotalLength(null, this.defaultItemsNumber, this.filter);

                var pagination = holder.find('.pagination');
                if (newModels.length !== 0) {
                    pagination.show();
                } else {
                    pagination.hide();
                }
                $("#top-bar-deleteBtn").hide();
                $('#check_all').prop('checked', false);

                holder.find('#timeRecivingDataFromServer').remove();
                holder.append("<div id='timeRecivingDataFromServer'>Created in " + (new Date() - this.startTime) + " ms</div>");
            },

            calcTotal: function () {
                var $curEl = this.$el;
                var $rows = $curEl.find('#listTable tr').not('#listFooter');

                var total = 0;
                var columns = ['openingBalance', 'inwards', 'outwards', 'closingBalance'];

                columns.forEach(function (col) {
                    $rows.each(function (index, element) {
                        var $curElement = $(element);
                        var $val = $curElement.find('.' + col);

                        var val = parseInt($val.attr('data-amount'), 10);

                        total += val;
                    });

                    $curEl.find('#listFooter').find('#' + col + 'Total').text(helpers.currencySplitter(total.toFixed(2)));
                    return total;
                });


            },

            render: function () {
                var $currentEl;
                var itemView;

                $('.ui-dialog ').remove();

                $currentEl = this.$el;

                $currentEl.html('');
                $currentEl.append(_.template(listTemplate));
                itemView = new ListItemView({
                    collection : this.collection,
                    itemsNumber: this.collection.namberToShow
                });

                $currentEl.prepend(itemView.render());

                this.renderCheckboxes();

                this.renderFilter(this);

                this.renderPagination($currentEl, this);

                App.filter = this.filter;

                $currentEl.append("<div id='timeRecivingDataFromServer'>Created in " + (new Date() - this.startTime) + " ms</div>");
            }

        });

        return ListView;
    });
