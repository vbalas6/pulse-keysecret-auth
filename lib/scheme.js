// Load modules

var Boom = require('boom');
var Hoek = require('hoek');
var Hawk = require('hawk');


// Declare internals

var internals = {};


exports.register = function(server, options, next) {

    server.auth.scheme('keySecret', internals.keySecretScheme);

    return next();
};


exports.register.attributes = {
  pkg: require('../package.json')
};


internals.keySecretScheme = function(server, options) {

    console.log("Inside internals.keySecretScheme  ::::::::::");

    Hoek.assert(options, 'Invalid scheme options');
    Hoek.assert(options.getCredentialsFunc, 'Missing required getCredentialsFunc method in the scheme configuration');

    var settings = Hoek.clone(options);
    settings.hawk = settings.hawk || {};

    var scheme = {

        authenticate: function(request, reply) {
            console.log("Inside authenticate  ::::::::::");
            if (!request.raw.req.headers.authorization) return reply(Boom.unauthorized('Authorization header is missing'));

            // Reformat to Hawk
            request.raw.req.headers.authorization = request.raw.req.headers.authorization.replace('KeySecret key=', 'Hawk id=');

            Hawk.server.authenticate(request.raw.req, settings.getCredentialsFunc, settings.hawk, function(err, credentials, artifacts) {

                if (!err) {
                    request.once('peek', function(chunk) {

                        var payloadHash = Hawk.crypto.initializePayloadHash(request.auth.credentials.algorithm, request.headers['content-type']);
                        payloadHash.update(chunk);

                        request.on('peek', function(chunk2) {

                            payloadHash.update(chunk2);
                        });

                        request.once('finish', function() {

                            request.plugins['hapi-auth-hawk'] = { payloadHash: Hawk.crypto.finalizePayloadHash(payloadHash) };
                        });
                    });
                }

                var result = { credentials: credentials, artifacts: artifacts };
                if (err) {
                    return reply(err, null, result);
                }

                return reply.continue(result);
            });
        },
        payload: function(request, reply) {

            if (!request.auth.artifacts.hash) {
                return reply(Boom.unauthorized(null, 'Hawk')); // Missing
            }

            var plugin = request.plugins['hapi-auth-hawk'];
            if (plugin &&
                Hawk.server.authenticatePayloadHash(plugin.payloadHash, request.auth.artifacts)) {

                return reply.continue();
            }

            return reply(Boom.unauthorized('Payload is invalid'));
        },
        response: function(request, reply) {

            var response = request.response;
            var payloadHash = Hawk.crypto.initializePayloadHash(request.auth.credentials.algorithm, response.headers['content-type']);

            response.header('trailer', 'server-authorization');
            response.header('transfer-encoding', 'chunked');
            // We must not send a content-length header alongside transfer-encoding.
            // see https://tools.ietf.org/html/rfc7230#section-3.3.3
            delete response.headers['content-length'];

            response.on('peek', function(chunk) {

                payloadHash.update(chunk);
            });

            response.once('finish', function() {

                var header = Hawk.server.header(request.auth.credentials, request.auth.artifacts, { hash: Hawk.crypto.finalizePayloadHash(payloadHash) });
                request.raw.res.addTrailers({ 'server-authorization': header });
            });

            return reply.continue();
        }
    };

    return scheme;
};


internals.bewit = function(server, options) {

    Hoek.assert(options, 'Invalid bewit scheme options');
    Hoek.assert(options.getCredentialsFunc, 'Missing required getCredentialsFunc method in bewit scheme configuration');

    var settings = Hoek.clone(options);
    settings.hawk = settings.hawk || {};

    var scheme = {
        authenticate: function(request, reply) {

            // Reformat to Hawk
            request.raw.req.headers.authorization = request.raw.req.headers.authorization.replace('KeySecret key=', 'Hawk id=');

            Hawk.server.authenticateBewit(request.raw.req, settings.getCredentialsFunc, settings.hawk, function(err, credentials, bewit) {

                var result = { credentials: credentials, artifacts: bewit };
                if (err) {
                    return reply(err, null, result);
                }

                return reply.continue(result);
            });
        }
    };

    return scheme;
};