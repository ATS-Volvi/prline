import { Associate, AssociateSkill, LeaveRecord, Allocation, Workstation } from "../../../database/models/models/models";
import { logAction } from "./auditService";
import { sendWhatsAppNotification } from "./whatsappService";

const SKILL_LEVEL_VALUE: Record<string, number> = {
  'Trainee': 1,
  'Operator': 2,
  'Certified': 3,
  'Expert': 4
};

export const autoAllocate = async (date: string, shiftId: string, lineId: string, userId?: string) => {
  const lineWS = await Workstation.findAll({ where: { lineId, userId } });
  if (lineWS.length === 0) {
    return 0;
  }

  await Allocation.destroy({ where: { date, shiftId, lineId, userId } });

  const associates = await Associate.findAll({ where: { status: 'Active', userId } });
  const associateSkills = await AssociateSkill.findAll({ where: { userId } });
  const leaveRecords = await LeaveRecord.findAll({ where: { date, userId } });
  const allAllocations = await Allocation.findAll({ where: { date, userId } });

  const currentSolveAllocations: any[] = [];
  let count = 0;

  const sortedWS = [...lineWS].sort((a, b) => {
    const scoreA = SKILL_LEVEL_VALUE[a.minSkillLevel] || 1;
    const scoreB = SKILL_LEVEL_VALUE[b.minSkillLevel] || 1;
    return scoreB - scoreA;
  });

  const getWorkloadCount = (assocId: string) => {
    const dbCount = allAllocations.filter(a => a.associateId === assocId && a.shiftId !== shiftId).length;
    const solveCount = currentSolveAllocations.filter(a => a.associateId === assocId).length;
    return dbCount + solveCount;
  };

  const isEmployeeScheduledOnDate = (assocId: string) => {
    const dbScheduled = allAllocations.some(a => a.associateId === assocId);
    const solveScheduled = currentSolveAllocations.some(a => a.associateId === assocId);
    return dbScheduled || solveScheduled;
  };

  for (const ws of sortedWS) {
    const reqSkill = ws.requiredSkillId;
    const minLvlValue = SKILL_LEVEL_VALUE[ws.minSkillLevel] || 1;
    const capacity = ws.maxStaffCount || 1;

    for (let slot = 0; slot < capacity; slot++) {
      const candidates: { associate: typeof Associate.prototype; level: string; score: number }[] = [];

      for (const assoc of associates) {
        if (isEmployeeScheduledOnDate(assoc.id)) continue;

        const onLeave = leaveRecords.some(l => l.associateId === assoc.id && (l.shiftId === 'ALL' || l.shiftId === shiftId));
        if (onLeave) continue;

        const aSkill = associateSkills.find(s => s.associateId === assoc.id && s.skillId === reqSkill);
        if (!aSkill) continue;

        if (new Date(aSkill.expiryDate) < new Date(date)) continue;

        const skillLvlValue = SKILL_LEVEL_VALUE[aSkill.level] || 1;
        if (skillLvlValue < minLvlValue) continue;

        let score = skillLvlValue * 10;
        if (assoc.category === 'Company') score += 5;
        else if (assoc.category === 'Contract') score += 3;
        else score += 1;

        const workload = getWorkloadCount(assoc.id);
        score -= workload * 15;

        candidates.push({ associate: assoc, level: aSkill.level, score });
      }

      candidates.sort((a, b) => b.score - a.score);

      if (candidates.length > 0) {
        const best = candidates[0].associate;
        const newAlloc = {
          id: `A-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId,
          date,
          shiftId,
          lineId,
          workstationId: ws.id,
          associateId: best.id,
          allocatedBy: "Auto System",
          overrideReasonCode: null,
          timestamp: new Date().toISOString()
        };
        await Allocation.create(newAlloc);
        // Trigger async WhatsApp message
        sendWhatsAppNotification(userId || 'SYSTEM', best.id, date, shiftId, ws.id, lineId);
        
        currentSolveAllocations.push(newAlloc);
        count++;
      } else {
        break;
      }
    }
  }

  await logAction("ALLOCATION_CONFIRMED", `Auto-allocated ${count} workstations for Line ${lineId.replace('LINE-', '')} (Shift ${shiftId.replace('SHIFT-', '')}).`, userId, "reviewer");
  
  return count;
};
