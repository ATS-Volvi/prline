"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const express_1 = __importDefault(require("express"));
const dbConn_1 = __importDefault(require("./config/dbConn"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = __importDefault(require("./utils/logger"));
const routes_1 = __importDefault(require("./src/api/v1/auth/routes"));
const routes_2 = __importDefault(require("./src/api/v1/routes"));
const createError_1 = require("./utils/errors/createError");
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.config();
        this.router();
    }
    connectToDb() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield dbConn_1.default.createConnection();
        });
    }
    config() {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.set('trust proxy', true);
            this.app.set('case sensitive routing', true);
            const corsOptions = {
                origin: [
                    process.env.FRONTEND_URL,
                    'http://localhost:5173',
                    'http://localhost:5174'
                ].filter(Boolean),
                credentials: true,
                methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
                allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-Client-Type']
            };
            this.app.use((0, cors_1.default)(corsOptions));
            this.app.use(express_1.default.json({ limit: '50mb' }));
            this.app.use(express_1.default.urlencoded({ limit: '50mb' }));
        });
    }
    router() {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.use("/api/v1/auth", routes_1.default);
            this.app.use("/api/v1", routes_2.default);
            this.app.all('*', (request, response, next) => __awaiter(this, void 0, void 0, function* () {
                logger_1.default === null || logger_1.default === void 0 ? void 0 : logger_1.default.info(request.url);
                return next((0, createError_1.createError)({ status: 404, message: "Not Found!" }));
            }));
            const errorMiddleware = (err, request, response, next) => {
                const errorStatus = err.status || 500;
                const errorMessage = err.message || "something went wrong";
                console.log(err);
                response.status(errorStatus).json({
                    status: errorStatus,
                    message: errorMessage,
                    stack: err.stack,
                    success: false
                });
            };
            this.app.use(errorMiddleware);
        });
    }
    start(port) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.connectToDb();
            try {
                const { Associate } = yield Promise.resolve().then(() => __importStar(require('./DB/models/models')));
                const { seedDatabase } = yield Promise.resolve().then(() => __importStar(require('./DB/seed')));
                const count = yield Associate.count();
                if (count === 0) {
                    console.log("No associates found. Seeding database...");
                    yield seedDatabase();
                }
                else {
                    console.log(`Database already initialized with ${count} associates.`);
                }
            }
            catch (err) {
                console.log("Database tables not found or uninitialized. Seeding...");
                try {
                    const { seedDatabase } = yield Promise.resolve().then(() => __importStar(require('./DB/seed')));
                    yield seedDatabase();
                }
                catch (seedErr) {
                    console.error("Failed to seed database on startup:", seedErr);
                }
            }
            this.port = port;
            this.app.listen(this.port, () => {
                console.log(`Listening on ${this.port}`);
            });
        });
    }
}
exports.default = Server;
