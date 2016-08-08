'use strict';
var uploader = require('./lib/flash');
var portDetection = require('./lib/ports');
var serialLib = require('./lib/serial');

var portConnected;

// when the webpage sends a message and we receive it, pass on the info to the uploader and request a flash to the device.
chrome.runtime.onConnectExternal.addListener(function(port) {
    portConnected = port;
    port.postMessage('connected');
    port.onMessage.addListener(function(msg) {
        console.log('msg', msg);
        switch (msg.type) {
            case 'upload':
                upload(msg, port);
                break;
            case 'ping':
                port.postMessage('ping');
                break;
            case 'serial-connect':
                connectSerial();
                break;
            case 'serial-disconnect':
                disconnectSerial();
                break;
            default:
                console.log('undefined type');
        }

    });
});

function upload(msg, port) {
    // call flash process
    uploader.flash(msg.board, msg.file, function(error) {
        // prepare the response object
        var message = error ? {
            error: error.message
        } : {
            success: true
        };
        // send back the status of the flash to the webpage so it knows when it's done/errored.
        port.postMessage(message);
    });
}

function disconnectSerial() {
    connection.disconnect();
    chrome.runtime.reload();
}

function connectSerial() {
    portDetection.getPorts(function(err, ports) {
        connection.connect(ports[0].comName);
    });
}

////////////////////////////////////////////////////////
/////////////////SERIAL MONITOR/////////////////////////
////////////////////////////////////////////////////////

var connection = new serialLib.SerialConnection();

connection.onConnect.addListener(function() {
    console.log('connected');
    connection.send('hello arduino');
});

connection.onReadLine.addListener(function(line) {
    portConnected.postMessage(line);
});
