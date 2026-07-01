"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const dbConn_1 = require("../../config/dbConn");
class User extends sequelize_1.Model {
}
User.init({
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        unique: true
    },
    password: {
        type: sequelize_1.DataTypes.STRING
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        unique: true
    },
    isVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false
    },
    userType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'reviewer'
    }
}, { sequelize: dbConn_1.sequelize, tableName: "users" });
exports.default = User;
