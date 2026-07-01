"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceRecord = exports.AuditLog = exports.Allocation = exports.LeaveRecord = exports.AssociateSkill = exports.Associate = exports.Shift = exports.Workstation = exports.ProductionLine = exports.Skill = void 0;
const sequelize_1 = require("sequelize");
const dbConn_1 = require("../../config/dbConn");
// 1. SKILL MODEL
class Skill extends sequelize_1.Model {
}
exports.Skill = Skill;
Skill.init({
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: true }
}, { sequelize: dbConn_1.sequelize, tableName: 'skills', timestamps: false });
// 2. PRODUCTION LINE MODEL
class ProductionLine extends sequelize_1.Model {
}
exports.ProductionLine = ProductionLine;
ProductionLine.init({
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    currentProduct: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    status: { type: sequelize_1.DataTypes.STRING, allowNull: false }
}, { sequelize: dbConn_1.sequelize, tableName: 'production_lines', timestamps: false });
// 3. WORKSTATION MODEL
class Workstation extends sequelize_1.Model {
}
exports.Workstation = Workstation;
Workstation.init({
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    lineId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    requiredSkillId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    minSkillLevel: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    maxStaffCount: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 1 }
}, { sequelize: dbConn_1.sequelize, tableName: 'workstations', timestamps: false });
// 4. SHIFT MODEL
class Shift extends sequelize_1.Model {
}
exports.Shift = Shift;
Shift.init({
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    timings: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    workingDays: { type: sequelize_1.DataTypes.TEXT, allowNull: false }
}, { sequelize: dbConn_1.sequelize, tableName: 'shifts', timestamps: false });
// 5. ASSOCIATE MODEL
class Associate extends sequelize_1.Model {
}
exports.Associate = Associate;
Associate.init({
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    category: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    joiningDate: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    status: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    plantIdRef: { type: sequelize_1.DataTypes.STRING, allowNull: true }
}, { sequelize: dbConn_1.sequelize, tableName: 'associates', timestamps: false });
// 6. ASSOCIATE SKILL MODEL (Junction Table)
class AssociateSkill extends sequelize_1.Model {
}
exports.AssociateSkill = AssociateSkill;
AssociateSkill.init({
    associateId: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    skillId: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    level: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    trainingDate: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    certifiedBy: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    expiryDate: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    reCertificationRequired: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize: dbConn_1.sequelize, tableName: 'associate_skills', timestamps: false });
// 7. LEAVE RECORD MODEL
class LeaveRecord extends sequelize_1.Model {
}
exports.LeaveRecord = LeaveRecord;
LeaveRecord.init({
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    associateId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    date: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    shiftId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    reason: { type: sequelize_1.DataTypes.STRING, allowNull: false }
}, { sequelize: dbConn_1.sequelize, tableName: 'leave_records', timestamps: false });
// 8. ALLOCATION MODEL
class Allocation extends sequelize_1.Model {
}
exports.Allocation = Allocation;
Allocation.init({
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    date: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    shiftId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    lineId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    workstationId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    associateId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    allocatedBy: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    overrideReasonCode: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    timestamp: { type: sequelize_1.DataTypes.STRING, allowNull: false }
}, { sequelize: dbConn_1.sequelize, tableName: 'allocations', timestamps: false });
// 9. AUDIT LOG MODEL
class AuditLog extends sequelize_1.Model {
}
exports.AuditLog = AuditLog;
AuditLog.init({
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    timestamp: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    actionType: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    details: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    userId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    userRole: { type: sequelize_1.DataTypes.STRING, allowNull: false }
}, {
    sequelize: dbConn_1.sequelize,
    tableName: 'audit_logs',
    timestamps: false,
    hooks: {
        beforeUpdate: () => { throw new Error("Audit logs are read-only and immutable."); },
        beforeDestroy: () => { throw new Error("Audit logs are read-only and immutable."); },
        beforeBulkUpdate: () => { throw new Error("Audit logs are read-only and immutable."); },
        beforeBulkDestroy: () => { throw new Error("Audit logs are read-only and immutable."); }
    }
});
// 10. ATTENDANCE RECORD MODEL
class AttendanceRecord extends sequelize_1.Model {
}
exports.AttendanceRecord = AttendanceRecord;
AttendanceRecord.init({
    id: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    date: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    shiftId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    associateId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    status: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'present' },
    markedBy: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    timestamp: { type: sequelize_1.DataTypes.STRING, allowNull: false }
}, { sequelize: dbConn_1.sequelize, tableName: 'attendance_records', timestamps: false });
// Relationships
ProductionLine.hasMany(Workstation, { foreignKey: 'lineId', as: 'workstations', onDelete: 'CASCADE' });
Workstation.belongsTo(ProductionLine, { foreignKey: 'lineId', as: 'productionLine' });
Skill.hasMany(Workstation, { foreignKey: 'requiredSkillId', as: 'workstations' });
Workstation.belongsTo(Skill, { foreignKey: 'requiredSkillId', as: 'skill' });
Associate.hasMany(AssociateSkill, { foreignKey: 'associateId', as: 'associateSkills', onDelete: 'CASCADE' });
AssociateSkill.belongsTo(Associate, { foreignKey: 'associateId', as: 'associate' });
Skill.hasMany(AssociateSkill, { foreignKey: 'skillId', as: 'associateSkills', onDelete: 'CASCADE' });
AssociateSkill.belongsTo(Skill, { foreignKey: 'skillId', as: 'skill' });
Associate.hasMany(LeaveRecord, { foreignKey: 'associateId', as: 'leaveRecords', onDelete: 'CASCADE' });
LeaveRecord.belongsTo(Associate, { foreignKey: 'associateId', as: 'associate' });
Associate.hasMany(Allocation, { foreignKey: 'associateId', as: 'allocations', onDelete: 'CASCADE' });
Allocation.belongsTo(Associate, { foreignKey: 'associateId', as: 'associate' });
Workstation.hasMany(Allocation, { foreignKey: 'workstationId', as: 'allocations', onDelete: 'CASCADE' });
Allocation.belongsTo(Workstation, { foreignKey: 'workstationId', as: 'workstation' });
Shift.hasMany(Allocation, { foreignKey: 'shiftId', as: 'allocations', onDelete: 'CASCADE' });
Allocation.belongsTo(Shift, { foreignKey: 'shiftId', as: 'shift' });
Associate.hasMany(AttendanceRecord, { foreignKey: 'associateId', as: 'attendanceRecords', onDelete: 'CASCADE' });
AttendanceRecord.belongsTo(Associate, { foreignKey: 'associateId', as: 'associate' });
