import { Request, Response } from 'express';
import { Workstation, Allocation, Associate } from '../../../database/models/models/models';
import { logAction } from '../services/auditService';
import { autoAllocate } from '../services/allocationService';
import { catchAsync } from '../middleware/errorHandler';
import { sendWhatsAppNotification } from '../services/whatsappService';

export const allocate = catchAsync(async (req: Request, res: Response) => {
  const { date, shiftId, lineId, workstationId, associateId, overrideReason } = req.body;
  const userId = req.authData?.userId;
  
  const ws = await Workstation.findOne({ where: { id: workstationId, userId } });
  if (!ws) {
    return res.status(404).json({ success: false, message: "Workstation not found." });
  }

  await Allocation.destroy({ where: { date, shiftId, associateId, userId } });

  const currentCount = await Allocation.count({ where: { date, shiftId, workstationId, userId } });
  if (currentCount >= (ws.maxStaffCount || 1)) {
    return res.status(400).json({ success: false, message: `Workstation is already at full capacity.` });
  }

  const newAlloc = await Allocation.create({
    id: `A-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    date,
    shiftId,
    lineId,
    workstationId,
    associateId,
    allocatedBy: "Supervisor",
    overrideReasonCode: overrideReason,
    timestamp: new Date().toISOString()
  });

  const assoc = await Associate.findOne({ where: { id: associateId, userId } });
  const action = overrideReason ? "OVERRIDE_ALLOCATION" : "ALLOCATION_CONFIRMED";
  const details = overrideReason 
    ? `OVERRIDE: ${assoc?.get('name')} assigned to ${ws?.get('name')} (Reason: ${overrideReason}).`
    : `Staffed workstation ${ws?.get('name')} with ${assoc?.get('name')}.`;

  await logAction(action, details, userId, req.authData?.userType || "reviewer");
  
  // Trigger async WhatsApp message
  sendWhatsAppNotification(userId || 'SYSTEM', associateId, date, shiftId, workstationId, lineId);

  res.json({ success: true, allocation: newAlloc });
});

export const deallocate = catchAsync(async (req: Request, res: Response) => {
  const { date, shiftId, workstationId, lineId, associateId } = req.body;
  const userId = req.authData?.userId;
  const ws = await Workstation.findOne({ where: { id: workstationId, userId } });

  const whereClause: any = { date, shiftId, workstationId, userId };
  if (associateId) {
    whereClause.associateId = associateId;
  }
  await Allocation.destroy({ where: whereClause });

  const suffix = associateId ? ` operator ID ${associateId}` : "";
  await logAction("ALLOCATION_CONFIRMED", `Deallocated${suffix} from station ${ws?.get('name')} on Line ${lineId.replace('LINE-', '')}.`, userId, req.authData?.userType || "reviewer");
  res.json({ success: true });
});

export const clear = catchAsync(async (req: Request, res: Response) => {
  const { date, shiftId, lineId } = req.body;
  const userId = req.authData?.userId;
  await Allocation.destroy({ where: { date, shiftId, lineId, userId } });
  await logAction("ALLOCATION_CONFIRMED", `Cleared all allocations for Line ${lineId.replace('LINE-', '')} for Shift ${shiftId.replace('SHIFT-', '')}.`, userId, req.authData?.userType || "reviewer");
  res.json({ success: true });
});

export const autoAllocateController = catchAsync(async (req: Request, res: Response) => {
  const { date, shiftId, lineId } = req.body;
  const userId = req.authData?.userId;
  const count = await autoAllocate(date, shiftId, lineId, userId);
  res.json({ success: true, allocatedCount: count });
});
