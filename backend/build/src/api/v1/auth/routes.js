"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = __importDefault(require("./controller"));
const AuthRouter = express_1.default.Router();
AuthRouter.post("/signup", (request, response, next) => {
    controller_1.default.signup(request, response, next);
});
AuthRouter.post("/login", (request, response, next) => {
    controller_1.default.login(request, response, next);
});
AuthRouter.get("/verifyEmail", (request, response, next) => {
    controller_1.default.verifyEmail(request, response, next);
});
AuthRouter.post("/forgetPassword", (request, response, next) => {
    controller_1.default.forgetPassword(request, response, next);
});
AuthRouter.put("/updatePassword", (request, response, next) => {
    controller_1.default.updatePassword(request, response, next);
});
exports.default = AuthRouter;
