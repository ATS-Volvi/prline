"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dev_1 = __importDefault(require("./dev"));
const production_1 = __importDefault(require("./production"));
const test_1 = __importDefault(require("./test"));
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
};
let logger = null;
if (process.env.NODE_ENV === "dev") {
    logger = (0, dev_1.default)();
}
if (process.env.NODE_ENV === "production") {
    logger = (0, production_1.default)();
}
if (process.env.NODE_ENV === "test") {
    logger = (0, test_1.default)();
}
exports.default = logger;
