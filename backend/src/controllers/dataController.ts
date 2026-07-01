import { Request, Response } from 'express';
import { 
  Associate, Skill, AssociateSkill, Workstation, ProductionLine, 
  Shift, Allocation, AuditLog, LeaveRecord, AttendanceRecord 
} from '@prline/database';
import { catchAsync } from '../middleware/errorHandler';

export const getAssociates = catchAsync(async (req: Request, res: Response) => {
  const data = await Associate.findAll();
  res.json(data);
});

export const getSkills = catchAsync(async (req: Request, res: Response) => {
  const data = await Skill.findAll();
  res.json(data);
});

export const getAssociateSkills = catchAsync(async (req: Request, res: Response) => {
  const data = await AssociateSkill.findAll();
  res.json(data);
});

export const getWorkstations = catchAsync(async (req: Request, res: Response) => {
  const data = await Workstation.findAll();
  res.json(data);
});

export const getProductionLines = catchAsync(async (req: Request, res: Response) => {
  const data = await ProductionLine.findAll();
  res.json(data);
});

export const getShifts = catchAsync(async (req: Request, res: Response) => {
  const shiftsRaw = await Shift.findAll();
  const data = shiftsRaw.map((s: any) => ({
    ...s.toJSON(),
    workingDays: JSON.parse(s.workingDays || "[]")
  }));
  res.json(data);
});

export const getAllocations = catchAsync(async (req: Request, res: Response) => {
  const data = await Allocation.findAll();
  res.json(data);
});

export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const data = await AuditLog.findAll({ order: [['timestamp', 'DESC']] });
  res.json(data);
});

export const getLeaveRecords = catchAsync(async (req: Request, res: Response) => {
  const data = await LeaveRecord.findAll();
  res.json(data);
});

export const getAttendanceRecords = catchAsync(async (req: Request, res: Response) => {
  const data = await AttendanceRecord.findAll();
  res.json(data);
});
