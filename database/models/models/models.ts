import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/dbConn";

// 1. SKILL MODEL
export class Skill extends Model {
  public id!: string;
  public userId!: string;
  public name!: string;
  public description!: string;
}
Skill.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, tableName: 'skills', timestamps: false });

// 2. PRODUCTION LINE MODEL
export class ProductionLine extends Model {
  public id!: string;
  public userId!: string;
  public name!: string;
  public currentProduct!: string;
  public status!: 'ACTIVE' | 'MAINTENANCE' | 'HALTED' | 'IDLE';
}
ProductionLine.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  currentProduct: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false }
}, { sequelize, tableName: 'production_lines', timestamps: false });

// 3. WORKSTATION MODEL
export class Workstation extends Model {
  public id!: string;
  public userId!: string;
  public name!: string;
  public lineId!: string;
  public requiredSkillId!: string;
  public minSkillLevel!: 'Trainee' | 'Operator' | 'Certified' | 'Expert';
  public maxStaffCount!: number;
}
Workstation.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  lineId: { type: DataTypes.STRING, allowNull: false },
  requiredSkillId: { type: DataTypes.STRING, allowNull: false },
  minSkillLevel: { type: DataTypes.STRING, allowNull: false },
  maxStaffCount: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { sequelize, tableName: 'workstations', timestamps: false });

// 4. SHIFT MODEL
export class Shift extends Model {
  public id!: string;
  public userId!: string;
  public name!: string;
  public timings!: string;
  public workingDays!: string; // Stored as serialized JSON array
}
Shift.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  timings: { type: DataTypes.STRING, allowNull: false },
  workingDays: { type: DataTypes.TEXT, allowNull: false }
}, { sequelize, tableName: 'shifts', timestamps: false });

// 5. ASSOCIATE MODEL
export class Associate extends Model {
  public id!: string;
  public userId!: string;
  public name!: string;
  public category!: 'Contract' | 'Company' | 'NTCI';
  public joiningDate!: string;
  public status!: 'Active' | 'Inactive';
  public plantIdRef!: string;
}
Associate.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  joiningDate: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  plantIdRef: { type: DataTypes.STRING, allowNull: true }
}, { sequelize, tableName: 'associates', timestamps: false });

// 6. ASSOCIATE SKILL MODEL (Junction Table)
export class AssociateSkill extends Model {
  public associateId!: string;
  public userId!: string;
  public skillId!: string;
  public level!: 'Trainee' | 'Operator' | 'Certified' | 'Expert';
  public trainingDate!: string;
  public certifiedBy!: string;
  public expiryDate!: string;
  public reCertificationRequired!: boolean;
}
AssociateSkill.init({
  associateId: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, primaryKey: true },
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
  public userId!: string;
  public associateId!: string;
  public date!: string;
  public shiftId!: string; // 'ALL' or specific shiftId
  public reason!: string;
}
LeaveRecord.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, primaryKey: true },
  associateId: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false },
  shiftId: { type: DataTypes.STRING, allowNull: false },
  reason: { type: DataTypes.STRING, allowNull: false }
}, { sequelize, tableName: 'leave_records', timestamps: false });

// 8. ALLOCATION MODEL
export class Allocation extends Model {
  public id!: string;
  public userId!: string;
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
  userId: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  shiftId: { type: DataTypes.STRING, allowNull: false },
  lineId: { type: DataTypes.STRING, allowNull: false },
  workstationId: { type: DataTypes.STRING, allowNull: false },
  associateId: { type: DataTypes.STRING, allowNull: false },
  allocatedBy: { type: DataTypes.STRING, allowNull: false },
  overrideReasonCode: { type: DataTypes.STRING, allowNull: true },
  timestamp: { type: DataTypes.STRING, allowNull: false }
}, { 
  sequelize, 
  tableName: 'allocations', 
  timestamps: false,
  indexes: [
    { fields: ['date'] },
    { fields: ['shiftId'] },
    { fields: ['date', 'shiftId'] }
  ]
});

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
}, {
  sequelize,
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
export class AttendanceRecord extends Model {
  public id!: string;
  public userId!: string;
  public date!: string;
  public shiftId!: string;
  public associateId!: string;
  public status!: 'present' | 'absent';
  public markedBy!: string;
  public timestamp!: string;
}
AttendanceRecord.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  userId: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  shiftId: { type: DataTypes.STRING, allowNull: false },
  associateId: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'present' },
  markedBy: { type: DataTypes.STRING, allowNull: false },
  timestamp: { type: DataTypes.STRING, allowNull: false }
}, { sequelize, tableName: 'attendance_records', timestamps: false });

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

// 9. RAG CHUNK MODEL
export class RagChunk extends Model {
  public id!: number;
  public entityType!: string;
  public entityId!: string;
  public content!: string;
  public metadata!: any;
  public embedding!: number[];
  public updatedAt!: Date;
}
RagChunk.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  entityType: { type: DataTypes.STRING, allowNull: false, field: 'entity_type' },
  entityId: { type: DataTypes.STRING, allowNull: false, field: 'entity_id' },
  content: { type: DataTypes.TEXT, allowNull: false },
  metadata: { type: DataTypes.JSONB, allowNull: true },
  embedding: { type: 'VECTOR(384)', allowNull: true },
}, { sequelize, tableName: 'rag_chunks', timestamps: true, updatedAt: 'updated_at', createdAt: false });

// 10. PRODUCTION ASSUMPTIONS MODEL
export class ProductionAssumptions extends Model {
  public id!: number;
  public userId!: string;
  public fyLabel!: string;
  public fyStartDate!: string;
  public numLines!: number;
  public ratedCapacityKgHr!: number;
  public hoursPerShift!: number;
  public shiftsPerDay!: number;
  public workingDaysPerMonth!: number;
  public plannedDowntimePct!: number;
  public rejectionPct!: number;
  public annualTargetMt!: number;
}
ProductionAssumptions.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.STRING, allowNull: false, field: 'user_id' },
  fyLabel: { type: DataTypes.STRING, allowNull: true, field: 'fy_label' },
  fyStartDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'fy_start_date' },
  numLines: { type: DataTypes.INTEGER, allowNull: true, field: 'num_lines' },
  ratedCapacityKgHr: { type: DataTypes.DECIMAL, allowNull: true, field: 'rated_capacity_kg_hr' },
  hoursPerShift: { type: DataTypes.DECIMAL, allowNull: true, field: 'hours_per_shift' },
  shiftsPerDay: { type: DataTypes.INTEGER, allowNull: true, field: 'shifts_per_day' },
  workingDaysPerMonth: { type: DataTypes.DECIMAL, allowNull: true, field: 'working_days_per_month' },
  plannedDowntimePct: { type: DataTypes.DECIMAL, allowNull: true, field: 'planned_downtime_pct' },
  rejectionPct: { type: DataTypes.DECIMAL, allowNull: true, field: 'rejection_pct' },
  annualTargetMt: { type: DataTypes.DECIMAL, allowNull: true, field: 'annual_target_mt' },
}, { sequelize, tableName: 'production_assumptions', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

// 11. MONTHLY SEASONALITY MODEL
export class MonthlySeasonality extends Model {
  public id!: number;
  public assumptionsId!: number;
  public month!: string;
  public indexValue!: number;
  public note!: string;
}
MonthlySeasonality.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assumptionsId: { type: DataTypes.INTEGER, allowNull: false, field: 'assumptions_id' },
  month: { type: DataTypes.STRING, allowNull: false },
  indexValue: { type: DataTypes.DECIMAL, allowNull: false, field: 'index_value' },
  note: { type: DataTypes.STRING, allowNull: true }
}, { sequelize, tableName: 'monthly_seasonality', timestamps: false });

// 12. MANPOWER NORM MODEL
export class ManpowerNorm extends Model {
  public id!: number;
  public assumptionsId!: number;
  public role!: string;
  public category!: 'Skilled' | 'Semi-Skilled' | 'Unskilled';
  public scope!: 'per_line_shift' | 'per_shift_shared';
  public countPerUnit!: number;
  public notes!: string;
}
ManpowerNorm.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assumptionsId: { type: DataTypes.INTEGER, allowNull: false, field: 'assumptions_id' },
  role: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  scope: { type: DataTypes.STRING, allowNull: false },
  countPerUnit: { type: DataTypes.DECIMAL, allowNull: false, field: 'count_per_unit' },
  notes: { type: DataTypes.STRING, allowNull: true }
}, { sequelize, tableName: 'manpower_norms', timestamps: false });

// 13. COVERAGE BUFFERS MODEL
export class CoverageBuffers extends Model {
  public id!: number;
  public assumptionsId!: number;
  public workingDaysPerAssociatePerWeek!: number;
  public offFactorAdj!: number;
  public absenteeBufferPct!: number;
}
CoverageBuffers.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assumptionsId: { type: DataTypes.INTEGER, allowNull: false, field: 'assumptions_id' },
  workingDaysPerAssociatePerWeek: { type: DataTypes.DECIMAL, defaultValue: 6, field: 'working_days_per_associate_per_week' },
  offFactorAdj: { type: DataTypes.DECIMAL, allowNull: true, field: 'off_factor_adj' },
  absenteeBufferPct: { type: DataTypes.DECIMAL, allowNull: true, field: 'absentee_buffer_pct' }
}, { sequelize, tableName: 'coverage_buffers', timestamps: false });

// 14. DAILY PRODUCTION ACTUAL MODEL
export class DailyProductionActual extends Model {
  public id!: number;
  public userId!: string;
  public productionDate!: string;
  public lineId!: string | null;
  public shift!: string | null;
  public actualOutputMt!: number;
  public enteredBy!: string;
  public notes!: string;
}
DailyProductionActual.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.STRING, allowNull: false, field: 'user_id' },
  productionDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'production_date' },
  lineId: { type: DataTypes.STRING, allowNull: true, field: 'line_id' },
  shift: { type: DataTypes.STRING, allowNull: true },
  actualOutputMt: { type: DataTypes.DECIMAL, allowNull: false, field: 'actual_output_mt' },
  enteredBy: { type: DataTypes.STRING, allowNull: true, field: 'entered_by' },
  notes: { type: DataTypes.STRING, allowNull: true }
}, { sequelize, tableName: 'daily_production_actual', timestamps: true, createdAt: 'created_at', updatedAt: false });

// Setup associations
ProductionAssumptions.hasMany(MonthlySeasonality, { foreignKey: 'assumptions_id', as: 'seasonality', onDelete: 'CASCADE' });
MonthlySeasonality.belongsTo(ProductionAssumptions, { foreignKey: 'assumptions_id', as: 'assumptions' });

ProductionAssumptions.hasMany(ManpowerNorm, { foreignKey: 'assumptions_id', as: 'norms', onDelete: 'CASCADE' });
ManpowerNorm.belongsTo(ProductionAssumptions, { foreignKey: 'assumptions_id', as: 'assumptions' });

ProductionAssumptions.hasOne(CoverageBuffers, { foreignKey: 'assumptions_id', as: 'buffers', onDelete: 'CASCADE' });
CoverageBuffers.belongsTo(ProductionAssumptions, { foreignKey: 'assumptions_id', as: 'assumptions' });


