module.exports = (function () {

    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var Schema = mongoose.Schema;
    var journalEntriesSchema = new Schema({
        date    : {type: Date, default: Date.now},
        type    : {type: String, default: ''},
        journal : {type: ObjectId, ref: 'journal', default: null, require: true},
        account : {type: ObjectId, ref: 'chartOfAccount', default: null},
        currency: {
            name: {type: String, default: 'USD'},
            rate: {type: Number, default: 1}
        },

        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },

        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date}
        },

        sourceDocument: {
            _id  : {type: ObjectId, default: null},
            model: {type: String, default: 'Invoice'},
            tCards: {type: Array, default: []}
        },

        debit : {type: Number, default: 0},
        credit: {type: Number, default: 0}
    });
    var tempJournalEntriesSchema = new Schema({
        date    : {type: Date, default: Date.now},
        type    : {type: String, default: ''},
        journal : {type: ObjectId},
        account : {type: ObjectId},
        currency: {
            name: String,
            rate: Number
        },

        createdBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date, default: Date.now}
        },

        editedBy: {
            user: {type: ObjectId, ref: 'Users', default: null},
            date: {type: Date}
        },

        sourceDocument: {
            _id  : {type: ObjectId, default: null},
            model: {type: String, default: 'Invoice'}
        },

        debit : {type: Number, default: 0},
        credit: {type: Number, default: 0}
    }, {collection: 'tempJournalEntries'});

    mongoose.model('journalEntry', journalEntriesSchema);
    mongoose.model('tempJournalEntry', tempJournalEntriesSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas.journalEntry = journalEntriesSchema;
    mongoose.Schemas.tempJournalEntry = tempJournalEntriesSchema;
})();
