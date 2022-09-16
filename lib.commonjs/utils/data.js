"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zeroPadBytes = exports.zeroPadValue = exports.stripZerosLeft = exports.dataSlice = exports.dataLength = exports.concat = exports.hexlify = exports.isBytesLike = exports.isHexString = exports.getBytesCopy = exports.getBytes = void 0;
const errors_js_1 = require("./errors.js");
function _getBytes(value, name, copy) {
    if (value instanceof Uint8Array) {
        if (copy) {
            return new Uint8Array(value);
        }
        return value;
    }
    if (typeof (value) === "string" && value.match(/^0x([0-9a-f][0-9a-f])*$/i)) {
        const result = new Uint8Array((value.length - 2) / 2);
        let offset = 2;
        for (let i = 0; i < result.length; i++) {
            result[i] = parseInt(value.substring(offset, offset + 2), 16);
            offset += 2;
        }
        return result;
    }
    return (0, errors_js_1.throwArgumentError)("invalid BytesLike value", name || "value", value);
}
/**
 *  Get a typed Uint8Array for %%value%%. If already a Uint8Array
 *  the original %%value%% is returned; if a copy is required use
 *  [[getBytesCopy]].
 *
 *  @see: getBytesCopy
 */
function getBytes(value, name) {
    return _getBytes(value, name, false);
}
exports.getBytes = getBytes;
/**
 *  Get a typed Uint8Array for %%value%%, creating a copy if necessary
 *  to prevent any modifications of the returned value from being
 *  reflected elsewhere.
 *
 *  @see: getBytes
 */
function getBytesCopy(value, name) {
    return _getBytes(value, name, true);
}
exports.getBytesCopy = getBytesCopy;
/**
 *  Returns true if %%value%% is a valid [[HexString]], with additional
 *  optional constraints depending on %%length%%.
 *
 *  If %%length%% is //true//, then %%value%% must additionally be a valid
 *  [[HexDataString]] (i.e. even length).
 *
 *  If %%length%% is //a number//, then %%value%% must represent that many
 *  bytes of data (e.g. ``0x1234`` is 2 bytes).
 */
function isHexString(value, length) {
    if (typeof (value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
        return false;
    }
    if (typeof (length) === "number" && value.length !== 2 + 2 * length) {
        return false;
    }
    if (length === true && (value.length % 2) !== 0) {
        return false;
    }
    return true;
}
exports.isHexString = isHexString;
/**
 *  Returns true if %%value%% is a valid representation of arbitrary
 *  data (i.e. a valid [[HexDataString]] or a Uint8Array).
 */
function isBytesLike(value) {
    return (isHexString(value, true) || (value instanceof Uint8Array));
}
exports.isBytesLike = isBytesLike;
const HexCharacters = "0123456789abcdef";
/**
 *  Returns a [[HexDataString]] representation of %%data%%.
 */
function hexlify(data) {
    const bytes = getBytes(data);
    let result = "0x";
    for (let i = 0; i < bytes.length; i++) {
        const v = bytes[i];
        result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
    }
    return result;
}
exports.hexlify = hexlify;
/**
 *  Returns a [[HexDataString]] by concatenating all values
 *  within %%data%%.
 */
function concat(datas) {
    return "0x" + datas.map((d) => hexlify(d).substring(2)).join("");
}
exports.concat = concat;
/**
 *  Returns the length of %%data%%, in bytes.
 */
function dataLength(data) {
    if (isHexString(data, true)) {
        return (data.length - 2) / 2;
    }
    return getBytes(data).length;
}
exports.dataLength = dataLength;
/**
 *  Returns a [[HexDataString]] by slicing %%data%% from the %%start%%
 *  offset to the %%end%% offset.
 *
 *  By default %%start%% is 0 and %%end%% is the length of %%data%%.
 */
function dataSlice(data, start, end) {
    const bytes = getBytes(data);
    if (end != null && end > bytes.length) {
        (0, errors_js_1.throwError)("cannot slice beyond data bounds", "BUFFER_OVERRUN", {
            buffer: bytes, length: bytes.length, offset: end
        });
    }
    return hexlify(bytes.slice((start == null) ? 0 : start, (end == null) ? bytes.length : end));
}
exports.dataSlice = dataSlice;
/**
 *  Return the [[HexDataString]] result by stripping all **leading**
 ** zero bytes from %%data%%.
 */
function stripZerosLeft(data) {
    let bytes = hexlify(data).substring(2);
    while (bytes.substring(0, 2) == "00") {
        bytes = bytes.substring(2);
    }
    return "0x" + bytes;
}
exports.stripZerosLeft = stripZerosLeft;
function zeroPad(data, length, left) {
    const bytes = getBytes(data);
    if (length < bytes.length) {
        (0, errors_js_1.throwError)("padding exceeds data length", "BUFFER_OVERRUN", {
            buffer: new Uint8Array(bytes),
            length: length,
            offset: length + 1
        });
    }
    const result = new Uint8Array(length);
    result.fill(0);
    if (left) {
        result.set(bytes, length - bytes.length);
    }
    else {
        result.set(bytes, 0);
    }
    return hexlify(result);
}
/**
 *  Return the [[HexDataString]] of %%data%% padded on the **left**
 *  to %%length%% bytes.
 */
function zeroPadValue(data, length) {
    return zeroPad(data, length, true);
}
exports.zeroPadValue = zeroPadValue;
/**
 *  Return the [[HexDataString]] of %%data%% padded on the **right**
 *  to %%length%% bytes.
 */
function zeroPadBytes(data, length) {
    return zeroPad(data, length, false);
}
exports.zeroPadBytes = zeroPadBytes;
//# sourceMappingURL=data.js.map