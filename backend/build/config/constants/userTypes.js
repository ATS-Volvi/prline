"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userTypeList = exports.userTypeEnum = void 0;
const USER_TYPE = {
    collector: 'collector',
    pri_admin: 'pri_admin'
};
exports.userTypeEnum = Object.values(USER_TYPE);
exports.userTypeList = Object.keys(USER_TYPE);
exports.default = USER_TYPE;
