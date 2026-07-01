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
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const envLoader_1 = require("./envLoader");
exports.sequelize = process.env.DATABASE_URL
    ? new sequelize_1.Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    })
    : new sequelize_1.Sequelize(envLoader_1.variables.DB_NAME, envLoader_1.variables.DB_USERNAME, envLoader_1.variables.DB_PASSWORD, {
        host: "localhost",
        dialect: "postgres",
        logging: false
    });
class Database {
    static createConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield exports.sequelize.authenticate();
                console.log("DB connection established");
            }
            catch (error) {
                console.log("unable to connect to DB : ", error);
            }
        });
    }
}
exports.default = Database;
