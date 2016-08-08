'use strict';

const serial = chrome.serial;
var utils = require('./utils');

exports.SerialConnection = function() {
    this.connectionId = -1;
    this.lineBuffer = '';
    this.boundOnReceive = this.onReceive.bind(this);
    this.boundOnReceiveError = this.onReceiveError.bind(this);
    this.onConnect = new chrome.Event();
    this.onReadLine = new chrome.Event();
    this.onError = new chrome.Event();
};

var connectionId;

exports.SerialConnection.prototype.onConnectComplete = function(connectionInfo) {
    if (!connectionInfo) {
        console.log('Connection failed.');
        return;
    }
    console.log('connectionInfo');
    console.log(connectionInfo);
    connectionId = connectionInfo.connectionId;
    this.connectionId = connectionInfo.connectionId;
    chrome.serial.onReceive.addListener(this.boundOnReceive);
    chrome.serial.onReceiveError.addListener(this.boundOnReceiveError);
    this.onConnect.dispatch();
};

exports.SerialConnection.prototype.onReceive = function(receiveInfo) {
    if (receiveInfo.connectionId !== this.connectionId) {
        console.log('no será esto');
        return;
    }

    console.log('receiveInfo');
    console.log(receiveInfo.data);
    this.lineBuffer += utils.ab2str(receiveInfo.data);
    var index;
    while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
        console.log('entro aqui');
        var line = this.lineBuffer.substr(0, index + 1);
        this.onReadLine.dispatch(line);
        this.lineBuffer = this.lineBuffer.substr(index + 1);
    }

};

exports.SerialConnection.prototype.onReceiveError = function(errorInfo) {
    if (errorInfo.connectionId === this.connectionId) {
        this.onError.dispatch(errorInfo.error);
    }
};
exports.SerialConnection.prototype.connect = function(path) {
    serial.connect(path, {
        ctsFlowControl: true
    }, this.onConnectComplete.bind(this));
};

exports.SerialConnection.prototype.send = function(msg) {
    if (this.connectionId < 0) {
        throw 'Invalid connection';
    }
    serial.send(this.connectionId, utils.str2ab(msg), function() {});
};

exports.SerialConnection.prototype.disconnect = function() {
    if (this.connectionId < 0) {
        throw 'Invalid connection';
    }
    serial.disconnect(connectionId, function() {
        this.lineBuffer = '';
    });
};
