import { Router, Request, Response } from "express";
import {
  Skill,
  ProductionLine,
  Workstation,
  Shift,
  Associate,
  AssociateSkill,
  LeaveRecord,
  Allocation,
  AuditLog,
  AttendanceRecord
} from "../../../DB/models/models";
import AuthHandler from "../../../middleware/authHandler";
import UserTypeHandler from "../../../middleware/getUserType";

const router = Router();

// Helper to log audit actions
const logAction = async (actionType: string, details: string, userId = "admin-user", userRole = "Plant Admin") => {
  try {
    await AuditLog.create({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actionType,
      details,
      userId,
      userRole
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

// 1. GET FULL APP STATE
router.get("/state", AuthHandler.authMiddleware, async (req: Request, res: Response) => {
  try {
    const associates = await Associate.findAll();
    const skills = await Skill.findAll();
    const associateSkills = await AssociateSkill.findAll();
    const workstations = await Workstation.findAll();
    const productionLines = await ProductionLine.findAll();
    const shiftsRaw = await Shift.findAll();
    const allocations = await Allocation.findAll();
    const leaveRecords = await LeaveRecord.findAll();
    const auditLogs = await AuditLog.findAll({ order: [['timestamp', 'DESC']] });
    const attendanceRecords = await AttendanceRecord.findAll();

    // Parse shift working days JSON
    const shifts = shiftsRaw.map(s => ({
      ...s.toJSON(),
      workingDays: JSON.parse(s.workingDays || "[]")
    }));

    res.json({
      associates,
      skills,
      associateSkills,
      workstations,
      productionLines,
      shifts,
      allocations,
      leaveRecords,
      auditLogs,
      attendanceRecords
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. ASSOCIATES CRUD
router.post("/associates", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { associate, skills } = req.body;
    await Associate.create(associate);

    if (skills && Array.isArray(skills)) {
      for (const sk of skills) {
        await AssociateSkill.create({
          associateId: associate.id,
          skillId: sk.skillId,
          level: sk.level,
          trainingDate: new Date().toISOString().split('T')[0],
          certifiedBy: 'Supervisor Manager',
          expiryDate: sk.expiryDate,
          reCertificationRequired: new Date(sk.expiryDate) < new Date()
        });
      }
    }
    await logAction("MASTER_DATA_UPDATED", `Created associate ${associate.name} (${associate.id}).`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/associates/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { associate, skills } = req.body;

    await Associate.update(associate, { where: { id } });

    // Sync skills
    await AssociateSkill.destroy({ where: { associateId: id } });
    if (skills && Array.isArray(skills)) {
      for (const sk of skills) {
        await AssociateSkill.create({
          associateId: id,
          skillId: sk.skillId,
          level: sk.level,
          trainingDate: new Date().toISOString().split('T')[0],
          certifiedBy: 'Supervisor Manager',
          expiryDate: sk.expiryDate,
          reCertificationRequired: new Date(sk.expiryDate) < new Date()
        });
      }
    }
    await logAction("MASTER_DATA_UPDATED", `Updated associate ${associate.name} (${id}).`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/associates/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assoc = await Associate.findByPk(id);
    await Associate.destroy({ where: { id } });
    await AssociateSkill.destroy({ where: { associateId: id } });
    await Allocation.destroy({ where: { associateId: id } });
    await LeaveRecord.destroy({ where: { associateId: id } });

    await logAction("MASTER_DATA_UPDATED", `Removed associate ${assoc?.get('name')} (${id}).`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. WORKSTATIONS CRUD
router.post("/workstations", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const workstation = req.body;
    await Workstation.create(workstation);
    await logAction("MASTER_DATA_UPDATED", `Configured workstation ${workstation.name} (${workstation.id}).`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Workstation bulk import
router.post("/workstations/bulk-import", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) {
      res.status(400).json({ success: false, message: "No CSV content provided." });
      return;
    }

    const lines = csvContent.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    if (lines.length <= 1) {
      res.status(400).json({ success: false, message: "Empty CSV or header-only content." });
      return;
    }

    const headers = lines[0].toLowerCase().split(",");
    const wsIdIdx = headers.indexOf("workstation_id");
    const nameIdx = headers.indexOf("name");
    const lineIdIdx = headers.indexOf("line_id");
    const skillsIdx = headers.indexOf("required_skills");
    const minLvlIdx = headers.indexOf("min_level");
    const maxStaffIdx = headers.indexOf("max_staff");

    if (wsIdIdx === -1 || nameIdx === -1 || lineIdIdx === -1) {
      res.status(400).json({ success: false, message: "CSV missing required headers: workstation_id, name, line_id" });
      return;
    }

    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length < 3) continue;

      const id = parts[wsIdIdx]?.trim();
      const name = parts[nameIdx]?.trim();
      const lineId = parts[lineIdIdx]?.trim();
      const requiredSkillId = skillsIdx !== -1 ? parts[skillsIdx]?.trim() : "BLADE_OPT";
      const minSkillLevel = minLvlIdx !== -1 ? parts[minLvlIdx]?.trim() : "Operator";
      const maxStaffCount = maxStaffIdx !== -1 ? parseInt(parts[maxStaffIdx]?.trim()) || 1 : 1;

      if (!id || !name || !lineId) {
        errors.push(`Row ${i + 1}: Missing workstation ID, name or line ID`);
        continue;
      }

      // Check if line exists
      const targetLine = await ProductionLine.findByPk(lineId);
      if (!targetLine) {
        errors.push(`Row ${i + 1}: Production line "${lineId}" does not exist`);
        continue;
      }

      // Create or update workstation
      await Workstation.upsert({
        id,
        name,
        lineId,
        requiredSkillId,
        minSkillLevel,
        maxStaffCount
      });
      importedCount++;
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: `Imported ${importedCount} items. Errors: ${errors.join("; ")}`
      });
    } else {
      await logAction("MASTER_DATA_UPDATED", `Bulk imported ${importedCount} workstation mappings.`);
      res.json({ success: true, message: `Successfully imported ${importedCount} workstations.`, count: importedCount });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/workstations/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workstation = req.body;
    await Workstation.update(workstation, { where: { id } });
    await logAction("MASTER_DATA_UPDATED", `Modified workstation ${workstation.name} (${id}).`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/workstations/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ws = await Workstation.findByPk(id);
    await Workstation.destroy({ where: { id } });
    await Allocation.destroy({ where: { workstationId: id } });

    await logAction("MASTER_DATA_UPDATED", `Deleted workstation ${ws?.get('name')} (${id}).`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3.1. PRODUCTION LINES CRUD
router.post("/production-lines", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const line = req.body;
    await ProductionLine.create(line);
    await logAction("MASTER_DATA_UPDATED", `Created production line ${line.name} (${line.id}).`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/production-lines/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const line = req.body;
    await ProductionLine.update(line, { where: { id } });
    await logAction("MASTER_DATA_UPDATED", `Updated production line ${line.name} (${id}).`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/production-lines/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const line = await ProductionLine.findByPk(id);
    await Workstation.destroy({ where: { lineId: id } });
    await Allocation.destroy({ where: { lineId: id } });
    await ProductionLine.destroy({ where: { id } });
    await logAction("MASTER_DATA_UPDATED", `Deleted production line ${line?.get('name')} (${id}).`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. LEAVE RECORDS
router.post("/leave", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const leave = req.body;
    const id = `LV-${Date.now()}`;
    await LeaveRecord.create({ ...leave, id });
    const assoc = await Associate.findByPk(leave.associateId);
    await logAction("MASTER_DATA_UPDATED", `Logged leave for ${assoc?.get('name')} on ${leave.date}.`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/leave/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leave = await LeaveRecord.findByPk(id);
    await LeaveRecord.destroy({ where: { id } });
    if (leave) {
      const assoc = await Associate.findByPk(leave.get('associateId') as string);
      await logAction("MASTER_DATA_UPDATED", `Cancelled leave for ${assoc?.get('name')} on ${leave.get('date')}.`);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. MANUAL ALLOCATE & DEALLOCATE
router.post("/allocation/allocate", AuthHandler.authMiddleware, UserTypeHandler.checkReviewer, async (req: Request, res: Response) => {
  try {
    const { date, shiftId, lineId, workstationId, associateId, overrideReason } = req.body;
    
    const ws = await Workstation.findByPk(workstationId);
    if (!ws) {
      res.status(404).json({ success: false, message: "Workstation not found." });
      return;
    }

    // 1. Clear any existing allocation for this specific associate on this date and shift (prevent double allocation)
    await Allocation.destroy({ where: { date, shiftId, associateId } });

    // 2. Check capacity
    const currentCount = await Allocation.count({ where: { date, shiftId, workstationId } });
    if (currentCount >= ws.maxStaffCount) {
      res.status(400).json({ success: false, message: `Workstation is already at full capacity (${ws.maxStaffCount}/${ws.maxStaffCount} operators allocated).` });
      return;
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/allocation/deallocate", AuthHandler.authMiddleware, UserTypeHandler.checkReviewer, async (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. CLEAR ALL ALLOCATIONS
router.post("/allocation/clear", AuthHandler.authMiddleware, UserTypeHandler.checkReviewer, async (req: Request, res: Response) => {
  try {
    const { date, shiftId, lineId } = req.body;
    await Allocation.destroy({ where: { date, shiftId, lineId } });
    await logAction("ALLOCATION_CONFIRMED", `Cleared all allocations for Line ${lineId.replace('LINE-', '')} for Shift ${shiftId.replace('SHIFT-', '')}.`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. OPTIMIZED AUTO-ALLOCATION ALGORITHM
const SKILL_LEVEL_VALUE: Record<string, number> = {
  'Trainee': 1,
  'Operator': 2,
  'Certified': 3,
  'Expert': 4
};

router.post("/allocation/auto-allocate", AuthHandler.authMiddleware, UserTypeHandler.checkReviewer, async (req: Request, res: Response) => {
  try {
    const { date, shiftId, lineId } = req.body;
    const lineWS = await Workstation.findAll({ where: { lineId } });
    if (lineWS.length === 0) {
      res.json({ success: false, allocatedCount: 0 });
      return;
    }

    // Clear existing allocations for this shift/line/date
    await Allocation.destroy({ where: { date, shiftId, lineId } });

    // Fetch all needed records for auto-solving
    const associates = await Associate.findAll({ where: { status: 'Active' } });
    const associateSkills = await AssociateSkill.findAll();
    const leaveRecords = await LeaveRecord.findAll({ where: { date } });
    const allAllocations = await Allocation.findAll({ where: { date } });

    const currentSolveAllocations: any[] = [];
    let count = 0;

    // Workstations sorted by skill difficulty descending
    const sortedWS = [...lineWS].sort((a, b) => {
      const scoreA = SKILL_LEVEL_VALUE[a.minSkillLevel] || 1;
      const scoreB = SKILL_LEVEL_VALUE[b.minSkillLevel] || 1;
      return scoreB - scoreA;
    });

    // Workload balancer count helper
    const getWorkloadCount = (assocId: string) => {
      const dbCount = allAllocations.filter(a => a.associateId === assocId && a.shiftId !== shiftId).length;
      const solveCount = currentSolveAllocations.filter(a => a.associateId === assocId).length;
      return dbCount + solveCount;
    };

    // Check if employee is scheduled anywhere else on same date
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
        const candidates: { associate: Associate; level: string; score: number }[] = [];

        for (const assoc of associates) {
          // Double-scheduling check: is this employee already scheduled on this day?
          if (isEmployeeScheduledOnDate(assoc.id)) continue;

          // Leave check
          const onLeave = leaveRecords.some(l => l.associateId === assoc.id && (l.shiftId === 'ALL' || l.shiftId === shiftId));
          if (onLeave) continue;

          // Skill check
          const aSkill = associateSkills.find(s => s.associateId === assoc.id && s.skillId === reqSkill);
          if (!aSkill) continue;

          // Expiry check
          if (new Date(aSkill.expiryDate) < new Date(date)) continue;

          // Level checks
          const skillLvlValue = SKILL_LEVEL_VALUE[aSkill.level] || 1;
          if (skillLvlValue < minLvlValue) continue;

          // Compute Base Score: compatibility weights
          let score = skillLvlValue * 10;
          if (assoc.category === 'Company') score += 5;
          else if (assoc.category === 'Contract') score += 3;
          else score += 1;

          // Workload balancer penalty: Subtract 15 points per existing assignment
          const workload = getWorkloadCount(assoc.id);
          score -= workload * 15;

          candidates.push({ associate: assoc, level: aSkill.level, score });
        }

        // Sort candidates by score descending
        candidates.sort((a, b) => b.score - a.score);

        // Staff the best fit candidate
        if (candidates.length > 0) {
          const best = candidates[0].associate;
          const newAlloc = {
            id: `A-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
          currentSolveAllocations.push(newAlloc);
          count++;
        } else {
          // No more eligible candidates for this workstation's slot capacity
          break;
        }
      }
    }

    await logAction("ALLOCATION_CONFIRMED", `Auto-allocated ${count} workstations for Line ${lineId.replace('LINE-', '')} (Shift ${shiftId.replace('SHIFT-', '')}).`);
    res.json({ success: true, allocatedCount: count });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. BULK IMPORT CSV
router.post("/associates/bulk-import", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      res.status(400).json({ success: false, message: "Invalid CSV payload." });
      return;
    }

    const lines = csvContent.split('\n');
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [code, name, category, skillsField] = line.split(',');
      if (!code || !name || !category) continue;

      const cleanCat = category.trim() === 'Company' ? 'Company' : category.trim() === 'NTCI' ? 'NTCI' : 'Contract';

      // Insert/Update Associate
      await Associate.upsert({
        id: code.trim(),
        name: name.trim(),
        category: cleanCat,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        plantIdRef: `PID-${code.trim()}`
      });

      // Clear existing skills for this imported user to avoid duplicate key conflicts
      await AssociateSkill.destroy({ where: { associateId: code.trim() } });

      if (skillsField) {
        const skillsList = skillsField.split(';');
        for (const item of skillsList) {
          const [skillId, lvl, exp] = item.split(':');
          if (!skillId || !lvl) continue;

          await AssociateSkill.create({
            associateId: code.trim(),
            skillId: skillId.trim(),
            level: lvl.trim() as any,
            trainingDate: new Date().toISOString().split('T')[0],
            certifiedBy: 'CSV Importer',
            expiryDate: exp ? exp.trim() : '2027-12-31',
            reCertificationRequired: exp ? new Date(exp) < new Date() : false
          });
        }
      }
      imported++;
    }

    await logAction("MASTER_DATA_UPDATED", `Processed bulk CSV import containing ${imported} associates.`);
    res.json({ success: true, message: `Successfully imported ${imported} associates.`, count: imported });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ATTENDANCE ROUTES
// GET attendance for a specific date + shift
router.get("/attendance", async (req: Request, res: Response) => {
  try {
    const { date, shiftId } = req.query;
    const where: any = {};
    if (date) where.date = date;
    if (shiftId) where.shiftId = shiftId;
    const records = await AttendanceRecord.findAll({ where });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST mark attendance (upsert — one record per associate per shift per date)
router.post("/attendance", async (req: Request, res: Response) => {
  try {
    const { date, shiftId, associateId, status, markedBy } = req.body;
    if (!date || !shiftId || !associateId || !status) {
      res.status(400).json({ success: false, message: 'Missing required fields.' });
      return;
    }
    // Remove existing record for this associate+date+shift if any
    await AttendanceRecord.destroy({ where: { date, shiftId, associateId } });
    // Create fresh record
    await AttendanceRecord.create({
      id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date,
      shiftId,
      associateId,
      status,
      markedBy: markedBy || 'R. Sharma',
      timestamp: new Date().toISOString()
    });
    const assoc = await Associate.findByPk(associateId);
    await logAction('ATTENDANCE_MARKED', `${assoc?.get('name')} marked ${status} for shift ${shiftId} on ${date}.`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SKILL CRUD ROUTES
router.post("/skills", async (req: Request, res: Response) => {
  try {
    const { id, name, description } = req.body;
    if (!id || !name) {
      res.status(400).json({ success: false, message: 'Missing ID or Name.' });
      return;
    }
    const exists = await Skill.findByPk(id);
    if (exists) {
      res.status(400).json({ success: false, message: 'Skill ID already exists.' });
      return;
    }
    const skill = await Skill.create({ id, name, description });
    await logAction('MASTER_DATA_UPDATED', `Created skill ${name} (${id}).`);
    res.json({ success: true, skill });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/skills/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const skill = await Skill.findByPk(id);
    if (!skill) {
      res.status(404).json({ success: false, message: 'Skill not found.' });
      return;
    }
    await skill.update({ name, description });
    await logAction('MASTER_DATA_UPDATED', `Updated skill ${name} (${id}).`);
    res.json({ success: true, skill });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/skills/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const skill = await Skill.findByPk(id);
    if (!skill) {
      res.status(404).json({ success: false, message: 'Skill not found.' });
      return;
    }
    const name = skill.get('name');
    await skill.destroy();
    await logAction('MASTER_DATA_UPDATED', `Deleted skill ${name} (${id}).`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SHIFT CRUD ROUTES
router.post("/shifts", async (req: Request, res: Response) => {
  try {
    const { id, name, timings, workingDays } = req.body;
    if (!id || !name || !timings) {
      res.status(400).json({ success: false, message: 'Missing Shift ID, Name, or Timings.' });
      return;
    }
    const exists = await Shift.findByPk(id);
    if (exists) {
      res.status(400).json({ success: false, message: 'Shift ID already exists.' });
      return;
    }
    const workingDaysStr = Array.isArray(workingDays) ? JSON.stringify(workingDays) : "[]";
    const shift = await Shift.create({ id, name, timings, workingDays: workingDaysStr });
    await logAction('MASTER_DATA_UPDATED', `Created shift ${name} (${id}).`);
    res.json({ success: true, shift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/shifts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, timings, workingDays } = req.body;
    const shift = await Shift.findByPk(id);
    if (!shift) {
      res.status(404).json({ success: false, message: 'Shift not found.' });
      return;
    }
    const workingDaysStr = Array.isArray(workingDays) ? JSON.stringify(workingDays) : JSON.stringify(workingDays || []);
    await shift.update({ name, timings, workingDays: workingDaysStr });
    await logAction('MASTER_DATA_UPDATED', `Updated shift ${name} (${id}).`);
    res.json({ success: true, shift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/shifts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shift = await Shift.findByPk(id);
    if (!shift) {
      res.status(404).json({ success: false, message: 'Shift not found.' });
      return;
    }
    const name = shift.get('name');
    await shift.destroy();
    await logAction('MASTER_DATA_UPDATED', `Deleted shift ${name} (${id}).`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
