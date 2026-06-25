import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/dbConn";

// 1. SKILL MODEL
export class Skill extends Model {
  public id!: string;
  public name!: string;
  public description!: string;
}
Skill.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, tableName: 'skills', timestamps: false });

// 2. PRODUCTION LINE MODEL
export class ProductionLine extends Model {
  public id!: string;
  public name!: string;
  public currentProduct!: string;
  public status!: 'ACTIVE' | 'MAINTENANCE' | 'HALTED' | 'IDLE';
}
ProductionLine.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  currentProduct: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false }
}, { sequelize, tableName: 'production_lines', timestamps: false });

// 3. WORKSTATION MODEL
export class Workstation extends Model {
  public id!: string;
  public name!: string;
  public lineId!: string;
  public requiredSkillId!: string;
  public minSkillLevel!: 'Trainee' | 'Operator' | 'Certified' | 'Expert';
  public maxStaffCount!: number;
}
Workstation.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  lineId: { type: DataTypes.STRING, allowNull: false },
  requiredSkillId: { type: DataTypes.STRING, allowNull: false },
  minSkillLevel: { type: DataTypes.STRING, allowNull: false },
  maxStaffCount: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { sequelize, tableName: 'workstations', timestamps: false });

// 4. SHIFT MODEL
export class Shift extends Model {
  public id!: string;
  public name!: string;
  public timings!: string;
  public workingDays!: string; // Stored as serialized JSON array
}
Shift.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  timings: { type: DataTypes.STRING, allowNull: false },
  workingDays: { type: DataTypes.TEXT, allowNull: false }
}, { sequelize, tableName: 'shifts', timestamps: false });

// 5. ASSOCIATE MODEL
export class Associate extends Model {
  public id!: string;
  public name!: string;
  public category!: 'Contract' | 'Company' | 'NTCI';
  public joiningDate!: string;
  public status!: 'Active' | 'Inactive';
}
Associate.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  joiningDate: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false }
}, { sequelize, tableName: 'associates', timestamps: false });

// 6. ASSOCIATE SKILL MODEL (Junction Table)
export class AssociateSkill extends Model {
  public associateId!: string;
  public skillId!: string;
  public level!: 'Trainee' | 'Operator' | 'Certified' | 'Expert';
  public trainingDate!: string;
  public certifiedBy!: string;
  public expiryDate!: string;
  public reCertificationRequired!: boolean;
}
AssociateSkill.init({
  associateId: { type: DataTypes.STRING, primaryKey: true },
  skillId: { type: DataTypes.STRING, primaryKey: true },
  level: { type: DataTypes.STRING, allowNull: false },
  trainingDate: { type: DataTypes.STRING, allowNull: false },
  certifiedBy: { type: DataTypes.STRING, allowNull: false },
  expiryDate: { type: DataTypes.STRING, allowNull: false },
  reCertificationRequired: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, tableName: 'associate_skills', timestamps: false });

// 7. LEAVE RECORD MODEL
export class LeaveRecord extends Model {
  public id!: string;
  public associateId!: string;
  public date!: string;
  public shiftId!: string; // 'ALL' or specific shiftId
  public reason!: string;
}
LeaveRecord.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  associateId: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false },
  shiftId: { type: DataTypes.STRING, allowNull: false },
  reason: { type: DataTypes.STRING, allowNull: false }
}, { sequelize, tableName: 'leave_records', timestamps: false });

// 8. ALLOCATION MODEL
export class Allocation extends Model {
  public id!: string;
  public date!: string;
  public shiftId!: string;
  public lineId!: string;
  public workstationId!: string;
  public associateId!: string;
  public allocatedBy!: string;
  public overrideReasonCode!: string | null;
  public timestamp!: string;
}
Allocation.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  shiftId: { type: DataTypes.STRING, allowNull: false },
  lineId: { type: DataTypes.STRING, allowNull: false },
  workstationId: { type: DataTypes.STRING, allowNull: false },
  associateId: { type: DataTypes.STRING, allowNull: false },
  allocatedBy: { type: DataTypes.STRING, allowNull: false },
  overrideReasonCode: { type: DataTypes.STRING, allowNull: true },
  timestamp: { type: DataTypes.STRING, allowNull: false }
}, { sequelize, tableName: 'allocations', timestamps: false });

// 9. AUDIT LOG MODEL
export class AuditLog extends Model {
  public id!: string;
  public timestamp!: string;
  public actionType!: string;
  public details!: string;
  public userId!: string;
  public userRole!: string;
}
AuditLog.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  timestamp: { type: DataTypes.STRING, allowNull: false },
  actionType: { type: DataTypes.STRING, allowNull: false },
  details: { type: DataTypes.TEXT, allowNull: false },
  userId: { type: DataTypes.STRING, allowNull: false },
  userRole: { type: DataTypes.STRING, allowNull: false }
}, { sequelize, tableName: 'audit_logs', timestamps: false });

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
