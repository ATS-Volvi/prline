import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// Initial Seed Data (Fallback)
const initialSkills: Skill[] = [];
const initialProductionLines: ProductionLine[] = [];
const initialWorkstations: Workstation[] = [];
const initialShifts: Shift[] = [];
const initialAssociates: Associate[] = [];
const initialAssociateSkills: AssociateSkill[] = [];
const initialLeaveRecords: LeaveRecord[] = [];
const initialAllocations: Allocation[] = [];
const initialAuditLogs: AuditLog[] = [];

const SKILL_LEVEL_VALUE: Record<SkillLevel, number> = {
  'Trainee': 1,
  'Operator': 2,
  'Certified': 3,
  'Expert': 4,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<UserRole>('Production Supervisor');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; userId: string } | null>(null);

  // Load from LocalStorage fallback on mount
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

  // Queries
  const createQuery = <T,>(key: string, url: string, fallbackData: T) => useQuery<T>({
    queryKey: [key],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${key}`);
      return res.json();
    },
    enabled: !!token,
    initialData: fallbackData,
  });

  const associatesQuery = createQuery('associates', '/api/v1/associates', initialAssociates);
  const skillsQuery = createQuery('skills', '/api/v1/skills', initialSkills);
  const associateSkillsQuery = createQuery('associateSkills', '/api/v1/associate-skills', initialAssociateSkills);
  const workstationsQuery = createQuery('workstations', '/api/v1/workstations', initialWorkstations);
  const productionLinesQuery = createQuery('productionLines', '/api/v1/production-lines', initialProductionLines);
  const shiftsQuery = createQuery('shifts', '/api/v1/shifts', initialShifts);
  const allocationsQuery = createQuery('allocations', '/api/v1/allocations', initialAllocations);
  const leaveRecordsQuery = createQuery('leaveRecords', '/api/v1/leave', initialLeaveRecords);
  const auditLogsQuery = createQuery('auditLogs', '/api/v1/audit-logs', initialAuditLogs);
  const attendanceRecordsQuery = createQuery('attendanceRecords', '/api/v1/attendance', []);

  // Map to local variables for context
  const associates = associatesQuery.data as Associate[];
  const skills = skillsQuery.data as Skill[];
  const associateSkills = associateSkillsQuery.data as AssociateSkill[];
  const workstations = workstationsQuery.data as Workstation[];
  const productionLines = productionLinesQuery.data as ProductionLine[];
  const shifts = shiftsQuery.data as Shift[];
  const allocations = allocationsQuery.data as Allocation[];
  const leaveRecords = leaveRecordsQuery.data as LeaveRecord[];
  const auditLogs = auditLogsQuery.data as AuditLog[];
  const attendanceRecords = attendanceRecordsQuery.data as AttendanceRecord[];

  // Save to LocalStorage helper
  const saveData = <T,>(key: string, data: T) => {
    localStorage.setItem(`pepsico_${key}`, JSON.stringify(data));
  };

  // Setters to bridge old useState code with React Query cache
  const setAssociates = (updater: Associate[] | ((prev: Associate[]) => Associate[])) => {
    queryClient.setQueryData(['associates'], (old: Associate[] | undefined) => { const next = typeof updater === 'function' ? updater(old || initialAssociates) : updater; saveData('associates', next); return next; });
  };
  const setSkills = (updater: Skill[] | ((prev: Skill[]) => Skill[])) => {
    queryClient.setQueryData(['skills'], (old: Skill[] | undefined) => { const next = typeof updater === 'function' ? updater(old || initialSkills) : updater; saveData('skills', next); return next; });
  };
  const setAssociateSkills = (updater: AssociateSkill[] | ((prev: AssociateSkill[]) => AssociateSkill[])) => {
    queryClient.setQueryData(['associateSkills'], (old: AssociateSkill[] | undefined) => { const next = typeof updater === 'function' ? updater(old || initialAssociateSkills) : updater; saveData('associateSkills', next); return next; });
  };
  const setWorkstations = (updater: Workstation[] | ((prev: Workstation[]) => Workstation[])) => {
    queryClient.setQueryData(['workstations'], (old: Workstation[] | undefined) => { const next = typeof updater === 'function' ? updater(old || initialWorkstations) : updater; saveData('workstations', next); return next; });
  };
  const setProductionLines = (updater: ProductionLine[] | ((prev: ProductionLine[]) => ProductionLine[])) => {
    queryClient.setQueryData(['productionLines'], (old: ProductionLine[] | undefined) => { const next = typeof updater === 'function' ? updater(old || initialProductionLines) : updater; saveData('productionLines', next); return next; });
  };
  const setShifts = (updater: Shift[] | ((prev: Shift[]) => Shift[])) => {
    queryClient.setQueryData(['shifts'], (old: Shift[] | undefined) => { const next = typeof updater === 'function' ? updater(old || initialShifts) : updater; saveData('shifts', next); return next; });
  };
  const setAllocations = (updater: Allocation[] | ((prev: Allocation[]) => Allocation[])) => {
    queryClient.setQueryData(['allocations'], (old: Allocation[] | undefined) => { const next = typeof updater === 'function' ? updater(old || initialAllocations) : updater; saveData('allocations', next); return next; });
  };
  const setLeaveRecords = (updater: LeaveRecord[] | ((prev: LeaveRecord[]) => LeaveRecord[])) => {
    queryClient.setQueryData(['leaveRecords'], (old: LeaveRecord[] | undefined) => { const next = typeof updater === 'function' ? updater(old || initialLeaveRecords) : updater; saveData('leaveRecords', next); return next; });
  };
  const setAuditLogs = (updater: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => {
    queryClient.setQueryData(['auditLogs'], (old: AuditLog[] | undefined) => { const next = typeof updater === 'function' ? updater(old || initialAuditLogs) : updater; saveData('auditLogs', next); return next; });
  };
  const setAttendanceRecords = (updater: AttendanceRecord[] | ((prev: AttendanceRecord[]) => AttendanceRecord[])) => {
    queryClient.setQueryData(['attendanceRecords'], (old: AttendanceRecord[] | undefined) => { const next = typeof updater === 'function' ? updater(old || []) : updater; saveData('attendanceRecords', next); return next; });
  };

  const fetchState = () => {
    queryClient.invalidateQueries();
  };



  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
    saveData('role', newRole);
  };



  const logAction = async (actionType: string, details: string) => {
    const currentUserId = user?.userId || 'EMP102';
    const currentRole = role;
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actionType,
      details,
      userId: currentUserId,
      userRole: currentRole,
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      saveData('auditLogs', updated);
      return updated;
    });

    try {
      const res = await fetch("/api/v1/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType, details })
      });
      if (res.ok) fetchState();
    } catch (err) {
      console.error("Failed to post audit log to backend:", err);
    }
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5505"}/api/v1/attendance`, {
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
