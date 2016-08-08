'use strict';
var Avrgirl = require('avrgirl-arduino');

module.exports.getPorts = function(callback) {
    Avrgirl.list(function(err, ports) {
        return callback(err, ports);
    });

};
