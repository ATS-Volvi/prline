"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../../../DB/models/models");
const authHandler_1 = __importDefault(require("../../../middleware/authHandler"));
const getUserType_1 = __importDefault(require("../../../middleware/getUserType"));
const router = (0, express_1.Router)();
// Helper to log audit actions
const logAction = (actionType_1, details_1, ...args_1) => __awaiter(void 0, [actionType_1, details_1, ...args_1], void 0, function* (actionType, details, userId = "admin-user", userRole = "Plant Admin") {
    try {
        yield models_1.AuditLog.create({
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            actionType,
            details,
            userId,
            userRole
        });
    }
    catch (error) {
        console.error("Audit log error:", error);
    }
});
// 1. GET FULL APP STATE
router.get("/state", authHandler_1.default.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const associates = yield models_1.Associate.findAll();
        const skills = yield models_1.Skill.findAll();
        const associateSkills = yield models_1.AssociateSkill.findAll();
        const workstations = yield models_1.Workstation.findAll();
        const productionLines = yield models_1.ProductionLine.findAll();
        const shiftsRaw = yield models_1.Shift.findAll();
        const allocations = yield models_1.Allocation.findAll();
        const leaveRecords = yield models_1.LeaveRecord.findAll();
        const auditLogs = yield models_1.AuditLog.findAll({ order: [['timestamp', 'DESC']] });
        const attendanceRecords = yield models_1.AttendanceRecord.findAll();
        // Parse shift working days JSON
        const shifts = shiftsRaw.map(s => (Object.assign(Object.assign({}, s.toJSON()), { workingDays: JSON.parse(s.workingDays || "[]") })));
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// 2. ASSOCIATES CRUD
router.post("/associates", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { associate, skills } = req.body;
        yield models_1.Associate.create(associate);
        if (skills && Array.isArray(skills)) {
            for (const sk of skills) {
                yield models_1.AssociateSkill.create({
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
        yield logAction("MASTER_DATA_UPDATED", `Created associate ${associate.name} (${associate.id}).`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.put("/associates/:id", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { associate, skills } = req.body;
        yield models_1.Associate.update(associate, { where: { id } });
        // Sync skills
        yield models_1.AssociateSkill.destroy({ where: { associateId: id } });
        if (skills && Array.isArray(skills)) {
            for (const sk of skills) {
                yield models_1.AssociateSkill.create({
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
        yield logAction("MASTER_DATA_UPDATED", `Updated associate ${associate.name} (${id}).`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.delete("/associates/:id", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const assoc = yield models_1.Associate.findByPk(id);
        yield models_1.Associate.destroy({ where: { id } });
        yield models_1.AssociateSkill.destroy({ where: { associateId: id } });
        yield models_1.Allocation.destroy({ where: { associateId: id } });
        yield models_1.LeaveRecord.destroy({ where: { associateId: id } });
        yield logAction("MASTER_DATA_UPDATED", `Removed associate ${assoc === null || assoc === void 0 ? void 0 : assoc.get('name')} (${id}).`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// 3. WORKSTATIONS CRUD
router.post("/workstations", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const workstation = req.body;
        yield models_1.Workstation.create(workstation);
        yield logAction("MASTER_DATA_UPDATED", `Configured workstation ${workstation.name} (${workstation.id}).`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// Workstation bulk import
router.post("/workstations/bulk-import", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { csvContent } = req.body;
        if (!csvContent) {
            res.status(400).json({ success: false, message: "No CSV content provided." });
            return;
        }
        const lines = csvContent.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
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
        const errors = [];
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(",");
            if (parts.length < 3)
                continue;
            const id = (_a = parts[wsIdIdx]) === null || _a === void 0 ? void 0 : _a.trim();
            const name = (_b = parts[nameIdx]) === null || _b === void 0 ? void 0 : _b.trim();
            const lineId = (_c = parts[lineIdIdx]) === null || _c === void 0 ? void 0 : _c.trim();
            const requiredSkillId = skillsIdx !== -1 ? (_d = parts[skillsIdx]) === null || _d === void 0 ? void 0 : _d.trim() : "BLADE_OPT";
            const minSkillLevel = minLvlIdx !== -1 ? (_e = parts[minLvlIdx]) === null || _e === void 0 ? void 0 : _e.trim() : "Operator";
            const maxStaffCount = maxStaffIdx !== -1 ? parseInt((_f = parts[maxStaffIdx]) === null || _f === void 0 ? void 0 : _f.trim()) || 1 : 1;
            if (!id || !name || !lineId) {
                errors.push(`Row ${i + 1}: Missing workstation ID, name or line ID`);
                continue;
            }
            // Check if line exists
            const targetLine = yield models_1.ProductionLine.findByPk(lineId);
            if (!targetLine) {
                errors.push(`Row ${i + 1}: Production line "${lineId}" does not exist`);
                continue;
            }
            // Create or update workstation
            yield models_1.Workstation.upsert({
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
        }
        else {
            yield logAction("MASTER_DATA_UPDATED", `Bulk imported ${importedCount} workstation mappings.`);
            res.json({ success: true, message: `Successfully imported ${importedCount} workstations.`, count: importedCount });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.put("/workstations/:id", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const workstation = req.body;
        yield models_1.Workstation.update(workstation, { where: { id } });
        yield logAction("MASTER_DATA_UPDATED", `Modified workstation ${workstation.name} (${id}).`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.delete("/workstations/:id", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const ws = yield models_1.Workstation.findByPk(id);
        yield models_1.Workstation.destroy({ where: { id } });
        yield models_1.Allocation.destroy({ where: { workstationId: id } });
        yield logAction("MASTER_DATA_UPDATED", `Deleted workstation ${ws === null || ws === void 0 ? void 0 : ws.get('name')} (${id}).`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// 3.1. PRODUCTION LINES CRUD
router.post("/production-lines", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const line = req.body;
        yield models_1.ProductionLine.create(line);
        yield logAction("MASTER_DATA_UPDATED", `Created production line ${line.name} (${line.id}).`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.put("/production-lines/:id", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const line = req.body;
        yield models_1.ProductionLine.update(line, { where: { id } });
        yield logAction("MASTER_DATA_UPDATED", `Updated production line ${line.name} (${id}).`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.delete("/production-lines/:id", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const line = yield models_1.ProductionLine.findByPk(id);
        yield models_1.Workstation.destroy({ where: { lineId: id } });
        yield models_1.Allocation.destroy({ where: { lineId: id } });
        yield models_1.ProductionLine.destroy({ where: { id } });
        yield logAction("MASTER_DATA_UPDATED", `Deleted production line ${line === null || line === void 0 ? void 0 : line.get('name')} (${id}).`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// 4. LEAVE RECORDS
router.post("/leave", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const leave = req.body;
        const id = `LV-${Date.now()}`;
        yield models_1.LeaveRecord.create(Object.assign(Object.assign({}, leave), { id }));
        const assoc = yield models_1.Associate.findByPk(leave.associateId);
        yield logAction("MASTER_DATA_UPDATED", `Logged leave for ${assoc === null || assoc === void 0 ? void 0 : assoc.get('name')} on ${leave.date}.`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.delete("/leave/:id", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const leave = yield models_1.LeaveRecord.findByPk(id);
        yield models_1.LeaveRecord.destroy({ where: { id } });
        if (leave) {
            const assoc = yield models_1.Associate.findByPk(leave.get('associateId'));
            yield logAction("MASTER_DATA_UPDATED", `Cancelled leave for ${assoc === null || assoc === void 0 ? void 0 : assoc.get('name')} on ${leave.get('date')}.`);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// 5. MANUAL ALLOCATE & DEALLOCATE
router.post("/allocation/allocate", authHandler_1.default.authMiddleware, getUserType_1.default.checkReviewer, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, shiftId, lineId, workstationId, associateId, overrideReason } = req.body;
        const ws = yield models_1.Workstation.findByPk(workstationId);
        if (!ws) {
            res.status(404).json({ success: false, message: "Workstation not found." });
            return;
        }
        // 1. Clear any existing allocation for this specific associate on this date and shift (prevent double allocation)
        yield models_1.Allocation.destroy({ where: { date, shiftId, associateId } });
        // 2. Check capacity
        const currentCount = yield models_1.Allocation.count({ where: { date, shiftId, workstationId } });
        if (currentCount >= ws.maxStaffCount) {
            res.status(400).json({ success: false, message: `Workstation is already at full capacity (${ws.maxStaffCount}/${ws.maxStaffCount} operators allocated).` });
            return;
        }
        const newAlloc = yield models_1.Allocation.create({
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
        const assoc = yield models_1.Associate.findByPk(associateId);
        const action = overrideReason ? "OVERRIDE_ALLOCATION" : "ALLOCATION_CONFIRMED";
        const details = overrideReason
            ? `OVERRIDE: ${assoc === null || assoc === void 0 ? void 0 : assoc.get('name')} assigned to ${ws === null || ws === void 0 ? void 0 : ws.get('name')} (Reason: ${overrideReason}).`
            : `Staffed workstation ${ws === null || ws === void 0 ? void 0 : ws.get('name')} with ${assoc === null || assoc === void 0 ? void 0 : assoc.get('name')}.`;
        yield logAction(action, details);
        res.json({ success: true, allocation: newAlloc });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.post("/allocation/deallocate", authHandler_1.default.authMiddleware, getUserType_1.default.checkReviewer, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, shiftId, workstationId, lineId, associateId } = req.body;
        const ws = yield models_1.Workstation.findByPk(workstationId);
        const whereClause = { date, shiftId, workstationId };
        if (associateId) {
            whereClause.associateId = associateId;
        }
        yield models_1.Allocation.destroy({ where: whereClause });
        const suffix = associateId ? ` operator ID ${associateId}` : "";
        yield logAction("ALLOCATION_CONFIRMED", `Deallocated${suffix} from station ${ws === null || ws === void 0 ? void 0 : ws.get('name')} on Line ${lineId.replace('LINE-', '')}.`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// 6. CLEAR ALL ALLOCATIONS
router.post("/allocation/clear", authHandler_1.default.authMiddleware, getUserType_1.default.checkReviewer, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, shiftId, lineId } = req.body;
        yield models_1.Allocation.destroy({ where: { date, shiftId, lineId } });
        yield logAction("ALLOCATION_CONFIRMED", `Cleared all allocations for Line ${lineId.replace('LINE-', '')} for Shift ${shiftId.replace('SHIFT-', '')}.`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// 7. OPTIMIZED AUTO-ALLOCATION ALGORITHM
const SKILL_LEVEL_VALUE = {
    'Trainee': 1,
    'Operator': 2,
    'Certified': 3,
    'Expert': 4
};
router.post("/allocation/auto-allocate", authHandler_1.default.authMiddleware, getUserType_1.default.checkReviewer, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, shiftId, lineId } = req.body;
        const lineWS = yield models_1.Workstation.findAll({ where: { lineId } });
        if (lineWS.length === 0) {
            res.json({ success: false, allocatedCount: 0 });
            return;
        }
        // Clear existing allocations for this shift/line/date
        yield models_1.Allocation.destroy({ where: { date, shiftId, lineId } });
        // Fetch all needed records for auto-solving
        const associates = yield models_1.Associate.findAll({ where: { status: 'Active' } });
        const associateSkills = yield models_1.AssociateSkill.findAll();
        const leaveRecords = yield models_1.LeaveRecord.findAll({ where: { date } });
        const allAllocations = yield models_1.Allocation.findAll({ where: { date } });
        const currentSolveAllocations = [];
        let count = 0;
        // Workstations sorted by skill difficulty descending
        const sortedWS = [...lineWS].sort((a, b) => {
            const scoreA = SKILL_LEVEL_VALUE[a.minSkillLevel] || 1;
            const scoreB = SKILL_LEVEL_VALUE[b.minSkillLevel] || 1;
            return scoreB - scoreA;
        });
        // Workload balancer count helper
        const getWorkloadCount = (assocId) => {
            const dbCount = allAllocations.filter(a => a.associateId === assocId && a.shiftId !== shiftId).length;
            const solveCount = currentSolveAllocations.filter(a => a.associateId === assocId).length;
            return dbCount + solveCount;
        };
        // Check if employee is scheduled anywhere else on same date
        const isEmployeeScheduledOnDate = (assocId) => {
            const dbScheduled = allAllocations.some(a => a.associateId === assocId);
            const solveScheduled = currentSolveAllocations.some(a => a.associateId === assocId);
            return dbScheduled || solveScheduled;
        };
        for (const ws of sortedWS) {
            const reqSkill = ws.requiredSkillId;
            const minLvlValue = SKILL_LEVEL_VALUE[ws.minSkillLevel] || 1;
            const capacity = ws.maxStaffCount || 1;
            for (let slot = 0; slot < capacity; slot++) {
                const candidates = [];
                for (const assoc of associates) {
                    // Double-scheduling check: is this employee already scheduled on this day?
                    if (isEmployeeScheduledOnDate(assoc.id))
                        continue;
                    // Leave check
                    const onLeave = leaveRecords.some(l => l.associateId === assoc.id && (l.shiftId === 'ALL' || l.shiftId === shiftId));
                    if (onLeave)
                        continue;
                    // Skill check
                    const aSkill = associateSkills.find(s => s.associateId === assoc.id && s.skillId === reqSkill);
                    if (!aSkill)
                        continue;
                    // Expiry check
                    if (new Date(aSkill.expiryDate) < new Date(date))
                        continue;
                    // Level checks
                    const skillLvlValue = SKILL_LEVEL_VALUE[aSkill.level] || 1;
                    if (skillLvlValue < minLvlValue)
                        continue;
                    // Compute Base Score: compatibility weights
                    let score = skillLvlValue * 10;
                    if (assoc.category === 'Company')
                        score += 5;
                    else if (assoc.category === 'Contract')
                        score += 3;
                    else
                        score += 1;
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
                    yield models_1.Allocation.create(newAlloc);
                    currentSolveAllocations.push(newAlloc);
                    count++;
                }
                else {
                    // No more eligible candidates for this workstation's slot capacity
                    break;
                }
            }
        }
        yield logAction("ALLOCATION_CONFIRMED", `Auto-allocated ${count} workstations for Line ${lineId.replace('LINE-', '')} (Shift ${shiftId.replace('SHIFT-', '')}).`);
        res.json({ success: true, allocatedCount: count });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// 8. BULK IMPORT CSV
router.post("/associates/bulk-import", authHandler_1.default.authMiddleware, getUserType_1.default.checkSecAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            if (!line)
                continue;
            const [code, name, category, skillsField] = line.split(',');
            if (!code || !name || !category)
                continue;
            const cleanCat = category.trim() === 'Company' ? 'Company' : category.trim() === 'NTCI' ? 'NTCI' : 'Contract';
            // Insert/Update Associate
            yield models_1.Associate.upsert({
                id: code.trim(),
                name: name.trim(),
                category: cleanCat,
                joiningDate: new Date().toISOString().split('T')[0],
                status: 'Active',
                plantIdRef: `PID-${code.trim()}`
            });
            // Clear existing skills for this imported user to avoid duplicate key conflicts
            yield models_1.AssociateSkill.destroy({ where: { associateId: code.trim() } });
            if (skillsField) {
                const skillsList = skillsField.split(';');
                for (const item of skillsList) {
                    const [skillId, lvl, exp] = item.split(':');
                    if (!skillId || !lvl)
                        continue;
                    yield models_1.AssociateSkill.create({
                        associateId: code.trim(),
                        skillId: skillId.trim(),
                        level: lvl.trim(),
                        trainingDate: new Date().toISOString().split('T')[0],
                        certifiedBy: 'CSV Importer',
                        expiryDate: exp ? exp.trim() : '2027-12-31',
                        reCertificationRequired: exp ? new Date(exp) < new Date() : false
                    });
                }
            }
            imported++;
        }
        yield logAction("MASTER_DATA_UPDATED", `Processed bulk CSV import containing ${imported} associates.`);
        res.json({ success: true, message: `Successfully imported ${imported} associates.`, count: imported });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// ATTENDANCE ROUTES
// GET attendance for a specific date + shift
router.get("/attendance", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, shiftId } = req.query;
        const where = {};
        if (date)
            where.date = date;
        if (shiftId)
            where.shiftId = shiftId;
        const records = yield models_1.AttendanceRecord.findAll({ where });
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// POST mark attendance (upsert — one record per associate per shift per date)
router.post("/attendance", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date, shiftId, associateId, status, markedBy } = req.body;
        if (!date || !shiftId || !associateId || !status) {
            res.status(400).json({ success: false, message: 'Missing required fields.' });
            return;
        }
        // Remove existing record for this associate+date+shift if any
        yield models_1.AttendanceRecord.destroy({ where: { date, shiftId, associateId } });
        // Create fresh record
        yield models_1.AttendanceRecord.create({
            id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date,
            shiftId,
            associateId,
            status,
            markedBy: markedBy || 'R. Sharma',
            timestamp: new Date().toISOString()
        });
        const assoc = yield models_1.Associate.findByPk(associateId);
        yield logAction('ATTENDANCE_MARKED', `${assoc === null || assoc === void 0 ? void 0 : assoc.get('name')} marked ${status} for shift ${shiftId} on ${date}.`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// SKILL CRUD ROUTES
router.post("/skills", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, name, description } = req.body;
        if (!id || !name) {
            res.status(400).json({ success: false, message: 'Missing ID or Name.' });
            return;
        }
        const exists = yield models_1.Skill.findByPk(id);
        if (exists) {
            res.status(400).json({ success: false, message: 'Skill ID already exists.' });
            return;
        }
        const skill = yield models_1.Skill.create({ id, name, description });
        yield logAction('MASTER_DATA_UPDATED', `Created skill ${name} (${id}).`);
        res.json({ success: true, skill });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.put("/skills/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const skill = yield models_1.Skill.findByPk(id);
        if (!skill) {
            res.status(404).json({ success: false, message: 'Skill not found.' });
            return;
        }
        yield skill.update({ name, description });
        yield logAction('MASTER_DATA_UPDATED', `Updated skill ${name} (${id}).`);
        res.json({ success: true, skill });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.delete("/skills/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const skill = yield models_1.Skill.findByPk(id);
        if (!skill) {
            res.status(404).json({ success: false, message: 'Skill not found.' });
            return;
        }
        const name = skill.get('name');
        yield skill.destroy();
        yield logAction('MASTER_DATA_UPDATED', `Deleted skill ${name} (${id}).`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// SHIFT CRUD ROUTES
router.post("/shifts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, name, timings, workingDays } = req.body;
        if (!id || !name || !timings) {
            res.status(400).json({ success: false, message: 'Missing Shift ID, Name, or Timings.' });
            return;
        }
        const exists = yield models_1.Shift.findByPk(id);
        if (exists) {
            res.status(400).json({ success: false, message: 'Shift ID already exists.' });
            return;
        }
        const workingDaysStr = Array.isArray(workingDays) ? JSON.stringify(workingDays) : "[]";
        const shift = yield models_1.Shift.create({ id, name, timings, workingDays: workingDaysStr });
        yield logAction('MASTER_DATA_UPDATED', `Created shift ${name} (${id}).`);
        res.json({ success: true, shift });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.put("/shifts/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, timings, workingDays } = req.body;
        const shift = yield models_1.Shift.findByPk(id);
        if (!shift) {
            res.status(404).json({ success: false, message: 'Shift not found.' });
            return;
        }
        const workingDaysStr = Array.isArray(workingDays) ? JSON.stringify(workingDays) : JSON.stringify(workingDays || []);
        yield shift.update({ name, timings, workingDays: workingDaysStr });
        yield logAction('MASTER_DATA_UPDATED', `Updated shift ${name} (${id}).`);
        res.json({ success: true, shift });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
router.delete("/shifts/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const shift = yield models_1.Shift.findByPk(id);
        if (!shift) {
            res.status(404).json({ success: false, message: 'Shift not found.' });
            return;
        }
        const name = shift.get('name');
        yield shift.destroy();
        yield logAction('MASTER_DATA_UPDATED', `Deleted shift ${name} (${id}).`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
// AUDIT LOGS POST ROUTE
router.post("/audit-logs", authHandler_1.default.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { actionType, details } = req.body;
        if (!actionType || !details) {
            res.status(400).json({ success: false, message: 'Missing actionType or details.' });
            return;
        }
        const userId = ((_a = req.authData) === null || _a === void 0 ? void 0 : _a.userId) || "unknown-user";
        const userRole = ((_b = req.authData) === null || _b === void 0 ? void 0 : _b.userType) || "unknown-role";
        yield logAction(actionType, details, userId, userRole);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));
exports.default = router;
