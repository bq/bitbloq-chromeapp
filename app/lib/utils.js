'use strict';

/**
 * Transform Array Buffer in String
 * @param {Array Buffer} buf
 * @return {String} decodeURIComponent(encodedString)
 */
module.exports.ab2str = function(buf) {
    var bufView = new Uint8Array(buf);
    var encodedString = String.fromCharCode.apply(null, bufView);
    return decodeURIComponent(encodedString);
};

/**
 * Transform String in ArrayBuffer
 * @param {String} String
 * @return {Array Buffer} buffer
 */
module.exports.str2ab = function(str) {
    var encodedString = encodeURIComponent(str);
    var bytes = new Uint8Array(encodedString.length);
    for (var i = 0; i < encodedString.length; ++i) {
        bytes[i] = encodedString.charCodeAt(i);
    }
    return bytes.buffer;
};
