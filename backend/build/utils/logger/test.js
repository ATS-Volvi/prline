"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const { combine, timestamp, label, printf, json } = winston_1.format;
const testLogger = () => {
    return (0, winston_1.createLogger)({
        level: "info",
        // format: winston.format.simple(),
        format: combine(timestamp(), json()),
        defaultMeta: { service: "user-service" },
        transports: [
            new winston_1.transports.Console(),
            new winston_1.transports.File({
                filename: "test.errors.log",
            }),
        ],
    });
};
exports.default = testLogger;
