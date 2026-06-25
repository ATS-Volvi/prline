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
const anotherError_1 = __importDefault(require("../utils/errors/anotherError"));
const createError_1 = require("../utils/errors/createError");
class UserTypeHandler {
    static checkAdmin(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = request.authData) === null || _a === void 0 ? void 0 : _a.isAuth)) {
                return next((0, createError_1.createError)({ status: 401, message: "need signin" }));
            }
            if (request.authData.userType !== "pri_admin") {
                throw new anotherError_1.default("NOT_ALLOWED_ACCESS", "Admin Only");
            }
            return next();
        });
    }
    static checkSecAdmin(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = request.authData) === null || _a === void 0 ? void 0 : _a.isAuth)) {
                return next((0, createError_1.createError)({ status: 401, message: "need signin" }));
            }
            if (!["pri_admin", "sec_admin"].includes(request.authData.userType)) {
                throw new anotherError_1.default("NOT_ALLOWED_ACCESS", "Admins Only");
            }
            return next();
        });
    }
    static checkReviewer(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = request.authData) === null || _a === void 0 ? void 0 : _a.isAuth)) {
                return next((0, createError_1.createError)({ status: 401, message: "need signin" }));
            }
            if (!["pri_admin", "sec_admin", "reviewer"].includes(request.authData.userType)) {
                throw new anotherError_1.default("NOT_ALLOWED_ACCESS", "Reviewers and Admins Only");
            }
            return next();
        });
    }
}
exports.default = UserTypeHandler;
