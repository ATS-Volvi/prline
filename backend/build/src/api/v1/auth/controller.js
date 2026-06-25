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
const service_1 = __importDefault(require("./service"));
const statusCodes_1 = __importDefault(require("../../../../config/constants/statusCodes"));
class MainAuthController {
    static signup(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = request.body;
            const result = yield service_1.default.signup(data, next);
            if (result) {
                const payload = {
                    content: result,
                    status: true
                };
                return response.status(statusCodes_1.default.CREATED).json(payload);
            }
        });
    }
    static login(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = request.body;
            const result = yield service_1.default.login(data, next);
            if (result) {
                const payload = {
                    content: result,
                    status: true
                };
                return response.status(statusCodes_1.default.OK).json(payload);
            }
        });
    }
    static verifyEmail(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token } = request.query;
            const result = yield service_1.default.verifyEmail(token, next);
            if (result) {
                const payload = {
                    content: result,
                    status: true
                };
                return response.status(statusCodes_1.default.OK).json(payload);
            }
        });
    }
    static forgetPassword(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = request.body;
            const result = yield service_1.default.forgetPassword(email, next);
            if (result) {
                const payload = {
                    content: result,
                    status: true
                };
                return response.status(statusCodes_1.default.OK).json(payload);
            }
        });
    }
    static updatePassword(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { password } = request.body;
            const { token } = request.query;
            const result = yield service_1.default.updatePassword(password, token, next);
            if (result) {
                const payload = {
                    content: result,
                    status: true
                };
                return response.status(statusCodes_1.default.OK).json(payload);
            }
        });
    }
}
exports.default = MainAuthController;
