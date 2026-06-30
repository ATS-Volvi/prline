"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const devLogger = () => {
    const myFormat = winston_1.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    });
    return (0, winston_1.createLogger)({
        level: "debug",
        // format: winston.format.simple(),
        format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.label({ label: "right meow!" }), winston_1.format.timestamp({ format: "HH:mm:ss" }), myFormat),
        //defaultMeta: { service: 'user-service' },
        transports: [new winston_1.transports.Console()],
    });
};
exports.default = devLogger;
