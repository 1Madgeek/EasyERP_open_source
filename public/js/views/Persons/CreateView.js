define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/dialogViewBase',
    'text!templates/Persons/CreateTemplate.html',
    'views/CustomersSuppliers/salesPurchases',
    'models/PersonsModel',
    'common',
    'populate',
    'constants'
], function (Backbone, $, _, ParentView, CreateTemplate, SalesPurchasesView, PersonModel, common, populate, CONSTANTS) {
    'use strict';
    var CreateView = ParentView.extend({
        el         : '#content-holder',
        contentType: 'Persons',
        template   : _.template(CreateTemplate),
        imageSrc   : '',

        initialize: function (options) {
            this.mId = CONSTANTS.MID[this.contentType];

            _.bindAll(this, 'saveItem', 'render');
            this.model = new PersonModel();
            this.models = (options && options.model) ? options.model : null;
            this.responseObj = {};

            this.render();
        },

        events: {
            'mouseenter .avatar': 'showEdit',
            'mouseleave .avatar': 'hideEdit',
            'click .details'    : 'showDetailsBox'
        },

        chooseOption: function (e) {
            $(e.target).parents('dd').find('.current-selected').text($(e.target).text()).attr('data-id', $(e.target).attr('id'));

        },

        changeTab: function (e) {
            var $holder = $(e.target);
            var $dialogHolder = $('.dialog-tabs-items');
            var n;

            $holder.closest('.dialog-tabs').find('a.active').removeClass('active');
            $holder.addClass('active');
            n = $holder.parents('.dialog-tabs').find('li').index($holder.parent());
            $dialogHolder.find('.dialog-tabs-item.active').removeClass('active');
            $dialogHolder.find('.dialog-tabs-item').eq(n).addClass('active');
        },

        saveItem: function () {
            var self = this;
            var mid = this.mId;
            var thisEl = this.$el;

            var company = $('#companiesDd').data('id');
            var dateBirth = $('.dateBirth').val();
            var department = $('#departmentDd option:selected').val();

            var usersId = [];
            var groupsId = [];
            var whoCanRW;
            var data;
            var model;

            $('.groupsAndUser tr').each(function () {
                if ($(this).data('type') === 'targetUsers') {
                    usersId.push($(this).data('id'));
                }
                if ($(this).data('type') === 'targetGroups') {
                    groupsId.push($(this).data('id'));
                }

            });

            whoCanRW = this.$el.find('[name="whoCanRW"]:checked').val();

            data = {
                name: {
                    first: $.trim(thisEl.find('#firstName').val()),
                    last : $.trim(thisEl.find('#lastName').val())
                },

                imageSrc  : this.imageSrc,
                dateBirth : dateBirth,
                company   : company,
                department: department,
                address   : {
                    street : $.trim($('#addressInput').val()),
                    city   : $.trim($('#cityInput').val()),
                    state  : $.trim($('#stateInput').val()),
                    zip    : $.trim($('#zipInput').val()),
                    country: $.trim(this.$el.find('#countryInputCreate').val())
                },

                website    : $.trim($('#websiteInput').val()),
                jobPosition: $.trim($('#jobPositionInput').val()),
                skype      : $.trim($('#skype').val()),
                social     : {
                    LI: $.trim(thisEl.find('#LI').val()),
                    FB: $.trim(thisEl.find('#FB').val())
                },

                phones: {
                    phone : $.trim($('#phoneInput').val()),
                    mobile: $.trim($('#mobileInput').val()),
                    fax   : $.trim($('#faxInput').val())
                },

                email         : $.trim($('#emailInput').val()),
                salesPurchases: {
                    isCustomer   : thisEl.find('#isCustomer').is(':checked'),
                    isSupplier   : thisEl.find('#isSupplier').is(':checked'),
                    active       : thisEl.find('#active').is(':checked'),
                    implementedBy: thisEl.find('#implementedBy').data('id') || null,
                    salesPerson  : thisEl.find('#employeesDd').data('id') || null,
                    salesTeam    : thisEl.find('#departmentDd').data('id') || null,
                    reference    : thisEl.find('#reference').val(),
                    language     : thisEl.find('#language').text()
                },

                groups: {
                    owner: $('#allUsersSelect').data('id'),
                    users: usersId,
                    group: groupsId
                },

                whoCanRW: whoCanRW
            };

            model = new PersonModel();
            model.save(data, {
                headers: {
                    mid: mid
                },

                wait   : true,
                success: function () {
                    self.hideDialog();
                    Backbone.history.navigate('easyErp/Persons', {trigger: true});
                },

                error: function (model, xhr) {
                    self.errorNotification(xhr);
                }
            });
        },

        render: function () {
            var personModel = new PersonModel();
            var formString = this.template();
            var self = this;
            var salesPurchasesEl;

            var thisEl = this.$el = $(formString).dialog({
                closeOnEscape: false,
                autoOpen     : true,
                resizable    : true,
                dialogClass  : 'edit-dialog',
                title        : 'Edit Person',
                width        : '900px',
                position     : {within: $('#wrapper')},
                buttons      : [
                    {
                        id   : 'create-person-dialog',
                        text : 'Create',
                        click: function () {
                            self.saveItem();
                        }
                    },

                    {
                        text : 'Cancel',
                        click: function () {
                            self.hideDialog();
                        }
                    }]

            });
            salesPurchasesEl = thisEl.find('#salesPurchases-container');

            this.renderAssignees(personModel);

            salesPurchasesEl.append(
                new SalesPurchasesView({
                    parrent: self
                }).render().el
            );

            populate.getCompanies('#companiesDd', '/customers/getCompaniesForDd', {}, this, false, true, (this.models) ? this.models._id : null);
            common.canvasDraw({model: personModel.toJSON()}, this);
            this.$el.find('.dateBirth').datepicker({
                dateFormat : 'd M, yy',
                changeMonth: true,
                changeYear : true,
                yearRange  : '-100y:c+nn',
                maxDate    : '-18y',
                minDate    : null
            });
            this.delegateEvents(this.events);
            return this;
        }

    });

    return CreateView;
});
