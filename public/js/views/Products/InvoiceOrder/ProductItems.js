/**
 * Created by Roman on 27.04.2015.
 */
define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/Product/InvoiceOrder/ProductItems.html',
    'text!templates/Product/InvoiceOrder/ProductInputContent.html',
    'text!templates/Product/InvoiceOrder/ProductItemsEditList.html',
    'text!templates/Product/InvoiceOrder/ItemsEditList.html',
    'text!templates/Product/InvoiceOrder/TotalAmount.html',
    'collections/Products/products',
    'views/Projects/projectInfo/wTracks/generateWTrack',
    'populate',
    'helpers',
    'dataService',
    'constants',
    'helpers/keyValidator'
], function (Backbone,
             $,
             _,
             productItemTemplate,
             ProductInputContent,
             ProductItemsEditList,
             ItemsEditList,
             totalAmount,
             productCollection,
             GenerateWTrack,
             populate,
             helpers,
             dataService,
             CONSTANTS,
             keyValidator) {
    'use strict';
    var ProductItemTemplate = Backbone.View.extend({
        el: '#productItemsHolder',

        events: {
            'click .addProductItem a'                                                 : 'getProducts',
            'click .newSelectList li:not(.miniStylePagination)'                       : 'chooseOption',
            'click .newSelectList li.miniStylePagination'                             : 'notHide',
            'click .newSelectList li.miniStylePagination .next:not(.disabled)'        : 'nextSelect',
            'click .newSelectList li.miniStylePagination .prev:not(.disabled)'        : 'prevSelect',
            'click .current-selected.productsDd'                                      : 'showProductsSelect',
            'click .current-selected.jobs'                                            : 'showSelect',
            'mouseenter .editable:not(.quickEdit), .editable .no-long:not(.quickEdit)': 'quickEdit',
            'mouseleave .editable'                                                    : 'removeEdit',
            'click #cancelSpan'                                                       : 'cancelClick',
            'click #saveSpan'                                                         : 'saveClick',
            'click #editSpan'                                                         : 'editClick',
            'click .fa-trash-o'                                                       : 'deleteRow',
            'keyup td[data-name=price] input'                                         : 'priceChange',
            'keypress  .forNum'                                                       : 'keypressHandler'
        },

        template: _.template(productItemTemplate),

        initialize: function (options) {
            var products;

            this.responseObj = {};
            this.taxesRate = 0;

            if (options) {
                this.projectModel = options.projectModel;
                this.wTrackCollection = options.wTrackCollection;
                this.createJob = options.createJob;

                delete options.projectModel;
                delete options.wTrackCollection;
                delete options.createJob;
                delete options.visible;
            }

            if (options && options.editable) {
                this.editable = options.editable;
            }

            if (options && options.editablePrice) {
                this.editablePrice = options.editablePrice;
            }

            if (options && options.balanceVisible) {
                this.visible = options.balanceVisible;
            }

            this.forSales = options.service;

            products = new productCollection(options);
            products.bind('reset', function () {
                this.products = products;
                this.filterProductsForDD();
            }, this);

            this.priceChange = _.debounce(this.priceChange, 250);
        },

        generateJob: function () {
            var self = this;
            var model = this.projectModel;
            var projectsDdContainer = $('#projectDd');
            var projectId = $('#projectDd').attr('data-id');

            if (!model) {
                projectsDdContainer.css('color', 'red');

                App.render({
                    type   : 'error',
                    message: CONSTANTS.SELECTP_ROJECT
                });
            }

            if (projectId === model._id) {
                if (this.generatedView) {
                    this.generatedView.undelegateEvents();
                }

                this.generatedView = new GenerateWTrack({
                    model               : this.projectModel,
                    wTrackCollection    : this.wTrackCollection,
                    createJob           : true,
                    forQuotationGenerate: true,
                    quotationDialog     : this
                });
            } else {
                dataService.getData(CONSTANTS.URLS.PROJECTS_GET_FOR_WTRACK, {_id: projectId}, function (project) {
                    self.projectModel = project && project.data ? project.data[0] : {};

                    if (self.generatedView) {
                        self.generatedView.undelegateEvents();
                    }

                    self.generatedView = new GenerateWTrack({
                        model               : self.projectModel,
                        wTrackCollection    : self.wTrackCollection,
                        createJob           : true,
                        forQuotationGenerate: true,
                        quotationDialog     : self
                    });
                });
            }

            return false;
        },

        deleteRow: function (e) {

            var target = $(e.target);
            var tr = target.closest('tr');
            var jobId = tr.attr('data-id');
            var exJob = _.findWhere(this.responseObj['#jobs'], {_id: jobId});

            e.stopPropagation();
            e.preventDefault();
            if (this.responseObj['#jobs']) {
                this.responseObj['#jobs'].splice(_.indexOf(this.responseObj['#jobs'], exJob), 1);
            }

            tr.remove();
        },

        generatedWtracks: function () {
            var tr = this.$el.find('tr[data-error="true"]');
            var aEl = tr.find('a[data-id="jobs"]');

            // aEl.click();
        },

        keypressHandler: function (e) {
            return keyValidator(e, true);
        },

        checkForQuickEdit: function (el) {
            var tr = el.closest('tr');
            var quickEditing = tr.find('.quickEdit');

            return !quickEditing.length;
        },

        showSelect: function (e, prev, next) {
            var $targetEl = $(e.target);
            var self = this;
            var $thisEl = this.$el;
            var project = $('#projectDd').attr('data-id');
            var existedJobs = $thisEl.find('.jobs.current-selected[data-id!="jobs"]');

            if (!this.checkForQuickEdit($targetEl)) {
                return false;
            }

            e.preventDefault();

            if (project && project.length >= 24) {
                dataService.getData('/jobs/getForDD', {projectId: project}, function (jobs) {
                    var aEl;

                    self.responseObj['#jobs'] = jobs;
                    if (existedJobs.length) {
                        existedJobs.each(function () {
                            var jobId = $(this).attr('data-id');
                            var exJob = _.findWhere(self.responseObj['#jobs'], {_id: jobId});
                            self.responseObj['#jobs'].splice(_.indexOf(self.responseObj['#jobs'], exJob), 1);
                        });

                    } // to show only not selected jobs

                    if (!jobs.length) {
                        /* $("#jobs").text("Select");
                         $("#jobs").attr("data-id", null);*/
                        aEl = $thisEl.find('.current-selected.jobs[data-id="jobs"]'); // if other jobs are on page
                        if (!aEl.text()) {
                            aEl.text('Select');
                        }
                    }

                    if (!self.projectModel) {
                        dataService.getData(CONSTANTS.URLS.PROJECTS_GET_FOR_QUOTATION, {projectId: project}, function (project) {
                            self.projectModel = project;
                        });
                    }

                    populate.showSelect(e, prev, next, self);
                });
            }
        },

        getProducts: function (e) {

            var self = this;
            var target = $(e.target);
            var $parrent = target.closest('tbody');
            var $parrentRow = $parrent.find('.productItem').last();
            var rowId = $parrentRow.attr('data-id');
            var hasError = $parrentRow.attr('data-error') === 'true';
            var $trEll = $parrent.find('tr.productItem');
            var products = this.products ? this.products.toJSON() : [];
            var templ = _.template(ProductInputContent);
            var currency = {};

            e.preventDefault();
            e.stopPropagation();

            currency._id = $('#currencyDd').attr('data-id');

            if (rowId === undefined || /* rowId !== 'false'*/ !hasError) {
                if (!$trEll.length) {
                    return $parrent.prepend(templ({
                        forSales     : self.forSales,
                        products     : products,
                        currencyClass: helpers.currencyClass,
                        currency     : currency
                    }));
                }
                $($trEll[$trEll.length - 1]).after(templ({
                    forSales     : self.forSales,
                    products     : products,
                    currencyClass: helpers.currencyClass,
                    currency     : currency
                }));
            }

            return false;
        },

        filterProductsForDD: function () {
            var id = '.productsDd';
            var self = this;
            var products = this.products.toJSON();

            this.responseObj[id] = [];
            this.responseObj[id] = this.responseObj[id].concat(_.map(products, function (item) {
                return {_id: item._id, name: item.name, level: item.projectShortDesc || ''};
            }));

            //  $(id).text(this.responseObj[id][0].name).attr("data-id", this.responseObj[id][0]._id);

        },

        /* quickEdit: function (e) {
         var target = $(e.target);
         var trId = target.closest("tr");
         var tdId = target.closest("td");

         if (trId.find("#editSpan").length === 0) {
         tdId.append('<span id="editSpan" class=""><a href="javascript:;">e</a></span>');
         if (tdId.width() - 30 < tdId.find(".no-long").width()) {
         tdId.find(".no-long").width(tdId.width() - 40);
         }
         }
         },*/

        /* removeEdit: function (e) {
         $('#editSpan').remove();
         $("td .no-long").css({width: "auto"});
         },
         */

        priceChange: function (e) {
            var $targetEl = $(e.target);
            var parent = $targetEl.closest('td');
            var inputEl = parent.find('input');
            var val;
            if (!inputEl.length) {
                inputEl = parent.find('textarea');
            }
            val = inputEl.val();

            e.preventDefault();

            if (!val.length) {
                val = '0';
            }

            /* parent.removeClass('quickEdit').html('<span>' + val + '</span>');
             parent.removeClass('quickEdit').html('<span>' + helpers.currencySplitter(val) + '</span>');*/

            if (inputEl.hasClass('datepicker')) {
                parent.find('span').addClass('datepicker');
            }
            if (inputEl.hasClass('textarea')) {
                parent.find('span').addClass('textarea');
            }

            this.recalculateTaxes(parent);
        },

        /* cancelClick: function (e) {
         e.preventDefault();

         var text = this.text ? this.text : '';
         var $targetEl = $(e.target);
         var parent = $targetEl.closest('td');
         var inputEl = parent.find('input');

         if (!inputEl.length) {
         inputEl = parent.find('textarea');
         }
         if (this.prevQuickEdit) {
         if ($(this.prevQuickEdit).hasClass('quickEdit')) {
         $('.quickEdit').removeClass('quickEdit').html('<span>' + text + '</span>');
         }
         }
         if (inputEl.hasClass('datepicker')) {
         parent.find('span').addClass('datepicker');
         }
         if (inputEl.hasClass('textarea')) {
         parent.find('span').addClass('textarea');
         }

         },*/

        showProductsSelect: function (e, prev, next) {
            var $targetEl = $(e.target);

            if (!this.checkForQuickEdit($targetEl)) {
                return false;
            }

            populate.showProductsSelect(e, prev, next, this);

            return false;
        },

        chooseOption: function (e) {
            var self = this;
            var $target = $(e.target);
            var $parrent = $target.parents('td');
            var $trEl = $target.parents('tr');
            var $hoursContainer = $trEl.find('[data-name="quantity"] span');
            var $parrents = $trEl.find('td');
            var _id = $target.attr('id');
            var quantity = $hoursContainer.text() || 0;
            var salePrice = 0;
            var model;
            var taxes;
            var datePicker;
            var spanDatePicker;
            var total;
            var subtotal;
            var selectedProduct;
            var jobId;
            var currentJob;
            var product = $('.productsDd');
            var price;
            var currency = {};
            var classForParent;

            if (_id !== 'createJob') {

                if ($parrent.hasClass('jobs')) {
                    _id = product.attr('data-id');
                    jobId = $target.attr('id');

                    currentJob = _.find(self.responseObj['#jobs'], function (job) {
                        return job._id === jobId;
                    });

                    quantity = 1;

                    $parrent.find('.jobs').text($target.text()).attr('data-id', jobId);
                    $parrent.attr('data-content', jobId); // in case of getting id  on edit quotation
                    // $hoursContainer.text(currentJob.budget.budgetTotal.hoursSum);
                    $hoursContainer.text(1); // for quantity = 1

                    model = this.products.get(_id);

                } else {
                    model = this.products.get(_id);

                    $trEl.attr('data-id', model.id);
                    $parrent.find('.current-selected').text($target.text()).attr('data-id', _id);
                }

                selectedProduct = model ? model.toJSON() : null;

                if (currentJob && selectedProduct) {
                    selectedProduct.info.salePrice = 0;

                    this.taxesRate = 0;
                }

                if (!this.forSales && selectedProduct) {
                    $($parrents[1]).attr('class', 'editable').find('span').text(selectedProduct.info.description || '');
                }

                $($parrents[2]).find('.datepicker.notVisible').datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true
                }).datepicker('setDate', new Date());

                datePicker = $trEl.find('input.datepicker');
                spanDatePicker = $trEl.find('span.datepicker');
                $trEl.attr('data-error', null);

                spanDatePicker.text(datePicker.val());
                datePicker.remove();

                //  $($parrents[2]).attr('class', 'editable');
                $trEl.find('#editInput').val(salePrice); // changed on def 0
                /* if (currentJob && currentJob.budget) {
                 price = currentJob.budget.budgetTotal.revenueSum;
                 if (price) {
                 $trEl.find('[data-name="price"]').find('input').val(price);
                 } else {
                 $trEl.find('[data-name="price"]').find('input').val('0');
                 }
                 }*/
                /* if (selectedProduct && selectedProduct.name === CONSTANTS.IT_SERVICES) {
                 $($parrents[4]).attr('class', 'editable').find('span').text(salePrice);

                 this.recalculatePriceByJob();
                 } else {*/
                if (!this.forSales) {   // added possibility to edit quantity and scheduled date for Purchase Quotation
                    $($parrents[2]).addClass('editable');
                    /* $($parrents[3]).addClass('editable');*/ // in case of taken away Scheduled Date
                }

                salePrice = selectedProduct.info.salePrice;

                currency._id = $('#currencyDd').attr('data-id');
                classForParent = 'editable forNum ' + helpers.currencyClass(currency._id);

                $($parrents[4]).attr('class', classForParent).find('span').text(salePrice);
                total = parseFloat(selectedProduct.info.salePrice);
                taxes = total * this.taxesRate;
                subtotal = total + taxes;
                taxes = taxes.toFixed(2);
                subtotal = subtotal.toFixed(2);

                $($parrents[5]).text(taxes);
                $($parrents[6]).text(subtotal);

                $('.newSelectList').remove();

                this.calculateTotal(selectedProduct.info.salePrice);
                /* }*/
            } else if (_id === 'createJob') {
                self.generateJob();
            }
        },

        isNaN: function (val) {
            return isNaN(val) ? 0 : val;
        },

        /* recalculatePriceByJob: function () {
         var self = this;
         var $thisEl = this.$el;
         var $amountInput = $('#amountDd');
         var $totalAmountEl = $thisEl.find('#totalAmountContainer');

         var $totalUntaxContainer = $totalAmountEl.find('#totalUntaxes');
         var $taxesContainer = $totalAmountEl.find('#taxes');
         var $totalContainer = $totalAmountEl.find('#totalAmount');
         var $resultForCalculate = $thisEl.find('tr.productItem');

         var inputPrice = $amountInput.val() || 0;
         var totalUntax = 0;
         var totalHours = 0;
         var $currentEl;
         var quantity;
         var cost;
         var dates = [];
         var date;
         var taxes;
         var total;

         $resultForCalculate.each(function (index) {
         var $tr = $(this);
         var hours = $.trim($tr.find('[data-name="quantity"]').text()) || 0;

         hours = parseInt(hours);

         totalHours += hours;
         });

         $resultForCalculate.each(function (index) {
         var $tr = $(this);
         var hours = $.trim($tr.find('[data-name="quantity"]').text()) || 0;
         var $priceContainer = $tr.find('[data-name="price"]');
         var $subtotalContainer = $tr.find('td.subtotal');
         var $taxesContainer = $tr.find('td.taxes');
         var price = 0;

         $priceContainer.removeClass('editable');

         hours = parseInt(hours);

         price = (hours / totalHours) * inputPrice;
         price = self.isNaN(price);
         price = price.toFixed(2);

         $priceContainer.text(price);
         $subtotalContainer.text(price);
         $taxesContainer.text('0.00');
         });

         $totalUntaxContainer.text(inputPrice);
         $totalContainer.text(inputPrice);
         },*/

        quantityRetriver: function ($parent) {
            var selectedProduct = this.products || new Backbone.Collection();
            var id;
            var quantity;

            $parent = $parent.closest('tr');
            id = $parent.attr('data-id');

            selectedProduct = selectedProduct.get(id) || null;

            if (selectedProduct && selectedProduct.get('name') === CONSTANTS.IT_SERVICES) {
                quantity = 1;
            } else {
                quantity = $parent.find('[data-name="quantity"] span').text();
                quantity = parseFloat(quantity);
            }

            return quantity;
        },

        recalculateTaxes: function ($parent) {
            var quantity = this.quantityRetriver($parent);
            var total;
            var cost;
            var taxes;
            var subtotal;

            $parent = $parent.closest('tr');

            cost = $parent.find('[data-name="price"] input').val();
            cost = parseFloat(helpers.spaceReplacer(cost));

            total = quantity * cost;
            taxes = total * this.taxesRate;
            subtotal = total + taxes;

            taxes = taxes.toFixed(2);
            $parent.find('.taxes').text(taxes);

            subtotal = subtotal.toFixed(2);
            $parent.find('.subtotal').text(helpers.currencySplitter(subtotal));

            this.calculateTotal();
        },

        calculateTotal: function () {
            var thisEl = this.$el;

            var totalUntaxContainer = thisEl.find('#totalUntaxes');
            var taxesContainer = thisEl.find('#taxes');
            var totalContainer = thisEl.find('#totalAmount');
            var balanceContainer = thisEl.find('#balance');
            var resultForCalculate = thisEl.find('tr.productItem');

            var totalUntax = 0;
            var totalEls = resultForCalculate.length;
            var $currentEl;
            var quantity;
            var cost;
            var balance;
            var taxes;
            var total;
            var date;
            var dates = [];
            var i;

            if (totalEls) {
                for (i = totalEls - 1; i >= 0; i--) {
                    $currentEl = $(resultForCalculate[i]);
                    //  quantity = $currentEl.find('[data-name="quantity"]').text();
                    cost = $currentEl.find('[data-name="price"] input').val() || '0';
                    quantity = this.quantityRetriver($currentEl);
                    cost = helpers.spaceReplacer(cost);
                    totalUntax += parseFloat(cost);
                    date = $currentEl.find('.datepicker').text();
                    dates.push(date);
                }
            }

            totalUntax = totalUntax.toFixed(2);
            totalUntaxContainer.text(helpers.currencySplitter(totalUntax));
            totalUntax = parseFloat(helpers.spaceReplacer(totalUntax));

            taxes = totalUntax * this.taxesRate;
            taxes = taxes.toFixed(2);
            taxesContainer.text(helpers.currencySplitter(taxes));
            taxes = parseFloat(helpers.spaceReplacer(taxes));

            total = totalUntax + taxes;
            balance = total - this.paid;
            total = total.toFixed(2);
            balance = balance.toFixed(2);

            totalContainer.text(helpers.currencySplitter(total));

            balanceContainer.text(helpers.currencySplitter(balance));

            date = helpers.minFromDates(dates);
            thisEl.find('#minScheduleDate span').text(date);
        },

        nextSelect: function (e) {
            this.showProductsSelect(e, false, true);
        },

        prevSelect: function (e) {
            this.showProductsSelect(e, true, false);
        },

        render: function (options) {
            var productsContainer;
            var totalAmountContainer;
            var $thisEl = this.$el;
            var products;
            var self = this;
            var currency;

            if (options && options.model) {
                products = options.model.products;
                currency = options.model.currency;

                $thisEl.html(_.template(ProductItemsEditList, {model: options.model, forSales: self.forSales}));

                if (products) {
                    productsContainer = $thisEl.find('#productList');
                    productsContainer.append(_.template(ItemsEditList, {
                        products        : products,
                        editable        : this.editable,
                        editablePrice   : this.editablePrice,
                        forSales        : self.forSales,
                        currencySplitter: helpers.currencySplitter,
                        currencyClass   : helpers.currencyClass,
                        currency        : currency
                    }));
                    totalAmountContainer = $thisEl.find('#totalAmountContainer');
                    totalAmountContainer.append(_.template(totalAmount, {
                        model           : options.model,
                        balanceVisible  : this.visible,
                        currencySplitter: helpers.currencySplitter,
                        currencyClass   : helpers.currencyClass
                    }));
                }
            } else {
                this.$el.html(this.template({forSales: self.forSales}));
                totalAmountContainer = $thisEl.find('#totalAmountContainer');
                totalAmountContainer.append(_.template(totalAmount, {
                    model           : null,
                    balanceVisible  : this.visible,
                    currencySplitter: helpers.currencySplitter,
                    currencyClass   : helpers.currencyClass
                }));
            }

            return this;
        }
    });

    return ProductItemTemplate;
});
