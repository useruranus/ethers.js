import { pbkdf2, sha256 } from "../crypto/index.js";
import { defineProperties, getBytes, hexlify, assertNormalize, assertPrivate, throwArgumentError, toUtf8Bytes } from "../utils/index.js";
import { langEn } from "../wordlists/lang-en.js";
// Returns a byte with the MSB bits set
function getUpperMask(bits) {
    return ((1 << bits) - 1) << (8 - bits) & 0xff;
}
// Returns a byte with the LSB bits set
function getLowerMask(bits) {
    return ((1 << bits) - 1) & 0xff;
}
function mnemonicToEntropy(mnemonic, wordlist = langEn) {
    assertNormalize("NFKD");
    if (wordlist == null) {
        wordlist = langEn;
    }
    const words = wordlist.split(mnemonic);
    if ((words.length % 3) !== 0 || words.length < 12 || words.length > 24) {
        throwArgumentError("invalid mnemonic length", "mnemonic", "[ REDACTED ]");
    }
    const entropy = new Uint8Array(Math.ceil(11 * words.length / 8));
    let offset = 0;
    for (let i = 0; i < words.length; i++) {
        let index = wordlist.getWordIndex(words[i].normalize("NFKD"));
        if (index === -1) {
            throwArgumentError(`invalid mnemonic word at index ${i}`, "mnemonic", "[ REDACTED ]");
        }
        for (let bit = 0; bit < 11; bit++) {
            if (index & (1 << (10 - bit))) {
                entropy[offset >> 3] |= (1 << (7 - (offset % 8)));
            }
            offset++;
        }
    }
    const entropyBits = 32 * words.length / 3;
    const checksumBits = words.length / 3;
    const checksumMask = getUpperMask(checksumBits);
    const checksum = getBytes(sha256(entropy.slice(0, entropyBits / 8)))[0] & checksumMask;
    if (checksum !== (entropy[entropy.length - 1] & checksumMask)) {
        throwArgumentError("invalid mnemonic checksum", "mnemonic", "[ REDACTED ]");
    }
    return hexlify(entropy.slice(0, entropyBits / 8));
}
function entropyToMnemonic(entropy, wordlist = langEn) {
    if ((entropy.length % 4) || entropy.length < 16 || entropy.length > 32) {
        throwArgumentError("invalid entropy size", "entropy", "[ REDACTED ]");
    }
    if (wordlist == null) {
        wordlist = langEn;
    }
    const indices = [0];
    let remainingBits = 11;
    for (let i = 0; i < entropy.length; i++) {
        // Consume the whole byte (with still more to go)
        if (remainingBits > 8) {
            indices[indices.length - 1] <<= 8;
            indices[indices.length - 1] |= entropy[i];
            remainingBits -= 8;
            // This byte will complete an 11-bit index
        }
        else {
            indices[indices.length - 1] <<= remainingBits;
            indices[indices.length - 1] |= entropy[i] >> (8 - remainingBits);
            // Start the next word
            indices.push(entropy[i] & getLowerMask(8 - remainingBits));
            remainingBits += 3;
        }
    }
    // Compute the checksum bits
    const checksumBits = entropy.length / 4;
    const checksum = parseInt(sha256(entropy).substring(2, 4), 16) & getUpperMask(checksumBits);
    // Shift the checksum into the word indices
    indices[indices.length - 1] <<= checksumBits;
    indices[indices.length - 1] |= (checksum >> (8 - checksumBits));
    return wordlist.join(indices.map((index) => wordlist.getWord(index)));
}
const _guard = {};
export class Mnemonic {
    phrase;
    password;
    wordlist;
    entropy;
    constructor(guard, entropy, phrase, password, wordlist) {
        if (password == null) {
            password = "";
        }
        if (wordlist == null) {
            wordlist = langEn;
        }
        assertPrivate(guard, _guard, "Mnemonic");
        defineProperties(this, { phrase, password, wordlist, entropy });
    }
    computeSeed() {
        const salt = toUtf8Bytes("mnemonic" + this.password, "NFKD");
        return pbkdf2(toUtf8Bytes(this.phrase, "NFKD"), salt, 2048, 64, "sha512");
    }
    static fromPhrase(phrase, password, wordlist) {
        // Normalize the case and space; throws if invalid
        const entropy = mnemonicToEntropy(phrase, wordlist);
        phrase = entropyToMnemonic(getBytes(entropy), wordlist);
        return new Mnemonic(_guard, entropy, phrase, password, wordlist);
    }
    static fromEntropy(_entropy, password, wordlist) {
        const entropy = getBytes(_entropy, "entropy");
        const phrase = entropyToMnemonic(entropy, wordlist);
        return new Mnemonic(_guard, hexlify(entropy), phrase, password, wordlist);
    }
    static entropyToPhrase(_entropy, wordlist) {
        const entropy = getBytes(_entropy, "entropy");
        return entropyToMnemonic(entropy, wordlist);
    }
    static phraseToEntropy(phrase, wordlist) {
        return mnemonicToEntropy(phrase, wordlist);
    }
    static isValidMnemonic(phrase, wordlist) {
        try {
            mnemonicToEntropy(phrase, wordlist);
            return true;
        }
        catch (error) { }
        return false;
    }
}
//# sourceMappingURL=mnemonic.js.map