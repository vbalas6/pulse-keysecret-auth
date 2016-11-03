var _ = require('lodash');

var Hapi = require('hapi');
// var Boom = require('boom');
var Inert = require('inert');
// var colors = require('colors/safe');


var server = new Hapi.Server();
server.connection({
  host: '0.0.0.0',
  port: '3000',
  routes: {
    cors: {
      origin: ['*'],
      headers: ['Authorization', 'Content-Type', 'If-None-Match', 'appid', 'token', 'assetid', 'asseturl', 'deviceid', 'appversion', 'user-agent', 'Accept-Language']
    },
    timeout: {
      socket: false
    }
  }
});

// Replace this with datastore lookup
var credentials = {
  d74s3nz2873n: {
    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
    algorithm: 'sha256'
  }
}
var getCredentials = function(id, callback) {
  return callback(null, credentials[id]);
};

server.register(require('keysecret-auth').scheme, function(err) {
  server.auth.strategy('keySecret', 'keySecret', {
    getCredentialsFunc: getCredentials
  });
});



/* Routes  */

server.register(Inert, function() {});

server.route({
  method: 'GET',
  path: '/',
  handler: {
    file: 'example/index.html'
  }
});

server.route({
  method: 'GET',
  path: '/test.js',
  handler: {
    file: 'test/test.js'
  }
});

server.route({
  method: 'GET',
  path: '/dist/browser.js',
  handler: {
    file: 'dist/browser.js'
  }
});

server.route({
  method: 'GET',
  path: '/api/test',
  config: {
    auth: 'keySecret'
  },
  handler: function(req, reply) {
    reply({
      test: "passed"
    })
  }
});

server.start(function() {})