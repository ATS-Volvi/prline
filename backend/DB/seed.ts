import { sequelize } from "../config/dbConn";
import {
  Skill,
  ProductionLine,
  Workstation,
  Shift,
  Associate,
  AssociateSkill
} from "./models/models";
import User from "./models/user";
import { hashPassword } from "../utils/hashPwd";

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
  { id: 'EMP101', name: 'A. Chen', category: 'Contract', joiningDate: '2025-01-10', status: 'Active' },
  { id: 'EMP102', name: 'S. Miller', category: 'Company', joiningDate: '2024-05-12', status: 'Active' },
  { id: 'EMP103', name: 'D. Petrova', category: 'NTCI', joiningDate: '2025-03-20', status: 'Active' },
  { id: 'EMP104', name: 'J. Doe', category: 'Contract', joiningDate: '2025-02-15', status: 'Active' },
  { id: 'EMP105', name: 'M. Kumar', category: 'Contract', joiningDate: '2024-11-01', status: 'Active' },
  { id: 'EMP106', name: 'R. Patel', category: 'Company', joiningDate: '2023-08-15', status: 'Active' },
  { id: 'EMP107', name: 'L. Wong', category: 'Contract', joiningDate: '2025-04-10', status: 'Active' },
  { id: 'EMP108', name: 'K. Sato', category: 'Contract', joiningDate: '2024-01-20', status: 'Inactive' },
  { id: 'EMP109', name: 'B. Jackson', category: 'Contract', joiningDate: '2024-09-05', status: 'Active' },
  { id: 'EMP110', name: 'N. Diaz', category: 'Company', joiningDate: '2022-12-01', status: 'Active' },
  { id: 'EMP111', name: 'T. Al-Farsi', category: 'NTCI', joiningDate: '2025-05-18', status: 'Active' },
  { id: 'EMP112', name: 'S. O\'Connor', category: 'Contract', joiningDate: '2024-02-28', status: 'Active' },
  { id: 'EMP113', name: 'H. Tanaka', category: 'Company', joiningDate: '2024-07-22', status: 'Active' },
  { id: 'EMP114', name: 'A. Mbaye', category: 'Contract', joiningDate: '2025-05-01', status: 'Active' },
  
  // Expanded pool (18 more associates to cover 30+)
  { id: 'EMP115', name: 'Rajesh Sen', category: 'Contract', joiningDate: '2024-03-10', status: 'Active' },
  { id: 'EMP116', name: 'Priya Das', category: 'Company', joiningDate: '2025-05-15', status: 'Active' },
  { id: 'EMP117', name: 'S. Roy', category: 'Contract', joiningDate: '2025-06-01', status: 'Active' },
  { id: 'EMP118', name: 'R. Chatterjee', category: 'Company', joiningDate: '2023-12-05', status: 'Active' },
  { id: 'EMP119', name: 'M. Das', category: 'Contract', joiningDate: '2025-02-22', status: 'Active' },
  { id: 'EMP120', name: 'N. Paul', category: 'NTCI', joiningDate: '2025-07-01', status: 'Active' },
  { id: 'EMP121', name: 'K. Sato-Ghosh', category: 'Company', joiningDate: '2024-08-14', status: 'Active' },
  { id: 'EMP122', name: 'P. Halder', category: 'Contract', joiningDate: '2025-01-20', status: 'Active' },
  { id: 'EMP123', name: 'S. Dutta', category: 'Contract', joiningDate: '2025-03-11', status: 'Active' },
  { id: 'EMP124', name: 'A. Samanta', category: 'Company', joiningDate: '2023-10-18', status: 'Active' },
  { id: 'EMP125', name: 'T. Saha', category: 'Contract', joiningDate: '2025-05-20', status: 'Active' },
  { id: 'EMP126', name: 'S. Chakraborty', category: 'NTCI', joiningDate: '2025-04-12', status: 'Active' },
  { id: 'EMP127', name: 'G. Mukherjee', category: 'Company', joiningDate: '2024-11-22', status: 'Active' },
  { id: 'EMP128', name: 'R. Ganguly', category: 'Contract', joiningDate: '2025-06-05', status: 'Active' },
  { id: 'EMP129', name: 'V. Mehta', category: 'Company', joiningDate: '2024-01-10', status: 'Active' },
  { id: 'EMP130', name: 'P. Sharma', category: 'Contract', joiningDate: '2025-02-15', status: 'Active' },
  { id: 'EMP131', name: 'B. Sengupta', category: 'Company', joiningDate: '2024-05-15', status: 'Active' },
  { id: 'EMP132', name: 'J. Banerjee', category: 'Contract', joiningDate: '2025-07-20', status: 'Active' },
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

export const seedDatabase = async () => {
  try {
    console.log("Starting Database Sync and Seeding...");
    
    // Sync tables with force: true to wipe existing and seed cleanly
    await sequelize.sync({ force: true });
    console.log("Database models synced successfully.");

    // Seed Skills
    await Skill.bulkCreate(skillsData);
    console.log("Skills seeded.");

    // Seed Lines
    await ProductionLine.bulkCreate(linesData);
    console.log("Production lines seeded.");

    // Seed Workstations
    await Workstation.bulkCreate(workstationsData);
    console.log("Workstations seeded.");

    // Seed Shifts
    await Shift.bulkCreate(shiftsData);
    console.log("Shifts seeded.");

    // Seed Associates
    await Associate.bulkCreate(associatesData);
    console.log("Associates seeded.");

    // Seed AssociateSkills
    await AssociateSkill.bulkCreate(associateSkillsData);
    console.log("Associate skills seeded.");

    // Seed Default Testing Users
    const hashedAdminPassword = await hashPassword('AdminPassword123');
    const hashedSupervisorPassword = await hashPassword('SupervisorPassword123');
    const hashedHRPassword = await hashPassword('HRPassword123');
    const hashedManagerPassword = await hashPassword('ManagerPassword123');

    await User.bulkCreate([
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
    console.log("Default users seeded.");

    console.log("Database Seeding Completed Successfully.");
  } catch (error) {
    console.error("Error during database seeding:", error);
  }
};

// If run directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
