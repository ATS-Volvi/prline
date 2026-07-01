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
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const envLoader_1 = require("../config/envLoader");
const sendEmail = (reciever, subject, body, next) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = nodemailer_1.default.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: envLoader_1.variables.WORKSPACE_EMAIL,
            pass: envLoader_1.variables.WORKSPACE_PASSWORD,
        },
        tls: {
            rejectUnauthorized: true,
        },
    });
    const hasHTMLTags = /<[a-z][\s\S]*>/i.test(body);
    const mailOptions = Object.assign({ from: envLoader_1.variables.WORKSPACE_EMAIL, to: reciever, subject: subject, text: body }, (hasHTMLTags ? { html: body } : {}));
    try {
        const info = yield transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return true;
    }
    catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
});
exports.sendEmail = sendEmail;
