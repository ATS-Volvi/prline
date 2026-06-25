export type AssociateCategory = 'Contract' | 'Company' | 'NTCI';
export type SkillLevel = 'Trainee' | 'Operator' | 'Certified' | 'Expert';
export type LineStatus = 'ACTIVE' | 'MAINTENANCE' | 'HALTED' | 'IDLE';
export type UserRole = 'Plant Admin' | 'HR / Training Coordinator' | 'Production Supervisor' | 'Plant Manager';

export interface Associate {
  id: string;
  name: string;
  category: AssociateCategory;
  joiningDate: string;
  status: 'Active' | 'Inactive';
}

export interface Skill {
  id: string;
  name: string;
  description: string;
}

export interface AssociateSkill {
  associateId: string;
  skillId: string;
  level: SkillLevel;
  trainingDate: string;
  certifiedBy: string;
  expiryDate: string;
  reCertificationRequired: boolean;
}

export interface Workstation {
  id: string;
  name: string;
  lineId: string;
  requiredSkillId: string;
  minSkillLevel: SkillLevel;
  maxStaffCount: number;
}

export interface ProductionLine {
  id: string;
  name: string;
  currentProduct: string;
  status: LineStatus;
}

export interface Shift {
  id: string;
  name: string;
  timings: string;
  workingDays: string[];
}

export interface Allocation {
  id: string;
  date: string;
  shiftId: string;
  lineId: string;
  workstationId: string;
  associateId: string;
  allocatedBy: string;
  overrideReasonCode: string | null; // e.g. "EMERGENCY_COVER", "SUPERVISOR_APPROVED", etc.
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actionType: string; // e.g., 'ALLOCATION_CONFIRMED', 'OVERRIDE_ALLOCATION', 'TRAINING_ADDED', 'MASTER_DATA_UPDATED'
  details: string;
  userId: string;
  userRole: string;
}

export interface LeaveRecord {
  id: string;
  associateId: string;
  date: string;
  shiftId: string; // which shift they are unavailable for, or 'ALL'
}

export interface AttendanceRecord {
  id: string;
  date: string;
  shiftId: string;
  associateId: string;
  status: 'present' | 'absent';
  markedBy: string;
  timestamp: string;
}
