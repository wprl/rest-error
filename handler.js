var util = require('util');
var mongoose = require('mongoose');
var BaucisError = require('./definitions');

var plugin = module.exports = function (options, protect) {
  var controller = this;

  protect.property('emptyCollection', 204);
  protect.property('handleErrors', true, function (handle) {
    return handle ? true : false;
  });

  protect.use(function (error, request, response, next) {
    if (!error) return next();
    // Validation errors.
    if (!(error instanceof mongoose.Error.ValidationError || error instanceof BaucisError.ValidationError)) {
      next(error);
      return;
    }
    
    response.status(422);
    if (controller.handleErrors()) return response.json(error.errors);
    next(error);
  });
  
  protect.use(function (error, request, response, next) {
    if (!error) return next();
    if (error.message.indexOf('E11000 duplicate key error') === -1) {
      next(error);
      return;
    }

    var body = {};
    var scrape = /[$](.+)[_]\d+\s+dup key: [{] : "([^"]+)" [}]/;
    var scraped = scrape.exec(error.message);
    var path = scraped ? scraped[1] : '???';
    var value = scraped ? scraped[2] : '???';
    body[path] = {
      message: util.format('Path `%s` (%s) must be unique.', path, value),
      originalMessage: error.message,
      name: 'MongoError',
      path: path,
      type: 'unique',
      value: value
    };

    response.status(422);
    if (controller.handleErrors()) return response.json(body);
    next(error);
  });

  protect.use('/:id?', function (error, request, response, next) {
    if (!error) return next();
    // Handle 404
    if (!(error instanceof BaucisError.NotFound)) return next(error);

    response.status(error.status);
    if (!controller.handleErrors()) return next(error);
    if (request.params.id) return next(error);
    if (error.parentController === true) return next(error);
    response.status(controller.emptyCollection());
    if (controller.emptyCollection() === 200) return response.json([]);
    if (controller.emptyCollection() === 204) return response.send();
    next(error);
  });

  protect.use(function (error, request, response, next) {
    if (!error) return next();
    // Just set the status code for these errors.
    if (!(error instanceof BaucisError)) return next(error);
    response.status(error.status);
    next(error);
  });

  protect.use(function (error, request, response, next) {
    if (!error) return next();
    if (!(error instanceof mongoose.Error.VersionError)) {
      next(error);
      return;
    }
    response.status(409);
    next(error);
  });
};