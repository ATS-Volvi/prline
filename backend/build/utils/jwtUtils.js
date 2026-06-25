"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJwt = signJwt;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const envLoader_1 = require("../config/envLoader");
const jwtSecret = envLoader_1.variables.JWT_SECRET;
function signJwt(payload, expiresIn) {
    return jsonwebtoken_1.default.sign(payload, jwtSecret, {
        expiresIn: "7d",
        algorithm: "HS512",
    });
}
