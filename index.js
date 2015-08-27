// ## Dependencies
var deco = require('deco');
var util = require('util');
// ## Module Definition
// Parent type for child HTTP errors.
var RestError = module.exports = deco().inherit(Error);
// ## Private Module Members
// Build a constructor function for an HTTP error, with a custom default message
// that can be overridden.
function buildConstructor (options) {
  var ChildError = deco(function (message) {
    this.status = options.status;
    this.name = options.name;
    // Format the formatted error message.
    this.message = util.format('%s (%s).', message, this.status);
  });

  ChildError.container(RestError).inherit(RestError);
  ChildError.sanitize(function () {
    // Use the given message (if any) and format it, or else use the default message.
    if (typeof arguments[0] === 'string') return util.format.apply(util, arguments);
    else return options.defaultMessage;
  });

  ChildError.status = options.status;

  return ChildError;
};
// ## Public Module Members
RestError.BadRequest = buildConstructor({
  defaultMessage: 'Please fix this request and try again',
  status: 400,
  name: 'Bad Request'
});

RestError.Deprecated = buildConstructor({
  defaultMessage: 'This request uses a deprecated feature and cannot be processed',
  status: 400,
  name: 'Bad Request'
});

RestError.BadSyntax = buildConstructor({
  defaultMessage: 'The body of the request is invalid and could not be parsed',
  status: 400,
  name: 'Bad Request'
});

RestError.Unauthorized = buildConstructor({
    defaultMessage: 'The requested resource requires authentication',
    status: 401,
    name: 'Unauthorized'
});

RestError.Forbidden = buildConstructor({
  defaultMessage: 'The requested resource is forbidden',
  status: 403,
  name: 'Forbidden'
});

RestError.NotFound = buildConstructor({
  defaultMessage: 'Nothing matched the requested query',
  status: 404,
  name: 'Not Found'
});

RestError.MethodNotAllowed = buildConstructor({
  defaultMessage: 'The requested HTTP method is not allowed for this resource',
  status: 405,
  name: 'Method Not Allowed'
});

RestError.NotAcceptable = buildConstructor({
  defaultMessage: 'The requested content type could not be provided',
  status: 406,
  name: 'Not Acceptable'
});

RestError.LockConflict = buildConstructor({
  defaultMessage: 'The requested update would conflict with a previous update',
  status: 409,
  name: 'Conflict'
});

RestError.Gone = buildConstructor({
    defaultMessage: 'The requested resource is no longer available',
    status: 410,
    name: 'Gone'
});

RestError.LengthRequired = buildConstructor({
    defaultMessage: 'The request did not specify the length of its content',
    status: 411,
    name: 'Length Required'
});

RestError.PreconditionFailed = buildConstructor({
    defaultMessage: 'The request preconditions cannot be met by the server',
    status: 412,
    name: 'Precondition Failed'
});

RestError.RequestEntityTooLarge = buildConstructor({
    defaultMessage: 'The request is larger than the server is willing or able to process',
    status: 413,
    name: 'Request Entity Too Large'
});

RestError.RequestUriTooLong = buildConstructor({
    defaultMessage: 'The request URI is too long',
    status: 414,
    name: 'Request URI Too Long'
});

RestError.UnsupportedMediaType = buildConstructor({
  defaultMessage: "The request's content type is unsupported",
  status: 415,
  name: 'Unsupported Media Type'
});

RestError.Teapot = buildConstructor({
  defaultMessage: 'You attempted to brew coffee with a teapot ;)',
  status: 418,
  name: 'I\'m a teapot'
});

RestError.UnprocessableEntity = deco(function (error) {
  this.message = 'The request entity could not be processed (422).'
  this.status = 422;
  this.name = 'Unprocessable Entity';
  this.errors = [];
  this.errors.push(error);
});

RestError.UnprocessableEntity.container(RestError).inherit(RestError);
RestError.UnprocessableEntity.prototype.add = function (key, error) {
  this.errors.push(error);
  return this;
};

RestError.TooManyRequests = buildConstructor({
    defaultMessage: 'The request would have exceeded the rate limit, so it has not been processed',
    status: 429,
    name: 'Too Many Requests'
});

RestError.InternalServerError = buildConstructor({
  defaultMessage: 'An unforeseen error occurred',
  status: 500,
  name: 'Internal Server Error'
});

RestError.Misconfigured = buildConstructor({
  defaultMessage: 'The server is misconfigured',
  status: 500,
  name: 'Internal Server Error'
});

RestError.NotImplemented = buildConstructor({
  defaultMessage: 'The requested functionality is not implemented',
  status: 501,
  name: 'Not Implemented'
});

RestError.status = function () {
  var args = Array.prototype.slice.call(arguments);
  var status = args.shift();
  var errorNames = Object.keys(RestError).filter(function (name) {
    return RestError[name].status === status;
  });

  if (errorNames.length === 0) {
    throw RestError.Misconfigured('Unknown HTTP status code: %s', status);
  }

  var errorType = RestError[errorNames[0]];

  return errorType.apply(errorType, args);
};
