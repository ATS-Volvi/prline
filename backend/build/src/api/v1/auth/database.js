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
const user_1 = __importDefault(require("../../../../DB/models/user"));
class MainAuthDatabase {
    static isUserExists(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield user_1.default.findOne({ where: { email: email } });
            if (result)
                return true;
            return false;
        });
    }
    static createUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, email, password, userType } = data;
            const newUser = new user_1.default({
                name: name,
                email: email,
                password: password,
                isVerified: false,
                userType: userType || 'reviewer'
            });
            const result = yield newUser.save();
            return result;
        });
    }
    static getUser(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield user_1.default.findOne({ where: { email: email } });
            return result;
        });
    }
    static verifyEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield user_1.default.update({ isVerified: true }, { where: { email: email } });
            return result;
        });
    }
    static updatePassword(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield user_1.default.update({ password: password }, { where: { email: email } });
            return result;
        });
    }
}
exports.default = MainAuthDatabase;
