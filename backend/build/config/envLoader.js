"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.variables = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ENV = [
    "DB_USERNAME",
    "DB_PASSWORD",
    "DB_NAME",
    "JWT_SECRET",
    "PORT",
    "WORKSPACE_PASSWORD",
    "WORKSPACE_EMAIL",
    "BASE_URL"
];
const loadVar = (env) => {
    const variables = {};
    env.forEach(name => {
        const value = process.env[`${name}`];
        if (value) {
            variables[`${name}`] = value;
        }
        else {
            console.error(`Env ${name} not found`);
        }
    });
    return variables;
};
exports.variables = loadVar(ENV);
