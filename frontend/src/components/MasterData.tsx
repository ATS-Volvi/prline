import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Associate, Workstation, AssociateCategory, SkillLevel, ProductionLine, LineStatus, Skill, Shift } from '../types';
import { ShiftPlanner } from './ShiftPlanner';

interface MasterDataProps {
  initialSubTab?: 'associates' | 'workstations' | 'skills' | 'lines' | 'shifts';
  selectedLineId?: string;
  setSelectedLineId?: (id: string) => void;
  setActiveTab?: (tab: string) => void;
}

export const MasterData: React.FC<MasterDataProps> = ({ initialSubTab, selectedLineId, setSelectedLineId, setActiveTab }) => {
  const {
    associates,
    workstations,
    skills,
    productionLines,
    shifts,
    allocations,
    addAssociate,
    updateAssociate,
    deleteAssociate,
    addWorkstation,
    updateWorkstation,
    deleteWorkstation,
    addProductionLine,
    updateProductionLine,
    addSkill,
    updateSkill,
    deleteSkill,
    addShift,
    updateShift,
    associateSkills,
    addTrainingRecord,
    role
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'associates' | 'workstations' | 'skills' | 'lines' | 'shifts'>(() => {
    if (initialSubTab) return initialSubTab;
    const stored = localStorage.getItem('master_data_sub_tab');
    return (stored as any) || 'associates';
  });

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
      setSelectedAssociate(null);
    }
  }, [initialSubTab]);

  // Profile View States
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(null);
  const [profileTab, setProfileTab] = useState<'skills' | 'certs' | 'training' | 'logs'>('skills');

  // Team Directory States
  const [associatesPage, setAssociatesPage] = useState(1);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('All');
  const [activeMenuAssocId, setActiveMenuAssocId] = useState<string | null>(null);
  const [assocSearchQuery, setAssocSearchQuery] = useState('');

  // Certification Matrix View States
  const [associatesViewMode, setAssociatesViewMode] = useState<'directory' | 'matrix'>('directory');
  const [matrixPage, setMatrixPage] = useState(1);
  const [matrixLineFilter, setMatrixLineFilter] = useState('All Lines');
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState('All Categories');
  const [matrixSkillLevelFilter, setMatrixSkillLevelFilter] = useState('Any Skill');
  const [matrixShowExpired, setMatrixShowExpired] = useState(true);

  // Assign training modal states
  const [showAssignTrainingModal, setShowAssignTrainingModal] = useState(false);
  const [trainAssocId, setTrainAssocId] = useState('');
  const [trainSkillId, setTrainSkillId] = useState('BLADE_OPT');
  const [trainLevel, setTrainLevel] = useState<SkillLevel>('Operator');
  const [trainExpiry, setTrainExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2); // default 2 years valid
    return d.toISOString().split('T')[0];
  });
  const [selectedAssociateLogs, setSelectedAssociateLogs] = useState<PerformanceLog[]>([]);
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [newLogType, setNewLogType] = useState<'Commendation' | 'Safety Note' | 'Attendance'>('Commendation');
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogDesc, setNewLogDesc] = useState('');

  interface PerformanceLog {
    id: string;
    associateId: string;
    type: 'Commendation' | 'Safety Note' | 'Attendance';
    title: string;
    description: string;
    date: string;
    supervisor: string;
  }

  // Load logs on associate change
  useEffect(() => {
    if (selectedAssociate) {
      const stored = localStorage.getItem(`perf_logs_${selectedAssociate.id}`);
      if (stored) {
        setSelectedAssociateLogs(JSON.parse(stored));
      } else {
        const defaults: PerformanceLog[] = [
          {
            id: 'log-1',
            associateId: selectedAssociate.id,
            type: 'Commendation',
            title: 'Exceptional handling of frying unit calibration',
            description: 'Exceptional handling of frying unit calibration during peak shift, preventing 2h of potential downtime.',
            date: '2024-02-20',
            supervisor: 'Sarah Miller'
          },
          {
            id: 'log-2',
            associateId: selectedAssociate.id,
            type: 'Safety Note',
            title: 'Reported worn seal on Seasoning Drum',
            description: 'Reported a worn seal on Seasoning Drum S-04 before failure.',
            date: '2024-01-12',
            supervisor: 'Admin User'
          },
          {
            id: 'log-3',
            associateId: selectedAssociate.id,
            type: 'Attendance',
            title: 'Volunteered for overtime shift',
            description: 'Volunteered for overtime shift on Kurkure Line A.',
            date: '2023-12-05',
            supervisor: 'James Dalton'
          }
        ];
        setSelectedAssociateLogs(defaults);
        localStorage.setItem(`perf_logs_${selectedAssociate.id}`, JSON.stringify(defaults));
      }
    }
  }, [selectedAssociate]);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogTitle || !newLogDesc || !selectedAssociate) return;

    const newLog: PerformanceLog = {
      id: 'log-' + Date.now(),
      associateId: selectedAssociate.id,
      type: newLogType,
      title: newLogTitle,
      description: newLogDesc,
      date: new Date().toISOString().split('T')[0],
      supervisor: role || 'Admin User'
    };

    const updated = [newLog, ...selectedAssociateLogs];
    setSelectedAssociateLogs(updated);
    localStorage.setItem(`perf_logs_${selectedAssociate.id}`, JSON.stringify(updated));

    // Reset Form
    setNewLogTitle('');
    setNewLogDesc('');
    setShowAddLogModal(false);
  };

  const getAvatarUrl = (name: string) => {
    if (name.includes("Marcus") || name.includes("Chen")) {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuDfI-JZyjb1pQwgoRAtI8MGXNX2TkA8IMEQGilu9TafNco6H0681KiHavWtbDCOinqxPmMVNW7cH2PGWBix5r5qN2C9dtJepLRZ5jQe-w5EM4EAd4HpvXjXE2ZjUfZ8L0JYCnIpFNelIEATQDAcZpx-hcSk2br-2DUV4G-gnc11DusyAddAz185_iYFO8pJdibyEO4J1XRizRZ5LQl04mYp3jucUv_Ldv1I8ajvM3NZ3OargpKyQvu6reWcSh6mOS_F6lv4y82etqE";
    }
    const malePortraits = [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
    ];
    const femalePortraits = [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
    ];
    const isFemale = name.match(/[aieou]$/i) || name.includes("Priya") || name.includes("S.") || name.includes("Petrova") || name.includes("L Wong") || name.includes("Miller");
    const list = isFemale ? femalePortraits : malePortraits;
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return list[hash % list.length];
  };

  const getTenure = (joiningDateStr: string) => {
    const joining = new Date(joiningDateStr);
    const today = new Date();
    const diffTime = today.getTime() - joining.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "New Joinee";
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} Month${months !== 1 ? 's' : ''} Tenure`;
    }
    const years = (diffDays / 365).toFixed(1);
    return `${years} Year${parseFloat(years) !== 1 ? 's' : ''} Tenure`;
  };


  const getSkillCardDetails = (skillName: string, level: string) => {
    let icon = "workspace_premium";
    let iconBg = "bg-slate-100 text-slate-700";
    let badgeStyle = "bg-slate-50 text-slate-800 border-slate-200";
    let barColor = "bg-slate-500";
    let score = "50%";
    let desc = "Standard operator qualification and workstation competency.";

    if (skillName.toLowerCase().includes("spice") || skillName.toLowerCase().includes("seasoning")) {
      icon = "restaurant";
      iconBg = "bg-emerald-50 text-emerald-650";
      badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-100";
      barColor = "bg-emerald-500";
      score = "98%";
      desc = "Precision calibration of seasoning dispensers and flavor profile management.";
    } else if (skillName.toLowerCase().includes("maint") || skillName.toLowerCase().includes("frying") || skillName.toLowerCase().includes("blade")) {
      icon = "build";
      iconBg = "bg-rose-50 text-rose-600";
      badgeStyle = "bg-blue-50 text-blue-800 border-blue-150";
      barColor = "bg-[#1E293B]";
      score = "82%";
      desc = "Level 2 preventative maintenance for high-temp oil circulation systems.";
    } else if (skillName.toLowerCase().includes("qc") || skillName.toLowerCase().includes("audit")) {
      icon = "rule";
      iconBg = "bg-blue-50 text-blue-650";
      badgeStyle = "bg-amber-50 text-amber-850 border-amber-200";
      barColor = "bg-[#1E293B]";
      score = "92%";
      desc = "Internal auditing for food safety standards and packaging integrity.";
    } else {
      if (level === 'Expert') {
        badgeStyle = "bg-emerald-50 text-emerald-805 border-emerald-200";
        barColor = "bg-emerald-500";
        score = "95%";
      } else if (level === 'Certified') {
        badgeStyle = "bg-blue-50 text-blue-800 border-blue-200";
        barColor = "bg-blue-600";
        score = "85%";
      } else if (level === 'Operator') {
        badgeStyle = "bg-amber-55 text-amber-850 border-amber-200";
        barColor = "bg-amber-500";
        score = "70%";
      } else {
        badgeStyle = "bg-slate-50 text-slate-805 border-slate-200";
        barColor = "bg-slate-400";
        score = "40%";
      }
    }

    return { icon, iconBg, badgeStyle, barColor, score, desc };
  };

  const renderAssociateProfile = (assoc: Associate) => {
    const mySkills = associateSkills.filter(s => s.associateId === assoc.id);
    const avatarUrl = getAvatarUrl(assoc.name);
    const tenure = getTenure(assoc.joiningDate);
    
    // Check if employee is supervisor
    const isSupervisor = assoc.category === 'Company' || assoc.name.includes("Marcus") || assoc.name.includes("Miller") || assoc.name.includes("Sharma");
    const designation = isSupervisor ? 'Line Supervisor' : 'Line Operator';
    
    // Attendance and OT Hours based on ID hash
    const nameHash = assoc.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const attendance = (97.5 + (nameHash % 25) / 10).toFixed(1);
    const otHours = 80 + (nameHash % 80);
    const productivity = "+" + (3.2 + (nameHash % 30) / 10).toFixed(1) + "%";

    return (
      <div className="flex-grow flex flex-col gap-6 select-text overflow-y-auto px-1 py-1 custom-scrollbar">
        
        {/* Breadcrumb / Back button bar */}
        <div className="flex justify-between items-center w-full mb-2">
          <div className="flex items-center gap-1 text-[11px] text-secondary font-medium">
            <button 
              type="button"
              onClick={() => setSelectedAssociate(null)} 
              className="hover:text-primary hover:underline font-semibold cursor-pointer"
            >
              Associates
            </button>
            <span className="text-secondary/50 font-normal">›</span>
            <span className="text-secondary font-semibold">{assoc.name}</span>
          </div>
          
          {/* Global Search and Settings icons matching mockup */}
          <div className="flex items-center gap-4 select-none">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-2.5 text-secondary text-sm">search</span>
              <input 
                type="text" 
                placeholder="Global Search..." 
                className="pl-8 pr-3 py-1 bg-surface-container-low border border-outline-variant rounded-lg text-[10px] font-medium placeholder-secondary/40 focus:outline-none w-44 shadow-premium-sm" 
              />
            </div>
            <span className="material-symbols-outlined text-secondary text-base cursor-pointer hover:text-primary">notifications</span>
            <span className="material-symbols-outlined text-secondary text-base cursor-pointer hover:text-primary flex items-center justify-center">settings</span>
          </div>
        </div>

        {/* Profile Header Card */}
        <section className="bg-white border border-outline-variant rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shadow-premium-sm">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-outline-variant shadow-premium-sm">
                <img alt={assoc.name} className="w-full h-full object-cover" src={avatarUrl} />
              </div>
              {assoc.status === 'Active' && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white w-5 h-5 rounded-lg border-2 border-white shadow-premium-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-[11px] font-bold">check</span>
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-base font-bold text-[#0F172A]">{assoc.name}</h1>
              
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold text-secondary font-mono bg-slate-105 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">{assoc.id}</span>
                <span className="flex items-center gap-1 text-[10px] text-secondary font-semibold">
                  <span className="material-symbols-outlined text-secondary text-[13px]">badge</span>
                  <span>{designation}</span>
                </span>
              </div>
              
              <div className="flex items-center gap-1 mt-1 text-[10px] text-secondary font-medium">
                <span className="material-symbols-outlined text-secondary text-[13px]">location_on</span>
                <span>Line B - Food Processing</span>
              </div>
              
              <div className="mt-2.5 flex gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1 shadow-premium-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  On Duty
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-50 text-secondary text-[9px] font-bold border border-slate-200 shadow-premium-sm">
                  {tenure}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button 
              type="button"
              onClick={() => window.print()}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-lg text-[10px] font-bold text-on-surface hover:bg-surface-container transition-colors shadow-premium-sm cursor-pointer bg-white"
            >
              <span className="material-symbols-outlined text-[14px]">upload</span>
              Export Report
            </button>
            <button 
              type="button"
              onClick={() => startEditAssociate(assoc)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1E293B] text-white rounded-lg text-[10px] font-bold hover:bg-slate-900 transition-all active:scale-[0.98] shadow-premium-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              Edit Profile
            </button>
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="border-b border-outline-variant">
          <div className="flex gap-6 overflow-x-auto custom-scrollbar">
            {(['skills', 'certs', 'training', 'logs'] as const).map(tab => {
              const isActive = profileTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setProfileTab(tab)}
                  className={`pb-2.5 text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer relative ${
                    isActive ? 'text-[#0F172A]' : 'text-secondary/60 hover:text-[#0F172A]'
                  }`}
                >
                  {tab === 'skills' ? 'Skills Matrix' : tab === 'certs' ? 'Certifications' : tab === 'training' ? 'Training History' : 'Performance Logs'}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F172A] rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="flex-grow mt-2">
          
          {/* TAB: Skills Matrix */}
          {profileTab === 'skills' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Dynamically mapped skill cards */}
                {mySkills.length === 0 ? (
                  <div className="p-8 border border-dashed border-outline-variant rounded-xl text-center text-secondary text-xs col-span-full">
                    No skills certified yet. Click "Assign New Competency" below or edit profile to assign.
                  </div>
                ) : (
                  mySkills.map(ms => {
                    const sk = skills.find(s => s.id === ms.skillId);
                    const name = sk?.name || ms.skillId;
                    const { icon, iconBg, badgeStyle, barColor, score, desc } = getSkillCardDetails(name, ms.level);

                    return (
                      <div key={ms.skillId} className="bg-white border border-outline-variant rounded-xl p-5 hover:border-primary transition-all group flex flex-col justify-between shadow-premium-sm min-h-[180px]">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className={`p-2 rounded-lg ${iconBg} flex items-center justify-center`}>
                              <span className="material-symbols-outlined text-[18px]">{icon}</span>
                            </div>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${badgeStyle}`}>
                              {ms.level}
                            </span>
                          </div>
                          <h3 className="font-bold text-xs text-[#0F172A] group-hover:text-primary transition-colors">{name}</h3>
                          <p className="text-[10px] text-secondary mt-1.5 leading-relaxed line-clamp-2">{sk?.description || desc}</p>
                        </div>
                        
                        <div className="space-y-2 pt-3 mt-4 border-t border-slate-100">
                          <div className="flex justify-between text-[9px] font-bold text-slate-700">
                            <span>Proficiency</span>
                            <span className="font-mono">{score}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div className={`h-full ${barColor} rounded-full`} style={{ width: score }}></div>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-secondary pt-1">
                            <span>Last Assessed:</span>
                            <span className="font-mono font-bold text-[#0F172A]">
                              {ms.trainingDate ? new Date(ms.trainingDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Oct 12, 2023'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Card 4: Operational Reliability Card (Spans 2 columns) */}
                <div className="bg-white border border-outline-variant rounded-xl p-5 flex flex-col sm:flex-row gap-6 items-center justify-between shadow-premium-sm lg:col-span-2">
                  <div className="flex-grow w-full space-y-3">
                    <h4 className="font-bold text-[10px] text-primary flex items-center gap-1.5 font-mono uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[16px] text-emerald-500 font-bold">verified_user</span>
                      Operational Reliability
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 select-none">
                      <div>
                        <p className="text-[10px] text-secondary">Attendance</p>
                        <p className="text-sm font-bold text-[#0F172A] mt-0.5">{attendance}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-secondary">Safety Incidents</p>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">0</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-secondary">OT Hours</p>
                        <p className="text-sm font-bold text-[#0F172A] mt-0.5">{otHours}h</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-secondary">Productivity</p>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">{productivity}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Circular Gauge */}
                  <div className="relative w-20 h-20 flex flex-col items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#091426]"
                        strokeDasharray={`${Math.round((parseFloat(attendance) + 94) / 2)}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold text-primary font-mono leading-none">{Math.round((parseFloat(attendance) + 94) / 2)}</span>
                      <span className="text-[6px] text-secondary font-bold uppercase tracking-wider text-center mt-0.5 leading-none">Composite<br/>Score</span>
                    </div>
                  </div>
                </div>

                {/* Card 5: Assign New Competency (Dashed container button) */}
                <button
                  type="button"
                  onClick={() => {
                    setTrainAssocId(assoc.id);
                    setShowAssignTrainingModal(true);
                  }}
                  className="border border-dashed border-slate-300 hover:border-primary bg-slate-50/20 hover:bg-slate-50/50 rounded-xl p-5 flex flex-col items-center justify-center min-h-[120px] cursor-pointer transition-all duration-200 shadow-premium-sm group text-center"
                >
                  <span className="material-symbols-outlined text-[32px] text-secondary group-hover:text-primary group-hover:scale-110 transition-all font-light">add_circle</span>
                  <span className="text-[10px] font-bold text-secondary group-hover:text-primary mt-2 uppercase tracking-wide">Assign New Competency</span>
                </button>
              </div>

              {/* Active Licenses Section */}
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-[13px] font-bold text-[#0F172A]">Active Licenses</h3>
                  <button 
                    type="button"
                    onClick={() => setProfileTab('certs')}
                    className="text-[10px] font-bold text-secondary hover:text-primary flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </button>
                </div>

                <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-premium-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-outline-variant text-secondary text-[8px] font-mono tracking-widest uppercase font-label-caps select-none">
                        <th className="p-3">Certificate Name</th>
                        <th className="p-3">ID</th>
                        <th className="p-3">Issue Date</th>
                        <th className="p-3">Expiry</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Mock Row matching the screen exactly */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
                          <span className="font-bold text-[#0F172A]">OSHA Food Safety Master</span>
                        </td>
                        <td className="p-3 font-mono text-[10px]">CRT-0988-X</td>
                        <td className="p-3 font-medium text-secondary">12 May 2022</td>
                        <td className="p-3 font-medium text-secondary">12 May 2025</td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold">Valid</span>
                        </td>
                      </tr>
                      {/* Dynamic row based on mySkills if any */}
                      {mySkills.slice(0, 2).map(ms => {
                        const sk = skills.find(s => s.id === ms.skillId);
                        const isExpired = new Date(ms.expiryDate) < new Date();
                        return (
                          <tr key={ms.skillId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 flex items-center gap-2">
                              <span className={`material-symbols-outlined text-base ${isExpired ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {isExpired ? 'error' : 'verified'}
                              </span>
                              <span className="font-bold text-[#0F172A]">{sk?.name || ms.skillId} Certification</span>
                            </td>
                            <td className="p-3 font-mono text-[10px]">CRT-{assoc.id}-{ms.skillId}</td>
                            <td className="p-3 font-medium text-secondary">
                              {ms.trainingDate ? new Date(ms.trainingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '15 Jan 2023'}
                            </td>
                            <td className="p-3 font-medium text-secondary">
                              {new Date(ms.expiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="p-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                isExpired ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                {isExpired ? 'Expired' : 'Valid'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB: Certifications */}
          {profileTab === 'certs' && (
            <div className="flex flex-col gap-6">
              {mySkills.length === 0 ? (
                <div className="p-8 border border-dashed border-outline-variant rounded-xl text-center text-secondary text-xs">
                  No active certifications available. Click "Edit Profile" to map certified skills.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mySkills.map(ms => {
                    const sk = skills.find(s => s.id === ms.skillId);
                    
                    // Determine validity
                    const isExpired = new Date(ms.expiryDate) < new Date();
                    const isExpiringSoon = !isExpired && (new Date(ms.expiryDate).getTime() - new Date().getTime()) < (90 * 24 * 60 * 60 * 1000);
                    const statusText = isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Valid';

                    return (
                      <div key={ms.skillId} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 hover:border-primary transition-all group flex flex-col justify-between shadow-premium-sm">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg ${isExpired ? 'bg-rose-50 text-rose-600' : isExpiringSoon ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                              isExpired ? 'bg-rose-50 text-rose-800 border-rose-200' :
                              isExpiringSoon ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {statusText}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-[#0F172A]">{sk?.name || ms.skillId} Certification</h3>
                          <p className="text-[10px] text-secondary mt-1">ID: CRT-{assoc.id}-{ms.skillId}</p>
                          <p className="text-[10px] text-secondary mt-1">Authority: {ms.certifiedBy || 'Safety Board'}</p>
                        </div>
                        <div className="space-y-1.5 pt-3.5 mt-4 border-t border-slate-100 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-secondary">Issued:</span>
                            <span className="font-mono font-bold text-[#0F172A]">{ms.trainingDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary">Expires:</span>
                            <span className="font-mono font-bold text-[#0F172A]">{ms.expiryDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: Training History */}
          {profileTab === 'training' && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-premium-sm">
              <div className="relative border-l border-slate-200 pl-8 space-y-6">
                
                {/* Certified Skills Training timeline items */}
                {mySkills.map(ms => {
                  const sk = skills.find(s => s.id === ms.skillId);
                  return (
                    <div key={ms.skillId} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-10 top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-surface-container-lowest shadow-premium-sm flex items-center justify-center"></span>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/40 p-4 border border-outline-variant rounded-lg shadow-premium-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-[#0F172A]">Advanced {sk?.name || ms.skillId} Training Course</h4>
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">Completed</span>
                          </div>
                          <div className="flex gap-4 text-[10px] text-secondary mt-1">
                            <span className="flex items-center gap-1 font-mono font-bold">
                              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                              {ms.trainingDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              4h Duration
                            </span>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => alert("Verification code matches certificate id.")}
                          className="text-primary hover:underline text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">description</span>
                          View Certificate
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Default General Training timeline items */}
                <div className="relative">
                  <span className="absolute -left-10 top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-surface-container-lowest shadow-premium-sm"></span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/40 p-4 border border-outline-variant rounded-lg shadow-premium-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-[#0F172A]">General Safety & Plant Operations Induction</h4>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">Completed</span>
                      </div>
                      <div className="flex gap-4 text-[10px] text-secondary mt-1">
                        <span className="flex items-center gap-1 font-mono font-bold">
                          <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                          {assoc.joiningDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          2h Duration
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => alert("Verification code matches onboarding checklist.")}
                      className="text-primary hover:underline text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      View Checklist
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: Performance Logs */}
          {profileTab === 'logs' && (
            <div className="flex flex-col gap-6">
              
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-xs text-primary uppercase font-mono tracking-wider">Performance History</h2>
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(true)}
                  className="py-1.5 px-3 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-slate-900 flex items-center gap-1 shadow-premium-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add Log Entry
                </button>
              </div>

              {/* Logs List */}
              {selectedAssociateLogs.length === 0 ? (
                <div className="p-8 border border-dashed border-outline-variant rounded-xl text-center text-secondary text-xs">
                  No performance history logs available for this associate.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedAssociateLogs.map(log => {
                    const isCommendation = log.type === 'Commendation';
                    const isSafety = log.type === 'Safety Note';
                    const typeColor = isCommendation ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                                      isSafety ? 'bg-blue-50 text-blue-800 border-blue-100' :
                                      'bg-slate-50 text-slate-700 border-slate-200';
                    return (
                      <div key={log.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start shadow-premium-sm">
                        <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 ${typeColor}`}>
                          {log.type}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-1 gap-4">
                            <h4 className="font-bold text-xs text-[#0F172A]">{log.title}</h4>
                            <span className="text-[10px] font-mono font-bold text-secondary shrink-0">{log.date}</span>
                          </div>
                          <p className="text-xs text-secondary mt-1.5 italic font-medium">"{log.description}"</p>
                          <div className="flex items-center gap-1 text-[10px] text-secondary mt-3 font-semibold">
                            <span className="material-symbols-outlined text-[14px]">person</span>
                            <span>Supervisor: {log.supervisor}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Add Log Entry Overlay Modal */}
        {showAddLogModal && (
          <div className="fixed inset-0 bg-[#091426]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl max-w-md w-full p-6 shadow-premium-lg flex flex-col gap-4 text-xs animate-slide-up select-text">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-primary uppercase font-mono tracking-wider">Add Performance Log</h3>
                <button 
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="p-1 hover:bg-slate-100 rounded text-secondary cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] font-bold">close</span>
                </button>
              </div>
              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-secondary uppercase text-[9px] font-mono tracking-wider">Log Type</label>
                  <select
                    value={newLogType}
                    onChange={(e) => setNewLogType(e.target.value as any)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary bg-surface-container-lowest font-bold text-xs cursor-pointer shadow-premium-sm"
                  >
                    <option value="Commendation">Commendation</option>
                    <option value="Safety Note">Safety Note</option>
                    <option value="Attendance">Attendance</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-secondary uppercase text-[9px] font-mono tracking-wider">Title</label>
                  <input
                    type="text"
                    required
                    value={newLogTitle}
                    onChange={(e) => setNewLogTitle(e.target.value)}
                    placeholder="e.g. Completed Shift in High Heat Station"
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary bg-surface-container-low text-xs shadow-premium-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-secondary uppercase text-[9px] font-mono tracking-wider">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newLogDesc}
                    onChange={(e) => setNewLogDesc(e.target.value)}
                    placeholder="Provide details about the log entry..."
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary bg-surface-container-low text-xs shadow-premium-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-primary text-white font-bold rounded-lg hover:bg-slate-900 transition-all shadow-premium-sm font-mono uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  Save Log Entry
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  };

  // Unified Line and Shift Configuration states
  const [expandedLineId, setExpandedLineId] = useState<string | null>('LINE-01');
  const [selectedLineFilter, setSelectedLineFilter] = useState('LINE-01');
  const [showConflictAlert, setShowConflictAlert] = useState(true);
  const [activeDaysShiftA, setActiveDaysShiftA] = useState<string[]>(['M', 'T', 'W', 'T', 'F']);
  const [activeDaysShiftB, setActiveDaysShiftB] = useState<string[]>(['M', 'T', 'W', 'T', 'F']);
  const [activeDaysShiftC, setActiveDaysShiftC] = useState<string[]>([]);
  const [activeShiftA, setActiveShiftA] = useState(true);
  const [activeShiftB, setActiveShiftB] = useState(true);
  const [activeShiftC, setActiveShiftC] = useState(false);
  const [startTimeA, setStartTimeA] = useState('06:00 AM');
  const [endTimeA, setEndTimeA] = useState('02:00 PM');
  const [startTimeB, setStartTimeB] = useState('02:00 PM');
  const [endTimeB, setEndTimeB] = useState('10:00 PM');
  const [startTimeC, setStartTimeC] = useState('10:00 PM');
  const [endTimeC, setEndTimeC] = useState('06:00 AM');

  const [showCommitToast, setShowCommitToast] = useState(false);

  const renderLineAndShiftConfig = () => {
    const handleCommitChanges = () => {
      setShowCommitToast(true);
      setTimeout(() => setShowCommitToast(false), 3000);
    };

    const toggleLineExpand = (id: string) => {
      setExpandedLineId(prev => prev === id ? null : id);
    };

    const toggleDay = (shift: 'A' | 'B' | 'C', day: string) => {
      if (shift === 'A') {
        setActiveDaysShiftA(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
      } else if (shift === 'B') {
        setActiveDaysShiftB(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
      } else {
        setActiveDaysShiftC(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
      }
    };

    return (
      <div className="flex-grow flex flex-col gap-6 select-text overflow-y-auto px-1 py-1 custom-scrollbar relative p-6 lg:p-8 animate-fade-in">
        
        {/* Toast Alert */}
        {showCommitToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#091426] text-white border border-slate-700 p-4 rounded-xl shadow-premium-lg flex items-center gap-3 animate-slide-up">
            <span className="material-symbols-outlined text-emerald-500 font-bold">check_circle</span>
            <div className="text-xs">
              <p className="font-bold">Changes Committed Successfully</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Shift and line parameters have been saved and synced to the active floor plan.</p>
            </div>
          </div>
        )}

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-4 select-none">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Line and Shift Configuration</h2>
            <p className="text-[11px] text-secondary mt-0.5">Configure operational parameters and machine hierarchies for Unit 04.</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Line Filter:</span>
            <select
              value={selectedLineFilter}
              onChange={(e) => {
                setSelectedLineFilter(e.target.value);
                setExpandedLineId(e.target.value);
              }}
              className="py-1.5 px-3 border border-outline-variant rounded-lg bg-white font-bold text-[10px] cursor-pointer shadow-premium-sm"
            >
              {productionLines.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleCommitChanges}
              className="py-2.5 px-4 bg-[#091426] text-white font-bold rounded-lg hover:bg-slate-900 transition-all flex items-center gap-2 shadow-premium-md cursor-pointer text-[10px] uppercase font-mono tracking-wider ml-1"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Commit Changes</span>
            </button>
          </div>
        </div>

        {/* TWO-COLUMN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Production Lines & Asset Location Context (xl:col-span-5) */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            
            {/* Production Lines Card */}
            <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-premium-sm">
              <div className="flex justify-between items-center mb-4 select-none">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
                  Production Lines
                </h3>
                <button
                  type="button"
                  onClick={() => alert("Add line functionality triggered!")}
                  className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-mono"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>NEW LINE</span>
                </button>
              </div>

              {/* Accordion List */}
              <div className="flex flex-col gap-3">
                {productionLines
                  .filter(l => l.id === selectedLineFilter)
                  .map(line => {
                  const isExpanded = expandedLineId === line.id;
                  const lineWS = workstations.filter(w => w.lineId === line.id);
                  
                  return (
                    <div key={line.id} className="border border-outline-variant rounded-xl overflow-hidden shadow-premium-sm transition-all bg-white">
                      
                      {/* Accordion Trigger */}
                      <button
                        type="button"
                        onClick={() => toggleLineExpand(line.id)}
                        className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <div>
                          <h4 className="font-bold text-xs text-[#0f172a]">{line.name}</h4>
                          <span className="text-[9px] font-mono text-secondary uppercase font-bold tracking-wider">ID: {line.id}</span>
                        </div>
                        <span className="material-symbols-outlined text-secondary transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                          expand_more
                        </span>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-col gap-2.5 animate-fade-in select-none">
                          {lineWS.length === 0 ? (
                            <div className="text-[10px] text-secondary italic">No workstations assigned to this line.</div>
                          ) : (
                            lineWS.map(ws => (
                              <div key={ws.id} className="bg-white border border-outline-variant p-3 rounded-lg flex items-center justify-between shadow-premium-sm hover:border-slate-350 transition-all">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                                    <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-[11px] text-[#0F172A] leading-tight">{ws.name}</p>
                                    <p className="text-[9px] font-mono text-secondary mt-0.5 uppercase tracking-wider">ID: {ws.id}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Shift Definitions & Conflict Alerts (xl:col-span-7) */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            
            {/* Shift Definitions Card */}
            <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-premium-sm flex flex-col justify-between min-h-[500px]">
              
              <div className="space-y-5">
                {/* Header */}
                <div className="flex justify-between items-center mb-1 select-none">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                    Shift Definitions
                  </h3>
                  <span className="text-[9px] font-bold text-secondary font-mono tracking-wider uppercase">Timezone: UTC +03:00</span>
                </div>

                {/* Shift Items */}
                <div className="flex flex-col gap-5">
                  
                  {/* Shift A */}
                  <div className={`border border-outline-variant rounded-xl p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center transition-opacity ${activeShiftA ? 'opacity-100' : 'opacity-55'}`}>
                    <div className="lg:col-span-2 select-none">
                      <h4 className="font-bold text-xs text-[#0f172a]">Shift A</h4>
                      <span className="mt-1 text-[8px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 inline-block uppercase font-mono tracking-wider">MORNING</span>
                    </div>

                    <div className="lg:col-span-5 grid grid-cols-2 gap-3 w-full">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider select-none">Start Time</span>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={startTimeA}
                            disabled={!activeShiftA}
                            onChange={(e) => setStartTimeA(e.target.value)}
                            className="w-full py-1.5 pl-3 pr-8 border border-outline-variant rounded-lg bg-white font-bold text-[11px] disabled:bg-slate-50"
                          />
                          <span className="material-symbols-outlined text-xs text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 select-none">schedule</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider select-none">End Time</span>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={endTimeA}
                            disabled={!activeShiftA}
                            onChange={(e) => setEndTimeA(e.target.value)}
                            className="w-full py-1.5 pl-3 pr-8 border border-outline-variant rounded-lg bg-white font-bold text-[11px] disabled:bg-slate-50"
                          />
                          <span className="material-symbols-outlined text-xs text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 select-none">schedule</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Toggle & Days */}
                    <div className="lg:col-span-5 flex flex-col items-start lg:items-end gap-2.5 select-none w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Active</span>
                        <button
                          type="button"
                          onClick={() => setActiveShiftA(!activeShiftA)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${activeShiftA ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${activeShiftA ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex gap-1.5">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                          const isSelected = activeDaysShiftA.includes(day);
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={!activeShiftA}
                              onClick={() => toggleDay('A', day)}
                              className={`w-6 h-6 rounded-md border font-bold text-[9px] font-mono transition-all flex items-center justify-center ${
                                !activeShiftA ? 'bg-slate-100 text-slate-300 border-slate-100' :
                                isSelected ? 'bg-[#091426] text-white border-[#091426]' : 'bg-white text-secondary border-outline-variant hover:bg-slate-55'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Shift B */}
                  <div className={`border border-outline-variant rounded-xl p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center transition-opacity ${activeShiftB ? 'opacity-100' : 'opacity-55'}`}>
                    <div className="lg:col-span-2 select-none">
                      <h4 className="font-bold text-xs text-[#0f172a]">Shift B</h4>
                      <span className="mt-1 text-[8px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100 inline-block uppercase font-mono tracking-wider">SWING</span>
                    </div>

                    <div className="lg:col-span-5 grid grid-cols-2 gap-3 w-full">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider select-none">Start Time</span>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={startTimeB}
                            disabled={!activeShiftB}
                            onChange={(e) => setStartTimeB(e.target.value)}
                            className="w-full py-1.5 pl-3 pr-8 border border-outline-variant rounded-lg bg-white font-bold text-[11px] disabled:bg-slate-50"
                          />
                          <span className="material-symbols-outlined text-xs text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 select-none">schedule</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider select-none">End Time</span>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={endTimeB}
                            disabled={!activeShiftB}
                            onChange={(e) => setEndTimeB(e.target.value)}
                            className="w-full py-1.5 pl-3 pr-8 border border-outline-variant rounded-lg bg-white font-bold text-[11px] disabled:bg-slate-50"
                          />
                          <span className="material-symbols-outlined text-xs text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 select-none">schedule</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Toggle & Days */}
                    <div className="lg:col-span-5 flex flex-col items-start lg:items-end gap-2.5 select-none w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Active</span>
                        <button
                          type="button"
                          onClick={() => setActiveShiftB(!activeShiftB)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${activeShiftB ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${activeShiftB ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex gap-1.5">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                          const isSelected = activeDaysShiftB.includes(day);
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={!activeShiftB}
                              onClick={() => toggleDay('B', day)}
                              className={`w-6 h-6 rounded-md border font-bold text-[9px] font-mono transition-all flex items-center justify-center ${
                                !activeShiftB ? 'bg-slate-100 text-slate-300 border-slate-100' :
                                isSelected ? 'bg-[#091426] text-white border-[#091426]' : 'bg-white text-secondary border-outline-variant hover:bg-slate-55'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Shift C */}
                  <div className={`border border-outline-variant rounded-xl p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center transition-opacity ${activeShiftC ? 'opacity-100' : 'opacity-55'}`}>
                    <div className="lg:col-span-2 select-none">
                      <h4 className="font-bold text-xs text-[#0f172a]">Shift C</h4>
                      <span className="mt-1 text-[8px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 inline-block uppercase font-mono tracking-wider">NIGHT</span>
                    </div>

                    <div className="lg:col-span-5 grid grid-cols-2 gap-3 w-full">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider select-none">Start Time</span>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={startTimeC}
                            disabled={!activeShiftC}
                            onChange={(e) => setStartTimeC(e.target.value)}
                            className="w-full py-1.5 pl-3 pr-8 border border-outline-variant rounded-lg bg-white font-bold text-[11px] disabled:bg-slate-50/50"
                          />
                          <span className="material-symbols-outlined text-xs text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 select-none">schedule</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider select-none">End Time</span>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={endTimeC}
                            disabled={!activeShiftC}
                            onChange={(e) => setEndTimeC(e.target.value)}
                            className="w-full py-1.5 pl-3 pr-8 border border-outline-variant rounded-lg bg-white font-bold text-[11px] disabled:bg-slate-50/50"
                          />
                          <span className="material-symbols-outlined text-xs text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 select-none">schedule</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Toggle & Days */}
                    <div className="lg:col-span-5 flex flex-col items-start lg:items-end gap-2.5 select-none w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Active</span>
                        <button
                          type="button"
                          onClick={() => setActiveShiftC(!activeShiftC)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${activeShiftC ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${activeShiftC ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex gap-1.5">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                          const isSelected = activeDaysShiftC.includes(day);
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={!activeShiftC}
                              onClick={() => toggleDay('C', day)}
                              className={`w-6 h-6 rounded-md border font-bold text-[9px] font-mono transition-all flex items-center justify-center ${
                                !activeShiftC ? 'bg-slate-50 text-slate-300/60 border-slate-100' :
                                isSelected ? 'bg-[#091426] text-white border-[#091426]' : 'bg-white text-secondary border-outline-variant hover:bg-slate-55'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-4 items-center pt-8 border-t border-slate-100 mt-6 select-none shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setStartTimeA('06:00 AM');
                    setEndTimeA('02:00 PM');
                    setStartTimeB('02:00 PM');
                    setEndTimeB('10:00 PM');
                    setStartTimeC('10:00 PM');
                    setEndTimeC('06:00 AM');
                    setActiveShiftA(true);
                    setActiveShiftB(true);
                    setActiveShiftC(false);
                    setActiveDaysShiftA(['M', 'T', 'W', 'T', 'F']);
                    setActiveDaysShiftB(['M', 'T', 'W', 'T', 'F']);
                    setActiveDaysShiftC([]);
                  }}
                  className="text-[10px] font-bold font-mono text-secondary hover:text-[#0F172A] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleCommitChanges}
                  className="py-2.5 px-5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-premium-md cursor-pointer text-[10px] uppercase font-mono tracking-wider"
                >
                  Save Shifts
                </button>
              </div>
            </div>

            {/* Shift Conflict alert block */}
            {showConflictAlert && (
              <div className="bg-rose-50 border border-rose-150 rounded-xl p-4 flex gap-3.5 items-start relative select-none animate-fade-in shadow-premium-sm">
                <span className="material-symbols-outlined text-rose-600 font-bold">report</span>
                <div className="flex-grow">
                  <h4 className="font-bold text-xs text-rose-800">Shift Conflict Detected</h4>
                  <p className="text-[10px] text-rose-700 mt-0.5 leading-relaxed">Shift A start time overlaps with Unit 03 maintenance window on Fridays. Please verify availability.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowConflictAlert(false)}
                  className="text-rose-400 hover:text-rose-600 font-bold text-sm cursor-pointer p-0.5"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCertificationMatrix = () => {
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    const todayStr = today.toISOString().split('T')[0];

    const filtered = associates.filter(assoc => {
      const searchLower = assocSearchQuery.toLowerCase();
      const matchesSearch = assoc.name.toLowerCase().includes(searchLower) || assoc.id.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;

      if (matrixCategoryFilter !== 'All Categories') {
        const catMap: Record<string, string> = {
          'Company Staff': 'Company',
          'Contractors': 'Contract',
          'Company': 'Company',
          'Contract': 'Contract'
        };
        const mappedFilter = catMap[matrixCategoryFilter] || matrixCategoryFilter;
        if (assoc.category !== mappedFilter) return false;
      }

      if (matrixLineFilter !== 'All Lines') {
        const lineId = matrixLineFilter === 'Line A' ? 'LINE-01' : 'LINE-02';
        const alloc = allocations.find(a => a.associateId === assoc.id && a.date === todayStr);
        if (!alloc || alloc.lineId !== lineId) return false;
      }

      if (!matrixShowExpired) {
        const hasExpired = associateSkills.some(s => s.associateId === assoc.id && new Date(s.expiryDate) < today);
        if (hasExpired) return false;
      }

      return true;
    });

    const mTotalPages = Math.ceil(filtered.length / 10) || 1;
    const paginated = filtered.slice((matrixPage - 1) * 10, matrixPage * 10);

    const totalCerts = associateSkills.length;
    const expiredCerts = associateSkills.filter(s => new Date(s.expiryDate) < today).length;
    const complianceRate = totalCerts > 0 ? ((totalCerts - expiredCerts) / totalCerts * 100).toFixed(1) : "82.4";
    
    const upcomingCount = associateSkills.filter(s => {
      const exp = new Date(s.expiryDate);
      return exp >= today && exp <= in30Days;
    }).length;

    const displaySkills = [
      { id: 'BLADE_OPT', name: 'Hydraulic Press 01', code: 'PAM-HP-01' },
      { id: 'SEAS_OPT', name: 'CNC Lathe A', code: 'MCH-CN-A1' },
      { id: 'FRY_OPT', name: 'Laser Cutter 04', code: 'CUT-LX-04' },
      { id: 'PACK_OPT', name: 'Pneumatic Sorter', code: 'LOC-PS-02' },
      { id: 'QC_AUDIT', name: 'QC Auditor', code: 'LOC-QC-08' }
    ];

    const handleAssignTrainingSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!trainAssocId) {
        alert("Please select an associate first.");
        return;
      }
      
      addTrainingRecord({
        associateId: trainAssocId,
        skillId: trainSkillId,
        level: trainLevel,
        trainingDate: new Date().toISOString().split('T')[0],
        certifiedBy: role,
        expiryDate: trainExpiry,
        reCertificationRequired: false
      });

      setShowAssignTrainingModal(false);
      alert(`Successfully assigned ${trainSkillId} training to operator ${trainAssocId}!`);
    };

    return (
      <div className="flex-grow flex flex-col gap-6 select-text overflow-y-auto px-1 py-1 custom-scrollbar relative">
        {showAssignTrainingModal && (
          <div className="fixed inset-0 bg-[#091426]/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
            <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-lg w-full max-w-md animate-scale-up select-none">
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
                <h3 className="font-bold text-xs text-primary uppercase font-mono tracking-wider">Assign Training Course</h3>
                <button
                  type="button"
                  onClick={() => setShowAssignTrainingModal(false)}
                  className="material-symbols-outlined text-secondary hover:text-primary cursor-pointer text-base"
                >
                  close
                </button>
              </div>

              <form onSubmit={handleAssignTrainingSubmit} className="mt-4 flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-secondary uppercase text-[9px] font-mono tracking-wider">Select Associate</label>
                  <select
                    value={trainAssocId}
                    onChange={(e) => setTrainAssocId(e.target.value)}
                    required
                    className="py-2 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-xs cursor-pointer shadow-premium-sm"
                  >
                    <option value="">-- Choose Operator --</option>
                    {associates.filter(a => a.status === 'Active').map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-secondary uppercase text-[9px] font-mono tracking-wider">Training Certification Skill</label>
                  <select
                    value={trainSkillId}
                    onChange={(e) => setTrainSkillId(e.target.value)}
                    className="py-2 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-xs cursor-pointer shadow-premium-sm"
                  >
                    {skills.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-secondary uppercase text-[9px] font-mono tracking-wider">Certified Level</label>
                    <select
                      value={trainLevel}
                      onChange={(e) => setTrainLevel(e.target.value as SkillLevel)}
                      className="py-2 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-xs cursor-pointer shadow-premium-sm"
                    >
                      <option value="Trainee">Trainee</option>
                      <option value="Operator">Operator</option>
                      <option value="Certified">Certified</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-secondary uppercase text-[9px] font-mono tracking-wider">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={trainExpiry}
                      onChange={(e) => setTrainExpiry(e.target.value)}
                      className="py-2 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-xs shadow-premium-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-slate-900 transition-all shadow-premium-md font-mono uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  Record Certification
                </button>
              </form>
            </div>
          </div>
        )}

        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-primary uppercase font-mono tracking-wider">Associate Certification Matrix</h2>
            <p className="text-[10px] text-secondary mt-0.5">Associates &gt; Certification Matrix</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto select-none">
            <button
              type="button"
              onClick={() => alert("Exporting certification matrix as CSV file...")}
              className="flex-1 sm:flex-none py-2 px-4 border border-outline-variant text-[10px] font-bold rounded-lg bg-white hover:bg-surface-container transition-all active:scale-[0.98] shadow-premium-sm cursor-pointer"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => {
                const firstActive = associates.find(a => a.status === 'Active');
                setTrainAssocId(firstActive ? firstActive.id : '');
                setShowAssignTrainingModal(true);
              }}
              className="flex-1 sm:flex-none py-2 px-4 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-slate-900 transition-all active:scale-[0.98] shadow-premium-md cursor-pointer"
            >
              + Assign Training
            </button>
          </div>
        </section>

        <section className="bg-white border border-outline-variant rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-premium-sm select-none">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Production Line</label>
              <select
                value={matrixLineFilter}
                onChange={(e) => { setMatrixLineFilter(e.target.value); setMatrixPage(1); }}
                className="py-1.5 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-[10px] cursor-pointer shadow-premium-sm"
              >
                <option value="All Lines">All Lines</option>
                <option value="Line A">Line A (LINE-01)</option>
                <option value="Line B">Line B (LINE-02)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Category</label>
              <select
                value={matrixCategoryFilter}
                onChange={(e) => { setMatrixCategoryFilter(e.target.value); setMatrixPage(1); }}
                className="py-1.5 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-[10px] cursor-pointer shadow-premium-sm"
              >
                <option value="All Categories">All Categories</option>
                <option value="Company Staff">Company Staff</option>
                <option value="Contractors">Contractors</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Skill Level</label>
              <select
                value={matrixSkillLevelFilter}
                onChange={(e) => { setMatrixSkillLevelFilter(e.target.value); setMatrixPage(1); }}
                className="py-1.5 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-[10px] cursor-pointer shadow-premium-sm"
              >
                <option value="Any Skill">Any Skill Level</option>
                <option value="Expert">Expert</option>
                <option value="Certified">Certified</option>
                <option value="Operator">Operator</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-secondary uppercase font-mono tracking-wider">Show Expired</span>
            <button
              type="button"
              onClick={() => { setMatrixShowExpired(prev => !prev); setMatrixPage(1); }}
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer relative shadow-premium-sm ${
                matrixShowExpired ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            >
              <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-premium-sm ${
                matrixShowExpired ? 'translate-x-3.5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </section>

        <section className="bg-slate-50 border border-outline-variant rounded-lg px-4 py-2.5 flex justify-between items-center text-[10px] select-none shadow-premium-sm shrink-0">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 font-bold text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Certified &amp; Valid</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Expiring Soon (30d)</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Expired</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
              <span>Not Trained</span>
            </div>
          </div>
          <span className="text-secondary font-semibold font-mono tracking-wide">Last synced: 10m ago</span>
        </section>

        <div className="bg-white border border-outline-variant rounded-xl shadow-premium-sm overflow-x-auto min-h-[450px] relative custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-surface-container-low shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <tr className="border-b border-outline-variant text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps select-none">
                <th className="p-3.5 w-64 min-w-[220px] sticky left-0 bg-surface-container-low z-30 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.08)]">Associate Name</th>
                {displaySkills.map(s => (
                  <th key={s.id} className="p-3.5 border-l border-outline-variant min-w-[150px]">
                    <div>{s.name}</div>
                    <div className="text-[8px] text-secondary font-mono tracking-wider font-semibold mt-0.5">{s.code}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {paginated.map(assoc => (
                <tr key={assoc.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-3.5 sticky left-0 bg-white z-10 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.08)] group-hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#091426] text-white flex items-center justify-center font-bold font-mono text-[11px] shadow-premium-sm">
                        {assoc.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div 
                          className="font-bold text-[#0F172A] hover:underline cursor-pointer"
                          onClick={() => { setSelectedAssociate(assoc); setProfileTab('skills'); }}
                        >
                          {assoc.name}
                        </div>
                        <div className="text-[9px] font-mono text-secondary font-semibold">ID: {assoc.id}</div>
                      </div>
                    </div>
                  </td>

                  {displaySkills.map(s => {
                    const cert = associateSkills.find(sk => sk.associateId === assoc.id && sk.skillId === s.id);
                    
                    let cellBg = "bg-white";
                    let content = null;
                    
                    if (cert) {
                      const expDate = new Date(cert.expiryDate);
                      const diffTime = expDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      const matchesSkillFilter = matrixSkillLevelFilter === 'Any Skill' || cert.level === matrixSkillLevelFilter;
                      
                      if (!matchesSkillFilter) {
                        content = <span className="text-secondary italic">—</span>;
                      } else if (diffDays < 0) {
                        cellBg = "bg-rose-50/30";
                        content = (
                          <div className="flex items-center gap-1.5 text-rose-700 font-bold text-[10px] animate-fade-in select-none">
                            <span className="material-symbols-outlined text-sm font-bold">cancel</span>
                            <span>Expired</span>
                          </div>
                        );
                      } else if (diffDays <= 30) {
                        cellBg = "bg-amber-50/30";
                        content = (
                          <div className="flex items-center gap-1.5 text-amber-700 font-bold text-[10px] animate-fade-in select-none">
                            <span className="material-symbols-outlined text-sm font-bold">warning</span>
                            <span>{diffDays} Days</span>
                          </div>
                        );
                      } else {
                        content = (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[10px] animate-fade-in select-none">
                            <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                            <span>Valid</span>
                          </div>
                        );
                      }
                    } else {
                      content = <span className="text-secondary/70 font-mono">—</span>;
                    }

                    return (
                      <td key={s.id} className={`p-3.5 border-l border-outline-variant text-center transition-all ${cellBg}`}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="flex justify-between items-center select-none shrink-0 py-1 text-[10px] font-bold text-secondary uppercase font-mono tracking-wider">
          <span>Showing {filtered.length > 0 ? (matrixPage - 1) * 10 + 1 : 0}-{Math.min(matrixPage * 10, filtered.length)} of {filtered.length} Operators</span>
          
          {mTotalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={matrixPage === 1}
                onClick={() => setMatrixPage(p => Math.max(1, p - 1))}
                className="w-6 h-6 border border-outline-variant rounded flex items-center justify-center bg-white text-secondary hover:text-primary disabled:opacity-40 cursor-pointer shadow-premium-sm"
              >
                <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
              </button>
              
              {Array.from({ length: mTotalPages }, (_, idx) => idx + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setMatrixPage(pageNum)}
                  className={`w-6 h-6 text-[10px] rounded flex items-center justify-center border transition-all cursor-pointer shadow-premium-sm ${
                    pageNum === matrixPage 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-white text-secondary border-outline-variant hover:text-primary'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                disabled={matrixPage === mTotalPages}
                onClick={() => setMatrixPage(p => Math.min(mTotalPages, p + 1))}
                className="w-6 h-6 border border-outline-variant rounded flex items-center justify-center bg-white text-secondary hover:text-primary disabled:opacity-40 cursor-pointer shadow-premium-sm"
              >
                <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
              </button>
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none shrink-0">
          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
            <div>
              <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Total Compliance</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-bold text-[#0F172A]">{complianceRate}%</span>
                <span className="text-[9px] font-bold text-emerald-600 font-mono">↑ 1.2%</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-emerald-500 text-lg">verified_user</span>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
            <div>
              <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Upcoming Expirations</p>
              <h3 className="text-lg font-bold text-[#0F172A] mt-1">{upcomingCount}</h3>
              <span className="text-[9px] text-secondary font-medium font-mono mt-1 inline-block">Next 30 Days</span>
            </div>
            <span className="material-symbols-outlined text-amber-500 text-lg">hourglass_empty</span>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
            <div>
              <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Critical Gaps</p>
              <h3 className="text-lg font-bold text-rose-600 mt-1">3</h3>
              <span className="text-[9px] text-secondary font-medium font-mono mt-1 inline-block">Line 4 Primary</span>
            </div>
            <span className="material-symbols-outlined text-rose-500 text-lg">report_problem</span>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
            <div>
              <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Active Trainings</p>
              <h3 className="text-lg font-bold text-[#0F172A] mt-1">28</h3>
              
              <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden mt-2 border border-slate-200">
                <div className="h-full bg-primary" style={{ width: '60%' }} />
              </div>
            </div>
            <span className="material-symbols-outlined text-secondary text-lg">model_training</span>
          </div>
        </div>

      </div>
    );
  };

  const changeSubTab = (tab: 'associates' | 'workstations' | 'skills' | 'lines' | 'shifts') => {
    setActiveSubTab(tab);
    setSelectedAssociate(null);
    localStorage.setItem('master_data_sub_tab', tab);
  };

  // Edit/Add states
  const [editingAssoc, setEditingAssoc] = useState<Associate | null>(null);
  const [isAddingAssoc, setIsAddingAssoc] = useState(false);
  const [assocId, setAssocId] = useState('');
  const [assocName, setAssocName] = useState('');
  const [assocCategory, setAssocCategory] = useState<AssociateCategory>('Contract');
  const [assocStatus, setAssocStatus] = useState<'Active' | 'Inactive'>('Active');
  const [assocPlantIdRef, setAssocPlantIdRef] = useState('');
  const [assocSkills, setAssocSkills] = useState<{ skillId: string; level: SkillLevel; expiryDate: string }[]>([]);

  // Workstation forms
  const [editingWS, setEditingWS] = useState<Workstation | null>(null);
  const [isAddingWS, setIsAddingWS] = useState(false);
  const [wsId, setWsId] = useState('');
  const [wsName, setWsName] = useState('');
  const [wsLineId, setWsLineId] = useState('LINE-01');
  const [wsRequiredSkill, setWsRequiredSkill] = useState('BLADE_OPT');
  const [wsMinLevel, setWsMinLevel] = useState<SkillLevel>('Operator');
  const [wsMaxStaffCount, setWsMaxStaffCount] = useState<number>(1);

  // Workstation UI states
  const [wsFloorSectionFilter, setWsFloorSectionFilter] = useState('All Sections');
  const [wsStatusFilter, setWsStatusFilter] = useState('All Statuses');

  // Production Line forms
  const [editingLine, setEditingLine] = useState<ProductionLine | null>(null);
  const [isAddingLine, setIsAddingLine] = useState(false);
  const [lineId, setLineId] = useState('');
  const [lineName, setLineName] = useState('');
  const [lineProduct, setLineProduct] = useState('');
  const [lineStatus, setLineStatus] = useState<LineStatus>('ACTIVE');

  // Skill forms
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [skId, setSkId] = useState('');
  const [skName, setSkName] = useState('');
  const [skDesc, setSkDesc] = useState('');

  // Shift forms
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [shiftId, setShiftId] = useState('');
  const [shiftName, setShiftName] = useState('');
  const [shiftTimings, setShiftTimings] = useState('');
  const [shiftDays, setShiftDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftId || !shiftName || !shiftTimings) {
      alert('Missing ID, Name or Timings');
      return;
    }

    const item: Shift = {
      id: shiftId,
      name: shiftName,
      timings: shiftTimings,
      workingDays: shiftDays
    };

    if (editingShift) {
      updateShift(item);
      setEditingShift(null);
    } else {
      if (shifts.some(s => s.id === shiftId)) {
        alert('Shift ID already exists.');
        return;
      }
      addShift(item);
      setIsAddingShift(false);
    }

    setShiftId('');
    setShiftName('');
    setShiftTimings('');
    setShiftDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  };


  // Skill Save
  const handleSaveSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skId || !skName) {
      alert('Missing ID or Name');
      return;
    }

    const item: Skill = {
      id: skId,
      name: skName,
      description: skDesc
    };

    if (editingSkill) {
      updateSkill(item);
      setEditingSkill(null);
    } else {
      if (skills.some(s => s.id === skId)) {
        alert('Skill ID already exists.');
        return;
      }
      addSkill(item);
      setIsAddingSkill(false);
    }

    setSkId('');
    setSkName('');
    setSkDesc('');
  };

  const startEditSkill = (s: Skill) => {
    setEditingSkill(s);
    setSkId(s.id);
    setSkName(s.name);
    setSkDesc(s.description);
  };

  // Skill check helper
  const handleSkillLevelChange = (skillId: string, level: SkillLevel, expiryDate: string, isChecked: boolean) => {
    if (isChecked) {
      setAssocSkills(prev => {
        const filtered = prev.filter(s => s.skillId !== skillId);
        return [...filtered, { skillId, level, expiryDate }];
      });
    } else {
      setAssocSkills(prev => prev.filter(s => s.skillId !== skillId));
    }
  };

  // Associate Save
  const handleSaveAssociate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assocId || !assocName) {
      alert('Missing ID or Name');
      return;
    }

    const item: Associate = {
      id: assocId,
      name: assocName,
      category: assocCategory,
      joiningDate: editingAssoc ? editingAssoc.joiningDate : new Date().toISOString().split('T')[0],
      status: assocStatus,
      plantIdRef: assocPlantIdRef || undefined
    };

    if (editingAssoc) {
      updateAssociate(item, assocSkills);
      setEditingAssoc(null);
    } else {
      if (associates.some(a => a.id === assocId)) {
        alert('Employee ID already exists.');
        return;
      }
      addAssociate(item, assocSkills);
      setIsAddingAssoc(false);
    }

    // Reset Form
    resetAssocForm();
  };

  const startEditAssociate = (a: Associate) => {
    setEditingAssoc(a);
    setAssocId(a.id);
    setAssocName(a.name);
    setAssocCategory(a.category);
    setAssocStatus(a.status);
    setAssocPlantIdRef(a.plantIdRef || '');
    
    // Load skills
    const existingSkills = associateSkills
      .filter(s => s.associateId === a.id)
      .map(s => ({ skillId: s.skillId, level: s.level, expiryDate: s.expiryDate }));
    setAssocSkills(existingSkills);
  };

  const resetAssocForm = () => {
    setAssocId('');
    setAssocName('');
    setAssocCategory('Contract');
    setAssocStatus('Active');
    setAssocPlantIdRef('');
    setAssocSkills([]);
  };

  // Workstation Save
  const handleSaveWS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsId || !wsName) {
      alert('Missing ID or Name');
      return;
    }

    const item: Workstation = {
      id: wsId,
      name: wsName,
      lineId: wsLineId,
      requiredSkillId: wsRequiredSkill,
      minSkillLevel: wsMinLevel,
      maxStaffCount: wsMaxStaffCount
    };

    if (editingWS) {
      updateWorkstation(item);
      setEditingWS(null);
    } else {
      if (workstations.some(w => w.id === wsId)) {
        alert('Workstation ID already exists.');
        return;
      }
      addWorkstation(item);
      setIsAddingWS(false);
    }

    setWsId('');
    setWsName('');
    setWsMaxStaffCount(1);
  };

  const startEditWS = (w: Workstation) => {
    setEditingWS(w);
    setWsId(w.id);
    setWsName(w.name);
    setWsLineId(w.lineId);
    setWsRequiredSkill(w.requiredSkillId);
    setWsMinLevel(w.minSkillLevel);
    setWsMaxStaffCount(w.maxStaffCount || 1);
  };

  const handleSaveLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineId || !lineName) {
      alert('Missing ID or Name');
      return;
    }

    const item: ProductionLine = {
      id: lineId,
      name: lineName,
      currentProduct: lineProduct || 'None',
      status: lineStatus
    };

    if (editingLine) {
      updateProductionLine(item);
      setEditingLine(null);
    } else {
      if (productionLines.some(l => l.id === lineId)) {
        alert('Production Line ID already exists.');
        return;
      }
      addProductionLine(item);
      setIsAddingLine(false);
    }

    setLineId('');
    setLineName('');
    setLineProduct('');
    setLineStatus('ACTIVE');
  };


  const canWriteAssociates = role === 'Plant Admin' || role === 'HR / Training Coordinator';
  const canWriteAllMasterData = role === 'Plant Admin';

  const filteredAssociatesList = associates.filter(assoc => {
    const searchLower = assocSearchQuery.toLowerCase();
    const matchesSearch = 
      assoc.name.toLowerCase().includes(searchLower) ||
      assoc.id.toLowerCase().includes(searchLower) ||
      (assoc.category && assoc.category.toLowerCase().includes(searchLower));
      
    if (!matchesSearch) return false;

    if (selectedSkillFilter === 'All') return true;
    
    const skills = associateSkills.filter(s => s.associateId === assoc.id);
    if (selectedSkillFilter === 'Welding') {
      return skills.some(s => s.skillId.includes("BLADE") || s.skillId.includes("WLD"));
    }
    if (selectedSkillFilter === 'Assembly') {
      return skills.some(s => s.skillId.includes("PACK") || s.skillId.includes("ARM"));
    }
    if (selectedSkillFilter === 'Quality Control') {
      return skills.some(s => s.skillId.includes("QC"));
    }
    if (selectedSkillFilter === 'Maintenance') {
      return skills.some(s => s.skillId.includes("MAINT"));
    }
    return true;
  });

  const totalPages = Math.ceil(filteredAssociatesList.length / 12) || 1;
  const paginatedAssociates = filteredAssociatesList.slice((associatesPage - 1) * 12, associatesPage * 12);

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background select-none animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center px-margin-desktop h-16 w-full border-b border-outline-variant shrink-0 bg-surface-container-lowest">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-headline-md font-bold">database</span>
          <h1 className="text-base font-bold text-[#0F172A]">Master Data Configuration</h1>
        </div>

        {/* Sub tabs switcher */}
        <div className="flex gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant shadow-premium-sm">
          <button
            onClick={() => changeSubTab('associates')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === 'associates' ? 'bg-surface-container-lowest text-primary shadow-premium-sm border border-outline-variant' : 'text-secondary hover:text-primary'
            }`}
          >
            Associate Master
          </button>
          <button
            onClick={() => changeSubTab('workstations')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === 'workstations' ? 'bg-surface-container-lowest text-primary shadow-premium-sm border border-outline-variant' : 'text-secondary hover:text-primary'
            }`}
          >
            Workstation Master
          </button>
          <button
            onClick={() => changeSubTab('skills')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === 'skills' ? 'bg-surface-container-lowest text-primary shadow-premium-sm border border-outline-variant' : 'text-secondary hover:text-primary'
            }`}
          >
            Skill Register
          </button>
          <button
            onClick={() => changeSubTab('lines')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === 'lines' ? 'bg-surface-container-lowest text-primary shadow-premium-sm border border-outline-variant' : 'text-secondary hover:text-primary'
            }`}
          >
            Line Master
          </button>
          <button
            onClick={() => changeSubTab('shifts' as any)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === ('shifts' as any) ? 'bg-surface-container-lowest text-primary shadow-premium-sm border border-outline-variant' : 'text-secondary hover:text-primary'
            }`}
          >
            Shift Master
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex animate-fade-in">
        {activeSubTab === 'shifts' ? (
          <ShiftPlanner
            selectedLineId={selectedLineId || 'LINE-01'}
            setSelectedLineId={setSelectedLineId || (() => {})}
            setActiveTab={setActiveTab || (() => {})}
          />
        ) : (
          <>
            {/* Left Side Table View */}
            <div className="flex-1 p-margin-desktop overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          {/* Sub-tab: Associates */}
          {activeSubTab === 'associates' && (
            selectedAssociate ? (
              renderAssociateProfile(selectedAssociate)
            ) : (
              <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
                {/* Mode Switcher */}
                <div className="flex justify-between items-center shrink-0 border-b border-outline-variant pb-3 select-none">
                  <div>
                    <h2 className="text-sm font-bold text-primary uppercase font-mono tracking-wider">
                      {associatesViewMode === 'matrix' ? 'Certification Matrix' : 'Roster Directory'}
                    </h2>
                    <p className="text-[10px] text-secondary mt-0.5">
                      {associatesViewMode === 'matrix' ? 'Check skill compliance and training records.' : 'Manage plant staff assignments and shift availability.'}
                    </p>
                  </div>

                  <div className="flex gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant shadow-premium-sm">
                    <button
                      type="button"
                      onClick={() => setAssociatesViewMode('directory')}
                      className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                        associatesViewMode === 'directory' ? 'bg-white text-primary shadow-premium-sm border border-outline-variant' : 'text-secondary hover:text-primary'
                      }`}
                    >
                      Roster View
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssociatesViewMode('matrix')}
                      className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                        associatesViewMode === 'matrix' ? 'bg-white text-primary shadow-premium-sm border border-outline-variant' : 'text-secondary hover:text-primary'
                      }`}
                    >
                      Certification Matrix
                    </button>
                  </div>
                </div>

                {associatesViewMode === 'matrix' ? (
                  renderCertificationMatrix()
                ) : (
                  <>
                    <div className="flex justify-between items-center shrink-0">
                      <div>
                        <h2 className="text-sm font-bold text-primary uppercase font-mono tracking-wider">Team Directory</h2>
                        <p className="text-[10px] text-secondary mt-0.5">Manage plant staff assignments and shift availability.</p>
                      </div>
                      
                      <div className="flex items-center gap-3 select-none">
                        {/* Search Bar */}
                        <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant text-[11px] w-64 shadow-premium-sm">
                          <span className="material-symbols-outlined text-secondary text-xs">search</span>
                          <input
                            type="text"
                            value={assocSearchQuery}
                            onChange={(e) => {
                              setAssocSearchQuery(e.target.value);
                              setAssociatesPage(1);
                            }}
                            placeholder="Search associates, ID, category..."
                            className="bg-transparent border-none focus:outline-none focus:ring-0 text-[10px] w-full p-0 text-on-surface"
                          />
                        </div>

                        {canWriteAssociates && !isAddingAssoc && !editingAssoc && (
                          <button
                            onClick={() => { resetAssocForm(); setIsAddingAssoc(true); }}
                            className="py-2 px-4 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer shadow-premium-md font-label-caps tracking-wider transition-all hover:scale-[1.02]"
                          >
                            <span className="material-symbols-outlined text-sm">person_add</span> ADD ASSOCIATE
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Summary Metrics Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none shrink-0">
                      <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Active Staff</p>
                          <h3 className="text-base font-bold text-[#0F172A] mt-1">
                            {associates.filter(a => a.status === 'Active').length} / {Math.max(140, associates.length)}
                          </h3>
                        </div>
                        <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                      </div>

                      <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Shift Status</p>
                          <h3 className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                            Optimal
                          </h3>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      </div>

                      <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Open Stations</p>
                          <h3 className="text-base font-bold text-[#0F172A] mt-1">
                            {String(Math.max(0, workstations.length - allocations.filter(a => a.date === new Date().toISOString().split('T')[0] && a.shiftId === 'SHIFT-A').length)).padStart(2, '0')}
                          </h3>
                        </div>
                        <span className="material-symbols-outlined text-secondary text-lg">desk</span>
                      </div>

                      <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Safety Score</p>
                          <h3 className="text-base font-bold text-[#0F172A] mt-1">98.4%</h3>
                        </div>
                        <span className="material-symbols-outlined text-rose-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                      </div>
                    </div>

                    {/* Filters & pagination bar */}
                    <div className="bg-slate-50 border border-outline-variant rounded-lg p-3 flex justify-between items-center select-none shrink-0 shadow-premium-sm">
                      {/* Category Filter Pills */}
                      <div className="flex gap-2">
                        {['All', 'Welding', 'Assembly', 'Quality Control', 'Maintenance'].map(pill => (
                          <button
                            key={pill}
                            onClick={() => { setSelectedSkillFilter(pill); setAssociatesPage(1); }}
                            className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-all cursor-pointer ${
                              selectedSkillFilter === pill 
                                ? 'bg-primary text-white border-primary shadow-premium-sm' 
                                : 'bg-white text-secondary border-outline-variant hover:text-primary'
                            }`}
                          >
                            {pill}
                          </button>
                        ))}
                      </div>

                      {/* Right pagination preview */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-secondary font-medium">
                          Showing {filteredAssociatesList.length > 0 ? (associatesPage - 1) * 12 + 1 : 0}-{Math.min(associatesPage * 12, filteredAssociatesList.length)} of {filteredAssociatesList.length}
                        </span>
                        <div className="flex gap-1">
                          <button
                            disabled={associatesPage === 1}
                            onClick={() => setAssociatesPage(p => Math.max(1, p - 1))}
                            className="w-6 h-6 border border-outline-variant rounded flex items-center justify-center bg-white text-secondary hover:text-primary disabled:opacity-40 cursor-pointer shadow-premium-sm"
                          >
                            <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
                          </button>
                          <button
                            disabled={associatesPage === totalPages}
                            onClick={() => setAssociatesPage(p => Math.min(totalPages, p + 1))}
                            className="w-6 h-6 border border-outline-variant rounded flex items-center justify-center bg-white text-secondary hover:text-primary disabled:opacity-40 cursor-pointer shadow-premium-sm"
                          >
                            <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Team Roster Table Card */}
                    <div className="bg-white border border-outline-variant rounded-xl shadow-premium-sm flex-grow overflow-visible relative">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps select-none">
                            <th className="p-3.5">Associate</th>
                            <th className="p-3.5">Skill Category</th>
                            <th className="p-3.5">Assignment</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedAssociates.map(assoc => {
                            const skills = associateSkills.filter(s => s.associateId === assoc.id);
                            
                            const todayStr = new Date().toISOString().split('T')[0];
                            const allocation = allocations.find(a => a.associateId === assoc.id && a.date === todayStr && a.shiftId === 'SHIFT-A');
                            
                            let assignmentText = "Facility Wide";
                            let assignmentIcon = "apartment";
                            
                            if (allocation) {
                              const ws = workstations.find(w => w.id === allocation.workstationId);
                              const line = productionLines.find(l => l.id === allocation.lineId);
                              if (line) {
                                assignmentText = line.name.replace("Line ", "Line A-").replace("0", "");
                                assignmentIcon = "precision_manufacturing";
                              } else if (ws) {
                                assignmentText = ws.name;
                                assignmentIcon = "desk";
                              }
                            }

                            let categoryText = "FLOATING";
                            let categoryBg = "bg-slate-50 text-secondary border-outline-variant";
                            
                            if (skills.length > 0) {
                              const mainSkill = skills[0].skillId;
                              if (mainSkill.includes("BLADE")) {
                                categoryText = "WELDING";
                                categoryBg = "bg-[#0f172a] text-slate-100 border-[#0f172a]";
                              } else if (mainSkill.includes("PACK")) {
                                categoryText = "ASSEMBLY";
                                categoryBg = "bg-blue-100 text-blue-800 border-blue-200";
                              } else if (mainSkill.includes("QC")) {
                                categoryText = "QUALITY CONTROL";
                                categoryBg = "bg-emerald-900 text-emerald-100 border-emerald-950";
                              } else if (mainSkill.includes("MAINT")) {
                                categoryText = "MAINTENANCE";
                                categoryBg = "bg-rose-50 text-rose-700 border-rose-100";
                              } else {
                                categoryText = mainSkill.replace("_OPT", "").replace("_ENG", "");
                                categoryBg = "bg-slate-100 text-slate-800 border-slate-200";
                              }
                            }

                            return (
                              <tr key={assoc.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3.5">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      alt={assoc.name} 
                                      className="w-8 h-8 rounded-full object-cover border border-outline-variant shadow-premium-sm cursor-pointer" 
                                      src={getAvatarUrl(assoc.name)} 
                                      onClick={() => { setSelectedAssociate(assoc); setProfileTab('skills'); }}
                                    />
                                    <div>
                                      <div 
                                        className="font-bold text-[#0F172A] hover:underline cursor-pointer"
                                        onClick={() => { setSelectedAssociate(assoc); setProfileTab('skills'); }}
                                      >
                                        {assoc.name}
                                      </div>
                                      <div className="text-[9px] font-mono text-secondary font-semibold">ID: {assoc.id}</div>
                                    </div>
                                  </div>
                                </td>
                                
                                <td className="p-3.5">
                                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider border shadow-premium-sm uppercase ${categoryBg}`}>
                                    {categoryText}
                                  </span>
                                </td>

                                <td className="p-3.5 font-medium text-secondary">
                                  <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-secondary text-sm">{assignmentIcon}</span>
                                    <span>{assignmentText}</span>
                                  </div>
                                </td>

                                <td className="p-3.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (role !== 'Plant Admin') {
                                        alert("Access Denied: Only Plant Admins can toggle operator status.");
                                        return;
                                      }
                                      const newStatus = assoc.status === 'Active' ? 'Inactive' : 'Active';
                                      updateAssociate({ ...assoc, status: newStatus }, associateSkills.filter(s => s.associateId === assoc.id).map(s => ({ skillId: s.skillId, level: s.level, expiryDate: s.expiryDate })));
                                    }}
                                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer relative shadow-premium-sm ${
                                      assoc.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-200'
                                    }`}
                                  >
                                    <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-premium-sm ${
                                      assoc.status === 'Active' ? 'translate-x-3.5' : 'translate-x-0'
                                    }`} />
                                  </button>
                                </td>

                                <td className="p-3.5 text-right select-none relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuAssocId(activeMenuAssocId === assoc.id ? null : assoc.id);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded-full transition-all text-secondary hover:text-primary cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                  </button>

                                  {activeMenuAssocId === assoc.id && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-45" 
                                        onClick={() => setActiveMenuAssocId(null)}
                                      />
                                      <div className="absolute right-3.5 top-11 bg-white border border-outline-variant rounded-xl shadow-premium-lg z-50 py-1.5 w-44 text-left animate-slide-up">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedAssociate(assoc);
                                            setProfileTab('skills');
                                            setActiveMenuAssocId(null);
                                          }}
                                          className="w-full px-4 py-2 hover:bg-slate-50 text-[10px] text-secondary hover:text-primary font-bold flex items-center gap-2 cursor-pointer"
                                        >
                                          <span className="material-symbols-outlined text-sm">badge</span>
                                          View Profile
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            startEditAssociate(assoc);
                                            setActiveMenuAssocId(null);
                                          }}
                                          className="w-full px-4 py-2 hover:bg-slate-50 text-[10px] text-secondary hover:text-primary font-bold flex items-center gap-2 cursor-pointer"
                                        >
                                          <span className="material-symbols-outlined text-sm">settings</span>
                                          Edit Skills
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const activeLine = productionLines.find(l => l.status === 'ACTIVE');
                                            if (activeLine) setSelectedLineId(activeLine.id);
                                            setActiveTab('shift_planner');
                                            setActiveMenuAssocId(null);
                                          }}
                                          className="w-full px-4 py-2 hover:bg-slate-50 text-[10px] text-secondary hover:text-primary font-bold flex items-center gap-2 cursor-pointer"
                                        >
                                          <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                                          Assign Station
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            alert("Opening calendar to manage shift availability.");
                                            setActiveMenuAssocId(null);
                                          }}
                                          className="w-full px-4 py-2 hover:bg-slate-50 text-[10px] text-secondary hover:text-primary font-bold flex items-center gap-2 cursor-pointer"
                                        >
                                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                                          Manage Availability
                                        </button>

                                        <div className="h-[1px] bg-slate-100 my-1" />

                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (role !== 'Plant Admin') {
                                              alert("Access Denied: Only Plant Admins can deactivate operators.");
                                              return;
                                            }
                                            const newStatus = assoc.status === 'Active' ? 'Inactive' : 'Active';
                                            updateAssociate({ ...assoc, status: newStatus }, associateSkills.filter(s => s.associateId === assoc.id).map(s => ({ skillId: s.skillId, level: s.level, expiryDate: s.expiryDate })));
                                            setActiveMenuAssocId(null);
                                          }}
                                          className="w-full px-4 py-2 hover:bg-slate-50 text-[10px] text-secondary hover:text-primary font-bold flex items-center gap-2 cursor-pointer"
                                        >
                                          <span className="material-symbols-outlined text-sm">block</span>
                                          {assoc.status === 'Active' ? 'Deactivate' : 'Activate'}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm(`Delete associate ${assoc.name}? This will permanently remove all records.`)) {
                                              deleteAssociate(assoc.id);
                                            }
                                            setActiveMenuAssocId(null);
                                          }}
                                          className="w-full px-4 py-2 hover:bg-rose-50 text-[10px] text-rose-600 font-bold flex items-center gap-2 cursor-pointer animate-fade-in"
                                        >
                                          <span className="material-symbols-outlined text-sm text-rose-600">delete</span>
                                          Delete Associate
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Page Numbers */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-1 select-none shrink-0 py-2">
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => {
                          const isCurrent = pageNum === associatesPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setAssociatesPage(pageNum)}
                              className={`w-6 h-6 text-[10px] font-bold rounded flex items-center justify-center border transition-all cursor-pointer shadow-premium-sm ${
                                isCurrent 
                                  ? 'bg-primary text-white border-primary' 
                                  : 'bg-white text-secondary border-outline-variant hover:text-primary'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          )}

          {/* Sub-tab: Workstations */}
          {activeSubTab === 'workstations' && (
            <div className="max-w-[1400px] mx-auto animate-fade-in">
              {/* HEADER SECTION */}
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
                <div>
                  <nav className="flex items-center gap-2 text-on-surface-variant text-body-sm mb-2">
                    <span>Assets</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-primary font-medium">Workstations</span>
                  </nav>
                  <h2 className="font-headline-lg text-headline-lg text-primary">Workstation Master</h2>
                </div>
                <div className="flex gap-md">
                  <button className="flex items-center gap-2 px-md py-3 bg-surface-container-highest text-primary font-bold rounded-lg border border-outline-variant hover:bg-surface-variant transition-all active:scale-95">
                    <span className="material-symbols-outlined">file_download</span>
                    Export List
                  </button>
                  {canWriteAllMasterData && !isAddingWS && !editingWS && (
                    <button
                      onClick={() => { setWsId(''); setWsName(''); setIsAddingWS(true); }}
                      className="flex items-center gap-2 px-md py-3 bg-primary-container text-on-primary font-bold rounded-lg hover:shadow-sm transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined">add</span>
                      Add Workstation
                    </button>
                  )}
                </div>
              </section>

              {/* KPI GRID (Bento Style) */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
                {/* Total */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-body-sm text-on-surface-variant font-medium">Total Workstations</span>
                    <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg">
                      <span className="material-symbols-outlined">precision_manufacturing</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-headline-lg font-bold">{workstations.length}</h3>
                    <p className="text-body-sm text-on-tertiary-container mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      +2 from last month
                    </p>
                  </div>
                </div>

                {/* Operating */}
                {(() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const activeAllocsToday = allocations.filter(a => a.date === todayStr);
                    const operatingCount = new Set(activeAllocsToday.map(a => a.workstationId)).size;
                    const operatingPct = workstations.length ? Math.round((operatingCount / workstations.length) * 100) : 0;
                    
                    return (
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-body-sm text-on-surface-variant font-medium">Operating</span>
                            <div className="p-2 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-lg">
                              <span className="material-symbols-outlined">check_circle</span>
                            </div>
                          </div>
                          <div className="mt-4">
                            <h3 className="text-headline-lg font-bold">{operatingCount}</h3>
                            <div className="w-full bg-surface-container h-1.5 rounded-full mt-2">
                              <div className="bg-on-tertiary-container h-1.5 rounded-full transition-all duration-1000" style={{ width: `${operatingPct}%` }}></div>
                            </div>
                          </div>
                        </div>
                    );
                })()}

                {/* Maintenance */}
                {(() => {
                    const maintenanceLines = productionLines.filter(l => l.status === 'MAINTENANCE').map(l => l.id);
                    const maintenanceWsCount = workstations.filter(w => maintenanceLines.includes(w.lineId)).length;
                    return (
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-body-sm text-on-surface-variant font-medium">Maintenance</span>
                            <div className="p-2 bg-secondary-fixed text-on-secondary-fixed-variant rounded-lg">
                              <span className="material-symbols-outlined">build</span>
                            </div>
                          </div>
                          <div className="mt-4">
                            <h3 className="text-headline-lg font-bold">{maintenanceWsCount}</h3>
                            <p className="text-body-sm text-on-secondary-container mt-1">Scheduled: {maintenanceWsCount > 0 ? 1 : 0} urgent</p>
                          </div>
                        </div>
                    );
                })()}

                {/* Offline/Critical */}
                {(() => {
                    const haltedLines = productionLines.filter(l => l.status === 'HALTED').map(l => l.id);
                    const haltedWsCount = workstations.filter(w => haltedLines.includes(w.lineId)).length;
                    return (
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-body-sm text-on-surface-variant font-medium">Offline/Critical</span>
                            <div className="p-2 bg-error-container text-on-error-container rounded-lg">
                              <span className="material-symbols-outlined">error</span>
                            </div>
                          </div>
                          <div className="mt-4">
                            <h3 className="text-headline-lg font-bold">{haltedWsCount}</h3>
                            <p className="text-body-sm text-error mt-1 font-medium">{haltedWsCount > 0 ? 'Awaiting parts' : 'All systems clear'}</p>
                          </div>
                        </div>
                    );
                })()}
              </section>

              {/* FILTERS & LIST */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
                {/* Filter Bar */}
                <div className="px-lg py-md border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-md bg-surface-container-low">
                  <div className="flex flex-wrap items-center gap-md">
                    <div className="flex items-center gap-2 bg-surface px-md py-2 border border-outline-variant rounded-lg text-body-md">
                      <span className="text-on-surface-variant">Floor Section:</span>
                      <select 
                        value={wsFloorSectionFilter}
                        onChange={(e) => setWsFloorSectionFilter(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 font-medium py-0 cursor-pointer outline-none"
                      >
                        <option value="All Sections">All Sections</option>
                        {productionLines.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 bg-surface px-md py-2 border border-outline-variant rounded-lg text-body-md">
                      <span className="text-on-surface-variant">Status:</span>
                      <select 
                        value={wsStatusFilter}
                        onChange={(e) => setWsStatusFilter(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 font-medium py-0 cursor-pointer outline-none"
                      >
                        <option value="All Statuses">All Statuses</option>
                        <option value="Operating">Operating</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Offline">Offline</option>
                        <option value="Idle">Idle</option>
                      </select>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-body-md font-medium">
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    Advanced Filters
                  </button>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low text-on-surface-variant font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
                      <tr>
                        <th className="p-3.5 border-b border-outline-variant">Station ID</th>
                        <th className="p-3.5 border-b border-outline-variant">Machine Name</th>
                        <th className="p-3.5 border-b border-outline-variant">Status</th>
                        <th className="p-3.5 border-b border-outline-variant">Min. Skill</th>
                        <th className="p-3.5 border-b border-outline-variant">Assigned Associate</th>
                        <th className="p-3.5 border-b border-outline-variant">Current Efficiency</th>
                        {canWriteAllMasterData && <th className="p-3.5 border-b border-outline-variant text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-outline-variant">
                      {workstations
                        .filter(ws => wsFloorSectionFilter === 'All Sections' || ws.lineId === wsFloorSectionFilter)
                        .filter(ws => {
                          if (wsStatusFilter === 'All Statuses') return true;
                          const line = productionLines.find(l => l.id === ws.lineId);
                          const todayStr = new Date().toISOString().split('T')[0];
                          const activeAlloc = allocations.find(a => a.workstationId === ws.id && a.date === todayStr);
                          let status = 'Idle';
                          if (line?.status === 'MAINTENANCE') status = 'Maintenance';
                          else if (line?.status === 'HALTED') status = 'Offline';
                          else if (activeAlloc) status = 'Operating';
                          return status === wsStatusFilter;
                        })
                        .map((ws) => {
                        const line = productionLines.find(l => l.id === ws.lineId);
                        
                        // Infer Status
                        let status = 'Idle';
                        let statusColor = 'bg-surface-container-high text-on-surface-variant';
                        let dotColor = 'bg-outline';
                        
                        const todayStr = new Date().toISOString().split('T')[0];
                        const activeAlloc = allocations.find(a => a.workstationId === ws.id && a.date === todayStr);
                        
                        if (line?.status === 'MAINTENANCE') {
                          status = 'Maintenance';
                          statusColor = 'bg-blue-100 text-blue-800';
                          dotColor = 'bg-blue-500';
                        } else if (line?.status === 'HALTED') {
                          status = 'Offline';
                          statusColor = 'bg-error-container text-on-error-container';
                          dotColor = 'bg-error';
                        } else if (activeAlloc) {
                          status = 'Operating';
                          statusColor = 'bg-green-100 text-green-800';
                          dotColor = 'bg-green-500';
                        }

                        // Determine Assigned Associate
                        const assignedAssoc = activeAlloc ? associates.find(a => a.id === activeAlloc.associateId) : null;
                        
                        // Mock Efficiency (seeded deterministically by ID so it doesn't jump around)
                        const mockEff = activeAlloc ? 80 + (ws.id.charCodeAt(ws.id.length-1) % 20) : (status === 'Maintenance' ? 0 : (status === 'Offline' ? 12 : 0));
                        const effColor = mockEff > 70 ? 'bg-on-tertiary-container' : (mockEff > 40 ? 'bg-secondary' : 'bg-error');

                        return (
                          <tr key={ws.id} className="hover:bg-surface-container-lowest/50 transition-colors cursor-pointer group">
                            <td className="p-3.5 text-xs text-primary font-bold font-mono">{ws.id}</td>
                            <td className="p-3.5">
                              <div className="flex flex-col">
                                <span className="font-bold">{ws.name}</span>
                                <span className="text-body-sm text-on-surface-variant">{line?.name || 'Unassigned Line'}</span>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mr-1.5`}></span>
                                {status}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border border-outline-variant ${ws.minSkillLevel === 'Expert' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                {ws.minSkillLevel === 'Expert' ? 'Expert' : ws.minSkillLevel}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {assignedAssoc ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-[10px] overflow-hidden border border-outline-variant">
                                    {assignedAssoc.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                                  </div>
                                  <span>{assignedAssoc.name}</span>
                                </div>
                              ) : (
                                <span className="text-body-sm text-on-surface-variant italic">Unassigned</span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-surface-container-high h-2 rounded-full overflow-hidden">
                                  <div className={`${effColor} h-full`} style={{ width: `${mockEff}%` }}></div>
                                </div>
                                <span className={`text-xs font-mono font-bold ${mockEff < 30 && status !== 'Maintenance' && status !== 'Idle' ? 'text-error' : ''}`}>{mockEff}%</span>
                              </div>
                            </td>
                            {canWriteAllMasterData && (
                              <td className="p-3.5 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); startEditWS(ws); }}
                                    className="p-2 text-on-surface-variant hover:text-primary transition-colors" 
                                    title="Edit"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Delete workstation ${ws.name}? Active shift allocations will be cleared.`)) {
                                        deleteWorkstation(ws.id);
                                      }
                                    }}
                                    className="p-2 text-on-surface-variant hover:text-error transition-colors" 
                                    title="Remove"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="px-lg py-md bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
                  <span className="text-body-sm text-on-surface-variant">Showing {workstations.length} Workstations</span>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-md border border-outline-variant hover:bg-surface transition-colors disabled:opacity-40" disabled>
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="px-3 py-1 rounded-md bg-primary text-on-primary font-bold text-body-sm">1</button>
                    <button className="p-2 rounded-md border border-outline-variant hover:bg-surface transition-colors disabled:opacity-40" disabled>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Sub-tab: Skills */}
          {activeSubTab === 'skills' && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-headline-md text-xs font-bold text-on-surface tracking-tight uppercase">Skill Master Register</h2>
                  <p className="text-[10px] text-secondary">Operational and technical safety skill descriptors</p>
                </div>
                {canWriteAllMasterData && !isAddingSkill && !editingSkill && (
                  <button
                    onClick={() => { setSkId(''); setSkName(''); setSkDesc(''); setIsAddingSkill(true); }}
                    className="py-2 px-4 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer shadow-premium-md font-label-caps tracking-wider transition-all hover:scale-[1.02]"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span> ADD SKILL
                  </button>
                )}
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-premium-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
                      <th className="p-3.5">SKILL CODE</th>
                      <th className="p-3.5">SKILL NAME</th>
                      <th className="p-3.5">DESCRIPTION & APPLICATION</th>
                      {canWriteAllMasterData && <th className="p-3.5 text-right">ACTIONS</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {skills.map(sk => (
                      <tr key={sk.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-primary">{sk.id}</td>
                        <td className="p-3.5 font-bold text-on-surface">{sk.name}</td>
                        <td className="p-3.5 text-secondary font-medium leading-relaxed">{sk.description}</td>
                        {canWriteAllMasterData && (
                          <td className="p-3.5 text-right select-none space-x-3">
                            <button
                              onClick={() => startEditSkill(sk)}
                              className="text-primary hover:underline font-bold text-[10px] cursor-pointer"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete skill ${sk.name}? This will clear all associate skill certifications.`)) {
                                  deleteSkill(sk.id);
                                }
                              }}
                              className="text-rose-600 hover:underline font-bold text-[10px] cursor-pointer"
                            >
                              REMOVE
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Unified Sub-tab: Lines configuration */}
          {activeSubTab === 'lines' && (
            renderLineAndShiftConfig()
          )}

        </div>
 
        {/* Right Add/Edit Side Form Panel */}
        {((canWriteAssociates && (isAddingAssoc || editingAssoc)) || (canWriteAllMasterData && (isAddingWS || editingWS || isAddingLine || editingLine || isAddingSkill || editingSkill || isAddingShift || editingShift))) && (
          <aside className="w-[380px] h-full border-l border-outline-variant bg-surface-container-lowest p-5 overflow-y-auto custom-scrollbar flex flex-col gap-5 shadow-premium-lg z-30 animate-slide-up">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs text-primary uppercase tracking-wider font-label-caps">
                {isAddingAssoc ? 'Create Associate' : editingAssoc ? 'Modify Associate' : isAddingWS ? 'Create Workstation' : editingWS ? 'Modify Workstation' : isAddingLine ? 'Create Production Line' : editingLine ? 'Modify Production Line' : isAddingSkill ? 'Create Skill' : editingSkill ? 'Modify Skill' : isAddingShift ? 'Create Shift' : 'Modify Shift'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingAssoc(false);
                  setEditingAssoc(null);
                  setIsAddingWS(false);
                  setEditingWS(null);
                  setIsAddingLine(false);
                  setEditingLine(null);
                  setIsAddingSkill(false);
                  setEditingSkill(null);
                  setIsAddingShift(false);
                  setEditingShift(null);
                  setLineId('');
                  setLineName('');
                  setLineProduct('');
                  setLineStatus('ACTIVE');
                  setWsId('');
                  setWsName('');
                  setWsMaxStaffCount(1);
                  setSkId('');
                  setSkName('');
                  setSkDesc('');
                  setShiftId('');
                  setShiftName('');
                  setShiftTimings('');
                  setShiftDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
                  resetAssocForm();
                }}
                className="p-1 hover:bg-surface-container rounded-lg text-secondary transition-colors flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Form: Associate */}
            {(isAddingAssoc || editingAssoc) && (
              <form onSubmit={handleSaveAssociate} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">EMPLOYEE ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingAssoc}
                    value={assocId}
                    onChange={(e) => setAssocId(e.target.value.toUpperCase())}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low font-mono disabled:opacity-65 shadow-premium-sm text-xs"
                    placeholder="e.g. EMP115"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">NAME</label>
                  <input
                    type="text"
                    required
                    value={assocName}
                    onChange={(e) => setAssocName(e.target.value)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low shadow-premium-sm text-xs"
                    placeholder="e.g. A. Mukhopadhyay"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">PLANT ID REFERENCE</label>
                  <input
                    type="text"
                    value={assocPlantIdRef}
                    onChange={(e) => setAssocPlantIdRef(e.target.value)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low shadow-premium-sm text-xs"
                    placeholder="e.g. PID-12345"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">CATEGORY</label>
                    <select
                      value={assocCategory}
                      onChange={(e) => setAssocCategory(e.target.value as AssociateCategory)}
                      className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest font-bold cursor-pointer shadow-premium-sm text-xs"
                    >
                      <option value="Contract">Contract</option>
                      <option value="Company">Company</option>
                      <option value="NTCI">NTCI</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">STATUS</label>
                    <select
                      value={assocStatus}
                      onChange={(e) => setAssocStatus(e.target.value as 'Active' | 'Inactive')}
                      className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest font-bold cursor-pointer shadow-premium-sm text-xs"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Skill Matrix Selectors */}
                <div className="border-t border-outline-variant pt-4">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider block mb-2">ASSIGNED SKILLS</label>
                  <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {skills.map(sk => {
                      const isAssigned = assocSkills.find(s => s.skillId === sk.id);
                      return (
                        <div key={sk.id} className="p-3 bg-surface-container-low border border-outline-variant rounded-lg flex flex-col gap-2 shadow-premium-sm">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!isAssigned}
                                onChange={(e) => handleSkillLevelChange(
                                  sk.id,
                                  isAssigned?.level || 'Operator',
                                  isAssigned?.expiryDate || '2027-12-31',
                                  e.target.checked
                                )}
                                className="rounded border-outline text-primary focus:ring-0 cursor-pointer w-3.5 h-3.5"
                              />
                              <span className="font-bold font-mono text-[10px] text-primary">{sk.id}</span>
                            </label>
                          </div>

                          {isAssigned && (
                            <div className="grid grid-cols-2 gap-2 pl-5 mt-0.5">
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-secondary uppercase tracking-wider block">LEVEL</label>
                                <select
                                  value={isAssigned.level}
                                  onChange={(e) => handleSkillLevelChange(
                                    sk.id,
                                    e.target.value as SkillLevel,
                                    isAssigned.expiryDate,
                                    true
                                  )}
                                  className="w-full p-1 bg-surface-container-lowest border border-outline-variant rounded text-[9px] cursor-pointer"
                                >
                                  <option value="Trainee">Trainee</option>
                                  <option value="Operator">Operator</option>
                                  <option value="Certified">Certified</option>
                                  <option value="Expert">Expert</option>
                                </select>
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-secondary uppercase tracking-wider block">EXPIRY</label>
                                <input
                                  type="date"
                                  value={isAssigned.expiryDate}
                                  onChange={(e) => handleSkillLevelChange(
                                    sk.id,
                                    isAssigned.level,
                                    e.target.value,
                                    true
                                  )}
                                  className="w-full p-0.5 px-1 bg-surface-container-lowest border border-outline-variant rounded text-[9px] font-mono cursor-pointer"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-slate-800 text-[10px] font-label-caps tracking-wider uppercase transition-all shadow-premium-md hover:shadow-premium-lg cursor-pointer"
                >
                  SAVE ASSOCIATE
                </button>
              </form>
            )}

            {/* Form: Workstation */}
            {(isAddingWS || editingWS) && (
              <form onSubmit={handleSaveWS} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">STATION ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingWS}
                    value={wsId}
                    onChange={(e) => setWsId(e.target.value.toUpperCase())}
                    className="py-2 px-3 border border-outline-variant bg-surface-container-low font-mono disabled:opacity-65 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm text-xs"
                    placeholder="e.g. WS-106"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">STATION NAME</label>
                  <input
                    type="text"
                    required
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low shadow-premium-sm text-xs"
                    placeholder="e.g. Seasoning Tumbler B"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">PRODUCTION LINE</label>
                  <select
                    value={wsLineId}
                    onChange={(e) => setWsLineId(e.target.value)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest font-bold cursor-pointer shadow-premium-sm text-xs"
                  >
                    {productionLines.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider block mb-1">COMPLIANT SKILLS (CHECK ALL REQUIRED)</label>
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 border border-outline-variant rounded-lg p-2 bg-surface-container-low shadow-inner">
                    {skills.map(sk => {
                      const isChecked = wsRequiredSkill.split(';').includes(sk.id);
                      return (
                        <label key={sk.id} className="flex items-center gap-2 cursor-pointer select-none py-0.5 hover:bg-surface-container/50 rounded px-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const currentSelected = wsRequiredSkill ? wsRequiredSkill.split(';').filter(Boolean) : [];
                              let updated: string[];
                              if (e.target.checked) {
                                updated = [...currentSelected, sk.id];
                              } else {
                                updated = currentSelected.filter(id => id !== sk.id);
                              }
                              setWsRequiredSkill(updated.join(';'));
                            }}
                            className="rounded border-outline text-primary focus:ring-0 cursor-pointer w-3.5 h-3.5"
                          />
                          <span className="font-mono text-[10px] font-bold text-primary">{sk.id}</span>
                          <span className="text-secondary text-[10px] truncate">— {sk.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">MIN LEVEL REQUIRED</label>
                  <select
                    value={wsMinLevel}
                    onChange={(e) => setWsMinLevel(e.target.value as SkillLevel)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest font-bold cursor-pointer shadow-premium-sm text-xs"
                  >
                    <option value="Trainee">Trainee</option>
                    <option value="Operator">Operator</option>
                    <option value="Certified">Certified</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">MAX STAFF CAPACITY</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={wsMaxStaffCount}
                    onChange={(e) => setWsMaxStaffCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low shadow-premium-sm text-xs"
                    placeholder="e.g. 2"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-slate-800 text-[10px] font-label-caps tracking-wider uppercase transition-all shadow-premium-md hover:shadow-premium-lg cursor-pointer"
                >
                  SAVE WORKSTATION
                </button>
              </form>
            )}

            {/* Form: Production Line */}
            {(isAddingLine || editingLine) && (
              <form onSubmit={handleSaveLine} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">LINE ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingLine}
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value.toUpperCase())}
                    className="py-2 px-3 border border-outline-variant bg-surface-container-low font-mono disabled:opacity-65 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm text-xs"
                    placeholder="e.g. LINE-05"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">LINE NAME</label>
                  <input
                    type="text"
                    required
                    value={lineName}
                    onChange={(e) => setLineName(e.target.value)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low shadow-premium-sm text-xs"
                    placeholder="e.g. Line 05 - Potato Sticks"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">CURRENT PRODUCT</label>
                  <input
                    type="text"
                    required
                    value={lineProduct}
                    onChange={(e) => setLineProduct(e.target.value)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low shadow-premium-sm text-xs"
                    placeholder="e.g. Lays Sticks Tangy Tomato"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">OPERATIONAL STATUS</label>
                  <select
                    value={lineStatus}
                    onChange={(e) => setLineStatus(e.target.value as LineStatus)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest font-bold cursor-pointer shadow-premium-sm text-xs"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="HALTED">HALTED</option>
                    <option value="IDLE">IDLE</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-slate-800 text-[10px] font-label-caps tracking-wider uppercase transition-all shadow-premium-md hover:shadow-premium-lg cursor-pointer"
                >
                  SAVE PRODUCTION LINE
                </button>
              </form>
            )}
            {/* Form: Skill */}
            {(isAddingSkill || editingSkill) && (
              <form onSubmit={handleSaveSkill} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">SKILL CODE / ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSkill}
                    value={skId}
                    onChange={(e) => setSkId(e.target.value.toUpperCase())}
                    className="py-2 px-3 border border-outline-variant bg-surface-container-low font-mono disabled:opacity-65 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm text-xs"
                    placeholder="e.g. PACKING_QA"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">SKILL NAME</label>
                  <input
                    type="text"
                    required
                    value={skName}
                    onChange={(e) => setSkName(e.target.value)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low shadow-premium-sm text-xs"
                    placeholder="e.g. Packing Quality Assurance"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">DESCRIPTION</label>
                  <textarea
                    rows={3}
                    value={skDesc}
                    onChange={(e) => setSkDesc(e.target.value)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low shadow-premium-sm text-xs"
                    placeholder="Describe skill competency rules..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-slate-800 text-[10px] font-label-caps tracking-wider uppercase transition-all shadow-premium-md hover:shadow-premium-lg cursor-pointer"
                >
                  SAVE SKILL
                </button>
              </form>
            )}

            {/* Form: Shift */}
            {(isAddingShift || editingShift) && (
              <form onSubmit={handleSaveShift} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">SHIFT ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingShift}
                    value={shiftId}
                    onChange={(e) => setShiftId(e.target.value.toUpperCase())}
                    className="py-2 px-3 border border-outline-variant bg-surface-container-low font-mono disabled:opacity-65 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm text-xs"
                    placeholder="e.g. SHIFT-D"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">SHIFT NAME</label>
                  <input
                    type="text"
                    required
                    value={shiftName}
                    onChange={(e) => setShiftName(e.target.value)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low shadow-premium-sm text-xs"
                    placeholder="e.g. Shift D"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">TIMINGS</label>
                  <input
                    type="text"
                    required
                    value={shiftTimings}
                    onChange={(e) => setShiftTimings(e.target.value)}
                    className="py-2 px-3 border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-low shadow-premium-sm text-xs"
                    placeholder="e.g. 06:00 - 14:00"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">WORKING DAYS</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const isSelected = shiftDays.includes(day);
                      return (
                        <label key={day} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setShiftDays(prev => [...prev, day]);
                              } else {
                                setShiftDays(prev => prev.filter(d => d !== day));
                              }
                            }}
                            className="rounded border-outline text-primary focus:ring-0 cursor-pointer w-3.5 h-3.5"
                          />
                          <span className="font-semibold text-slate-700 text-[10px]">{day}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-slate-800 text-[10px] font-label-caps tracking-wider uppercase transition-all shadow-premium-md hover:shadow-premium-lg cursor-pointer"
                >
                  SAVE SHIFT
                </button>
              </form>
            )}

          </aside>
        )}
      </>
    )}
  </div>
    </div>
  );
};
