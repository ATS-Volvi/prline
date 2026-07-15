import { sequelize } from "../config/dbConn";
import {
  Skill,
  ProductionLine,
  Workstation,
  Shift,
  Associate,
  AssociateSkill,
  ProductionAssumptions,
  MonthlySeasonality,
  ManpowerNorm,
  CoverageBuffers,
  Allocation,
  AuditLog,
  RagChunk,
  DailyProductionActual
} from "./models/models";
import User from "./models/user";
import { hashPassword } from "../../backend/utils/hashPwd";

const skillsData = [
  { id: 'BLADE_OPT', name: 'Blade Operation', description: 'Slicing blade calibration and replacement' },
  { id: 'HYGIENE_L2', name: 'Food Hygiene L2', description: 'Advanced food safety and sanitation protocols' },
  { id: 'HEAT_SAFETY', name: 'High-Temp Safety', description: 'Thermal fryer safety and emergency protocols' },
  { id: 'OIL_MGMT', name: 'Oil Management', description: 'Frying oil testing, filtration, and recycling' },
  { id: 'SPICE_MIX', name: 'Spice Blending', description: 'Flavour dusting calibration and seasoning control' },
  { id: 'MECH_OP', name: 'Mechanical Operation', description: 'Packaging and bagging line mechanical configuration' },
  { id: 'QA_L1', name: 'Quality Assurance L1', description: 'Moisture, salt, and thickness packaging QA' },
  { id: 'CHEM_CERT', name: 'Quality Lab Chemist', description: 'Lab-grade chemical inspection and acidity titration' },
];

const linesData = [
  { id: 'LINE-01', name: 'Line 01 - Potato Chips (Classic)', currentProduct: 'Lays Classic Salted', status: 'ACTIVE' },
  { id: 'LINE-02', name: 'Line 02 - Tortilla Chips (Zesty)', currentProduct: 'Doritos Cheese', status: 'ACTIVE' },
  { id: 'LINE-03', name: 'Line 03 - Pretzels (Salted)', currentProduct: 'Rold Gold Twist', status: 'MAINTENANCE' },
  { id: 'LINE-04', name: 'Line 04 - Extruded Snacks', currentProduct: 'Cheetos Puffs', status: 'IDLE' },
];

const workstationsData = [
  { id: 'WS-101', name: 'Slicing & Washing', lineId: 'LINE-01', requiredSkillId: 'BLADE_OPT', minSkillLevel: 'Operator', maxStaffCount: 1 },
  { id: 'WS-102', name: 'High-Temp Frying', lineId: 'LINE-01', requiredSkillId: 'HEAT_SAFETY', minSkillLevel: 'Certified', maxStaffCount: 1 },
  { id: 'WS-103', name: 'Flavor Application', lineId: 'LINE-01', requiredSkillId: 'SPICE_MIX', minSkillLevel: 'Operator', maxStaffCount: 1 },
  { id: 'WS-104', name: 'Auto-Bagging', lineId: 'LINE-01', requiredSkillId: 'MECH_OP', minSkillLevel: 'Operator', maxStaffCount: 1 },
  { id: 'WS-105', name: 'Quality Lab Check', lineId: 'LINE-01', requiredSkillId: 'CHEM_CERT', minSkillLevel: 'Certified', maxStaffCount: 1 },
  { id: 'WS-201', name: 'Milling & Shearing', lineId: 'LINE-02', requiredSkillId: 'MECH_OP', minSkillLevel: 'Operator', maxStaffCount: 1 },
  { id: 'WS-202', name: 'Baking Oven Operator', lineId: 'LINE-02', requiredSkillId: 'HEAT_SAFETY', minSkillLevel: 'Operator', maxStaffCount: 1 },
  { id: 'WS-203', name: 'Seasoning Tumbler', lineId: 'LINE-02', requiredSkillId: 'SPICE_MIX', minSkillLevel: 'Trainee', maxStaffCount: 1 },
  { id: 'WS-204', name: 'Multi-Packer Unit', lineId: 'LINE-02', requiredSkillId: 'QA_L1', minSkillLevel: 'Operator', maxStaffCount: 1 },
];

const shiftsData = [
  { id: 'SHIFT-A', name: 'Shift A', timings: '06:00 - 14:00', workingDays: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) },
  { id: 'SHIFT-B', name: 'Shift B', timings: '14:00 - 22:00', workingDays: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) },
  { id: 'SHIFT-C', name: 'Shift C', timings: '22:00 - 06:00', workingDays: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) },
];

const associatesData = [
  { id: 'EMP101', name: 'A. Chen', category: 'Contract', joiningDate: '2025-01-10', status: 'Active', plantIdRef: 'PID-101', phoneNumber: '+919876543201' },
  { id: 'EMP102', name: 'S. Miller', category: 'Company', joiningDate: '2024-05-12', status: 'Active', plantIdRef: 'PID-102', phoneNumber: '+919876543202' },
  { id: 'EMP103', name: 'D. Petrova', category: 'NTCI', joiningDate: '2025-03-20', status: 'Active', plantIdRef: 'PID-103', phoneNumber: '+919876543203' },
  { id: 'EMP104', name: 'J. Doe', category: 'Contract', joiningDate: '2025-02-15', status: 'Active', plantIdRef: 'PID-104', phoneNumber: '+919876543204' },
  { id: 'EMP105', name: 'M. Kumar', category: 'Contract', joiningDate: '2024-11-01', status: 'Active', plantIdRef: 'PID-105', phoneNumber: '+919876543205' },
  { id: 'EMP106', name: 'R. Patel', category: 'Company', joiningDate: '2023-08-15', status: 'Active', plantIdRef: 'PID-106', phoneNumber: '+919876543206' },
  { id: 'EMP107', name: 'L. Wong', category: 'Contract', joiningDate: '2025-04-10', status: 'Active', plantIdRef: 'PID-107', phoneNumber: '+919876543207' },
  { id: 'EMP108', name: 'K. Sato', category: 'Contract', joiningDate: '2024-01-20', status: 'Inactive', plantIdRef: 'PID-108', phoneNumber: '+919876543208' },
  { id: 'EMP109', name: 'B. Jackson', category: 'Contract', joiningDate: '2024-09-05', status: 'Active', plantIdRef: 'PID-109', phoneNumber: '+919876543209' },
  { id: 'EMP110', name: 'N. Diaz', category: 'Company', joiningDate: '2022-12-01', status: 'Active', plantIdRef: 'PID-110', phoneNumber: '+919876543210' },
  { id: 'EMP111', name: 'T. Al-Farsi', category: 'NTCI', joiningDate: '2025-05-18', status: 'Active', plantIdRef: 'PID-111', phoneNumber: '+919876543211' },
  { id: 'EMP112', name: 'S. O\'Connor', category: 'Contract', joiningDate: '2024-02-28', status: 'Active', plantIdRef: 'PID-112', phoneNumber: '+919876543212' },
  { id: 'EMP113', name: 'H. Tanaka', category: 'Company', joiningDate: '2024-07-22', status: 'Active', plantIdRef: 'PID-113', phoneNumber: '+919876543213' },
  { id: 'EMP114', name: 'A. Mbaye', category: 'Contract', joiningDate: '2025-05-01', status: 'Active', plantIdRef: 'PID-114', phoneNumber: '+919876543214' },
  
  // Expanded pool (18 more associates to cover 30+)
  { id: 'EMP115', name: 'Rajesh Sen', category: 'Contract', joiningDate: '2024-03-10', status: 'Active', plantIdRef: 'PID-115', phoneNumber: '+919876543215' },
  { id: 'EMP116', name: 'Priya Das', category: 'Company', joiningDate: '2025-05-15', status: 'Active', plantIdRef: 'PID-116', phoneNumber: '+919876543216' },
  { id: 'EMP117', name: 'S. Roy', category: 'Contract', joiningDate: '2025-06-01', status: 'Active', plantIdRef: 'PID-117', phoneNumber: '+919876543217' },
  { id: 'EMP118', name: 'R. Chatterjee', category: 'Company', joiningDate: '2023-12-05', status: 'Active', plantIdRef: 'PID-118', phoneNumber: '+919876543218' },
  { id: 'EMP119', name: 'M. Das', category: 'Contract', joiningDate: '2025-02-22', status: 'Active', plantIdRef: 'PID-119', phoneNumber: '+919876543219' },
  { id: 'EMP120', name: 'N. Paul', category: 'NTCI', joiningDate: '2025-07-01', status: 'Active', plantIdRef: 'PID-120', phoneNumber: '+919876543220' },
  { id: 'EMP121', name: 'K. Sato-Ghosh', category: 'Company', joiningDate: '2024-08-14', status: 'Active', plantIdRef: 'PID-121', phoneNumber: '+919876543221' },
  { id: 'EMP122', name: 'P. Halder', category: 'Contract', joiningDate: '2025-01-20', status: 'Active', plantIdRef: 'PID-122', phoneNumber: '+919876543222' },
  { id: 'EMP123', name: 'S. Dutta', category: 'Contract', joiningDate: '2025-03-11', status: 'Active', plantIdRef: 'PID-123', phoneNumber: '+919876543223' },
  { id: 'EMP124', name: 'A. Samanta', category: 'Company', joiningDate: '2023-10-18', status: 'Active', plantIdRef: 'PID-124', phoneNumber: '+919876543224' },
  { id: 'EMP125', name: 'T. Saha', category: 'Contract', joiningDate: '2025-05-20', status: 'Active', plantIdRef: 'PID-125', phoneNumber: '+919876543225' },
  { id: 'EMP126', name: 'S. Chakraborty', category: 'NTCI', joiningDate: '2025-04-12', status: 'Active', plantIdRef: 'PID-126', phoneNumber: '+919876543226' },
  { id: 'EMP127', name: 'G. Mukherjee', category: 'Company', joiningDate: '2024-11-22', status: 'Active', plantIdRef: 'PID-127', phoneNumber: '+919876543227' },
  { id: 'EMP128', name: 'R. Ganguly', category: 'Contract', joiningDate: '2025-06-05', status: 'Active', plantIdRef: 'PID-128', phoneNumber: '+919876543228' },
  { id: 'EMP129', name: 'V. Mehta', category: 'Company', joiningDate: '2024-01-10', status: 'Active', plantIdRef: 'PID-129', phoneNumber: '+919876543229' },
  { id: 'EMP130', name: 'P. Sharma', category: 'Contract', joiningDate: '2025-02-15', status: 'Active', plantIdRef: 'PID-130', phoneNumber: '+919876543230' },
  { id: 'EMP131', name: 'B. Sengupta', category: 'Company', joiningDate: '2024-05-15', status: 'Active', plantIdRef: 'PID-131', phoneNumber: '+919876543231' },
  { id: 'EMP132', name: 'J. Banerjee', category: 'Contract', joiningDate: '2025-07-20', status: 'Active', plantIdRef: 'PID-132', phoneNumber: '+919876543232' },
];

const associateSkillsData = [
  // A. Chen
  { associateId: 'EMP101', skillId: 'BLADE_OPT', level: 'Certified', trainingDate: '2025-01-15', certifiedBy: 'T. Supervisor', expiryDate: '2026-12-31' },
  { associateId: 'EMP101', skillId: 'QA_L1', level: 'Operator', trainingDate: '2025-02-10', certifiedBy: 'Q. Manager', expiryDate: '2026-06-30' },
  
  // S. Miller
  { associateId: 'EMP102', skillId: 'HEAT_SAFETY', level: 'Certified', trainingDate: '2025-05-20', certifiedBy: 'Safety Board', expiryDate: '2026-10-15' },
  { associateId: 'EMP102', skillId: 'MECH_OP', level: 'Expert', trainingDate: '2024-06-01', certifiedBy: 'M. Plant', expiryDate: '2027-06-01' },
  { associateId: 'EMP102', skillId: 'OIL_MGMT', level: 'Certified', trainingDate: '2025-02-20', certifiedBy: 'M. Plant', expiryDate: '2026-08-20' },

  // D. Petrova
  { associateId: 'EMP103', skillId: 'CHEM_CERT', level: 'Expert', trainingDate: '2025-03-25', certifiedBy: 'Lab Director', expiryDate: '2027-03-25' },
  { associateId: 'EMP103', skillId: 'HYGIENE_L2', level: 'Certified', trainingDate: '2025-04-01', certifiedBy: 'QA Dept', expiryDate: '2026-04-01' },

  // J. Doe
  { associateId: 'EMP104', skillId: 'SPICE_MIX', level: 'Operator', trainingDate: '2025-02-20', certifiedBy: 'Line Chief', expiryDate: '2026-02-20' },
  { associateId: 'EMP104', skillId: 'HYGIENE_L2', level: 'Operator', trainingDate: '2025-03-01', certifiedBy: 'QA Dept', expiryDate: '2026-03-01' },

  // M. Kumar
  { associateId: 'EMP105', skillId: 'BLADE_OPT', level: 'Operator', trainingDate: '2025-01-10', certifiedBy: 'T. Supervisor', expiryDate: '2027-01-10' },

  // R. Patel
  { associateId: 'EMP106', skillId: 'HEAT_SAFETY', level: 'Expert', trainingDate: '2024-05-15', certifiedBy: 'Safety Board', expiryDate: '2027-05-15' },
  { associateId: 'EMP106', skillId: 'OIL_MGMT', level: 'Expert', trainingDate: '2024-05-15', certifiedBy: 'M. Plant', expiryDate: '2027-05-15' },

  // L. Wong
  { associateId: 'EMP107', skillId: 'SPICE_MIX', level: 'Operator', trainingDate: '2025-01-05', certifiedBy: 'Line Chief', expiryDate: '2026-12-31' },

  // B. Jackson
  { associateId: 'EMP109', skillId: 'MECH_OP', level: 'Certified', trainingDate: '2024-09-05', certifiedBy: 'M. Plant', expiryDate: '2026-09-05' },

  // N. Diaz
  { associateId: 'EMP110', skillId: 'QA_L1', level: 'Expert', trainingDate: '2023-12-01', certifiedBy: 'Q. Manager', expiryDate: '2028-12-01' },

  // T. Al-Farsi
  { associateId: 'EMP111', skillId: 'CHEM_CERT', level: 'Certified', trainingDate: '2025-05-18', certifiedBy: 'Lab Director', expiryDate: '2026-11-18' },

  // S. O'Connor
  { associateId: 'EMP112', skillId: 'HYGIENE_L2', level: 'Operator', trainingDate: '2025-02-28', certifiedBy: 'QA Dept', expiryDate: '2027-02-28' },

  // H. Tanaka
  { associateId: 'EMP113', skillId: 'MECH_OP', level: 'Operator', trainingDate: '2024-07-22', certifiedBy: 'M. Plant', expiryDate: '2027-07-22' },

  // A. Mbaye
  { associateId: 'EMP114', skillId: 'SPICE_MIX', level: 'Certified', trainingDate: '2025-05-01', certifiedBy: 'Line Chief', expiryDate: '2027-05-01' },

  // Rajesh Sen
  { associateId: 'EMP115', skillId: 'BLADE_OPT', level: 'Certified', trainingDate: '2025-06-30', certifiedBy: 'T. Supervisor', expiryDate: '2027-06-30' },
  { associateId: 'EMP115', skillId: 'HYGIENE_L2', level: 'Operator', trainingDate: '2025-06-30', certifiedBy: 'QA Dept', expiryDate: '2026-12-31' },

  // Priya Das
  { associateId: 'EMP116', skillId: 'HEAT_SAFETY', level: 'Expert', trainingDate: '2025-10-15', certifiedBy: 'Safety Board', expiryDate: '2028-10-15' },
  { associateId: 'EMP116', skillId: 'OIL_MGMT', level: 'Certified', trainingDate: '2025-08-20', certifiedBy: 'M. Plant', expiryDate: '2027-08-20' },

  // S. Roy
  { associateId: 'EMP117', skillId: 'SPICE_MIX', level: 'Operator', trainingDate: '2025-04-12', certifiedBy: 'Line Chief', expiryDate: '2027-04-12' },

  // R. Chatterjee
  { associateId: 'EMP118', skillId: 'MECH_OP', level: 'Expert', trainingDate: '2025-01-20', certifiedBy: 'M. Plant', expiryDate: '2028-01-20' },
  { associateId: 'EMP118', skillId: 'QA_L1', level: 'Certified', trainingDate: '2025-02-15', certifiedBy: 'Q. Manager', expiryDate: '2027-02-15' },

  // M. Das
  { associateId: 'EMP119', skillId: 'CHEM_CERT', level: 'Certified', trainingDate: '2025-12-10', certifiedBy: 'Lab Director', expiryDate: '2026-12-10' },
  { associateId: 'EMP119', skillId: 'HYGIENE_L2', level: 'Operator', trainingDate: '2025-03-01', certifiedBy: 'QA Dept', expiryDate: '2027-03-01' },

  // N. Paul
  { associateId: 'EMP120', skillId: 'BLADE_OPT', level: 'Operator', trainingDate: '2025-05-18', certifiedBy: 'T. Supervisor', expiryDate: '2027-05-18' },

  // K. Sato-Ghosh
  { associateId: 'EMP121', skillId: 'HEAT_SAFETY', level: 'Certified', trainingDate: '2025-09-22', certifiedBy: 'Safety Board', expiryDate: '2027-09-22' },

  // P. Halder
  { associateId: 'EMP122', skillId: 'SPICE_MIX', level: 'Trainee', trainingDate: '2025-01-20', certifiedBy: 'Line Chief', expiryDate: '2026-12-31' },

  // S. Dutta
  { associateId: 'EMP123', skillId: 'MECH_OP', level: 'Operator', trainingDate: '2025-03-11', certifiedBy: 'M. Plant', expiryDate: '2027-06-15' },

  // A. Samanta
  { associateId: 'EMP124', skillId: 'QA_L1', level: 'Operator', trainingDate: '2025-11-30', certifiedBy: 'Q. Manager', expiryDate: '2027-11-30' },

  // T. Saha
  { associateId: 'EMP125', skillId: 'CHEM_CERT', level: 'Expert', trainingDate: '2025-03-01', certifiedBy: 'Lab Director', expiryDate: '2028-03-01' },

  // S. Chakraborty
  { associateId: 'EMP126', skillId: 'HYGIENE_L2', level: 'Certified', trainingDate: '2025-04-12', certifiedBy: 'QA Dept', expiryDate: '2027-08-15' },

  // G. Mukherjee
  { associateId: 'EMP127', skillId: 'BLADE_OPT', level: 'Certified', trainingDate: '2025-12-31', certifiedBy: 'T. Supervisor', expiryDate: '2027-12-31' },

  // R. Ganguly
  { associateId: 'EMP128', skillId: 'HEAT_SAFETY', level: 'Operator', trainingDate: '2025-06-05', certifiedBy: 'Safety Board', expiryDate: '2027-04-20' },

  // V. Mehta
  { associateId: 'EMP129', skillId: 'SPICE_MIX', level: 'Certified', trainingDate: '2025-01-10', certifiedBy: 'Line Chief', expiryDate: '2027-10-10' },

  // P. Sharma
  { associateId: 'EMP130', skillId: 'MECH_OP', level: 'Operator', trainingDate: '2025-02-15', certifiedBy: 'M. Plant', expiryDate: '2027-09-05' },

  // B. Sengupta
  { associateId: 'EMP131', skillId: 'QA_L1', level: 'Certified', trainingDate: '2025-05-15', certifiedBy: 'Q. Manager', expiryDate: '2028-05-15' },

  // J. Banerjee
  { associateId: 'EMP132', skillId: 'CHEM_CERT', level: 'Certified', trainingDate: '2025-07-20', certifiedBy: 'Lab Director', expiryDate: '2027-07-20' },
];

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

export const seedDatabase = async (targetUserId?: string) => {
  try {
    if (targetUserId) {
      console.log(`Seeding database for target userId: ${targetUserId}...`);

      // Seed Skills scoped to user
      await Skill.bulkCreate(skillsData.map(d => ({ ...d, userId: targetUserId })));

      // Seed Lines scoped to user
      await ProductionLine.bulkCreate(linesData.map(d => ({ ...d, userId: targetUserId })));

      // Seed Workstations scoped to user
      await Workstation.bulkCreate(workstationsData.map(d => ({ ...d, userId: targetUserId })));

      // Seed Shifts scoped to user
      await Shift.bulkCreate(shiftsData.map(d => ({ ...d, userId: targetUserId })));

      // Seed Associates scoped to user
      await Associate.bulkCreate(associatesData.map(d => ({ ...d, userId: targetUserId })));

      // Seed AssociateSkills scoped to user
      await AssociateSkill.bulkCreate(associateSkillsData.map(d => ({ ...d, userId: targetUserId })));

      // Seed Production planning tables scoped to user
      const assumptionsInstance = await ProductionAssumptions.create({
        ...defaultAssumptions,
        userId: targetUserId
      });
      const assumptions = assumptionsInstance.get({ plain: true });
      
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

      console.log(`Successfully seeded Kolkata Plant Snack factory for userId: ${targetUserId}.`);
      return;
    }

    console.log("Starting Global Database Sync and Seeding...");
    
    // Sync tables sequentially with force: true to safely drop and recreate them in FK dependency order
    const models = [
      User,
      Skill,
      ProductionLine,
      Workstation,
      Shift,
      Associate,
      AssociateSkill,
      ProductionAssumptions,
      MonthlySeasonality,
      ManpowerNorm,
      CoverageBuffers,
      Allocation,
      AuditLog,
      RagChunk,
      DailyProductionActual
    ];
    for (const model of models) {
      await model.sync({ force: true, logging: console.log });
    }
    console.log("Database models synced successfully.");

    // Seed Default Testing Users
    const hashedAdminPassword = await hashPassword('AdminPassword123');
    const hashedSupervisorPassword = await hashPassword('SupervisorPassword123');
    const hashedHRPassword = await hashPassword('HRPassword123');
    const hashedManagerPassword = await hashPassword('ManagerPassword123');

    const users = await User.bulkCreate([
      {
        name: 'A. Mukhopadhyay',
        email: 'admin@pepsico.com',
        password: hashedAdminPassword,
        isVerified: true,
        userType: 'pri_admin'
      },
      {
        name: 'R. Sharma',
        email: 'supervisor@pepsico.com',
        password: hashedSupervisorPassword,
        isVerified: true,
        userType: 'reviewer'
      },
      {
        name: 'P. Banerjee',
        email: 'hr@pepsico.com',
        password: hashedHRPassword,
        isVerified: true,
        userType: 'sec_admin'
      },
      {
        name: 'S. Chatterjee',
        email: 'manager@pepsico.com',
        password: hashedManagerPassword,
        isVerified: true,
        userType: 'manager'
      }
    ]);
    console.log("Default users created. Seeding data for default users...");

    // Seed data for each default user created
    for (const u of users) {
      const rawUser = u.get({ plain: true });
      await seedDatabase(rawUser.userId);
    }

    console.log("Database Seeding Completed Successfully.");
  } catch (error) {
    console.error("Error during database seeding:", error);
  }
};

// If run directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
