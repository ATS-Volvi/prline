"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.decryptToken = decryptToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const envLoader_1 = require("../config/envLoader");
function generateToken(email, expiresIn) {
    const token = jsonwebtoken_1.default.sign({ email }, envLoader_1.variables.JWT_SECRET, { expiresIn: expiresIn });
    const encryptedToken = Buffer.from(token).toString('base64');
    return encryptedToken;
}
function decryptToken(encryptedToken) {
    const token = Buffer.from(encryptedToken, 'base64').toString('utf-8');
    try {
        const decoded = jsonwebtoken_1.default.verify(token, envLoader_1.variables.JWT_SECRET);
        return decoded.email;
    }
    catch (error) {
        return null;
    }
}
