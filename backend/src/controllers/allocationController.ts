import { Request, Response } from 'express';
import { Workstation, Allocation, Associate } from '../../../../database/models/models';
import { logAction } from '../services/auditService';
import { autoAllocate } from '../services/allocationService';
import { catchAsync } from '../middleware/errorHandler';

export const allocate = catchAsync(async (req: Request, res: Response) => {
  const { date, shiftId, lineId, workstationId, associateId, overrideReason } = req.body;
  
  const ws = await Workstation.findByPk(workstationId);
  if (!ws) {
    return res.status(404).json({ success: false, message: "Workstation not found." });
  }

  await Allocation.destroy({ where: { date, shiftId, associateId } });

  const currentCount = await Allocation.count({ where: { date, shiftId, workstationId } });
  if (currentCount >= (ws.maxStaffCount || 1)) {
    return res.status(400).json({ success: false, message: `Workstation is already at full capacity.` });
  }

  const newAlloc = await Allocation.create({
    id: `A-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date,
    shiftId,
    lineId,
    workstationId,
    associateId,
    allocatedBy: "Supervisor",
    overrideReasonCode: overrideReason,
    timestamp: new Date().toISOString()
  });

  const assoc = await Associate.findByPk(associateId);
  const action = overrideReason ? "OVERRIDE_ALLOCATION" : "ALLOCATION_CONFIRMED";
  const details = overrideReason 
    ? `OVERRIDE: ${assoc?.get('name')} assigned to ${ws?.get('name')} (Reason: ${overrideReason}).`
    : `Staffed workstation ${ws?.get('name')} with ${assoc?.get('name')}.`;

  await logAction(action, details);
  res.json({ success: true, allocation: newAlloc });
});

export const deallocate = catchAsync(async (req: Request, res: Response) => {
  const { date, shiftId, workstationId, lineId, associateId } = req.body;
  const ws = await Workstation.findByPk(workstationId);

  const whereClause: any = { date, shiftId, workstationId };
  if (associateId) {
    whereClause.associateId = associateId;
  }
  await Allocation.destroy({ where: whereClause });

  const suffix = associateId ? ` operator ID ${associateId}` : "";
  await logAction("ALLOCATION_CONFIRMED", `Deallocated${suffix} from station ${ws?.get('name')} on Line ${lineId.replace('LINE-', '')}.`);
  res.json({ success: true });
});

export const clear = catchAsync(async (req: Request, res: Response) => {
  const { date, shiftId, lineId } = req.body;
  await Allocation.destroy({ where: { date, shiftId, lineId } });
  await logAction("ALLOCATION_CONFIRMED", `Cleared all allocations for Line ${lineId.replace('LINE-', '')} for Shift ${shiftId.replace('SHIFT-', '')}.`);
  res.json({ success: true });
});

export const autoAllocateController = catchAsync(async (req: Request, res: Response) => {
  const { date, shiftId, lineId } = req.body;
  const count = await autoAllocate(date, shiftId, lineId);
  res.json({ success: true, allocatedCount: count });
});
