"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const customError_1 = __importDefault(require("./customError"));
class NotFoundError extends customError_1.default {
    constructor() {
        super("Not Found");
        this.codePhrase = "NOT_FOUND";
        this.statusCode = 404;
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
    returnError() {
        return {
            message: this.message,
            code: this.codePhrase,
            statusCode: this.statusCode,
        };
    }
}
exports.default = NotFoundError;
