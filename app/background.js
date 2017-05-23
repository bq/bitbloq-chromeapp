'use strict';
var uploader = require('./lib/flash');
var portDetection = require('./lib/ports');
var serialLib = require('./lib/serial');

var connectedPort;

// when the webpage sends a message and we receive it, pass on the info to the uploader and request a flash to the device.
chrome.runtime.onConnectExternal.addListener(function(port) {
    connectedPort = port;
    port.postMessage('connected');
    port.onMessage.addListener(function(msg) {
        console.log('msg', msg);
        switch (msg.type) {
            case 'upload':
                console.log(msg.file);
                //resetBoard(port, function() {
                upload(msg, port);
                //});

                break;
            case 'ping':
                port.postMessage('ping');
                break;
            case 'serial-connect':
                connectSerial(msg);
                break;
            case 'serial-connect-send':
                receiveData(msg.data);
                break;
            case 'serial-disconnect':
                disconnectSerial();
                break;
            case 'change-baudrate':
                changeBaudarate(msg.data);
                break;
            case 'get-ports':
                getPorts(port);
                break;
            default:
                console.log('undefined type');
        }

    });
});
var MBOT_LOAD_ADDRESS_REGEXP = /55....20/; //mBot always give timeout with this codes
function upload(msg, port) {
    // call flash process
    serialPortConnection.disconnect(function() {
        uploader.flash(msg.board, msg.file, function(error) {
            var message = {
                type: 'upload'
            };
            console.log(error);
            if (!error ||
                (error &&
                    (msg.board === 'uno') &&
                    error.message &&
                    (error.message.indexOf('timeout') !== -1) &&
                    MBOT_LOAD_ADDRESS_REGEXP.test(error.message)
                )
            ) {
                message.success = true;

            } else {
                message.success = false;
                message.error = error.message;
            }

            // send back the status of the flash to the webpage so it knows when it's done/errored.
            port.postMessage(message);
            serialPortConnection.reconnect();
        });
    });
}

function disconnectSerial() {
    serialPortConnection.disconnect(function() {
        console.log('reload');
        chrome.runtime.reload();
    });

}

function connectSerial(msg) {
    console.log('connectSerial', msg.port);
    serialPortConnection.connect({
        path: msg.port.comName,
        endLineCharacter: '\n'
    });
}

function receiveData(data) {
    serialPortConnection.send(data, function(response) {
        console.log('response');
        console.log(response);
    });
}

function changeBaudarate(baudrate) {
    serialPortConnection.update(baudrate, function(result) {
        console.log('hecho');
        console.log(result);
    });
}

function getPorts() {
    portDetection.getPorts(function(err, ports) {
        console.log('ports');
        console.log(ports);
        var message = {
            type: 'get-ports',
            ports: ports
        };
        if (err) {
            message.success = false;
            message.error = err.message;
        } else {
            message.success = true;
        }

        // send back the status of the flash to the webpage so it knows when it's done/errored.
        connectedPort.postMessage(message);
    });
}

/*function resetBoard(path, callback) {
    //process to reset a board with a path
    //connect with 1200 baidrate
    //dtr tru 1 second
    //dtr false 200 ms
    //dtr true
    //disconnect
    var sharedConnectionInfo;
    chrome.serial.connect(path, {
        name: 'bitbloq-board-reset',
        bitrate: 1200,
        sendTimeout: 1000,
        receiveTimeout: 1000,
        ctsFlowControl: true
    }, function(connectionInfo) {
        console.log('connected reset', connectionInfo);
        if (connectionInfo && connectionInfo.connectionId) {
            sharedConnectionInfo = connectionInfo;
            chrome.serial.setControlSignals(sharedConnectionInfo.connectionId, {
                dtr: true,
                rts: false
            }, function(data) {
                console.log('setControlSignals', data);
                setTimeout(function() {
                    chrome.serial.setControlSignals(sharedConnectionInfo.connectionId, {
                        dtr: false,
                        rts: false
                    }, function(data) {
                        console.log('setControlSignals-2', data);
                        setTimeout(function() {
                            chrome.serial.setControlSignals(sharedConnectionInfo.connectionId, {
                                dtr: true,
                                rts: false
                            }, function(data) {
                                console.log('setControlSignals-3', data);
                                chrome.serial.disconnect(sharedConnectionInfo.connectionId, function(data) {
                                    console.log('disconnect', data);
                                    callback();
                                });
                            });
                        }, 200);

                    });
                }, 1000);
            });
        }

    });
}*/

////////////////////////////////////////////////////////
/////////////////SERIAL MONITOR/////////////////////////
////////////////////////////////////////////////////////

var serialPortConnection = new serialLib.SerialConnection();

serialPortConnection.onConnect.addListener(function() {
    console.log('connected');
});

var canSendData = true;
var buffer = '';

serialPortConnection.onReadLine.addListener(function(line) {
    buffer = buffer + line;
    if (canSendData) {
        connectedPort.postMessage(buffer);
        buffer = '';
        canSendData = false;
        setTimeout(function() {
            canSendData = true;
        }, 100);
    }
});