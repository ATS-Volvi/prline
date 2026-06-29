import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  type Associate,
  type Skill,
  type AssociateSkill,
  type Workstation,
  type ProductionLine,
  type Shift,
  type Allocation,
  type AuditLog,
  type LeaveRecord,
  type AttendanceRecord,
  type UserRole,
  type SkillLevel,
  type AssociateCategory,
} from '../types';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  token: string | null;
  user: { name: string; email: string; userId: string } | null;
  login: (token: string, user: { name: string; email: string; userId: string }, role: UserRole) => void;
  logout: () => void;
  associates: Associate[];
  skills: Skill[];
  associateSkills: AssociateSkill[];
  workstations: Workstation[];
  productionLines: ProductionLine[];
  shifts: Shift[];
  allocations: Allocation[];
  auditLogs: AuditLog[];
  leaveRecords: LeaveRecord[];
  attendanceRecords: AttendanceRecord[];
  
  // Actions
  addAssociate: (associate: Associate, skills: { skillId: string; level: SkillLevel; expiryDate: string }[]) => void;
  updateAssociate: (associate: Associate, skills: { skillId: string; level: SkillLevel; expiryDate: string }[]) => void;
  deleteAssociate: (id: string) => void;

  addWorkstation: (workstation: Workstation) => void;
  updateWorkstation: (workstation: Workstation) => void;
  deleteWorkstation: (id: string) => void;
  addProductionLine: (line: ProductionLine) => void;
  updateProductionLine: (line: ProductionLine) => void;
  deleteProductionLine: (id: string) => void;
  addSkill: (skill: Skill) => void;
  updateSkill: (skill: Skill) => void;
  deleteSkill: (id: string) => void;
  addShift: (shift: Shift) => void;
  updateShift: (shift: Shift) => void;
  deleteShift: (id: string) => void;
  addTrainingRecord: (record: AssociateSkill) => void;
  bulkImportAssociates: (csvContent: string) => Promise<{ success: boolean; message: string; count: number }>;
  
  addLeaveRecord: (record: Omit<LeaveRecord, 'id'>) => void;
  removeLeaveRecord: (id: string) => void;

  markAttendance: (date: string, shiftId: string, associateId: string, status: 'present' | 'absent') => Promise<void>;

  allocateAssociate: (
    date: string,
    shiftId: string,
    lineId: string,
    workstationId: string,
    associateId: string,
    overrideReason: string | null
  ) => Promise<{ success: boolean; message: string }>;

  deallocateWorkstation: (
    date: string,
    shiftId: string,
    lineId: string,
    workstationId: string,
    associateId?: string
  ) => void;

  autoAllocateLine: (date: string, shiftId: string, lineId: string) => Promise<{ success: boolean; allocatedCount: number }>;
  clearLineAllocations: (date: string, shiftId: string, lineId: string) => void;

  // Validation & Queries
  getEligibilityList: (
    workstationId: string,
    date: string,
    shiftId: string
  ) => {
    eligible: { associate: Associate; skillLevel: SkillLevel; score: number }[];
    ineligible: { associate: Associate; reason: string }[];
  };

  // OT helper
  getConsecutiveWorkDays: (associateId: string, asOfDate: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Seed Data
const initialSkills: Skill[] = [
  { id: 'BLADE_OPT', name: 'Blade Operation', description: 'Slicing blade calibration and replacement' },
  { id: 'HYGIENE_L2', name: 'Food Hygiene L2', description: 'Advanced food safety and sanitation protocols' },
  { id: 'HEAT_SAFETY', name: 'High-Temp Safety', description: 'Thermal fryer safety and emergency protocols' },
  { id: 'OIL_MGMT', name: 'Oil Management', description: 'Frying oil testing, filtration, and recycling' },
  { id: 'SPICE_MIX', name: 'Spice Blending', description: 'Flavour dusting calibration and seasoning control' },
  { id: 'MECH_OP', name: 'Mechanical Operation', description: 'Packaging and bagging line mechanical configuration' },
  { id: 'QA_L1', name: 'Quality Assurance L1', description: 'Moisture, salt, and thickness packaging QA' },
  { id: 'CHEM_CERT', name: 'Quality Lab Chemist', description: 'Lab-grade chemical inspection and acidity titration' },
];

const initialProductionLines: ProductionLine[] = [
  { id: 'LINE-01', name: 'Line 01 - Potato Chips (Classic)', currentProduct: 'Lays Classic Salted', status: 'ACTIVE' },
  { id: 'LINE-02', name: 'Line 02 - Tortilla Chips (Zesty)', currentProduct: 'Doritos Cheese', status: 'ACTIVE' },
  { id: 'LINE-03', name: 'Line 03 - Pretzels (Salted)', currentProduct: 'Rold Gold Twist', status: 'MAINTENANCE' },
  { id: 'LINE-04', name: 'Line 04 - Extruded Snacks', currentProduct: 'Cheetos Puffs', status: 'IDLE' },
];

const initialWorkstations: Workstation[] = [
  // Line 01
  { id: 'WS-101', name: 'Slicing & Washing', lineId: 'LINE-01', requiredSkillId: 'BLADE_OPT', minSkillLevel: 'Operator', maxStaffCount: 1 },
  { id: 'WS-102', name: 'High-Temp Frying', lineId: 'LINE-01', requiredSkillId: 'HEAT_SAFETY', minSkillLevel: 'Certified', maxStaffCount: 1 },
  { id: 'WS-103', name: 'Flavor Application', lineId: 'LINE-01', requiredSkillId: 'SPICE_MIX', minSkillLevel: 'Operator', maxStaffCount: 1 },
  { id: 'WS-104', name: 'Auto-Bagging', lineId: 'LINE-01', requiredSkillId: 'MECH_OP', minSkillLevel: 'Operator', maxStaffCount: 1 },
  { id: 'WS-105', name: 'Quality Lab Check', lineId: 'LINE-01', requiredSkillId: 'CHEM_CERT', minSkillLevel: 'Certified', maxStaffCount: 1 },
  
  // Line 02
  { id: 'WS-201', name: 'Milling & Shearing', lineId: 'LINE-02', requiredSkillId: 'MECH_OP', minSkillLevel: 'Operator', maxStaffCount: 1 },
  { id: 'WS-202', name: 'Baking Oven Operator', lineId: 'LINE-02', requiredSkillId: 'HEAT_SAFETY', minSkillLevel: 'Operator', maxStaffCount: 1 },
  { id: 'WS-203', name: 'Seasoning Tumbler', lineId: 'LINE-02', requiredSkillId: 'SPICE_MIX', minSkillLevel: 'Trainee', maxStaffCount: 1 },
  { id: 'WS-204', name: 'Multi-Packer Unit', lineId: 'LINE-02', requiredSkillId: 'QA_L1', minSkillLevel: 'Operator', maxStaffCount: 1 },
];

const initialShifts: Shift[] = [
  { id: 'SHIFT-A', name: 'Shift A', timings: '06:00 - 14:00', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  { id: 'SHIFT-B', name: 'Shift B', timings: '14:00 - 22:00', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  { id: 'SHIFT-C', name: 'Shift C', timings: '22:00 - 06:00', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
];

const initialAssociates: Associate[] = [
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
];

const initialAssociateSkills: AssociateSkill[] = [
  // A. Chen
  { associateId: 'EMP101', skillId: 'BLADE_OPT', level: 'Certified', trainingDate: '2025-01-15', certifiedBy: 'T. Supervisor', expiryDate: '2026-12-31', reCertificationRequired: false },
  { associateId: 'EMP101', skillId: 'QA_L1', level: 'Operator', trainingDate: '2025-02-10', certifiedBy: 'Q. Manager', expiryDate: '2026-06-30', reCertificationRequired: false },
  
  // S. Miller
  { associateId: 'EMP102', skillId: 'HEAT_SAFETY', level: 'Certified', trainingDate: '2025-05-20', certifiedBy: 'Safety Board', expiryDate: '2026-10-15', reCertificationRequired: false },
  { associateId: 'EMP102', skillId: 'MECH_OP', level: 'Expert', trainingDate: '2024-06-01', certifiedBy: 'M. Plant', expiryDate: '2027-06-01', reCertificationRequired: false },
  { associateId: 'EMP102', skillId: 'OIL_MGMT', level: 'Certified', trainingDate: '2025-02-20', certifiedBy: 'M. Plant', expiryDate: '2026-08-20', reCertificationRequired: false },

  // D. Petrova
  { associateId: 'EMP103', skillId: 'CHEM_CERT', level: 'Expert', trainingDate: '2025-03-25', certifiedBy: 'Lab Director', expiryDate: '2027-03-25', reCertificationRequired: false },
  { associateId: 'EMP103', skillId: 'HYGIENE_L2', level: 'Certified', trainingDate: '2025-04-01', certifiedBy: 'QA Dept', expiryDate: '2026-04-01', reCertificationRequired: false },

  // J. Doe
  { associateId: 'EMP104', skillId: 'SPICE_MIX', level: 'Operator', trainingDate: '2025-02-20', certifiedBy: 'Line Chief', expiryDate: '2026-02-20', reCertificationRequired: false },
  { associateId: 'EMP104', skillId: 'HYGIENE_L2', level: 'Operator', trainingDate: '2025-03-01', certifiedBy: 'QA Dept', expiryDate: '2026-03-01', reCertificationRequired: false },

  // M. Kumar
  { associateId: 'EMP105', skillId: 'BLADE_OPT', level: 'Operator', trainingDate: '2024-11-10', certifiedBy: 'T. Supervisor', expiryDate: '2025-11-10', reCertificationRequired: true }, // Expired!
  { associateId: 'EMP105', skillId: 'HYGIENE_L2', level: 'Expert', trainingDate: '2024-11-15', certifiedBy: 'QA Dept', expiryDate: '2026-11-15', reCertificationRequired: false },

  // R. Patel
  { associateId: 'EMP106', skillId: 'OIL_MGMT', level: 'Operator', trainingDate: '2024-09-01', certifiedBy: 'M. Plant', expiryDate: '2026-09-01', reCertificationRequired: false },
  { associateId: 'EMP106', skillId: 'HEAT_SAFETY', level: 'Trainee', trainingDate: '2024-10-01', certifiedBy: 'Safety Board', expiryDate: '2025-04-01', reCertificationRequired: true }, // Expired!

  // L. Wong
  { associateId: 'EMP107', skillId: 'MECH_OP', level: 'Operator', trainingDate: '2025-04-12', certifiedBy: 'M. Plant', expiryDate: '2026-04-12', reCertificationRequired: false },
  { associateId: 'EMP107', skillId: 'QA_L1', level: 'Operator', trainingDate: '2025-04-15', certifiedBy: 'QA Dept', expiryDate: '2026-04-15', reCertificationRequired: false },

  // K. Sato
  { associateId: 'EMP108', skillId: 'SPICE_MIX', level: 'Trainee', trainingDate: '2024-02-01', certifiedBy: 'Line Chief', expiryDate: '2025-02-01', reCertificationRequired: true },

  // B. Jackson
  { associateId: 'EMP109', skillId: 'MECH_OP', level: 'Expert', trainingDate: '2024-09-10', certifiedBy: 'M. Plant', expiryDate: '2026-09-10', reCertificationRequired: false },

  // N. Diaz
  { associateId: 'EMP110', skillId: 'HEAT_SAFETY', level: 'Expert', trainingDate: '2023-12-15', certifiedBy: 'Safety Board', expiryDate: '2026-12-15', reCertificationRequired: false },
  { associateId: 'EMP110', skillId: 'OIL_MGMT', level: 'Expert', trainingDate: '2024-01-10', certifiedBy: 'M. Plant', expiryDate: '2027-01-10', reCertificationRequired: false },

  // T. Al-Farsi
  { associateId: 'EMP111', skillId: 'CHEM_CERT', level: 'Certified', trainingDate: '2025-05-20', certifiedBy: 'Lab Director', expiryDate: '2026-05-20', reCertificationRequired: false },

  // S. O'Connor (expiring in 5 days)
  { associateId: 'EMP112', skillId: 'BLADE_OPT', level: 'Expert', trainingDate: '2025-06-29', certifiedBy: 'T. Supervisor', expiryDate: '2026-06-30', reCertificationRequired: false }, // Near expiry relative to current date (2026-06-25)
  
  // H. Tanaka
  { associateId: 'EMP113', skillId: 'SPICE_MIX', level: 'Certified', trainingDate: '2024-07-25', certifiedBy: 'Line Chief', expiryDate: '2026-07-25', reCertificationRequired: false },
  
  // A. Mbaye
  { associateId: 'EMP114', skillId: 'HYGIENE_L2', level: 'Operator', trainingDate: '2025-05-05', certifiedBy: 'QA Dept', expiryDate: '2026-05-05', reCertificationRequired: true }, // Expired
];

const initialLeaveRecords: LeaveRecord[] = [
  { id: 'L-01', associateId: 'EMP104', date: '2026-06-25', shiftId: 'ALL' }, // J. Doe on leave today
];

const initialAllocations: Allocation[] = [
  { id: 'A-01', date: '2026-06-25', shiftId: 'SHIFT-A', lineId: 'LINE-01', workstationId: 'WS-101', associateId: 'EMP101', allocatedBy: 'R. Sharma', overrideReasonCode: null, timestamp: '2026-06-25T05:45:00Z' },
  { id: 'A-02', date: '2026-06-25', shiftId: 'SHIFT-A', lineId: 'LINE-01', workstationId: 'WS-102', associateId: 'EMP102', allocatedBy: 'R. Sharma', overrideReasonCode: null, timestamp: '2026-06-25T05:46:12Z' },
  { id: 'A-03', date: '2026-06-25', shiftId: 'SHIFT-A', lineId: 'LINE-01', workstationId: 'WS-103', associateId: 'EMP113', allocatedBy: 'R. Sharma', overrideReasonCode: null, timestamp: '2026-06-25T05:47:00Z' },
];

const initialAuditLogs: AuditLog[] = [
  { id: 'LOG-01', timestamp: '2026-06-25T05:45:00Z', actionType: 'ALLOCATION_CONFIRMED', details: 'A. Chen (EMP101) allocated to Slicing & Washing (WS-101) on Line 01 for Shift A.', userId: 'EMP102', userRole: 'Production Supervisor' },
  { id: 'LOG-02', timestamp: '2026-06-25T05:46:12Z', actionType: 'ALLOCATION_CONFIRMED', details: 'S. Miller (EMP102) allocated to High-Temp Frying (WS-102) on Line 01 for Shift A.', userId: 'EMP102', userRole: 'Production Supervisor' },
  { id: 'LOG-03', timestamp: '2026-06-25T05:47:00Z', actionType: 'ALLOCATION_CONFIRMED', details: 'H. Tanaka (EMP113) allocated to Flavor Application (WS-103) on Line 01 for Shift A.', userId: 'EMP102', userRole: 'Production Supervisor' },
];

const SKILL_LEVEL_VALUE: Record<SkillLevel, number> = {
  'Trainee': 1,
  'Operator': 2,
  'Certified': 3,
  'Expert': 4,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('Production Supervisor');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; userId: string } | null>(null);
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [associateSkills, setAssociateSkills] = useState<AssociateSkill[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const handleLogin = (newToken: string, newUser: { name: string; email: string; userId: string }, newRole: UserRole) => {
    setToken(newToken);
    setUser(newUser);
    setRole(newRole);
    localStorage.setItem('pepsico_token', newToken);
    localStorage.setItem('pepsico_user', JSON.stringify(newUser));
    localStorage.setItem('pepsico_role', JSON.stringify(newRole));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setRole('Production Supervisor');
    localStorage.removeItem('pepsico_token');
    localStorage.removeItem('pepsico_user');
    localStorage.removeItem('pepsico_role');
  };

  // Locally scoped fetch to override window.fetch and inject authorization headers
  const fetch = async (url: string | URL, options: RequestInit = {}, skipLogoutOn401 = false) => {
    const activeToken = token || localStorage.getItem('pepsico_token');
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    const res = await window.fetch(url, { ...options, headers });
    if (res.status === 401 && !skipLogoutOn401) {
      handleLogout();
    }
    return res;
  };

  const fetchState = async () => {
    try {
      // skipLogoutOn401=true: if the stored token is expired, fall back gracefully
      // instead of triggering an auto-logout that can race with manual login
      const res = await fetch("/api/v1/state", {}, true);
      if (res.status === 401) {
        // Token expired — clear stale localStorage and fall through to local data
        localStorage.removeItem('pepsico_token');
        localStorage.removeItem('pepsico_user');
        localStorage.removeItem('pepsico_role');
        setToken(null);
        setUser(null);
        throw new Error('Token expired');
      }
      if (!res.ok) throw new Error("Backend response not OK");
      const data = await res.json();
      setAssociates(data.associates || []);
      setSkills(data.skills || []);
      setAssociateSkills(data.associateSkills || []);
      setWorkstations(data.workstations || []);
      setProductionLines(data.productionLines || []);
      setShifts(data.shifts || []);
      setAllocations(data.allocations || []);
      setLeaveRecords(data.leaveRecords || []);
      setAuditLogs(data.auditLogs || []);
      setAttendanceRecords(data.attendanceRecords || []);
    } catch (err) {
      console.error("Failed to fetch state from backend, falling back to local storage:", err);
      const loadData = <T,>(key: string, initial: T): T => {
        const stored = localStorage.getItem(`pepsico_${key}`);
        return stored ? JSON.parse(stored) : initial;
      };
      setAssociates(loadData('associates', initialAssociates));
      setSkills(loadData('skills', initialSkills));
      setAssociateSkills(loadData('associateSkills', initialAssociateSkills));
      setWorkstations(loadData('workstations', initialWorkstations));
      setProductionLines(loadData('productionLines', initialProductionLines));
      setShifts(loadData('shifts', initialShifts));
      setAllocations(loadData('allocations', initialAllocations));
      setAuditLogs(loadData('auditLogs', initialAuditLogs));
      setLeaveRecords(loadData('leaveRecords', initialLeaveRecords));
      setAttendanceRecords([]); // no local fallback needed for attendance
    }
  };

  // Load from Backend or LocalStorage fallback on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('pepsico_token');
    const storedUser = localStorage.getItem('pepsico_user');
    const storedRole = localStorage.getItem('pepsico_role');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    if (storedRole) {
      try {
        setRole(JSON.parse(storedRole) as UserRole);
      } catch {
        setRole(storedRole as UserRole);
      }
    } else {
      setRole('Production Supervisor');
    }
  }, []);

  // Fetch state on mount and whenever token changes
  useEffect(() => {
    fetchState();
  }, [token]);

  // Save to LocalStorage helper
  const saveData = <T,>(key: string, data: T) => {
    localStorage.setItem(`pepsico_${key}`, JSON.stringify(data));
  };

  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
    saveData('role', newRole);
  };



  const logAction = (actionType: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actionType,
      details,
      userId: 'EMP102', // Simulated logged in supervisor
      userRole: role,
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      saveData('auditLogs', updated);
      return updated;
    });
  };

  // Associates CRUD
  const addAssociate = async (associate: Associate, skillsToAdd: { skillId: string; level: SkillLevel; expiryDate: string }[]) => {
    // Optimistic / fallback local state update
    setAssociates(prev => {
      const updated = [...prev, associate];
      saveData('associates', updated);
      return updated;
    });
    const newSkills: AssociateSkill[] = skillsToAdd.map(s => ({
      associateId: associate.id,
      skillId: s.skillId,
      level: s.level,
      trainingDate: new Date().toISOString().split('T')[0],
      certifiedBy: 'HR Systems',
      expiryDate: s.expiryDate,
      reCertificationRequired: new Date(s.expiryDate) < new Date(),
    }));
    setAssociateSkills(prev => {
      const updated = [...prev, ...newSkills];
      saveData('associateSkills', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Added associate ${associate.name} (${associate.id}) with ${skillsToAdd.length} skills.`);

    try {
      const res = await fetch("/api/v1/associates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ associate, skills: skillsToAdd })
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const updateAssociate = async (associate: Associate, skillsToAdd: { skillId: string; level: SkillLevel; expiryDate: string }[]) => {
    // Optimistic / fallback local state update
    setAssociates(prev => {
      const updated = prev.map(a => a.id === associate.id ? associate : a);
      saveData('associates', updated);
      return updated;
    });
    setAssociateSkills(prev => {
      const filtered = prev.filter(s => s.associateId !== associate.id);
      const newSkills: AssociateSkill[] = skillsToAdd.map(s => ({
        associateId: associate.id,
        skillId: s.skillId,
        level: s.level,
        trainingDate: new Date().toISOString().split('T')[0],
        certifiedBy: 'HR Systems',
        expiryDate: s.expiryDate,
        reCertificationRequired: new Date(s.expiryDate) < new Date(),
      }));
      const updated = [...filtered, ...newSkills];
      saveData('associateSkills', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Updated associate ${associate.name} (${associate.id}).`);

    try {
      const res = await fetch(`/api/v1/associates/${associate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ associate, skills: skillsToAdd })
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const deleteAssociate = async (id: string) => {
    // Optimistic / fallback local state update
    setAssociates(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveData('associates', updated);
      return updated;
    });
    setAssociateSkills(prev => {
      const updated = prev.filter(s => s.associateId !== id);
      saveData('associateSkills', updated);
      return updated;
    });
    setAllocations(prev => {
      const updated = prev.filter(a => a.associateId !== id);
      saveData('allocations', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Deleted associate ${id}.`);

    try {
      const res = await fetch(`/api/v1/associates/${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  // Workstations CRUD
  const addWorkstation = async (ws: Workstation) => {
    // Optimistic / fallback local state update
    setWorkstations(prev => {
      const updated = [...prev, ws];
      saveData('workstations', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Created workstation ${ws.name} (${ws.id}) on ${ws.lineId}.`);

    try {
      const res = await fetch("/api/v1/workstations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ws)
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const updateWorkstation = async (ws: Workstation) => {
    // Optimistic / fallback local state update
    setWorkstations(prev => {
      const updated = prev.map(w => w.id === ws.id ? ws : w);
      saveData('workstations', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Updated workstation ${ws.name} (${ws.id}).`);

    try {
      const res = await fetch(`/api/v1/workstations/${ws.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ws)
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const deleteWorkstation = async (id: string) => {
    // Optimistic / fallback local state update
    setWorkstations(prev => {
      const updated = prev.filter(w => w.id !== id);
      saveData('workstations', updated);
      return updated;
    });
    setAllocations(prev => {
      const updated = prev.filter(a => a.workstationId !== id);
      saveData('allocations', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Deleted workstation ${id}.`);

    try {
      const res = await fetch(`/api/v1/workstations/${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const addProductionLine = async (line: ProductionLine) => {
    setProductionLines(prev => {
      const updated = [...prev, line];
      saveData('productionLines', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Created production line ${line.name} (${line.id}).`);

    try {
      const res = await fetch("/api/v1/production-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(line)
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const updateProductionLine = async (line: ProductionLine) => {
    setProductionLines(prev => {
      const updated = prev.map(l => l.id === line.id ? line : l);
      saveData('productionLines', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Updated production line ${line.name} (${line.id}).`);

    try {
      const res = await fetch(`/api/v1/production-lines/${line.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(line)
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const deleteProductionLine = async (id: string) => {
    setProductionLines(prev => {
      const updated = prev.filter(l => l.id !== id);
      saveData('productionLines', updated);
      return updated;
    });
    setWorkstations(prev => {
      const updated = prev.filter(w => w.lineId !== id);
      saveData('workstations', updated);
      return updated;
    });
    setAllocations(prev => {
      const updated = prev.filter(a => a.lineId !== id);
      saveData('allocations', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Deleted production line ${id}.`);

    try {
      const res = await fetch(`/api/v1/production-lines/${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const addSkill = async (skill: Skill) => {
    setSkills(prev => {
      const updated = [...prev, skill];
      saveData('skills', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Created skill ${skill.name} (${skill.id}).`);

    try {
      const res = await fetch("/api/v1/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skill)
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const updateSkill = async (skill: Skill) => {
    setSkills(prev => {
      const updated = prev.map(s => s.id === skill.id ? skill : s);
      saveData('skills', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Updated skill ${skill.name} (${skill.id}).`);

    try {
      const res = await fetch(`/api/v1/skills/${skill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skill)
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const deleteSkill = async (id: string) => {
    setSkills(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveData('skills', updated);
      return updated;
    });
    setAssociateSkills(prev => {
      const updated = prev.filter(s => s.skillId !== id);
      saveData('associateSkills', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Deleted skill ${id}.`);

    try {
      const res = await fetch(`/api/v1/skills/${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };


  const addShift = async (shift: Shift) => {
    setShifts(prev => {
      const updated = [...prev, shift];
      saveData('shifts', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Created shift ${shift.name} (${shift.id}).`);

    try {
      const res = await fetch("/api/v1/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shift)
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const updateShift = async (shift: Shift) => {
    setShifts(prev => {
      const updated = prev.map(s => s.id === shift.id ? shift : s);
      saveData('shifts', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Updated shift ${shift.name} (${shift.id}).`);

    try {
      const res = await fetch(`/api/v1/shifts/${shift.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shift)
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const deleteShift = async (id: string) => {
    setShifts(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveData('shifts', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Deleted shift ${id}.`);

    try {
      const res = await fetch(`/api/v1/shifts/${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };


  const addTrainingRecord = async (record: AssociateSkill) => {
    // Optimistic / fallback local state update
    setAssociateSkills(prev => {
      const existsIndex = prev.findIndex(s => s.associateId === record.associateId && s.skillId === record.skillId);
      let updated: AssociateSkill[];
      if (existsIndex > -1) {
        updated = prev.map((s, idx) => idx === existsIndex ? record : s);
      } else {
        updated = [...prev, record];
      }
      saveData('associateSkills', updated);
      return updated;
    });
    const assoc = associates.find(a => a.id === record.associateId);
    const skill = skills.find(s => s.id === record.skillId);
    logAction('TRAINING_ADDED', `Updated training: ${assoc?.name} certified in ${skill?.name} at ${record.level} level.`);

    try {
      if (assoc) {
        const otherSkills = associateSkills
          .filter(s => s.associateId === record.associateId && s.skillId !== record.skillId)
          .map(s => ({ skillId: s.skillId, level: s.level, expiryDate: s.expiryDate }));
        const allSkills = [...otherSkills, { skillId: record.skillId, level: record.level, expiryDate: record.expiryDate }];
        
        const res = await fetch(`/api/v1/associates/${record.associateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ associate: assoc, skills: allSkills })
        });
        if (res.ok) fetchState();
      }
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  // Leave records
  const addLeaveRecord = async (record: Omit<LeaveRecord, 'id'>) => {
    const id = `L-${Date.now()}`;
    const newRecord = { ...record, id };
    setLeaveRecords(prev => {
      const updated = [...prev, newRecord];
      saveData('leaveRecords', updated);
      return updated;
    });
    setAllocations(prev => {
      const updated = prev.filter(a => !(a.associateId === record.associateId && a.date === record.date && (record.shiftId === 'ALL' || a.shiftId === record.shiftId)));
      saveData('allocations', updated);
      return updated;
    });
    const assoc = associates.find(a => a.id === record.associateId);
    logAction('MASTER_DATA_UPDATED', `Marked ${assoc?.name} on leave for ${record.date}.`);

    try {
      const res = await fetch("/api/v1/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  const removeLeaveRecord = async (id: string) => {
    setLeaveRecords(prev => {
      const updated = prev.filter(l => l.id !== id);
      saveData('leaveRecords', updated);
      return updated;
    });
    logAction('MASTER_DATA_UPDATED', `Removed leave record ${id}.`);

    try {
      const res = await fetch(`/api/v1/leave/${id}`, {
        method: "DELETE"
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error, local fallback used:", err);
    }
  };

  // Bulk Import
  const bulkImportAssociates = async (csvContent: string): Promise<{ success: boolean; message: string; count: number }> => {
    try {
      const res = await fetch("/api/v1/associates/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent })
      });
      if (res.ok) {
        const data = await res.json();
        fetchState();
        return { success: true, message: data.message, count: data.count };
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to bulk import");
      }
    } catch (err: any) {
      console.error("Backend error in bulk import, falling back to local CSV parsing:", err);
      // Local CSV Parsing fallback
      try {
        const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length <= 1) return { success: false, message: 'Empty CSV or headers only', count: 0 };
        
        const headers = lines[0].toLowerCase().split(',');
        const idIdx = headers.indexOf('employee_id');
        const nameIdx = headers.indexOf('name');
        const categoryIdx = headers.indexOf('category');
        const skillsIdx = headers.indexOf('skills');

        if (idIdx === -1 || nameIdx === -1) {
          return { success: false, message: 'Invalid CSV format. Missing employee_id or name headers.', count: 0 };
        }

        let count = 0;
        const newAssociates: Associate[] = [];
        const newSkills: AssociateSkill[] = [];

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim());
          if (parts.length < headers.length) continue;

          const id = parts[idIdx];
          const name = parts[nameIdx];
          const categoryStr = categoryIdx > -1 ? parts[categoryIdx] : 'Contract';
          const category: AssociateCategory = ['Company', 'NTCI', 'Contract'].includes(categoryStr) 
            ? (categoryStr as AssociateCategory) 
            : 'Contract';

          const associate: Associate = {
            id,
            name,
            category,
            joiningDate: new Date().toISOString().split('T')[0],
            status: 'Active',
          };

          newAssociates.push(associate);
          count++;

          if (skillsIdx > -1 && parts[skillsIdx]) {
            const skillEntries = parts[skillsIdx].split(';');
            skillEntries.forEach(entry => {
              const [skillId, lvl, expDate] = entry.split(':');
              if (skillId && lvl) {
                const skillLevel = ['Trainee', 'Operator', 'Certified', 'Expert'].includes(lvl) 
                  ? (lvl as SkillLevel) 
                  : 'Operator';
                
                newSkills.push({
                  associateId: id,
                  skillId,
                  level: skillLevel,
                  trainingDate: new Date().toISOString().split('T')[0],
                  certifiedBy: 'System Import',
                  expiryDate: expDate || '2027-12-31',
                  reCertificationRequired: expDate ? new Date(expDate) < new Date() : false,
                });
              }
            });
          }
        }

        setAssociates(prev => {
          const filtered = prev.filter(a => !newAssociates.some(na => na.id === a.id));
          const updated = [...filtered, ...newAssociates];
          saveData('associates', updated);
          return updated;
        });

        setAssociateSkills(prev => {
          const filtered = prev.filter(s => !newAssociates.some(na => na.id === s.associateId));
          const updated = [...filtered, ...newSkills];
          saveData('associateSkills', updated);
          return updated;
        });

        logAction('MASTER_DATA_UPDATED', `Imported ${count} associates via CSV bulk upload (local).`);
        return { success: true, message: `Successfully imported ${count} associates (local).`, count };
      } catch (localErr: any) {
        return { success: false, message: `Error parsing CSV locally: ${localErr.message}`, count: 0 };
      }
    }
  };

  // Eligibility query
  const getEligibilityList = (
    workstationId: string,
    date: string,
    shiftId: string
  ) => {
    const ws = workstations.find(w => w.id === workstationId);
    if (!ws) return { eligible: [], ineligible: [] };

    const reqSkills = ws.requiredSkillId.split(';');
    const reqMinLevelValue = SKILL_LEVEL_VALUE[ws.minSkillLevel];

    const eligibleList: { associate: Associate; skillLevel: SkillLevel; score: number }[] = [];
    const ineligibleList: { associate: Associate; reason: string }[] = [];

    associates.forEach(assoc => {
      // 1. Inactive check
      if (assoc.status !== 'Active') {
        ineligibleList.push({ associate: assoc, reason: 'Inactive profile' });
        return;
      }

      // 2. On leave check
      const onLeave = leaveRecords.some(l => l.associateId === assoc.id && l.date === date && (l.shiftId === 'ALL' || l.shiftId === shiftId));
      if (onLeave) {
        ineligibleList.push({ associate: assoc, reason: 'On leave' });
        return;
      }

      // Check attendance
      const attendance = attendanceRecords.find(r => r.associateId === assoc.id && r.date === date && r.shiftId === shiftId);
      if (attendance && attendance.status === 'absent') {
        ineligibleList.push({ associate: assoc, reason: 'Marked absent today' });
        return;
      }

      // 3. Already allocated check
      // If assigned to THIS same workstation in this shift → already there, skip (don't show again)
      const alreadyOnThisWS = allocations.some(a => a.date === date && a.shiftId === shiftId && a.associateId === assoc.id && a.workstationId === workstationId);
      if (alreadyOnThisWS) return; // silently skip — already assigned here

      // If assigned to ANY OTHER station or shift on the same day → ineligible
      const allocatedElsewhere = allocations.some(a => a.date === date && a.associateId === assoc.id && a.workstationId !== workstationId);
      if (allocatedElsewhere) {
        const allocatedWS = allocations.find(a => a.date === date && a.associateId === assoc.id && a.workstationId !== workstationId);
        const currentWs = workstations.find(w => w.id === allocatedWS?.workstationId);
        ineligibleList.push({ associate: assoc, reason: `Already allocated today (Station: ${currentWs?.name || 'unknown'})` });
        return;
      }

      // 4. Multiple Skills Check
      let hasAllSkills = true;
      let missingSkillCode = '';
      let expiredSkillCode = '';
      let expiredDate = '';
      let insufficientLvlSkillCode = '';
      let lowestSkillLevelValue = 999;
      let lowestSkillLevelName: SkillLevel = 'Trainee';

      for (const reqSkill of reqSkills) {
        const assocSkill = associateSkills.find(s => s.associateId === assoc.id && s.skillId === reqSkill);
        if (!assocSkill) {
          hasAllSkills = false;
          missingSkillCode = reqSkill;
          break;
        }

        // Expiration check
        const isExpired = new Date(assocSkill.expiryDate) < new Date(date);
        if (isExpired) {
          hasAllSkills = false;
          expiredSkillCode = reqSkill;
          expiredDate = assocSkill.expiryDate;
          break;
        }

        // Level check
        const skillLevelValue = SKILL_LEVEL_VALUE[assocSkill.level];
        if (skillLevelValue < reqMinLevelValue) {
          hasAllSkills = false;
          insufficientLvlSkillCode = reqSkill;
          break;
        }

        if (skillLevelValue < lowestSkillLevelValue) {
          lowestSkillLevelValue = skillLevelValue;
          lowestSkillLevelName = assocSkill.level;
        }
      }

      if (!hasAllSkills) {
        if (missingSkillCode) {
          ineligibleList.push({ associate: assoc, reason: `Missing required skill (${missingSkillCode})` });
        } else if (expiredSkillCode) {
          ineligibleList.push({ associate: assoc, reason: `Skill certification expired on ${expiredDate} (${expiredSkillCode})` });
        } else if (insufficientLvlSkillCode) {
          ineligibleList.push({ associate: assoc, reason: `Insufficient level for ${insufficientLvlSkillCode} (Requires: ${ws.minSkillLevel})` });
        }
        return;
      }

      // Calculate Eligibility Score using lowest matching level:
      let score = lowestSkillLevelValue * 10;
      if (assoc.category === 'Company') score += 5;
      else if (assoc.category === 'Contract') score += 3;
      else score += 1;

      // Subtract 15 points per existing assignment to equalize workload
      const totalWorkload = allocations.filter(a => a.associateId === assoc.id).length;
      score -= totalWorkload * 15;

      eligibleList.push({
        associate: assoc,
        skillLevel: lowestSkillLevelName,
        score,
      });
    });

    // Sort eligible list by score (descending)
    eligibleList.sort((a, b) => b.score - a.score);

    return {
      eligible: eligibleList,
      ineligible: ineligibleList,
    };
  };

  // Manual Allocate Action
  const allocateAssociate = async (
    date: string,
    shiftId: string,
    lineId: string,
    workstationId: string,
    associateId: string,
    overrideReason: string | null
  ): Promise<{ success: boolean; message: string }> => {
    // 1. First, filter out any existing allocation for this associate on this date and shift (to prevent double assignment)
    let updatedAllocations = allocations.filter(a => !(a.date === date && a.shiftId === shiftId && a.associateId === associateId));

    // 2. Check capacity
    const ws = workstations.find(w => w.id === workstationId);
    const capacity = ws?.maxStaffCount || 1;
    const currentWSAllocations = updatedAllocations.filter(a => a.date === date && a.shiftId === shiftId && a.workstationId === workstationId);
    if (currentWSAllocations.length >= capacity) {
      return { success: false, message: `Workstation is already at full capacity (${capacity}/${capacity} operators allocated).` };
    }

    const newAllocation: Allocation = {
      id: `A-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date,
      shiftId,
      lineId,
      workstationId,
      associateId,
      allocatedBy: 'R. Sharma',
      overrideReasonCode: overrideReason,
      timestamp: new Date().toISOString(),
    };

    const finalAllocations = [...updatedAllocations, newAllocation];
    setAllocations(finalAllocations);
    saveData('allocations', finalAllocations);

    const assoc = associates.find(a => a.id === associateId);

    if (overrideReason) {
      logAction('OVERRIDE_ALLOCATION', `OVERRIDE: ${assoc?.name} allocated to ${ws?.name} on Line ${lineId.replace('LINE-', '')}. Reason: ${overrideReason}`);
    } else {
      logAction('ALLOCATION_CONFIRMED', `${assoc?.name} allocated to ${ws?.name} on Line ${lineId.replace('LINE-', '')}.`);
    }

    try {
      const res = await fetch("/api/v1/allocation/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, shiftId, lineId, workstationId, associateId, overrideReason })
      });
      if (res.ok) {
        fetchState();
        return { success: true, message: 'Allocation successful' };
      } else {
        const errData = await res.json();
        return { success: false, message: errData.message || 'Allocation failed on backend.' };
      }
    } catch (err) {
      console.error("Backend error on manual allocate, local state used:", err);
      return { success: true, message: 'Allocation completed locally (fallback mode).' };
    }
  };

  const deallocateWorkstation = async (
    date: string,
    shiftId: string,
    lineId: string,
    workstationId: string,
    associateId?: string
  ) => {
    let targetAlloc: Allocation | undefined;
    if (associateId) {
      targetAlloc = allocations.find(a => a.date === date && a.shiftId === shiftId && a.workstationId === workstationId && a.associateId === associateId);
    } else {
      targetAlloc = allocations.find(a => a.date === date && a.shiftId === shiftId && a.workstationId === workstationId);
    }

    if (targetAlloc) {
      setAllocations(prev => {
        const updated = prev.filter(a => {
          const match = a.date === date && a.shiftId === shiftId && a.workstationId === workstationId;
          if (match) {
            if (associateId) {
              return a.associateId !== associateId;
            }
            return false;
          }
          return true;
        });
        saveData('allocations', updated);
        return updated;
      });
      
      const ws = workstations.find(w => w.id === workstationId);
      const targetName = associateId ? (associates.find(a => a.id === associateId)?.name || associateId) : 'all operators';
      logAction('ALLOCATION_CONFIRMED', `Deallocated ${targetName} from station ${ws?.name} on Line ${lineId.replace('LINE-', '')}.`);
    }

    try {
      const res = await fetch("/api/v1/allocation/deallocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, shiftId, workstationId, lineId, associateId })
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error on deallocate, local state used:", err);
    }
  };

  // Clear allocations
  const clearLineAllocations = async (date: string, shiftId: string, lineId: string) => {
    setAllocations(prev => {
      const updated = prev.filter(a => !(a.date === date && a.shiftId === shiftId && a.lineId === lineId));
      saveData('allocations', updated);
      return updated;
    });
    logAction('ALLOCATION_CONFIRMED', `Cleared all allocations for Line ${lineId.replace('LINE-', '')} for Shift ${shiftId.replace('SHIFT-', '')}.`);

    try {
      const res = await fetch("/api/v1/allocation/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, shiftId, lineId })
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Backend error on clear, local state used:", err);
    }
  };

  // Auto Allocation Algorithm
  const autoAllocateLine = async (date: string, shiftId: string, lineId: string): Promise<{ success: boolean; allocatedCount: number }> => {
    try {
      const res = await fetch("/api/v1/allocation/auto-allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, shiftId, lineId })
      });
      if (res.ok) {
        const data = await res.json();
        fetchState();
        return { success: true, allocatedCount: data.allocatedCount };
      } else {
        throw new Error("Failed to auto-allocate on backend");
      }
    } catch (err) {
      console.error("Backend error on auto-allocate, falling back to local optimization algorithm:", err);
      // Local Algorithm Fallback
      const lineWS = workstations.filter(w => w.lineId === lineId);
      if (lineWS.length === 0) return { success: false, allocatedCount: 0 };

      const filteredAllocations = allocations.filter(a => !(a.date === date && a.shiftId === shiftId && a.lineId === lineId));
      const currentSolveAllocations = [...filteredAllocations];
      let count = 0;

      const sortedWS = [...lineWS].sort((a, b) => {
        const scoreA = SKILL_LEVEL_VALUE[a.minSkillLevel];
        const scoreB = SKILL_LEVEL_VALUE[b.minSkillLevel];
        return scoreB - scoreA;
      });

      const isEmployeeScheduledOnDate = (assocId: string) => {
        return currentSolveAllocations.some(a => a.date === date && a.associateId === assocId);
      };

      const getWorkloadCount = (assocId: string) => {
        return currentSolveAllocations.filter(a => a.associateId === assocId).length;
      };

      sortedWS.forEach(ws => {
        const reqSkill = ws.requiredSkillId;
        const minLvlValue = SKILL_LEVEL_VALUE[ws.minSkillLevel];
        const capacity = ws.maxStaffCount || 1;

        for (let slot = 0; slot < capacity; slot++) {
          const candidates: { associate: Associate; level: SkillLevel; score: number }[] = [];

          associates.forEach(assoc => {
            if (assoc.status !== 'Active') return;
            if (isEmployeeScheduledOnDate(assoc.id)) return;

            const onLeave = leaveRecords.some(l => l.associateId === assoc.id && l.date === date && (l.shiftId === 'ALL' || l.shiftId === shiftId));
            if (onLeave) return;

            // Check attendance
            const attendance = attendanceRecords.find(r => r.associateId === assoc.id && r.date === date && r.shiftId === shiftId);
            if (attendance && attendance.status === 'absent') return;

            const aSkill = associateSkills.find(s => s.associateId === assoc.id && s.skillId === reqSkill);
            if (!aSkill) return;

            if (new Date(aSkill.expiryDate) < new Date(date)) return;

            const skillLvlValue = SKILL_LEVEL_VALUE[aSkill.level];
            if (skillLvlValue < minLvlValue) return;

            let score = skillLvlValue * 10;
            if (assoc.category === 'Company') score += 5;
            else if (assoc.category === 'Contract') score += 3;
            else score += 1;

            const workload = getWorkloadCount(assoc.id);
            score -= workload * 15;

            candidates.push({ associate: assoc, level: aSkill.level, score });
          });

          candidates.sort((a, b) => b.score - a.score);

          if (candidates.length > 0) {
            const best = candidates[0].associate;
            const newAlloc: Allocation = {
              id: `A-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              date,
              shiftId,
              lineId,
              workstationId: ws.id,
              associateId: best.id,
              allocatedBy: 'Auto System',
              overrideReasonCode: null,
              timestamp: new Date().toISOString(),
            };
            currentSolveAllocations.push(newAlloc);
            count++;
          } else {
            break; // No more eligible candidates for subsequent slots
          }
        }
      });

      setAllocations(currentSolveAllocations);
      saveData('allocations', currentSolveAllocations);
      logAction('ALLOCATION_CONFIRMED', `Auto-allocated ${count} workstations (local fallback) for Line ${lineId.replace('LINE-', '')} (Shift ${shiftId.replace('SHIFT-', '')}).`);
      return { success: true, allocatedCount: count };
    }
  };

  const markAttendance = async (date: string, shiftId: string, associateId: string, status: 'present' | 'absent'): Promise<void> => {
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => !(r.date === date && r.shiftId === shiftId && r.associateId === associateId));
      const newRecord: AttendanceRecord = {
        id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date,
        shiftId,
        associateId,
        status,
        markedBy: 'R. Sharma',
        timestamp: new Date().toISOString()
      };
      return [...filtered, newRecord];
    });

    try {
      const res = await fetch("http://localhost:5505/api/v1/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, shiftId, associateId, status, markedBy: 'R. Sharma' })
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Failed to post attendance to backend:", err);
    }
  };

  const getConsecutiveWorkDays = (associateId: string, asOfDate: string): number => {
    const d = new Date(asOfDate);
    let consecutiveCount = 0;
    for (let i = 0; i < 10; i++) {
      const checkDate = new Date(d);
      checkDate.setDate(d.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const isAllocated = allocations.some(a => a.associateId === associateId && a.date === dateStr);
      if (isAllocated) {
        consecutiveCount++;
      } else {
        break;
      }
    }
    return consecutiveCount;
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole: handleSetRole,
        token,
        user,
        login: handleLogin,
        logout: handleLogout,
        associates,
        skills,
        associateSkills,
        workstations,
        productionLines,
        shifts,
        allocations,
        auditLogs,
        leaveRecords,
        attendanceRecords,
        
        addAssociate,
        updateAssociate,
        deleteAssociate,
        addWorkstation,
        updateWorkstation,
        deleteWorkstation,
        addProductionLine,
        updateProductionLine,
        deleteProductionLine,
        addSkill,
        updateSkill,
        deleteSkill,
        addShift,
        updateShift,
        deleteShift,
        addTrainingRecord,
        bulkImportAssociates,
        addLeaveRecord,
        removeLeaveRecord,
        markAttendance,
        allocateAssociate,
        deallocateWorkstation,
        autoAllocateLine,
        clearLineAllocations,
        getEligibilityList,
        getConsecutiveWorkDays,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
