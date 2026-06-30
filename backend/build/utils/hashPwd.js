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
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchHash = exports.hashPassword = void 0;
const bcrypt_1 = require("bcrypt");
const hashPassword = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const password = yield (0, bcrypt_1.hash)(data, 12);
    return password;
});
exports.hashPassword = hashPassword;
const matchHash = (pwd, hash) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, bcrypt_1.compare)(pwd, hash);
    return result;
});
exports.matchHash = matchHash;
