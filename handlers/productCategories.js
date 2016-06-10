var mongoose = require('mongoose');
var Categories = function (models, event) {
    var CategorySchema = mongoose.Schemas.ProductCategory;
    var objectId = mongoose.Types.ObjectId;
    var MAINCONSTANTS = require('../constants/mainConstants');

    this.getExpenses = function (req, res, next) {
        var ProductCategory = models.get(req.session.lastDb, 'ProductCategory', CategorySchema);

        var parentId = MAINCONSTANTS.EXPENSESCAREGORY;

        ProductCategory
            .find({parent: objectId(parentId)})
            .sort({fullName: 1, nestingLevel: 1, sequence: 1})
            .populate('parent')
            .exec(function (err, categories) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(categories);
            });

    };

    function getById(req, res, next) {
        var ProductCategory = models.get(req.session.lastDb, 'ProductCategory', CategorySchema);
        var id = req.query.id;

        if (id && id.length < 24) {
            return res.status(400).send();
        }

        ProductCategory
            .findById(id)
            .populate('parent')
            .exec(function (err, category) {
                if (err) {
                    return next(err);
                }
                res.status(200).send(category);
            });
    }

    this.getForDd = function (req, res, next) {
        var ProductCategory = models.get(req.session.lastDb, 'ProductCategory', CategorySchema);

        if (req.query.id) {
            return getById(req, res, next);
        }

        ProductCategory
            .find()
            .sort({fullName: 1, nestingLevel: 1, sequence: 1})
            .populate('parent')
            .exec(function (err, categories) {
                if (err) {
                    return next(err);
                }
                res.status(200).send({data: categories});
            });
    };

    this.getById = function (req, res, next) {
        getById(req, res, next);
    };

    this.create = function (req, res, next) {
        var ProductCategory = models.get(req.session.lastDb, 'ProductCategory', CategorySchema);
        var body = req.body;
        var category;

        if (!Object.keys(body).length) {
            return res.status(400).send();
        }

        body.createdBy = {
            user: req.session.uId
        };
        body.editedBy = {
            user: req.session.uId
        };

        category = new ProductCategory(body);

        category.save(function (err, category) {
            if (err) {
                return next(err);
            }

            res.status(200).send(category);
        });
    };

    function updateNestingLevel(req, id, nestingLevel, callback) {
        var ProductCategory = models.get(req.session.lastDb, 'ProductCategory', CategorySchema);

        ProductCategory.find({parent: id}).exec(function (err, result) {
            var n = 0;
            if (result.length !== 0) {
                result.forEach(function (item) {
                    n++;

                    ProductCategory.findByIdAndUpdate(item._id, {nestingLevel: nestingLevel + 1}, {new: true}, function (err, res) {
                        if (result.length === n) {
                            updateNestingLevel(req, res._id, res.nestingLevel + 1, function () {
                                callback();
                            });
                        } else {
                            updateNestingLevel(req, res._id, res.nestingLevel + 1);
                        }
                    });
                });
            } else {
                if (callback) {
                    callback();
                }
            }
        });
    }

    function updateSequence(model, sequenceField, start, end, parentDepartmentStart, parentDepartmentEnd, isCreate, isDelete, callback) {
        var query;
        var objFind = {};
        var objChange = {};
        var inc = -1;
        var c;

        if (parentDepartmentStart === parentDepartmentEnd) {// on one workflow

            if (!(isCreate || isDelete)) {

                if (start > end) {
                    inc = 1;
                    c = end;
                    end = start;
                    start = c;
                } else {
                    end -= 1;
                }
                objChange = {};
                objFind = {parent: parentDepartmentStart};
                objFind[sequenceField] = {$gte: start, $lte: end};
                objChange[sequenceField] = inc;
                query = model.update(objFind, {$inc: objChange}, {multi: true});
                query.exec(function (err, res) {
                    if (callback) {
                        callback((inc === -1) ? end : start);
                    }
                });
            } else {
                if (isCreate) {
                    query = model.count({parent: parentDepartmentStart}).exec(function (err, res) {
                        if (callback) {
                            callback(res);
                        }
                    });
                }
                if (isDelete) {
                    objChange = {};
                    objFind = {parent: parentDepartmentStart};
                    objFind[sequenceField] = {$gt: start};
                    objChange[sequenceField] = -1;
                    query = model.update(objFind, {$inc: objChange}, {multi: true});
                    query.exec(function (err, res) {
                        if (callback) {
                            callback(res);
                        }
                    });
                }
            }
        } else {// nbetween workflow
            objChange = {};
            objFind = {parent: parentDepartmentStart};
            objFind[sequenceField] = {$gte: start};
            objChange[sequenceField] = -1;
            query = model.update(objFind, {$inc: objChange}, {multi: true});
            query.exec();
            objFind = {parent: parentDepartmentEnd};
            objFind[sequenceField] = {$gte: end};
            objChange[sequenceField] = 1;
            query = model.update(objFind, {$inc: objChange}, {multi: true});
            query.exec(function () {
                if (callback) {
                    callback(end);
                }
            });

        }
    }

    function updateFullName(id, Model, cb) {
        var fullName;
        var parrentFullName;

        Model
            .findById(id)
            .populate(parent)
            .exec(function (err, category) {
                parrentFullName = category.parent ? category.parent.fullName : null;

                if (parrentFullName) {
                    fullName = parrentFullName + ' / ' + category.name;
                } else {
                    fullName = category.name;
                }

                if (!err) {
                    Model.findByIdAndUpdate(id, {$set: {fullName: fullName}}, {new: true}, cb);
                }
            });
    }

    this.update = function (req, res, next) {
        var ProductCategory = models.get(req.session.lastDb, 'ProductCategory', CategorySchema);
        var data = req.body;
        var _id = req.params.id;

        delete data.createdBy;

        if (data.users && data.users[0] && data.users[0]._id) {
            data.users = data.users.map(function (item) {
                return item._id;
            });
        }

        if (data.sequenceStart) {
            updateSequence(ProductCategory, 'sequence', data.sequenceStart, data.sequence, data.parentCategoryStart, data.parent, false, false, function (sequence) {
                data.sequence = sequence;
                ProductCategory.findByIdAndUpdate(_id, data, {new: true}, function (err, result) {
                    if (err) {
                        next(err);
                    } else {
                        // ToDo update fullName
                        ProductCategory.populate(result, {path: 'parent'}, function (err, result) {
                            if (err) {
                                return next(err);
                            }
                            if (data.isAllUpdate) {
                                updateNestingLevel(req, _id, data.nestingLevel, function () {
                                    res.send(200, {success: 'Category updated success'});
                                });
                            } else {
                                res.send(200, {success: 'Category updated success'});
                            }

                            updateFullName(_id, ProductCategory, function () {
                                console.log('fullName was updated');
                            });

                        });
                    }
                });
            });
        } else {
            ProductCategory.findByIdAndUpdate(_id, data, {new: true}, function (err, result) {
                ProductCategory.populate(result, {path: 'parent'}, function (err, result) {
                    if (err) {
                        console.log(err);
                    }
                });

                updateFullName(_id, ProductCategory, function () {
                    console.log('fullName was updated');
                });

                if (err) {
                    return next(err);
                }
                if (data.isAllUpdate) {
                    updateNestingLevel(req, _id, data.nestingLevel, function () {
                        res.send(200, {success: 'Category updated success'});
                    });
                } else {
                    res.send(200, {success: 'Category updated success'});
                }

            });
        }
    };

    function removeAllChild(req, arrId, callback) {
        var ProductCategory = models.get(req.session.lastDb, 'ProductCategory', CategorySchema);

        if (arrId.length > 0) {
            ProductCategory.find({parent: {$in: arrId}}, {_id: 1}, function (err, res) {
                ProductCategory.find({parent: {$in: arrId}}, {multi: true}).remove().exec(function (err, result) {
                    arrId = res.map(function (item) {
                        return item._id;
                    });
                    removeAllChild(req, arrId, callback);
                });

            });
        } else {
            if (callback) {
                callback();
            }
        }
    }

    this.remove = function (req, res, next) {
        var ProductCategory = models.get(req.session.lastDb, 'ProductCategory', CategorySchema);
        var _id = req.param('id');

        ProductCategory.remove({_id: _id}, function (err, result) {
            if (err) {
                return next(err);
            }

            removeAllChild(req, [_id].objectID(), function () {
                res.status(200).send({success: 'Category was removed'});
            });

        });
    };

};

module.exports = Categories;
