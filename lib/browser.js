var hawk = require('../node_modules/hawk/lib/browser.js');

var keySecret = {
  internals: {}
};

keySecret.client = {

  header: function header(uri, method, options) {

    //  Remap key/secret for hawk
    options.credentials.id = options.credentials.key;
    options.credentials.key = options.credentials.secret;

    var hawkHeader = hawk.client.header(uri, method, options)
      //  Reformat into key/secret format
    hawkHeader.field = hawkHeader.field.replace('Hawk id=', 'KeySecret key=')
    return hawkHeader;
  }
}

module.exports = keySecret;