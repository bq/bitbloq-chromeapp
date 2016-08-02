'use strict';
var uploader = require('./lib/flash');

// when the webpage sends a message and we receive it, pass on the info to the uploader and request a flash to the device.
chrome.runtime.onConnectExternal.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        // call flash process
        uploader.flash(msg.board, msg.file, function(error) {
            // prepare the response object
            var message = error ? { error: error.message } : { success: true };
            // send back the status of the flash to the webpage so it knows when it's done/errored.
            port.postMessage(message);
        });
    });
});