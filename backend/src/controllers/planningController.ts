import { Request, Response } from 'express';
import { catchAsync } from '../middleware/errorHandler';
import {
  ProductionAssumptions,
  MonthlySeasonality,
  ManpowerNorm,
  CoverageBuffers,
  DailyProductionActual,
  Allocation
} from '../../../database/models/models/models';
import {
  calcOEE,
  calcTheoreticalAnnualCapacity,
  buildMonthlyPlan,
  buildQuarterlyPlan,
  buildWeeklyPlan,
  buildResourcePlan,
  getVarianceReport
} from '../services/planningService';

// Default values to seed on the fly if needed
const defaultAssumptions = {
  fyLabel: 'FY 2026-27',
  fyStartDate: '2026-04-01',
  numLines: 3,
  ratedCapacityKgHr: 2200,
  hoursPerShift: 8,
  shiftsPerDay: 3,
  workingDaysPerMonth: 26,
  plannedDowntimePct: 0.08,
  rejectionPct: 0.015,
  annualTargetMt: 36000
};

const defaultSeasonality = [
  { month: 'Apr', indexValue: 1.0 },
  { month: 'May', indexValue: 1.05 },
  { month: 'Jun', indexValue: 0.95 },
  { month: 'Jul', indexValue: 0.9 },
  { month: 'Aug', indexValue: 0.85 },
  { month: 'Sep', indexValue: 1.0 },
  { month: 'Oct', indexValue: 1.2 },
  { month: 'Nov', indexValue: 1.15 },
  { month: 'Dec', indexValue: 1.1 },
  { month: 'Jan', indexValue: 0.95 },
  { month: 'Feb', indexValue: 0.9 },
  { month: 'Mar', indexValue: 0.95 }
];

const defaultNorms = [
  { role: 'Line Operator', category: 'Skilled', scope: 'per_line_shift', countPerUnit: 1, notes: 'One per line' },
  { role: 'Machine Feeder/Helper', category: 'Semi-Skilled', scope: 'per_line_shift', countPerUnit: 2, notes: 'Two helpers per line' },
  { role: 'Seasoning Operator', category: 'Skilled', scope: 'per_line_shift', countPerUnit: 1, notes: 'Seasoning control' },
  { role: 'Packing Machine Operator', category: 'Skilled', scope: 'per_line_shift', countPerUnit: 2, notes: 'Two per packaging station' },
  { role: 'Packing Associate', category: 'Unskilled', scope: 'per_line_shift', countPerUnit: 3, notes: 'Manual sorting and packing' },
  { role: 'Material Handler', category: 'Semi-Skilled', scope: 'per_line_shift', countPerUnit: 1, notes: 'Forklift / Pallet movement' },
  { role: 'Shift Supervisor', category: 'Skilled', scope: 'per_shift_shared', countPerUnit: 1, notes: 'Shared shift lead' },
  { role: 'Line Mechanic', category: 'Skilled', scope: 'per_shift_shared', countPerUnit: 1, notes: 'Shared maintenance' },
  { role: 'QA Inspector', category: 'Skilled', scope: 'per_shift_shared', countPerUnit: 1, notes: 'Shared QA inspector' },
  { role: 'Utility/Housekeeping', category: 'Unskilled', scope: 'per_shift_shared', countPerUnit: 1, notes: 'Shared housekeeping utility' }
];

const defaultBuffers = {
  workingDaysPerAssociatePerWeek: 6,
  offFactorAdj: 1.167,
  absenteeBufferPct: 0.05
};

async function ensureAssumptionsExist(userId: string): Promise<any> {
  let assumptions: any = await ProductionAssumptions.findOne({
    where: { userId },
    include: [
      { association: 'seasonality' },
      { association: 'norms' },
      { association: 'buffers' }
    ]
  });

  if (!assumptions) {
    assumptions = await ProductionAssumptions.create({
      ...defaultAssumptions,
      userId
    });

    await MonthlySeasonality.bulkCreate(defaultSeasonality.map(s => ({
      ...s,
      assumptionsId: assumptions.id
    })));

    await ManpowerNorm.bulkCreate(defaultNorms.map(n => ({
      ...n,
      assumptionsId: assumptions.id
    })));

    await CoverageBuffers.create({
      ...defaultBuffers,
      assumptionsId: assumptions.id
    });

    // Refetch populated
    assumptions = await ProductionAssumptions.findOne({
      where: { userId },
      include: [
        { association: 'seasonality' },
        { association: 'norms' },
        { association: 'buffers' }
      ]
    });
  }

  return assumptions;
}

export const getAssumptions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId || 'EMP102';
  const assumptions = await ensureAssumptionsExist(userId);
  res.json({ success: true, data: assumptions });
});

export const updateAssumptions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId || 'EMP102';
  const { assumptions: assumptionsData, seasonality: seasonalityData, norms: normsData, buffers: buffersData } = req.body;

  let assumptions: any = await ProductionAssumptions.findOne({ where: { userId } });
  if (!assumptions) {
    assumptions = await ProductionAssumptions.create({ ...assumptionsData, userId });
  } else {
    await assumptions.update(assumptionsData);
  }

  if (seasonalityData && Array.isArray(seasonalityData)) {
    await MonthlySeasonality.destroy({ where: { assumptionsId: assumptions.id } });
    await MonthlySeasonality.bulkCreate(seasonalityData.map(s => ({
      assumptionsId: assumptions.id,
      month: s.month,
      indexValue: Number(s.indexValue),
      note: s.note
    })));
  }

  if (normsData && Array.isArray(normsData)) {
    await ManpowerNorm.destroy({ where: { assumptionsId: assumptions.id } });
    await ManpowerNorm.bulkCreate(normsData.map(n => ({
      assumptionsId: assumptions.id,
      role: n.role,
      category: n.category,
      scope: n.scope,
      countPerUnit: Number(n.countPerUnit),
      notes: n.notes
    })));
  }

  if (buffersData) {
    await CoverageBuffers.destroy({ where: { assumptionsId: assumptions.id } });
    const { id: _, assumptionsId: __, ...cleanBuffers } = buffersData;
    await CoverageBuffers.create({
      ...cleanBuffers,
      assumptionsId: assumptions.id
    });
  }

  const updated = await ProductionAssumptions.findOne({
    where: { userId },
    include: [
      { association: 'seasonality' },
      { association: 'norms' },
      { association: 'buffers' }
    ]
  });

  res.json({ success: true, data: updated });
});

export const getPlan = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId || 'EMP102';
  const { granularity } = req.query; // 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'daily'

  const assumptions: any = await ensureAssumptionsExist(userId);
  const monthly = buildMonthlyPlan(assumptions, assumptions.seasonality || []);

  if (granularity === 'annual') {
    const capacity = calcTheoreticalAnnualCapacity(assumptions);
    return res.json({
      success: true,
      data: {
        annualTarget: Number(assumptions.annualTargetMt),
        theoreticalCapacity: capacity,
        utilization: capacity > 0 ? Number(assumptions.annualTargetMt) / capacity : 0
      }
    });
  } else if (granularity === 'quarterly') {
    const quarterly = buildQuarterlyPlan(monthly);
    return res.json({ success: true, data: quarterly });
  } else if (granularity === 'weekly') {
    const weekly = buildWeeklyPlan(assumptions, monthly);
    return res.json({ success: true, data: weekly });
  } else if (granularity === 'daily') {
    const weekly = buildWeeklyPlan(assumptions, monthly);
    const dailyPlan: any[] = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    weekly.forEach(w => {
      let curr = new Date(w.startDate);
      for (let i = 0; i < 6; i++) {
        dailyPlan.push({
          date: curr.toISOString().split('T')[0],
          dayOfWeek: days[i],
          weekNum: w.weekNum,
          target: w.dailyTarget
        });
        curr.setDate(curr.getDate() + 1);
      }
    });
    return res.json({ success: true, data: dailyPlan });
  } else {
    // monthly
    return res.json({ success: true, data: monthly });
  }
});

export const getManpowerPlan = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId || 'EMP102';

  const assumptions: any = await ensureAssumptionsExist(userId);
  const resourcePlan = buildResourcePlan(assumptions.norms || [], assumptions, assumptions.buffers);

  // Retrieve current active allocations count for comparison
  const todayStr = new Date().toISOString().split('T')[0];
  const activeAllocations = await Allocation.findAll({
    where: { userId, date: todayStr }
  });

  res.json({
    success: true,
    data: resourcePlan,
    currentAllocationsCount: activeAllocations.length
  });
});

export const logActual = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId || 'EMP102';
  const { productionDate, lineId, shift, actualOutputMt, notes } = req.body;

  const [actual, created] = await DailyProductionActual.findOrCreate({
    where: {
      userId,
      productionDate,
      lineId: lineId || null,
      shift: shift || null
    },
    defaults: {
      actualOutputMt,
      enteredBy: req.authData?.name || 'System',
      notes
    }
  });

  if (!created) {
    await actual.update({
      actualOutputMt,
      enteredBy: req.authData?.name || 'System',
      notes
    });
  }

  res.json({ success: true, data: actual });
});

export const getVariance = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authData?.userId || 'EMP102';
  const { asOf } = req.query; // YYYY-MM-DD
  const asOfDate = asOf ? new Date(asOf as string) : new Date();

  await ensureAssumptionsExist(userId);
  const report = await getVarianceReport(userId, asOfDate);
  res.json({ success: true, data: report });
});
