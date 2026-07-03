import { Op } from "sequelize";
import {
  ProductionAssumptions,
  MonthlySeasonality,
  ManpowerNorm,
  CoverageBuffers,
  DailyProductionActual
} from "../../../database/models/models/models";

const MONTH_ORDER: Record<string, number> = {
  'Apr': 0, 'May': 1, 'Jun': 2, 'Jul': 3, 'Aug': 4, 'Sep': 5,
  'Oct': 6, 'Nov': 7, 'Dec': 8, 'Jan': 9, 'Feb': 10, 'Mar': 11
};

export interface MonthlyPlanRow {
  month: string;
  seasonalityIndex: number;
  monthlyTarget: number;
  dailyOutputRequired: number;
  monthlyCapacity: number;
  utilization: number;
}

export interface QuarterlyPlanRow {
  quarter: string;
  quarterlyTarget: number;
  quarterlyCapacity: number;
  utilization: number;
}

export interface WeeklyPlanRow {
  weekNum: number;
  startDate: string;
  endDate: string;
  month: string;
  weeklyTarget: number;
  dailyTarget: number;
}

export interface ResourcePlanRow {
  role: string;
  category: string;
  scope: string;
  positionsPerShift: number;
  positionsPerDay: number;
  associatesRequired: number;
  notes?: string;
}

// Assumptions!B18 — OEE = (1 - downtime%) * (1 - rejection%)
export function calcOEE(downtimePct: number, rejectionPct: number): number {
  return (1 - downtimePct) * (1 - rejectionPct);
}

// Assumptions!B21 — theoretical annual capacity (MT)
// = lines * rated_kg_hr * hrs_per_shift * shifts_per_day * working_days_per_month * 12 / 1000 * OEE
export function calcTheoreticalAnnualCapacity(a: ProductionAssumptions): number {
  const oee = calcOEE(Number(a.plannedDowntimePct), Number(a.rejectionPct));
  return (
    Number(a.numLines) *
    Number(a.ratedCapacityKgHr) *
    Number(a.hoursPerShift) *
    Number(a.shiftsPerDay) *
    Number(a.workingDaysPerMonth) *
    12 *
    oee
  ) / 1000;
}

// Monthly Plan — one row per FY month
export function buildMonthlyPlan(a: ProductionAssumptions, seasonality: MonthlySeasonality[]): MonthlyPlanRow[] {
  const sortedSeasonality = [...seasonality].sort((x, y) => {
    const ox = MONTH_ORDER[x.month] ?? 99;
    const oy = MONTH_ORDER[y.month] ?? 99;
    return ox - oy;
  });

  const oee = calcOEE(Number(a.plannedDowntimePct), Number(a.rejectionPct));

  return sortedSeasonality.map(s => {
    // monthlyTarget = (seasonalityIndex / 12) * annualTarget [Monthly Plan!C4 = B4/12*Assumptions!B20]
    const monthlyTarget = (Number(s.indexValue) / 12) * Number(a.annualTargetMt);
    
    // dailyOutputRequired = monthlyTarget / workingDays
    const dailyOutputRequired = monthlyTarget / Number(a.workingDaysPerMonth);
    
    // monthlyCapacity = lines * rated_kg_hr * hrs_per_shift * shifts_per_day * workingDays / 1000 * OEE
    const monthlyCapacity = (
      Number(a.numLines) *
      Number(a.ratedCapacityKgHr) *
      Number(a.hoursPerShift) *
      Number(a.shiftsPerDay) *
      Number(a.workingDaysPerMonth) *
      oee
    ) / 1000;

    // utilization = monthlyTarget / monthlyCapacity
    const utilization = monthlyCapacity > 0 ? monthlyTarget / monthlyCapacity : 0;

    return {
      month: s.month,
      seasonalityIndex: Number(s.indexValue),
      monthlyTarget,
      dailyOutputRequired,
      monthlyCapacity,
      utilization
    };
  });
}

// Quarterly Plan — sum months 1-3, 4-6, 7-9, 10-12 of the FY (Apr-Mar)
export function buildQuarterlyPlan(monthly: MonthlyPlanRow[]): QuarterlyPlanRow[] {
  const quarters = [
    { name: 'Q1 (AMJ)', indices: [0, 1, 2] },
    { name: 'Q2 (JAS)', indices: [3, 4, 5] },
    { name: 'Q3 (OND)', indices: [6, 7, 8] },
    { name: 'Q4 (JFM)', indices: [9, 10, 11] }
  ];

  return quarters.map(q => {
    let quarterlyTarget = 0;
    let quarterlyCapacity = 0;

    q.indices.forEach(idx => {
      if (monthly[idx]) {
        quarterlyTarget += monthly[idx].monthlyTarget;
        quarterlyCapacity += monthly[idx].monthlyCapacity;
      }
    });

    const utilization = quarterlyCapacity > 0 ? quarterlyTarget / quarterlyCapacity : 0;

    return {
      quarter: q.name,
      quarterlyTarget,
      quarterlyCapacity,
      utilization
    };
  });
}

// Weekly Plan — 52 weeks from fy_start_date, weekly target = monthlyTarget / weeksInThatMonth,
// daily target (6-day week) = weeklyTarget / 6
export function buildWeeklyPlan(a: ProductionAssumptions, monthly: MonthlyPlanRow[]): WeeklyPlanRow[] {
  const fyStartDate = a.fyStartDate || '2026-04-01';
  const weeks: { weekNum: number; startDate: string; endDate: string; monthLabel: string }[] = [];
  let current = new Date(fyStartDate);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let w = 1; w <= 52; w++) {
    const startStr = current.toISOString().split('T')[0];
    const nextWeek = new Date(current);
    nextWeek.setDate(nextWeek.getDate() + 6);
    const endStr = nextWeek.toISOString().split('T')[0];
    const monthLabel = monthNames[current.getMonth()];

    weeks.push({
      weekNum: w,
      startDate: startStr,
      endDate: endStr,
      monthLabel
    });

    current.setDate(current.getDate() + 7);
  }

  const weeksPerMonth: Record<string, number> = {};
  weeks.forEach(w => {
    weeksPerMonth[w.monthLabel] = (weeksPerMonth[w.monthLabel] || 0) + 1;
  });

  return weeks.map(w => {
    const monthlyRow = monthly.find(m => m.month === w.monthLabel);
    const monthlyTarget = monthlyRow ? monthlyRow.monthlyTarget : 0;
    const numWeeks = weeksPerMonth[w.monthLabel] || 4.33; // Fallback
    const weeklyTarget = monthlyTarget / numWeeks;
    const dailyTarget = weeklyTarget / 6;

    return {
      weekNum: w.weekNum,
      startDate: w.startDate,
      endDate: w.endDate,
      month: w.monthLabel,
      weeklyTarget,
      dailyTarget
    };
  });
}

// Resource Plan — per role: positions/shift = norm * (lines if per_line_shift scope else 1)
//                 positions/day = positions/shift * shifts_per_day
//                 associatesRequired = ROUNDUP(positions/day * (1 + absenteeBufferPct) * offFactorAdj, 0)
export function buildResourcePlan(
  norms: ManpowerNorm[],
  a: ProductionAssumptions,
  buffers: CoverageBuffers
): ResourcePlanRow[] {
  const absenteeBufferPct = buffers ? Number(buffers.absenteeBufferPct) : 0.05;
  const offFactorAdj = buffers ? Number(buffers.offFactorAdj) : 1.167;

  return norms.map(n => {
    const isPerLine = n.scope === 'per_line_shift';
    const positionsPerShift = Number(n.countPerUnit) * (isPerLine ? Number(a.numLines) : 1);
    const positionsPerDay = positionsPerShift * Number(a.shiftsPerDay);
    const associatesRequired = Math.ceil(positionsPerDay * (1 + absenteeBufferPct) * offFactorAdj);

    return {
      role: n.role,
      category: n.category,
      scope: n.scope,
      positionsPerShift,
      positionsPerDay,
      associatesRequired,
      notes: n.notes
    };
  });
}

// Variance report
export async function getVarianceReport(userId: string, asOfDate: Date) {
  const assumptions = await ProductionAssumptions.findOne({ where: { userId } });
  if (!assumptions) {
    throw new Error("Assumptions not configured");
  }

  const seasonality = await MonthlySeasonality.findAll({ where: { assumptionsId: assumptions.id } });
  const monthly = buildMonthlyPlan(assumptions, seasonality);
  const weeklyPlan = buildWeeklyPlan(assumptions, monthly);

  const actuals = await DailyProductionActual.findAll({
    where: {
      userId,
      productionDate: {
        [Op.lte]: asOfDate
      }
    }
  });

  // Planned cumulative to date
  let plannedToDate = 0;
  let current = new Date(assumptions.fyStartDate || '2026-04-01');
  const end = new Date(asOfDate);

  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sunday
    if (dayOfWeek !== 0) {
      const dateStr = current.toISOString().split('T')[0];
      const matchingWeek = weeklyPlan.find(w => dateStr >= w.startDate && dateStr <= w.endDate);
      if (matchingWeek) {
        plannedToDate += matchingWeek.dailyTarget;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  const actualToDate = actuals.reduce((sum, act) => sum + Number(act.actualOutputMt), 0);
  const gapMT = actualToDate - plannedToDate;
  const gapPct = plannedToDate > 0 ? gapMT / plannedToDate : 0;

  // Remaining days to catch up
  const fyEndDate = new Date(weeklyPlan[51].endDate);
  let remainingDays = 0;
  let curr = new Date(asOfDate);
  curr.setDate(curr.getDate() + 1);
  while (curr <= fyEndDate) {
    if (curr.getDay() !== 0) {
      remainingDays++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  const annualTarget = Number(assumptions.annualTargetMt);
  const remainingTarget = annualTarget - actualToDate;
  const requiredDailyRateToRecover = remainingDays > 0 ? remainingTarget / remainingDays : 0;

  // original planned daily rate remaining
  let remainingPlanned = 0;
  let currPlanned = new Date(asOfDate);
  currPlanned.setDate(currPlanned.getDate() + 1);
  while (currPlanned <= fyEndDate) {
    if (currPlanned.getDay() !== 0) {
      const dateStr = currPlanned.toISOString().split('T')[0];
      const matchingWeek = weeklyPlan.find(w => dateStr >= w.startDate && dateStr <= w.endDate);
      if (matchingWeek) {
        remainingPlanned += matchingWeek.dailyTarget;
      }
    }
    currPlanned.setDate(currPlanned.getDate() + 1);
  }
  const originalPlannedDailyRateRemaining = remainingDays > 0 ? remainingPlanned / remainingDays : 0;

  // Monthly cumulative series for planned vs actual line chart
  const chartSeries: any[] = [];
  let cumPlanned = 0;
  let cumActual = 0;
  const startYear = new Date(assumptions.fyStartDate || '2026-04-01').getFullYear();

  for (const m of monthly) {
    cumPlanned += m.monthlyTarget;
    
    // Sum actuals in this month
    const monthNum = Object.keys(MONTH_ORDER).indexOf(m.month); // 0 for Apr
    const jsMonth = (monthNum + 3) % 12; // Apr -> 3, May -> 4... Jan -> 0
    const calYear = jsMonth >= 3 ? startYear : startYear + 1;

    // Filter actuals that belong to this month and year (up to asOfDate)
    const actualsInMonth = actuals.filter(act => {
      const actDate = new Date(act.productionDate);
      return actDate.getMonth() === jsMonth && actDate.getFullYear() === calYear;
    });

    const actualSum = actualsInMonth.reduce((sum, act) => sum + Number(act.actualOutputMt), 0);
    cumActual += actualSum;

    // Check if this month has started or passed
    const monthEndDate = new Date(calYear, jsMonth + 1, 0); // last day of month
    const hasStarted = monthEndDate <= end || (end.getMonth() === jsMonth && end.getFullYear() === calYear);

    chartSeries.push({
      month: m.month,
      planned: Math.round(cumPlanned),
      actual: hasStarted ? Math.round(cumActual) : null
    });
  }

  return {
    plannedToDate,
    actualToDate,
    gapMT,
    gapPct,
    remainingDays,
    remainingTarget,
    requiredDailyRateToRecover,
    catchUpDeltaVsOriginalPlan: requiredDailyRateToRecover - originalPlannedDailyRateRemaining,
    chartSeries
  };
}
