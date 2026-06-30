"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const customError_1 = __importDefault(require("./customError"));
class AnotherError extends customError_1.default {
    constructor(codePhrase, message) {
        super(message);
        this.statusCode = 400;
        this.codePhrase = codePhrase;
        Object.setPrototypeOf(this, AnotherError.prototype);
    }
    returnError() {
        return {
            message: this.message,
            code: this.codePhrase,
            statusCode: this.statusCode,
        };
    }
}
exports.default = AnotherError;
