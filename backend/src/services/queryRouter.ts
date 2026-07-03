import { Op } from 'sequelize';
import { 
  AssociateSkill, 
  Associate, 
  Skill, 
  Workstation, 
  Allocation, 
  LeaveRecord, 
  ProductionLine 
} from '../../../database/models/models/models';

export type StructuredIntent =
  | 'expired_certifications'
  | 'understaffed_workstations'
  | 'upcoming_leave'
  | 'skill_coverage_gap'
  | null;

export function classifyIntent(query: string): StructuredIntent {
  const q = query.toLowerCase();
  if (q.match(/expired|laps(ed)?|overdue/) && q.match(/cert|skill|training/)) return 'expired_certifications';
  if (q.match(/understaff|short.?staff|not enough|coverage gap|unfilled|vacant/)) return 'understaffed_workstations';
  if (q.match(/on leave|absent|off (next|this) week|who.?s out/)) return 'upcoming_leave';
  if (q.match(/lack.*skill|missing.*skill|not (qualified|certified) for/)) return 'skill_coverage_gap';
  return null;
}

export async function handle(intent: StructuredIntent, userId: string, filters: any) {
  // Determine reference date using latest allocation date (or fallback to today)
  const latestAlloc = await Allocation.findOne({
    where: { userId },
    order: [['date', 'DESC']]
  });
  const referenceDate = latestAlloc ? latestAlloc.date : new Date().toISOString().split('T')[0];

  switch (intent) {
    case 'expired_certifications':
      return await handleExpiredCertifications(userId, referenceDate, filters);
    case 'understaffed_workstations':
      return await handleUnderstaffedWorkstations(userId, referenceDate, filters);
    case 'upcoming_leave':
      return await handleUpcomingLeave(userId, referenceDate, filters);
    case 'skill_coverage_gap':
      return await handleSkillCoverageGap(userId, referenceDate, filters);
    default:
      throw new Error(`Unhandled intent: ${intent}`);
  }
}

async function handleExpiredCertifications(userId: string, referenceDate: string, filters: any) {
  const certs = await AssociateSkill.findAll({
    where: {
      userId,
      expiryDate: { [Op.lt]: referenceDate }
    },
    include: [
      { model: Associate, as: 'associate', required: true },
      { model: Skill, as: 'skill', required: true }
    ],
    order: [['expiryDate', 'ASC']]
  });

  const seen = new Set<string>();
  let rows = certs.reduce((acc: any[], c: any) => {
    const key = `${c.associateId}-${c.skillId}`;
    if (seen.has(key)) return acc;
    seen.add(key);

    const expDate = new Date(c.expiryDate);
    const refDate = new Date(referenceDate);
    const diffTime = refDate.getTime() - expDate.getTime();
    const daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    acc.push({
      id: `cert-${c.associateId}-${c.skillId}`,
      associateName: c.associate?.name || 'Unknown',
      associateId: c.associateId,
      skillName: c.skill?.name || 'Unknown',
      expiryDate: c.expiryDate,
      daysOverdue,
      summary: `Associate ${c.associate?.name} (${c.associateId}) holds expired certification for ${c.skill?.name} (expired ${daysOverdue} days ago)`
    });
    return acc;
  }, []);

  // Optional: filter by Line ID if allocations are scoped
  if (filters.lineId && filters.lineId !== 'ALL') {
    const allocations = await Allocation.findAll({
      where: { userId, date: referenceDate, lineId: filters.lineId }
    });
    const allocatedAssocIds = new Set(allocations.map((a: any) => a.associateId));
    rows = rows.filter((r: any) => allocatedAssocIds.has(r.associateId));
  }

  // Text answer
  let answer = `### 🔴 Expired Operator Certifications\n\n`;
  if (rows.length === 0) {
    answer += `All active operators have valid certifications.\n`;
  } else {
    answer += `I found **${rows.length}** expired certification(s) requiring immediate recertification:\n\n`;
    answer += `| Operator | Certified Skill | Expiry Date | Status |\n`;
    answer += `| :--- | :--- | :--- | :--- |\n`;
    rows.forEach(r => {
      answer += `| **${r.associateName}** (ID: ${r.associateId}) | ${r.skillName} | ${r.expiryDate} | 🔴 Expired ${r.daysOverdue} days ago |\n`;
    });
  }

  // Chart
  const skillCounts: Record<string, number> = {};
  rows.forEach(r => {
    skillCounts[r.skillName] = (skillCounts[r.skillName] || 0) + 1;
  });
  const chartData = Object.entries(skillCounts).map(([name, count]) => ({ name, Count: count }));

  const chart = chartData.length > 0 ? {
    type: 'bar',
    title: 'Expirations count by Skill Type',
    data: chartData,
    xKey: 'name',
    bars: [{ key: 'Count', color: '#f43f5e' }]
  } : null;

  return { answer, rows, chart };
}

async function handleUnderstaffedWorkstations(userId: string, referenceDate: string, filters: any) {
  const lines = await ProductionLine.findAll({
    where: {
      userId,
      status: 'ACTIVE',
      ...(filters.lineId && filters.lineId !== 'ALL' ? { id: filters.lineId } : {})
    }
  });
  const lineIds = lines.map((l: any) => l.id);

  const workstations = await Workstation.findAll({
    where: {
      userId,
      lineId: { [Op.in]: lineIds }
    }
  });

  const allocations = await Allocation.findAll({
    where: {
      userId,
      date: referenceDate,
      lineId: { [Op.in]: lineIds }
    }
  });

  const rows: any[] = [];
  workstations.forEach((ws: any) => {
    const wsAllocs = allocations.filter((a: any) => a.workstationId === ws.id);
    const assignedCount = wsAllocs.length;
    const requiredCount = ws.maxStaffCount || 1;
    if (assignedCount < requiredCount) {
      const line = lines.find((l: any) => l.id === ws.lineId);
      rows.push({
        id: `ws-${ws.id}`,
        workstationName: ws.name,
        workstationId: ws.id,
        lineId: ws.lineId,
        lineName: line ? line.name.split(' - ')[0] : 'Unknown',
        assignedCount,
        requiredCount,
        summary: `Workstation ${ws.name} on ${line ? line.name : ws.lineId} is understaffed: ${assignedCount}/${requiredCount} operators assigned`
      });
    }
  });

  let answer = `### ⚠️ Understaffed Workstations\n\n`;
  if (rows.length === 0) {
    answer += `All active line workstations are fully staffed.\n`;
  } else {
    answer += `I detected **${rows.length}** understaffed workstation(s) for date **${referenceDate}**:\n\n`;
    answer += `| Workstation | Production Line | Assigned Count | Capacity | Status |\n`;
    answer += `| :--- | :--- | :--- | :--- | :--- |\n`;
    rows.forEach(r => {
      answer += `| **${r.workstationName}** | ${r.lineName} | ${r.assignedCount} | ${r.requiredCount} | 🟡 Understaffed |\n`;
    });
  }

  const chartData = rows.map(r => ({
    name: r.workstationName,
    Assigned: r.assignedCount,
    Required: r.requiredCount
  }));

  const chart = chartData.length > 0 ? {
    type: 'bar',
    title: 'Assigned vs Required Staffing',
    data: chartData,
    xKey: 'name',
    bars: [{ key: 'Assigned', color: '#f59e0b' }, { key: 'Required', color: '#64748b' }]
  } : null;

  return { answer, rows, chart };
}

async function handleUpcomingLeave(userId: string, referenceDate: string, filters: any) {
  // Parse date range: default to next 7 days
  const dateFrom = filters.dateFrom || referenceDate;
  const dateTo = filters.dateTo || new Date(new Date(dateFrom).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const leaves = await LeaveRecord.findAll({
    where: {
      userId,
      date: {
        [Op.between]: [dateFrom, dateTo]
      }
    },
    include: [
      { model: Associate, as: 'associate', required: true }
    ],
    order: [['date', 'ASC']]
  });

  const seenLeaves = new Set<string>();
  const rows = leaves.reduce((acc: any[], l: any) => {
    const key = `${l.associateId}-${l.date}`;
    if (seenLeaves.has(key)) return acc;
    seenLeaves.add(key);

    acc.push({
      id: `leave-${l.id}`,
      associateName: l.associate?.name || 'Unknown',
      associateId: l.associateId,
      date: l.date,
      reason: l.reason,
      summary: `${l.associate?.name} (${l.associateId}) is on leave on ${l.date} (Reason: ${l.reason})`
    });
    return acc;
  }, []);

  let answer = `### 📋 Upcoming Operator Leaves (${dateFrom} to ${dateTo})\n\n`;
  if (rows.length === 0) {
    answer += `No operators are scheduled for leave during this date range.\n`;
  } else {
    answer += `The following **${rows.length}** leaves are registered:\n\n`;
    answer += `| Date | Operator | Reason | Status |\n`;
    answer += `| :--- | :--- | :--- | :--- |\n`;
    rows.forEach(r => {
      answer += `| **${r.date}** | ${r.associateName} (ID: ${r.associateId}) | ${r.reason} | Approved |\n`;
    });
  }

  // Count leaves by date
  const dateCounts: Record<string, number> = {};
  rows.forEach(r => {
    dateCounts[r.date] = (dateCounts[r.date] || 0) + 1;
  });
  const chartData = Object.entries(dateCounts).map(([name, count]) => ({ name, Absences: count })).sort((a, b) => a.name.localeCompare(b.name));

  const chart = chartData.length > 0 ? {
    type: 'bar',
    title: 'Leaves count by Date',
    data: chartData,
    xKey: 'name',
    bars: [{ key: 'Absences', color: '#f59e0b' }]
  } : null;

  return { answer, rows, chart };
}

async function handleSkillCoverageGap(userId: string, referenceDate: string, filters: any) {
  const levelValues: Record<string, number> = {
    'Trainee': 1,
    'Operator': 2,
    'Certified': 3,
    'Expert': 4
  };

  const allocations = await Allocation.findAll({
    where: {
      userId,
      date: referenceDate,
      ...(filters.lineId && filters.lineId !== 'ALL' ? { lineId: filters.lineId } : {})
    }
  });

  const associates = await Associate.findAll({ where: { userId } });
  const workstations = await Workstation.findAll({ where: { userId } });
  const associateSkills = await AssociateSkill.findAll({ where: { userId } });
  const skills = await Skill.findAll({ where: { userId } });
  const lines = await ProductionLine.findAll({ where: { userId } });

  const rows: any[] = [];
  const seenGaps = new Set<string>();

  allocations.forEach((a: any) => {
    const ws = workstations.find((w: any) => w.id === a.workstationId);
    if (!ws) return;
    const assoc = associates.find((as: any) => as.id === a.associateId);
    if (!assoc) return;

    const key = `${a.associateId}-${ws.id}`;
    if (seenGaps.has(key)) return;

    const assocSkill = associateSkills.find((s: any) => s.associateId === a.associateId && s.skillId === ws.requiredSkillId);
    const skill = skills.find((s: any) => s.id === ws.requiredSkillId);
    const skillName = skill ? skill.name : ws.requiredSkillId;
    const line = lines.find((l: any) => l.id === a.lineId);
    const lineName = line ? line.name.split(' - ')[0] : a.lineId;

    if (!assocSkill) {
      seenGaps.add(key);
      rows.push({
        id: `gap-${a.id}`,
        associateName: assoc.name,
        associateId: a.associateId,
        workstationName: ws.name,
        lineName,
        requiredSkill: skillName,
        minLevel: ws.minSkillLevel,
        currentLevel: 'None',
        reason: 'No certification',
        summary: `Associate ${assoc.name} (${a.associateId}) lacks required skill "${skillName}" for workstation "${ws.name}"`
      });
    } else {
      const isExpired = new Date(assocSkill.expiryDate) < new Date(referenceDate);
      const belowLevel = levelValues[assocSkill.level] < levelValues[ws.minSkillLevel];
      
      if (isExpired || belowLevel) {
        seenGaps.add(key);
        rows.push({
          id: `gap-${a.id}`,
          associateName: assoc.name,
          associateId: a.associateId,
          workstationName: ws.name,
          lineName,
          requiredSkill: skillName,
          minLevel: ws.minSkillLevel,
          currentLevel: assocSkill.level,
          reason: isExpired ? 'Certification expired' : 'Competency below minimum',
          summary: isExpired 
            ? `Associate ${assoc.name} (${a.associateId}) holds an EXPIRED certification for "${skillName}" assigned at "${ws.name}"`
            : `Associate ${assoc.name} (${a.associateId}) is level "${assocSkill.level}" but "${ws.name}" requires minimum level "${ws.minSkillLevel}"`
        });
      }
    }
  });

  let answer = `### 🚨 Roster Skill Coverage Gaps\n\n`;
  if (rows.length === 0) {
    answer += `No skill coverage gaps detected on the active roster allocations.\n`;
  } else {
    answer += `I detected **${rows.length}** skill coverage gaps on the current roster allocations:\n\n`;
    answer += `| Operator | Workstation | Required Skill | Min level | Assigned level | Deficit Reason |\n`;
    answer += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    rows.forEach(r => {
      answer += `| **${r.associateName}** (ID: ${r.associateId}) | ${r.workstationName} (${r.lineName}) | ${r.requiredSkill} | ${r.minLevel} | ${r.currentLevel} | 🔴 ${r.reason} |\n`;
    });
  }

  // Count gaps by Line
  const lineCounts: Record<string, number> = {};
  rows.forEach(r => {
    lineCounts[r.lineName] = (lineCounts[r.lineName] || 0) + 1;
  });
  const chartData = Object.entries(lineCounts).map(([name, count]) => ({ name, Gaps: count }));

  const chart = chartData.length > 0 ? {
    type: 'bar',
    title: 'Skill Deficits by Line',
    data: chartData,
    xKey: 'name',
    bars: [{ key: 'Gaps', color: '#f43f5e' }]
  } : null;

  return { answer, rows, chart };
}
