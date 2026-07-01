// ─── Recommendation Engine ────────────────────────────────────────────────
// Pure, rule-based AI recommendation generator.
// Input: live snapshots of all AppContext data arrays.
// Output: sorted array of Recommendation objects, highest priority first.

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationCategory =
  | 'staffing'
  | 'certification'
  | 'safety'
  | 'production'
  | 'overtime'
  | 'forecast'
  | 'maintenance';

export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  title: string;
  message: string;
  action?: string;
  affectedEntity?: string;
  timestamp: string;
}

interface RecommendationInput {
  associates: any[];
  associateSkills: any[];
  workstations: any[];
  productionLines: any[];
  shifts: any[];
  allocations: any[];
  leaveRecords: any[];
  skills: any[];
  auditLogs?: any[];
}

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

export function generateRecommendations(data: RecommendationInput): Recommendation[] {
  const recs: Recommendation[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const in7 = new Date(today); in7.setDate(today.getDate() + 7);
  const in30 = new Date(today); in30.setDate(today.getDate() + 30);
  const activeAssociates = data.associates.filter(a => a.status === 'Active');
  // Use activeAssociates length check to silence TS6133 if needed
  if (activeAssociates.length === 0) {
    // optional logic fallback if no associates are active
  }

  // ── 1. Expired certifications ──────────────────────────────────────────
  const expired = data.associateSkills.filter(s => new Date(s.expiryDate) < today);
  if (expired.length > 0) {
    recs.push({
      id: 'cert-expired',
      priority: 'critical',
      category: 'certification',
      title: `${expired.length} Certification${expired.length > 1 ? 's' : ''} Expired`,
      message: `${expired.length} operator certification${expired.length > 1 ? 's have' : ' has'} lapsed. Affected operators cannot be legally allocated to safety-critical workstations until renewed.`,
      action: 'Schedule immediate re-certification',
      affectedEntity: 'Skill Matrix',
      timestamp: new Date().toISOString(),
    });
  }

  // ── 2. Certifications expiring in 7 days ───────────────────────────────
  const expiring7 = data.associateSkills.filter(s => {
    const d = new Date(s.expiryDate);
    return d >= today && d <= in7;
  });
  if (expiring7.length > 0) {
    recs.push({
      id: 'cert-expiring-7',
      priority: 'high',
      category: 'certification',
      title: `${expiring7.length} Cert${expiring7.length > 1 ? 's' : ''} Expiring Within 7 Days`,
      message: `Renew ${expiring7.length} certification${expiring7.length > 1 ? 's' : ''} before expiry to avoid compliance gaps and forced reallocation.`,
      action: 'Book refresher training sessions',
      affectedEntity: 'Skill Matrix',
      timestamp: new Date().toISOString(),
    });
  }

  // ── 3. Certifications expiring in 30 days ─────────────────────────────
  const expiring30 = data.associateSkills.filter(s => {
    const d = new Date(s.expiryDate);
    return d > in7 && d <= in30;
  });
  if (expiring30.length > 0) {
    recs.push({
      id: 'cert-expiring-30',
      priority: 'medium',
      category: 'certification',
      title: `${expiring30.length} Certs Expiring in 30 Days`,
      message: `Plan training schedules for ${expiring30.length} certifications due in the next month to maintain continuous coverage.`,
      action: 'Schedule training calendar',
      affectedEntity: 'Skill Matrix',
      timestamp: new Date().toISOString(),
    });
  }

  // ── 4. Today's staffing gaps per active line ───────────────────────────
  const activeLines = data.productionLines.filter(l => l.status === 'ACTIVE');
  let totalUnderstaffedWS = 0;
  activeLines.forEach(line => {
    const lineWS = data.workstations.filter(w => w.lineId === line.id);
    const lineAllocs = new Set(
      data.allocations
        .filter(a => a.date === todayStr && a.lineId === line.id)
        .map(a => a.workstationId)
    ).size;
    const gap = lineWS.length - lineAllocs;
    if (gap > 0) totalUnderstaffedWS += gap;
  });
  if (totalUnderstaffedWS > 0) {
    recs.push({
      id: 'staffing-gap',
      priority: totalUnderstaffedWS >= 3 ? 'critical' : 'high',
      category: 'staffing',
      title: `${totalUnderstaffedWS} Workstation${totalUnderstaffedWS > 1 ? 's' : ''} Understaffed Today`,
      message: `${totalUnderstaffedWS} production workstation${totalUnderstaffedWS > 1 ? 's are' : ' is'} unallocated for today's shift. This directly reduces line throughput capacity.`,
      action: 'Open Shift Allocation and assign available operators',
      affectedEntity: 'Shift Planner',
      timestamp: new Date().toISOString(),
    });
  }

  // ── 5. Today's leave count ─────────────────────────────────────────────
  const todayLeaves = data.leaveRecords.filter(l => l.date === todayStr).length;
  if (todayLeaves >= 3) {
    recs.push({
      id: 'high-leave',
      priority: 'high',
      category: 'staffing',
      title: `High Absenteeism — ${todayLeaves} Operators on Leave Today`,
      message: `${todayLeaves} operators are absent today, reducing available pool significantly. Consider cross-training or contract cover.`,
      action: 'Review available standby operators',
      affectedEntity: 'Shift Planner',
      timestamp: new Date().toISOString(),
    });
  }

  // ── 6. Maintenance lines ───────────────────────────────────────────────
  const maintenanceLines = data.productionLines.filter(l => l.status === 'MAINTENANCE');
  if (maintenanceLines.length > 0) {
    recs.push({
      id: 'lines-in-maintenance',
      priority: 'medium',
      category: 'maintenance',
      title: `${maintenanceLines.length} Production Line${maintenanceLines.length > 1 ? 's' : ''} in Maintenance`,
      message: `Line${maintenanceLines.length > 1 ? 's' : ''} ${maintenanceLines.map(l => l.name.split(' - ')[0]).join(', ')} ${maintenanceLines.length > 1 ? 'are' : 'is'} offline for maintenance. Reallocate capacity to active lines.`,
      action: 'Review maintenance schedule and timeline',
      affectedEntity: 'Plant Map',
      timestamp: new Date().toISOString(),
    });
  }

  // ── 7. Halted lines ────────────────────────────────────────────────────
  const haltedLines = data.productionLines.filter(l => l.status === 'HALTED');
  if (haltedLines.length > 0) {
    recs.push({
      id: 'lines-halted',
      priority: 'critical',
      category: 'production',
      title: `CRITICAL — ${haltedLines.length} Line${haltedLines.length > 1 ? 's' : ''} Halted`,
      message: `Production halt detected on ${haltedLines.map(l => l.name.split(' - ')[0]).join(', ')}. Immediate supervisor escalation required to assess downtime impact.`,
      action: 'Escalate to Plant Manager immediately',
      affectedEntity: 'Production Lines',
      timestamp: new Date().toISOString(),
    });
  }

  // ── 8. Overcrowded workstations (over max capacity) ────────────────────
  const overAllocated = data.workstations.filter(ws => {
    const count = data.allocations.filter(a => a.date === todayStr && a.workstationId === ws.id).length;
    return count > (ws.maxStaffCount || 1);
  });
  if (overAllocated.length > 0) {
    recs.push({
      id: 'over-allocated',
      priority: 'high',
      category: 'safety',
      title: `${overAllocated.length} Workstation${overAllocated.length > 1 ? 's' : ''} Overallocated`,
      message: `${overAllocated.length} workstation${overAllocated.length > 1 ? 's exceed' : ' exceeds'} maximum staff count — safety and compliance risk. Review allocation immediately.`,
      action: 'Remove excess allocations',
      affectedEntity: 'Shift Planner',
      timestamp: new Date().toISOString(),
    });
  }

  // ── 9. Low operator coverage overall (< 60%) ──────────────────────────
  const totalWS = data.workstations.length;
  const filledWS = new Set(
    data.allocations.filter(a => a.date === todayStr).map(a => a.workstationId)
  ).size;
  const fillRate = totalWS > 0 ? Math.round((filledWS / totalWS) * 100) : 100;
  if (fillRate < 60) {
    recs.push({
      id: 'low-fill-rate',
      priority: 'critical',
      category: 'production',
      title: `Plant Fill Rate at ${fillRate}% — Critical`,
      message: `Overall workstation fill rate is critically low at ${fillRate}%. Production output is expected to be severely impacted. Immediate staffing action required.`,
      action: 'Activate standby roster and cross-line reallocation',
      affectedEntity: 'Dashboard',
      timestamp: new Date().toISOString(),
    });
  } else if (fillRate < 80) {
    recs.push({
      id: 'below-target-fill-rate',
      priority: 'medium',
      category: 'production',
      title: `Plant Fill Rate at ${fillRate}% — Below Target`,
      message: `Current staffing fill rate of ${fillRate}% is below the 80% operational target. Review uncovered workstations and assign available operators.`,
      action: 'Check Shift Planner for open slots',
      affectedEntity: 'Dashboard',
      timestamp: new Date().toISOString(),
    });
  }

  // ── 10. Positive observation ───────────────────────────────────────────
  const validCerts = data.associateSkills.filter(s => new Date(s.expiryDate) >= today);
  const certCoverage = data.associateSkills.length > 0
    ? Math.round((validCerts.length / data.associateSkills.length) * 100)
    : 0;
  if (certCoverage >= 90 && fillRate >= 80) {
    recs.push({
      id: 'healthy-plant',
      priority: 'low',
      category: 'safety',
      title: 'Plant Compliance Status: Healthy',
      message: `Certification coverage at ${certCoverage}% and staffing fill at ${fillRate}%. Operations are within safe and compliant parameters.`,
      action: 'Maintain current staffing and training cadence',
      affectedEntity: 'Dashboard',
      timestamp: new Date().toISOString(),
    });
  }

  return recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

export function getAlertCount(data: RecommendationInput): number {
  return generateRecommendations(data).filter(
    r => r.priority === 'critical' || r.priority === 'high'
  ).length;
}
