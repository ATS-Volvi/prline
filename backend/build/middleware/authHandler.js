"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const envLoader_1 = require("../config/envLoader");
const createError_1 = require("../utils/errors/createError");
class AuthHandler {
    static authMiddleware(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!request.headers.authorization) {
                return next((0, createError_1.createError)({ status: 401, message: "need signin" }));
            }
            const token = request.headers.authorization.split(' ')[1];
            if (!token) {
                return next((0, createError_1.createError)({ status: 401, message: "need signin" }));
            }
            const jwtSecret = envLoader_1.variables.JWT_SECRET;
            try {
                const decodedToken = jsonwebtoken_1.default.verify(token, jwtSecret);
                request.authData = {
                    isAuth: true,
                    name: decodedToken.name,
                    userType: decodedToken.userType,
                    userId: decodedToken.userId,
                    email: decodedToken.email
                };
                return next();
            }
            catch (err) {
                return next((0, createError_1.createError)({ status: 401, message: "need signin" }));
            }
        });
    }
}
exports.default = AuthHandler;
