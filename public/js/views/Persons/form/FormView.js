define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/Persons/form/FormTemplate.html',
    'views/Persons/EditView',
    'views/Opportunities/compactContent',
    'views/Notes/NoteView',
    'views/Notes/AttachView',
    'views/Opportunities/CreateView',
    'common',
    'constants'
], function (Backbone,
             $,
             _,
             personFormTemplate,
             EditView,
             OpportunitiesCompactContentView,
             NoteView,
             AttachView,
             CreateViewOpportunities,
             common,
             CONSTANTS) {
    'use strict';

    var personTasksView = Backbone.View.extend({
        el: '#content-holder',

        events: {
            'click .checkbox'                                                         : 'checked',
            'click .person-checkbox:not(.disabled)'                                   : 'personsSalesChecked',
            'click .details'                                                          : 'toggle',
            'click .company'                                                          : 'gotoCompanyForm',
            'mouseenter .editable:not(.quickEdit), .editable .no-long:not(.quickEdit)': 'quickEdit',
            'mouseleave .editable'                                                    : 'removeEdit',
            'click #editSpan'                                                         : 'editClick',
            'click #cancelSpan'                                                       : 'cancelClick',
            'click #saveSpan'                                                         : 'saveClick',
            'click .btnHolder .add.opportunities'                                     : 'addOpportunities',
            'change .sale-purchase input'                                             : 'saveCheckboxChange',
            'click .miniPagination .next:not(.not-active)'                            : 'nextMiniPage',
            'click .miniPagination .prev:not(.not-active)'                            : 'prevMiniPage',
            'click .miniPagination .first:not(.not-active)'                           : 'firstMiniPage',
            'click .miniPagination .last:not(.not-active)'                            : 'lastMiniPage'
        },

        initialize: function (options) {
            var self = this;
            var formModel;
            var $thisEl = this.$el;

            this.mId = CONSTANTS.MID[this.contentType];
            this.formModel = options.model;
            this.formModel.on('change', this.render, this);
            this.formModel.urlRoot = '/Persons';
            this.pageMini = 1;
            this.pageCount = 4;
            this.allMiniOpp = 0;
            this.allPages = 2;

            formModel = this.formModel.toJSON();

            common.populateOpportunitiesForMiniView('/opportunities/OpportunitiesForMiniView', formModel._id, formModel.company ? formModel.company._id : null, this.pageMini, this.pageCount, true, function (opps) {
                self.allMiniOpp = opps.listLength;
                self.allPages = Math.ceil(self.allMiniOpp / self.pageCount);

                if (self.allPages === self.pageMini) {
                    $thisEl.find('.miniPagination .next').addClass('not-active');
                    $thisEl.find('.miniPagination .last').addClass('not-active');
                }

                if (self.allPages === 1 || self.allPages === 0) {
                    $thisEl.find('.miniPagination').hide();
                }
            });
        },

        nextMiniPage: function () {
            this.pageMini += 1;
            this.renderMiniOpp();
        },
        prevMiniPage: function () {
            this.pageMini -= 1;
            this.renderMiniOpp();
        },

        firstMiniPage: function () {
            this.pageMini = 1;
            this.renderMiniOpp();
        },

        lastMiniPage: function () {
            this.pageMini = this.allPages;
            this.renderMiniOpp();
        },

        renderMiniOpp: function () {
            var self = this;
            var formModel = this.formModel.toJSON();

            common.populateOpportunitiesForMiniView('/opportunities/OpportunitiesForMiniView', formModel._id, formModel.company ? formModel.company._id : null, this.pageMini, this.pageCount, false, function (collection) {
                var oppElem = self.$el.find('#opportunities');
                var isLast = self.pageMini === self.allPages;

                oppElem.empty();

                oppElem.append(
                    new OpportunitiesCompactContentView({
                        collection: collection.data
                    }).render({first: self.pageMini === 1, last: isLast, all: self.allPages}).el
                );
            });
        },

        addOpportunities: function (e) {
            var model;

            e.preventDefault();

            model = this.formModel.toJSON();
            new CreateViewOpportunities({
                model    : model,
                elementId: 'personAttach'
            });
        },

        quickEdit: function (e) {
            var trId = $(e.target).closest('dd');
            var $thisEl = this.$el;

            if ($thisEl.find('#' + trId.attr('id')).find('#editSpan').length === 0) {
                $thisEl.find('#' + trId.attr('id')).append('<span id="editSpan" class=""><a href="#">e</a></span>');
                if ($thisEl.find('#' + trId.attr('id')).width() - 30 < $thisEl.find('#' + trId.attr('id')).find('.no-long').width()) {
                    $thisEl.find('#' + trId.attr('id')).find('.no-long').width($thisEl.find('#' + trId.attr('id')).width() - 30);
                }
            }
        },

        removeEdit: function () {
            var $thisEl = this.$el;
            $thisEl.find('#editSpan').remove();
            $thisEl.find('dd .no-long').css({width: 'auto'});
        },

        cancelClick: function (e) {
            e.preventDefault();

            Backbone.history.fragment = '';
            Backbone.history.navigate('#easyErp/Persons/form/' + this.formModel.id, {trigger: true});
        },

        editClick: function (e) {
            var maxlength = $('#' + $(e.target).parent().parent()[0].id).find('.no-long').attr('data-maxlength') || 32;
            var $thisEl = this.$el;
            var parent;
            var objIndex;

            e.preventDefault();
            $thisEl.find('.quickEdit #editInput').remove();
            $thisEl.find('.quickEdit #cancelSpan').remove();
            $thisEl.find('.quickEdit #saveSpan').remove();

            if (this.prevQuickEdit) {
                if ($thisEl.find('#' + this.prevQuickEdit.id).hasClass('quickEdit')) {
                    if ($thisEl.find('#' + this.prevQuickEdit.id).hasClass('with-checkbox')) {
                        $thisEl.find('#' + this.prevQuickEdit.id + ' input').prop('disabled', true).prop('checked', ($thisEl.find('#' + this.prevQuickEdit.id + ' input').prop('checked') ? 'checked' : ''));
                        $thisEl.find('.quickEdit').removeClass('quickEdit');
                    } else if (this.prevQuickEdit.id === 'email') {
                        $thisEl.find('#' + this.prevQuickEdit.id).append('<a href="mailto:' + this.text + '">' + this.text + '</a>');
                        $thisEl.find('.quickEdit').removeClass('quickEdit');
                    } else {
                        $thisEl.find('.quickEdit').text(this.text || '').removeClass('quickEdit');
                    }
                }
            }

            parent = $(e.target).parent().parent();
            $thisEl.find('#' + parent[0].id).addClass('quickEdit');
            $thisEl.find('#editSpan').remove();
            objIndex = parent[0].id.split('_');

            if (objIndex.length > 1) {
                this.text = this.formModel.get(objIndex[0])[objIndex[1]];
            } else {
                this.text = this.formModel.get(objIndex[0]);
            }

            if (parent[0].id === 'dateBirth') {
                $thisEl.find('#' + parent[0].id).text('');
                $thisEl.find('#' + parent[0].id).append('<input id="editInput" maxlength="48" type="text" readonly class="left has-datepicker"/>');
                $thisEl.find('.has-datepicker').datepicker({
                    dateFormat : 'd M, yy',
                    changeMonth: true,
                    changeYear : true,
                    yearRange  : '-100y:c+nn',
                    maxDate    : '-18y',
                    minDate    : null
                });
            } else if ($thisEl.find('#' + parent[0].id).hasClass('with-checkbox')) {
                $thisEl.find('#' + parent[0].id + ' input').removeAttr('disabled');
            } else {
                $thisEl.find('#' + parent[0].id).text('');
                $thisEl.find('#' + parent[0].id).append('<input id="editInput" maxlength="' + maxlength + '" type="text" class="left"/>');
            }

            $thisEl.find('#editInput').val(this.text);
            this.prevQuickEdit = parent[0];
            $thisEl.find('#' + parent[0].id).append('<span id="saveSpan"><a href="#">c</a></span>');
            $thisEl.find('#' + parent[0].id).append('<span id="cancelSpan"><a href="#">x</a></span>');
            $thisEl.find('#' + parent[0].id).find('#editInput').width($thisEl.find('#' + parent[0].id).find('#editInput').width() - 50);
        },

        saveCheckboxChange: function (e) {
            var parent = $(e.target).parent();
            var objIndex = parent[0].id.replace('_', '.');
            var currentModel = this.model;

            currentModel[objIndex] = ($('#' + parent[0].id + ' input').prop('checked'));
            this.formModel.save(currentModel, {
                headers: {
                    mid: this.mId
                },

                patch: true
            });
        },

        saveClick: function (e) {
            var parent = $(e.target).parent().parent();
            var objIndex = parent[0].id.split('_'); // replace change to split;
            var currentModel = this.model;
            var newModel = {};
            var oldvalue = {};
            var param;
            var valid;
            var i;

            e.preventDefault();

            if (objIndex.length > 1) {
                for (i in this.formModel.toJSON()[objIndex[0]]) {
                    oldvalue[i] = this.formModel.toJSON()[objIndex[0]][i];

                }

                param = currentModel.get(objIndex[0]) || {};
                param[objIndex[1]] = $('#editInput').val();
                newModel[objIndex[0]] = param;
            } else {
                oldvalue = this.formModel.toJSON()[objIndex[0]];
                newModel[objIndex[0]] = $('#editInput').val();
            }

            valid = this.formModel.save(newModel, {
                headers: {
                    mid: this.mId
                },

                patch  : true,
                success: function (model) {
                    Backbone.history.fragment = '';
                    Backbone.history.navigate('#easyErp/Persons/form/' + model.id, {trigger: true});
                },

                error: function (model, response) {
                    if (response) {
                        App.render({
                            type   : 'error',
                            message: response.error
                        });
                    }
                }
            });

            if (!valid) {
                newModel[objIndex[0]] = oldvalue;
                this.formModel.set(newModel);
            }
        },

        personsSalesChecked: function (e) {
            if ($(e.target).get(0).tagName.toLowerCase() === 'span') {
                $(e.target).parent().toggleClass('active');
            } else {
                $(e.target).toggleClass('active');
            }
        },

        gotoCompanyForm: function (e) {
            var id = $(e.target).closest('a').attr('data-id');

            e.preventDefault();
            window.location.hash = '#easyErp/Companies/form/' + id;
        },

        toggle: function () {
            this.$('#details').animate({
                height: 'toggle'
            }, 250, function () {

            });
        },

        render: function () {
            var formModel = this.formModel.toJSON();
            var $thisEl = this.$el;

            $thisEl.html(_.template(personFormTemplate, formModel));
            this.renderMiniOpp();
            $thisEl.find('.formLeftColumn').append(
                new NoteView({
                    model: this.formModel
                }).render().el
            );
            $thisEl.find('.formLeftColumn').append(
                new AttachView({
                    model      : this.formModel,
                    contentType: 'Persons'
                }).render().el
            );
            $(window).on('resize', function () {
                $('#editInput').width($('#editInput').parent().width() - 55);

            });
            return this;
        },

        editItem: function () {
            // create editView in dialog here
            new EditView({model: this.formModel});
        },

        deleteItems: function () {
            var mid = this.mId;
            var answer;

            answer = confirm('Really DELETE item ?!');

            if (answer === false) {
                return false;
            }
            
            this.formModel.destroy({
                headers: {
                    mid: mid
                },

                success: function () {
                    Backbone.history.navigate('#easyErp/Persons/thumbnails', {trigger: true});

                },

                error: function (model, err) {
                    if (err.status === 403) {
                        App.render({
                            type   : 'error',
                            message: 'You do not have permission to perform this action'
                        });
                    }
                }
            });
        }
    });

    return personTasksView;
});
