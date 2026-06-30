"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.CustomError = void 0;
class CustomError extends Error {
    constructor({ status = 500, message = 'Internal Server Error' }) {
        super(message);
        this.status = status;
        // Set the prototype explicitly to ensure instanceof works correctly
        Object.setPrototypeOf(this, CustomError.prototype);
    }
}
exports.CustomError = CustomError;
const createError = (options) => {
    return new CustomError(options);
};
exports.createError = createError;
