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
const envLoader_1 = require("../../../../config/envLoader");
const emailTemplates_1 = require("../../../../utils/emailTemplates");
const createError_1 = require("../../../../utils/errors/createError");
const hashPwd_1 = require("../../../../utils/hashPwd");
const jwtUtils_1 = require("../../../../utils/jwtUtils");
const mailer_1 = require("../../../../utils/mailer");
const resetPassword_1 = require("../../../../utils/resetPassword");
const database_1 = __importDefault(require("./database"));
class MainAuthService {
    static signup(data, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, name, password } = data;
            const userExists = yield database_1.default.isUserExists(email);
            if (userExists) {
                return next((0, createError_1.createError)({ status: 400, message: "User already exists" }));
            }
            const hashedPassword = yield (0, hashPwd_1.hashPassword)(password);
            data.password = hashedPassword;
            const result = yield database_1.default.createUser(data);
            // Try to send verification email; if SMTP not configured, auto-verify the user
            try {
                const encryptedEmail = (0, resetPassword_1.generateToken)(email, "30d");
                const emailBody = (0, emailTemplates_1.verifyEmail)(`${envLoader_1.variables.BASE_URL}/api/v1/auth/verifyEmail?token=${encodeURIComponent(encryptedEmail)}`);
                const emailSent = yield (0, mailer_1.sendEmail)(result.email, "Email Verification", emailBody);
                if (!emailSent) {
                    // Email not configured (dev mode) — auto-verify so the user can log in immediately
                    yield database_1.default.verifyEmail(email);
                }
            }
            catch (_a) {
                yield database_1.default.verifyEmail(email);
            }
            return {
                data: { userId: result.userId, name: result.name, email: result.email },
            };
        });
    }
    static login(data, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = data;
            const user = yield database_1.default.getUser(email);
            if (!user) {
                return next((0, createError_1.createError)({ status: 404, message: "User not found" }));
            }
            if (!(yield (0, hashPwd_1.matchHash)(password, user.password))) {
                return next((0, createError_1.createError)({ status: 401, message: "Invalid password" }));
            }
            if (!user.isVerified) {
                return next((0, createError_1.createError)({ status: 401, message: "user not verified" }));
            }
            const accessToken = (0, jwtUtils_1.signJwt)({
                name: user.name,
                email: user.email,
                userId: user.userId,
                userType: user.userType
            }, 7);
            return {
                data: { userId: user.userId, email: user.email, name: user.name, userType: user.userType },
                accessToken: accessToken
            };
        });
    }
    static verifyEmail(token, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const email = (0, resetPassword_1.decryptToken)(token);
            if (!email) {
                return next((0, createError_1.createError)({ status: 401, message: "token expired" }));
            }
            const userExists = yield database_1.default.isUserExists(email);
            if (!userExists) {
                return next((0, createError_1.createError)({ status: 404, message: "User not found" }));
            }
            const result = yield database_1.default.verifyEmail(email);
            return result;
        });
    }
    static forgetPassword(email, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const userExists = yield database_1.default.isUserExists(email);
            if (!userExists) {
                return next((0, createError_1.createError)({ status: 404, message: "user not found" }));
            }
            const token = (0, resetPassword_1.generateToken)(email, "10m");
            const emailBody = (0, emailTemplates_1.forgetPasswordMail)(token);
            console.log("Encrypted token : ", token);
            try {
                yield (0, mailer_1.sendEmail)(email, "Reset Password Link", emailBody, next);
            }
            catch (emailErr) {
                return next((0, createError_1.createError)({ status: 400, message: "Error sending mail" }));
            }
            return true;
        });
    }
    static updatePassword(password, token, next) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(token, "token");
            const email = (0, resetPassword_1.decryptToken)(token);
            if (!email) {
                return next((0, createError_1.createError)({ status: 400, message: "token invalid or expired" }));
            }
            const userExists = yield database_1.default.isUserExists(email);
            if (!userExists) {
                return next((0, createError_1.createError)({ status: 404, message: "User not found" }));
            }
            const hashedPassword = yield (0, hashPwd_1.hashPassword)(password);
            const result = yield database_1.default.updatePassword(email, hashedPassword);
            return result;
        });
    }
}
exports.default = MainAuthService;
