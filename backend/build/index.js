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
const buffer_1 = __importDefault(require("buffer"));
if (!buffer_1.default.SlowBuffer) {
    buffer_1.default.SlowBuffer = buffer_1.default.Buffer;
}
const envLoader_1 = require("./config/envLoader");
const server_1 = __importDefault(require("./server"));
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { PORT } = envLoader_1.variables;
        const app = new server_1.default();
        app.start(Number(PORT));
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
});
start();
process.on("SIGTERM", (signal) => {
    console.debug(signal);
    console.debug(`Process ${process.pid} received a SIGTERM signal`);
    process.exit(0);
});
process.on("SIGINT", (signal) => {
    console.debug(signal);
    console.debug(`Process ${process.pid} has been interrupted`);
    process.exit(0);
});
process.on("uncaughtException", (err) => {
    console.error(err);
    console.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});
