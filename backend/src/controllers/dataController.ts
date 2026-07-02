import { Request, Response } from 'express';
import { 
  Associate, Skill, AssociateSkill, Workstation, ProductionLine, 
  Shift, Allocation, AuditLog, LeaveRecord, AttendanceRecord 
} from '../../../database/models/models/models';
import { catchAsync } from '../middleware/errorHandler';

export const getAssociates = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId;
  const data = await Associate.findAll({ where: { userId } });
  res.json(data);
});

export const getSkills = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId;
  const data = await Skill.findAll({ where: { userId } });
  res.json(data);
});

export const getAssociateSkills = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId;
  const data = await AssociateSkill.findAll({ where: { userId } });
  res.json(data);
});

export const getWorkstations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId;
  const data = await Workstation.findAll({ where: { userId } });
  res.json(data);
});

export const getProductionLines = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId;
  const data = await ProductionLine.findAll({ where: { userId } });
  res.json(data);
});

export const getShifts = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId;
  const shiftsRaw = await Shift.findAll({ where: { userId } });
  const data = shiftsRaw.map((s: any) => ({
    ...s.toJSON(),
    workingDays: JSON.parse(s.workingDays || "[]")
  }));
  res.json(data);
});

export const getAllocations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId;
  const data = await Allocation.findAll({ where: { userId } });
  res.json(data);
});

export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId;
  const data = await AuditLog.findAll({ where: { userId }, order: [['timestamp', 'DESC']] });
  res.json(data);
});

export const getLeaveRecords = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId;
  const data = await LeaveRecord.findAll({ where: { userId } });
  res.json(data);
});

export const getAttendanceRecords = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId;
  const data = await AttendanceRecord.findAll({ where: { userId } });
  res.json(data);
});
