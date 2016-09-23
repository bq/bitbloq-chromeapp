'use strict';

const serial = chrome.serial;
var utils = require('./utils');

exports.SerialConnection = function() {
    this.connectionId = -1;
    this.lineBuffer = '';
    this.lastConnectionParams = '';
    this.endLineCharacter = false;
    this.onConnect = new chrome.Event();
    this.onReadLine = new chrome.Event();
    this.onError = new chrome.Event();
    this.sendData = false;
    chrome.serial.onReceive.addListener(this.onReceive.bind(this));
    chrome.serial.onReceiveError.addListener(this.onReceiveError.bind(this));
};


exports.SerialConnection.prototype.onConnectComplete = function(connectionInfo) {
    if (!connectionInfo) {
        console.log('Connection failed.');
        return;
    }

    console.log('connectionInfo');
    console.log(connectionInfo);
    this.connectionId = connectionInfo.connectionId;
    this.lineBuffer = '';
    this.onConnect.dispatch();
    setTimeout((function() {
        this.sendData = true;
    }).bind(this), 500);

};

exports.SerialConnection.prototype.onReceive = function(receiveInfo) {
    if (receiveInfo.connectionId !== this.connectionId) {
        console.log('no será esto');
    } else {
        //console.log('received');
        //console.log(receiveInfo.connectionId, this.connectionId);
        //console.log('this.endLineCharacter', this.endLineCharacter);

        this.lineBuffer += utils.ab2str(receiveInfo.data);

        if (this.lineBuffer.indexOf(this.endLineCharacter) !== -1 || this.lineBuffer.length > 40) {
            //console.log('lineFoound sending');
            //console.log(this.lineBuffer);
            //console.log('lineFoound endsending');
            if (this.sendData) {
                this.onReadLine.dispatch(this.lineBuffer);
            }
            this.lineBuffer = '';
        }
    }
};

exports.SerialConnection.prototype.onReceiveError = function(errorInfo) {
    console.log('onReceiveError', errorInfo);
    this.onError.dispatch(errorInfo.error);
};
exports.SerialConnection.prototype.reconnect = function() {
    if (this.connectionId !== -1) {
        console.log('we are connected, we cant reconnect');
    } else if (!this.lastConnectionParams) {
        console.log('we cant reconnect to serial because we never connect');
    } else {
        this.connect(this.lastConnectionParams);
    }
};
exports.SerialConnection.prototype.connect = function(params) {
    if (this.connectionId !== -1) {
        console.log('its connected, so disconection!');
        this.disconnect((function() {
            this.connect(params);
        }).bind(this));
    } else {
        this.lineBuffer = '';
        this.lastConnectionParams = params;
        this.endLineCharacter = params.endLineCharacter;
        serial.connect(params.path, {
            bufferSize: 12288,
            ctsFlowControl: false
        }, this.onConnectComplete.bind(this));
    }
};

exports.SerialConnection.prototype.update = function(baudrate, callback) {
    serial.update(this.connectionId, {
        bitrate: baudrate
    }, callback);
};

exports.SerialConnection.prototype.send = function(msg, callback) {
    if (this.connectionId < 0) {
        throw 'Invalid connection';
    }
    var msg2 = utils.str2ab(msg);
    console.log('/********************/');
    console.log(utils.ab2str(msg2));
    console.log('/********************/');
    serial.send(this.connectionId, msg2, callback);
};

exports.SerialConnection.prototype.disconnect = function(callback) {
    if (this.connectionId < 0) {
        callback();
    } else {
        serial.disconnect(this.connectionId, (function() {
            this.connectionId = -1;
            this.sendData = false;
            callback();
        }).bind(this));
    }
};
