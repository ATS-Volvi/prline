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
  LeaveRecord as LeaveRecordType, // avoid clash if any
  AttendanceRecord
} from "../../../../database/models/models/models";
import AuthHandler from "../../../middleware/authHandler";
import UserTypeHandler from "../../../middleware/getUserType";
import { logAction } from "../../../src/services/auditService";
import * as allocationController from "../../../src/controllers/allocationController";
import * as dataController from "../../../src/controllers/dataController";
import * as reportsController from "../../../src/controllers/reportsController";
import * as planningController from "../../../src/controllers/planningController";

const router = Router();


// 1. GET FULL APP STATE (Deprecated, keeping for backwards compatibility)
router.get("/state", AuthHandler.authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.authData?.userId;
    const associates = await Associate.findAll({ where: { userId } });
    const skills = await Skill.findAll({ where: { userId } });
    const associateSkills = await AssociateSkill.findAll({ where: { userId } });
    const workstations = await Workstation.findAll({ where: { userId } });
    const productionLines = await ProductionLine.findAll({ where: { userId } });
    const shiftsRaw = await Shift.findAll({ where: { userId } });
    const allocations = await Allocation.findAll({ where: { userId } });
    const leaveRecords = await LeaveRecord.findAll({ where: { userId } });
    const auditLogs = await AuditLog.findAll({ where: { userId }, order: [['timestamp', 'DESC']] });
    const attendanceRecords = await AttendanceRecord.findAll({ where: { userId } });

    // Parse shift working days JSON
    const shifts = shiftsRaw.map((s: any) => ({
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

// Granular GET Endpoints
router.get("/associates", AuthHandler.authMiddleware, dataController.getAssociates);
router.get("/skills", AuthHandler.authMiddleware, dataController.getSkills);
router.get("/associate-skills", AuthHandler.authMiddleware, dataController.getAssociateSkills);
router.get("/workstations", AuthHandler.authMiddleware, dataController.getWorkstations);
router.get("/production-lines", AuthHandler.authMiddleware, dataController.getProductionLines);
router.get("/shifts", AuthHandler.authMiddleware, dataController.getShifts);
router.get("/allocations", AuthHandler.authMiddleware, dataController.getAllocations);
router.get("/audit-logs", AuthHandler.authMiddleware, dataController.getAuditLogs);
router.get("/leave", AuthHandler.authMiddleware, dataController.getLeaveRecords);


// 2. ASSOCIATES CRUD
router.post("/associates", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { associate, skills } = req.body;
    const userId = req.authData?.userId;
    await Associate.create({ ...associate, userId });

    if (skills && Array.isArray(skills)) {
      for (const sk of skills) {
        await AssociateSkill.create({
          associateId: associate.id,
          userId,
          skillId: sk.skillId,
          level: sk.level,
          trainingDate: new Date().toISOString().split('T')[0],
          certifiedBy: 'Supervisor Manager',
          expiryDate: sk.expiryDate,
          reCertificationRequired: new Date(sk.expiryDate) < new Date()
        });
      }
    }
    await logAction("MASTER_DATA_UPDATED", `Created associate ${associate.name} (${associate.id}).`, userId, req.authData?.userType || "sec_admin");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/associates/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { associate, skills } = req.body;
    const userId = req.authData?.userId;

    await Associate.update(associate, { where: { id, userId } });

    // Sync skills
    await AssociateSkill.destroy({ where: { associateId: id, userId } });
    if (skills && Array.isArray(skills)) {
      for (const sk of skills) {
        await AssociateSkill.create({
          associateId: id,
          userId,
          skillId: sk.skillId,
          level: sk.level,
          trainingDate: new Date().toISOString().split('T')[0],
          certifiedBy: 'Supervisor Manager',
          expiryDate: sk.expiryDate,
          reCertificationRequired: new Date(sk.expiryDate) < new Date()
        });
      }
    }
    await logAction("MASTER_DATA_UPDATED", `Updated associate ${associate.name} (${id}).`, userId, req.authData?.userType || "sec_admin");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/associates/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.authData?.userId;
    const assoc = await Associate.findOne({ where: { id, userId } });
    await Associate.destroy({ where: { id, userId } });
    await AssociateSkill.destroy({ where: { associateId: id, userId } });
    await Allocation.destroy({ where: { associateId: id, userId } });
    await LeaveRecord.destroy({ where: { associateId: id, userId } });

    await logAction("MASTER_DATA_UPDATED", `Removed associate ${assoc?.get('name')} (${id}).`, userId, req.authData?.userType || "sec_admin");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. WORKSTATIONS CRUD
router.post("/workstations", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const workstation = req.body;
    const userId = req.authData?.userId;
    await Workstation.create({ ...workstation, userId });
    await logAction("MASTER_DATA_UPDATED", `Configured workstation ${workstation.name} (${workstation.id}).`, userId, req.authData?.userType || "sec_admin");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Workstation bulk import
router.post("/workstations/bulk-import", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { csvContent } = req.body;
    const userId = req.authData?.userId;
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
      const targetLine = await ProductionLine.findOne({ where: { id: lineId, userId } });
      if (!targetLine) {
        errors.push(`Row ${i + 1}: Production line "${lineId}" does not exist`);
        continue;
      }

      // Create or update workstation
      await Workstation.upsert({
        id,
        userId,
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
      await logAction("MASTER_DATA_UPDATED", `Bulk imported ${importedCount} workstation mappings.`, userId, req.authData?.userType || "sec_admin");
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
    const userId = req.authData?.userId;
    await Workstation.update(workstation, { where: { id, userId } });
    await logAction("MASTER_DATA_UPDATED", `Modified workstation ${workstation.name} (${id}).`, userId, req.authData?.userType || "sec_admin");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/workstations/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.authData?.userId;
    const ws = await Workstation.findOne({ where: { id, userId } });
    await Workstation.destroy({ where: { id, userId } });
    await Allocation.destroy({ where: { workstationId: id, userId } });

    await logAction("MASTER_DATA_UPDATED", `Deleted workstation ${ws?.get('name')} (${id}).`, userId, req.authData?.userType || "sec_admin");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3.1. PRODUCTION LINES CRUD
router.post("/production-lines", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const line = req.body;
    const userId = req.authData?.userId;
    await ProductionLine.create({ ...line, userId });
    await logAction("MASTER_DATA_UPDATED", `Created production line ${line.name} (${line.id}).`, userId, req.authData?.userType || "sec_admin");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/production-lines/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const line = req.body;
    const userId = req.authData?.userId;
    await ProductionLine.update(line, { where: { id, userId } });
    await logAction("MASTER_DATA_UPDATED", `Updated production line ${line.name} (${id}).`, userId, req.authData?.userType || "sec_admin");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/production-lines/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.authData?.userId;
    const line = await ProductionLine.findOne({ where: { id, userId } });
    await Workstation.destroy({ where: { lineId: id, userId } });
    await Allocation.destroy({ where: { lineId: id, userId } });
    await ProductionLine.destroy({ where: { id, userId } });
    await logAction("MASTER_DATA_UPDATED", `Deleted production line ${line?.get('name')} (${id}).`, userId, req.authData?.userType || "sec_admin");
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
    const userId = req.authData?.userId;
    await LeaveRecord.create({ ...leave, id, userId });
    const assoc = await Associate.findOne({ where: { id: leave.associateId, userId } });
    await logAction("MASTER_DATA_UPDATED", `Logged leave for ${assoc?.get('name')} on ${leave.date}.`, userId, req.authData?.userType || "sec_admin");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/leave/:id", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.authData?.userId;
    const leave = await LeaveRecord.findOne({ where: { id, userId } });
    await LeaveRecord.destroy({ where: { id, userId } });
    if (leave) {
      const assoc = await Associate.findOne({ where: { id: leave.get('associateId') as string, userId } });
      await logAction("MASTER_DATA_UPDATED", `Cancelled leave for ${assoc?.get('name')} on ${leave.get('date')}.`, userId, req.authData?.userType || "sec_admin");
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. MANUAL ALLOCATE & DEALLOCATE
router.post("/allocation/allocate", AuthHandler.authMiddleware, UserTypeHandler.checkReviewer, allocationController.allocate);
router.post("/allocation/deallocate", AuthHandler.authMiddleware, UserTypeHandler.checkReviewer, allocationController.deallocate);

// 6. CLEAR ALL ALLOCATIONS
router.post("/allocation/clear", AuthHandler.authMiddleware, UserTypeHandler.checkReviewer, allocationController.clear);

// 7. OPTIMIZED AUTO-ALLOCATION ALGORITHM
router.post("/allocation/auto-allocate", AuthHandler.authMiddleware, UserTypeHandler.checkReviewer, allocationController.autoAllocateController);


// 8. BULK IMPORT CSV
router.post("/associates/bulk-import", AuthHandler.authMiddleware, UserTypeHandler.checkSecAdmin, async (req: Request, res: Response) => {
  try {
    const { csvContent } = req.body;
    const userId = req.authData?.userId;
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
        userId,
        name: name.trim(),
        category: cleanCat,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        plantIdRef: `PID-${code.trim()}`
      });

      // Clear existing skills for this imported user to avoid duplicate key conflicts
      await AssociateSkill.destroy({ where: { associateId: code.trim(), userId } });

      if (skillsField) {
        const skillsList = skillsField.split(';');
        for (const item of skillsList) {
          const [skillId, lvl, exp] = item.split(':');
          if (!skillId || !lvl) continue;

          await AssociateSkill.create({
            associateId: code.trim(),
            userId,
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

    await logAction("MASTER_DATA_UPDATED", `Processed bulk CSV import containing ${imported} associates.`, userId, req.authData?.userType || "sec_admin");
    res.json({ success: true, message: `Successfully imported ${imported} associates.`, count: imported });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ATTENDANCE ROUTES
// GET attendance for a specific date + shift
router.get("/attendance", AuthHandler.authMiddleware, async (req: Request, res: Response) => {
  try {
    const { date, shiftId } = req.query;
    const userId = req.authData?.userId;
    const where: any = { userId };
    if (date) where.date = date;
    if (shiftId) where.shiftId = shiftId;
    const records = await AttendanceRecord.findAll({ where });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST mark attendance (upsert — one record per associate per shift per date)
router.post("/attendance", AuthHandler.authMiddleware, async (req: Request, res: Response) => {
  try {
    const { date, shiftId, associateId, status, markedBy } = req.body;
    const userId = req.authData?.userId;
    if (!date || !shiftId || !associateId || !status) {
      res.status(400).json({ success: false, message: 'Missing required fields.' });
      return;
    }
    // Remove existing record for this associate+date+shift if any
    await AttendanceRecord.destroy({ where: { date, shiftId, associateId, userId } });
    // Create fresh record
    await AttendanceRecord.create({
      id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      date,
      shiftId,
      associateId,
      status,
      markedBy: markedBy || 'R. Sharma',
      timestamp: new Date().toISOString()
    });
    const assoc = await Associate.findOne({ where: { id: associateId, userId } });
    await logAction('ATTENDANCE_MARKED', `${assoc?.get('name')} marked ${status} for shift ${shiftId} on ${date}.`, userId, req.authData?.userType || "reviewer");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SKILL CRUD ROUTES
router.post("/skills", AuthHandler.authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, name, description } = req.body;
    const userId = req.authData?.userId;
    if (!id || !name) {
      res.status(400).json({ success: false, message: 'Missing ID or Name.' });
      return;
    }
    const exists = await Skill.findOne({ where: { id, userId } });
    if (exists) {
      res.status(400).json({ success: false, message: 'Skill ID already exists.' });
      return;
    }
    const skill = await Skill.create({ id, userId, name, description });
    await logAction('MASTER_DATA_UPDATED', `Created skill ${name} (${id}).`, userId, req.authData?.userType || "reviewer");
    res.json({ success: true, skill });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/skills/:id", AuthHandler.authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.authData?.userId;
    const skill = await Skill.findOne({ where: { id, userId } });
    if (!skill) {
      res.status(404).json({ success: false, message: 'Skill not found.' });
      return;
    }
    await skill.update({ name, description });
    await logAction('MASTER_DATA_UPDATED', `Updated skill ${name} (${id}).`, userId, req.authData?.userType || "reviewer");
    res.json({ success: true, skill });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/skills/:id", AuthHandler.authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.authData?.userId;
    const skill = await Skill.findOne({ where: { id, userId } });
    if (!skill) {
      res.status(404).json({ success: false, message: 'Skill not found.' });
      return;
    }
    const name = skill.get('name');
    await skill.destroy();
    await logAction('MASTER_DATA_UPDATED', `Deleted skill ${name} (${id}).`, userId, req.authData?.userType || "reviewer");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SHIFT CRUD ROUTES
router.post("/shifts", AuthHandler.authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, name, timings, workingDays } = req.body;
    const userId = req.authData?.userId;
    if (!id || !name || !timings) {
      res.status(400).json({ success: false, message: 'Missing Shift ID, Name, or Timings.' });
      return;
    }
    const exists = await Shift.findOne({ where: { id, userId } });
    if (exists) {
      res.status(400).json({ success: false, message: 'Shift ID already exists.' });
      return;
    }
    const workingDaysStr = Array.isArray(workingDays) ? JSON.stringify(workingDays) : "[]";
    const shift = await Shift.create({ id, userId, name, timings, workingDays: workingDaysStr });
    await logAction('MASTER_DATA_UPDATED', `Created shift ${name} (${id}).`, userId, req.authData?.userType || "reviewer");
    res.json({ success: true, shift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/shifts/:id", AuthHandler.authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, timings, workingDays } = req.body;
    const userId = req.authData?.userId;
    const shift = await Shift.findOne({ where: { id, userId } });
    if (!shift) {
      res.status(404).json({ success: false, message: 'Shift not found.' });
      return;
    }
    const workingDaysStr = Array.isArray(workingDays) ? JSON.stringify(workingDays) : JSON.stringify(workingDays || []);
    await shift.update({ name, timings, workingDays: workingDaysStr });
    await logAction('MASTER_DATA_UPDATED', `Updated shift ${name} (${id}).`, userId, req.authData?.userType || "reviewer");
    res.json({ success: true, shift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/shifts/:id", AuthHandler.authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.authData?.userId;
    const shift = await Shift.findOne({ where: { id, userId } });
    if (!shift) {
      res.status(404).json({ success: false, message: 'Shift not found.' });
      return;
    }
    const name = shift.get('name');
    await shift.destroy();
    await logAction('MASTER_DATA_UPDATED', `Deleted shift ${name} (${id}).`, userId, req.authData?.userType || "reviewer");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// AUDIT LOGS POST ROUTE
router.post("/audit-logs", AuthHandler.authMiddleware, async (req: Request, res: Response) => {
  try {
    const { actionType, details } = req.body;
    if (!actionType || !details) {
      res.status(400).json({ success: false, message: 'Missing actionType or details.' });
      return;
    }
    const userId = req.authData?.userId || "unknown-user";
    const userRole = req.authData?.userType || "unknown-role";
    await logAction(actionType, details, userId, userRole);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// RAG CHAT REPORT ROUTE
router.post("/reports/rag-chat", AuthHandler.authMiddleware, reportsController.ragChatController);
router.get("/reports/rag-status", AuthHandler.authMiddleware, reportsController.ragStatusController);

// PRODUCTION & MANPOWER PLANNING ROUTES
router.get("/planning/assumptions", AuthHandler.authMiddleware, planningController.getAssumptions);
router.put("/planning/assumptions", AuthHandler.authMiddleware, planningController.updateAssumptions);
router.get("/planning/plan", AuthHandler.authMiddleware, planningController.getPlan);
router.get("/planning/manpower", AuthHandler.authMiddleware, planningController.getManpowerPlan);
router.post("/planning/actuals", AuthHandler.authMiddleware, planningController.logActual);
router.get("/planning/variance", AuthHandler.authMiddleware, planningController.getVariance);

export default router;
