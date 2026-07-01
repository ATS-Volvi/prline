import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Associate, Workstation, AssociateCategory, SkillLevel, ProductionLine, LineStatus, Skill, Shift } from '../types';

export const MasterData: React.FC = () => {
  const {
    associates,
    workstations,
    skills,
    productionLines,
    shifts,
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
    associateSkills,
    role
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'associates' | 'workstations' | 'skills' | 'lines' | 'shifts'>(() => {
    const stored = localStorage.getItem('master_data_sub_tab');
    return (stored as any) || 'associates';
  });

  // Profile View States
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(null);
  const [profileTab, setProfileTab] = useState<'skills' | 'certs' | 'training' | 'logs'>('skills');
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

  const getSkillIcon = (id: string) => {
    switch (id) {
      case 'BLADE_OPT': return 'build';
      case 'HYGIENE_L2': return 'clean_hands';
      case 'HEAT_SAFETY': return 'local_fire_department';
      case 'OIL_MGMT': return 'oil_barrel';
      case 'SPICE_MIX': return 'restaurant';
      case 'MECH_OP': return 'engineering';
      case 'QA_L1': return 'rule';
      case 'CHEM_CERT': return 'science';
      default: return 'workspace_premium';
    }
  };

  const renderAssociateProfile = (assoc: Associate) => {
    const mySkills = associateSkills.filter(s => s.associateId === assoc.id);
    const avatarUrl = getAvatarUrl(assoc.name);
    const tenure = getTenure(assoc.joiningDate);
    
    // Check if employee is supervisor
    const isSupervisor = assoc.category === 'Company' || assoc.name.includes("Miller") || assoc.name.includes("Sharma");
    const designation = isSupervisor ? 'Line Supervisor' : 'Line Operator';
    
    // Attendance and OT Hours based on ID hash
    const nameHash = assoc.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const attendance = (97.5 + (nameHash % 25) / 10).toFixed(1);
    const otHours = 80 + (nameHash % 80);
    const productivity = "+" + (3.2 + (nameHash % 30) / 10).toFixed(1) + "%";

    return (
      <div className="flex-grow flex flex-col gap-6 select-text overflow-y-auto px-1 py-1 custom-scrollbar">
        
        {/* Breadcrumb / Back button bar */}
        <div className="flex items-center gap-2 text-xs text-secondary mb-2">
          <button 
            type="button"
            onClick={() => setSelectedAssociate(null)} 
            className="hover:text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Associate Master
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-bold text-primary font-mono">{assoc.name}</span>
        </div>

        {/* Profile Header Card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-premium-sm">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 border-outline-variant shadow-premium-sm">
                <img alt={assoc.name} className="w-full h-full object-cover" src={avatarUrl} />
              </div>
              {assoc.status === 'Active' && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-lg border-2 border-surface-container-lowest shadow-premium-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] font-bold">verified</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">{assoc.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-secondary">
                <span className="font-mono bg-surface-container px-2 py-0.5 rounded text-on-surface-variant font-bold">{assoc.id}</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">badge</span>
                  <span className="font-semibold">{designation}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <span className="font-semibold">Line B - Food Processing</span>
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow-premium-sm ${
                  assoc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${assoc.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  {assoc.status === 'Active' ? 'On Duty' : 'Off Duty'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-200 shadow-premium-sm">
                  {tenure}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 w-full md:w-auto">
            <button 
              type="button"
              onClick={() => window.print()}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 border border-outline-variant rounded-lg text-[10px] font-bold text-on-surface hover:bg-surface-container transition-colors shadow-premium-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">ios_share</span>
              Export Report
            </button>
            <button 
              type="button"
              onClick={() => startEditAssociate(assoc)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-lg text-[10px] font-bold hover:bg-slate-900 transition-all active:scale-[0.98] shadow-premium-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Profile
            </button>
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="border-b border-outline-variant mt-2">
          <div className="flex gap-6 overflow-x-auto custom-scrollbar">
            {(['skills', 'certs', 'training', 'logs'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setProfileTab(tab)}
                className={`pb-3 text-xs font-bold whitespace-nowrap transition-all cursor-pointer relative ${
                  profileTab === tab ? 'text-primary' : 'text-secondary opacity-60 hover:opacity-100'
                }`}
              >
                {tab === 'skills' ? 'Skills Matrix' : tab === 'certs' ? 'Certifications' : tab === 'training' ? 'Training History' : 'Performance Logs'}
                {profileTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"></div>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="flex-grow mt-2">
          
          {/* TAB: Skills Matrix */}
          {profileTab === 'skills' && (
            <div className="flex flex-col gap-6">
              {mySkills.length === 0 ? (
                <div className="p-8 border border-dashed border-outline-variant rounded-xl text-center text-secondary text-xs">
                  No skills certified yet. Click "Edit Profile" to assign skills to this employee.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mySkills.map(ms => {
                    const sk = skills.find(s => s.id === ms.skillId);
                    const icon = getSkillIcon(ms.skillId);
                    
                    // Proficiency bar calculations
                    const barWidth = ms.level === 'Trainee' ? '30%' : ms.level === 'Operator' ? '60%' : ms.level === 'Certified' ? '85%' : '100%';
                    const barColor = ms.level === 'Trainee' ? 'bg-amber-500' : ms.level === 'Operator' ? 'bg-blue-500' : ms.level === 'Certified' ? 'bg-indigo-650' : 'bg-emerald-500';
                    const score = ms.level === 'Trainee' ? '30%' : ms.level === 'Operator' ? '60%' : ms.level === 'Certified' ? '85%' : '98%';

                    return (
                      <div key={ms.skillId} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 hover:border-primary transition-all group flex flex-col justify-between shadow-premium-sm">
                        <div className="mb-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-surface-container-low rounded-lg text-primary">
                              <span className="material-symbols-outlined text-[20px]">{icon}</span>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                              ms.level === 'Expert' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              ms.level === 'Certified' ? 'bg-indigo-50 text-indigo-850 border-indigo-250' :
                              ms.level === 'Operator' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              'bg-amber-50 text-amber-800 border-amber-250'
                            }`}>
                              {ms.level}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-primary transition-colors">{sk?.name || ms.skillId}</h3>
                          <p className="text-[11px] text-secondary mt-1 leading-relaxed line-clamp-2">{sk?.description || 'Operational competence certificate.'}</p>
                        </div>
                        <div className="space-y-2 pt-3 border-t border-slate-100">
                          <div className="flex justify-between text-[10px] font-bold text-slate-700">
                            <span>Proficiency</span>
                            <span className="font-mono">{score}</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} rounded-full`} style={{ width: barWidth }}></div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-secondary pt-1.5">
                            <span>Last Assessed:</span>
                            <span className="font-mono font-bold text-[#0F172A]">{ms.trainingDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Operational Reliability Section */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col md:flex-row gap-6 items-center justify-between shadow-premium-sm">
                <div className="flex-grow w-full space-y-3">
                  <h4 className="font-bold text-xs text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-500 font-bold">verified_user</span>
                    OPERATIONAL RELIABILITY INDEX
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                    <div>
                      <p className="text-[10px] text-secondary">Attendance</p>
                      <p className="font-headline-md text-sm font-bold text-[#0F172A]">{attendance}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-secondary">Safety Incidents</p>
                      <p className="font-headline-md text-sm font-bold text-emerald-600">0</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-secondary">OT Hours</p>
                      <p className="font-headline-md text-sm font-bold text-[#0F172A]">{otHours}h</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-secondary">Productivity</p>
                      <p className="font-headline-md text-sm font-bold text-emerald-600">{productivity}</p>
                    </div>
                  </div>
                </div>
                
                {/* Circular Gauge visual representation */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500"
                      strokeDasharray={`${attendance}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-[11px] font-bold font-mono text-primary">{attendance}%</div>
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

  const startEditShift = (s: Shift) => {
    setEditingShift(s);
    setShiftId(s.id);
    setShiftName(s.name);
    setShiftTimings(s.timings);
    setShiftDays(s.workingDays || []);
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

  const startEditLine = (l: ProductionLine) => {
    setEditingLine(l);
    setLineId(l.id);
    setLineName(l.name);
    setLineProduct(l.currentProduct);
    setLineStatus(l.status);
  };

  const canWriteAssociates = role === 'Plant Admin' || role === 'HR / Training Coordinator';
  const canWriteAllMasterData = role === 'Plant Admin';

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
        
        {/* Left Side Table View */}
        <div className="flex-1 p-margin-desktop overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          {/* Sub-tab: Associates */}
          {activeSubTab === 'associates' && (
            selectedAssociate ? (
              renderAssociateProfile(selectedAssociate)
            ) : (
              <>
                <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-headline-md text-xs font-bold text-on-surface tracking-tight uppercase">Associate List</h2>
                  <p className="text-[10px] text-secondary">Manage shift operators, contractors, and category classifications</p>
                </div>
                {canWriteAssociates && !isAddingAssoc && !editingAssoc && (
                  <button
                    onClick={() => { resetAssocForm(); setIsAddingAssoc(true); }}
                    className="py-2 px-4 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-slate-905 flex items-center gap-1.5 cursor-pointer shadow-premium-md font-label-caps tracking-wider transition-all hover:scale-[1.02]"
                  >
                    <span className="material-symbols-outlined text-sm">person_add</span> ADD ASSOCIATE
                  </button>
                )}
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-premium-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
                      <th className="p-3.5">EMPLOYEE ID</th>
                      <th className="p-3.5">NAME</th>
                      <th className="p-3.5">PLANT ID REF</th>
                      <th className="p-3.5">CATEGORY</th>
                      <th className="p-3.5">JOINING DATE</th>
                      <th className="p-3.5">SKILLS ROSTERED</th>
                      <th className="p-3.5">STATUS</th>
                      {canWriteAssociates && <th className="p-3.5 text-right">ACTIONS</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {associates.map(assoc => {
                      const skillsCount = associateSkills.filter(s => s.associateId === assoc.id).length;
                      return (
                        <tr key={assoc.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td 
                            className="p-3.5 font-mono font-bold text-primary hover:underline cursor-pointer"
                            onClick={() => { setSelectedAssociate(assoc); setProfileTab('skills'); }}
                          >
                            {assoc.id}
                          </td>
                          <td 
                            className="p-3.5 font-bold text-on-surface hover:underline cursor-pointer"
                            onClick={() => { setSelectedAssociate(assoc); setProfileTab('skills'); }}
                          >
                            {assoc.name}
                          </td>
                          <td className="p-3.5 font-mono text-secondary font-semibold">{assoc.plantIdRef || 'N/A'}</td>
                          <td className="p-3.5 text-secondary font-medium">{assoc.category}</td>
                          <td className="p-3.5 font-mono text-secondary">{assoc.joiningDate}</td>
                          <td className="p-3.5">
                            <span className="bg-surface-container-low text-slate-700 font-bold px-2 py-0.5 rounded border border-outline-variant font-mono text-[9px] shadow-premium-sm">
                              {skillsCount} Skills
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider border shadow-premium-sm ${
                              assoc.status === 'Active' ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant border-outline-variant' : 'bg-surface-container-low text-slate-600 border-outline-variant'
                            }`}>
                              {assoc.status.toUpperCase()}
                            </span>
                          </td>
                          {canWriteAssociates && (
                            <td className="p-3.5 text-right select-none space-x-3">
                              <button
                                onClick={() => startEditAssociate(assoc)}
                                className="text-primary hover:underline font-bold text-[10px] cursor-pointer"
                              >
                                EDIT
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete ${assoc.name}? All skill mappings will be removed.`)) {
                                    deleteAssociate(assoc.id);
                                  }
                                }}
                                className="text-rose-600 hover:underline font-bold text-[10px] cursor-pointer"
                              >
                                REMOVE
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
            )
          )}

          {/* Sub-tab: Workstations */}
          {activeSubTab === 'workstations' && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-headline-md text-xs font-bold text-on-surface tracking-tight uppercase">Workstations Directory</h2>
                  <p className="text-[10px] text-secondary">Manage plant floor workstation constraints and required minimum skills</p>
                </div>
                {canWriteAllMasterData && !isAddingWS && !editingWS && (
                  <button
                    onClick={() => { setWsId(''); setWsName(''); setIsAddingWS(true); }}
                    className="py-2 px-4 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer shadow-premium-md font-label-caps tracking-wider transition-all hover:scale-[1.02]"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span> CONFIGURE STATION
                  </button>
                )}
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-premium-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
                      <th className="p-3.5">STATION ID</th>
                      <th className="p-3.5">STATION NAME</th>
                      <th className="p-3.5">PRODUCTION LINE</th>
                      <th className="p-3.5">REQUIRED SKILL</th>
                      <th className="p-3.5">MINIMUM LEVEL</th>
                      <th className="p-3.5">CAPACITY</th>
                      {canWriteAllMasterData && <th className="p-3.5 text-right">ACTIONS</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {workstations.map(ws => {
                      const line = productionLines.find(l => l.id === ws.lineId);
                      return (
                        <tr key={ws.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-primary">{ws.id}</td>
                          <td className="p-3.5 font-bold text-on-surface">{ws.name}</td>
                          <td className="p-3.5 text-secondary font-medium">{line?.name || ws.lineId}</td>
                          <td className="p-3.5 font-mono font-bold text-secondary">{ws.requiredSkillId}</td>
                          <td className="p-3.5">
                            <span className="bg-surface-container-low text-slate-800 font-bold px-2 py-0.5 rounded border border-outline-variant font-mono text-[9px] shadow-premium-sm">
                              &gt;= {ws.minSkillLevel}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-700">
                            {ws.maxStaffCount || 1} { (ws.maxStaffCount || 1) === 1 ? 'Worker' : 'Workers' }
                          </td>
                          {canWriteAllMasterData && (
                            <td className="p-3.5 text-right select-none space-x-3">
                              <button
                                onClick={() => startEditWS(ws)}
                                className="text-primary hover:underline font-bold text-[10px] cursor-pointer"
                              >
                                EDIT
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete workstation ${ws.name}? Active shift allocations will be cleared.`)) {
                                    deleteWorkstation(ws.id);
                                  }
                                }}
                                className="text-rose-600 hover:underline font-bold text-[10px] cursor-pointer"
                              >
                                REMOVE
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
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

          {/* Sub-tab: Lines */}
          {activeSubTab === 'lines' && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-headline-md text-xs font-bold text-on-surface tracking-tight uppercase">Production Lines Directory</h2>
                  <p className="text-[10px] text-secondary">Manage plant floor production channels, current product running, and operational status</p>
                </div>
                {canWriteAllMasterData && !isAddingLine && !editingLine && (
                  <button
                    onClick={() => {
                      setLineId('');
                      setLineName('');
                      setLineProduct('');
                      setLineStatus('ACTIVE');
                      setIsAddingLine(true);
                    }}
                    className="py-2 px-4 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer shadow-premium-md font-label-caps tracking-wider transition-all hover:scale-[1.02]"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span> ADD PRODUCTION LINE
                  </button>
                )}
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-premium-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
                      <th className="p-3.5">LINE ID</th>
                      <th className="p-3.5">LINE NAME</th>
                      <th className="p-3.5">CURRENT PRODUCT</th>
                      <th className="p-3.5">STATUS</th>
                      {canWriteAllMasterData && <th className="p-3.5 text-right">ACTIONS</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productionLines.map(line => (
                      <tr key={line.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-primary">{line.id}</td>
                        <td className="p-3.5 font-bold text-on-surface">{line.name}</td>
                        <td className="p-3.5 text-secondary font-medium">{line.currentProduct}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider border shadow-premium-sm ${
                            line.status === 'ACTIVE'
                              ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant border-outline-variant'
                              : line.status === 'MAINTENANCE'
                              ? 'bg-secondary-container text-on-secondary-container border-outline-variant'
                              : line.status === 'HALTED'
                              ? 'bg-error-container text-on-error-container border-outline-variant'
                              : 'bg-surface-container-low text-slate-600 border-outline-variant'
                          }`}>
                            {line.status}
                          </span>
                        </td>
                        {canWriteAllMasterData && (
                          <td className="p-3.5 text-right select-none space-x-3">
                            <button
                              onClick={() => startEditLine(line)}
                              className="text-primary hover:underline font-bold text-[10px] cursor-pointer"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete production line ${line.name}? This will delete all configured workstations and allocations for this line.`)) {
                                  deleteProductionLine(line.id);
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

          {/* Sub-tab: Shifts */}
          {activeSubTab === 'shifts' && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-headline-md text-xs font-bold text-on-surface tracking-tight uppercase">Shifts Directory</h2>
                  <p className="text-[10px] text-secondary">Manage plant shift timings, schedule definitions, and active working days</p>
                </div>
                {canWriteAllMasterData && !isAddingShift && !editingShift && (
                  <button
                    onClick={() => {
                      setShiftId('');
                      setShiftName('');
                      setShiftTimings('');
                      setShiftDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
                      setIsAddingShift(true);
                    }}
                    className="py-2 px-4 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer shadow-premium-md font-label-caps tracking-wider transition-all hover:scale-[1.02]"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span> ADD SHIFT
                  </button>
                )}
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-premium-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
                      <th className="p-3.5">SHIFT ID</th>
                      <th className="p-3.5">SHIFT NAME</th>
                      <th className="p-3.5">TIMINGS</th>
                      <th className="p-3.5">WORKING DAYS</th>
                      {canWriteAllMasterData && <th className="p-3.5 text-right">ACTIONS</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shifts.map(shift => (
                      <tr key={shift.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-primary">{shift.id}</td>
                        <td className="p-3.5 font-bold text-on-surface">{shift.name}</td>
                        <td className="p-3.5 font-mono text-secondary font-medium">{shift.timings}</td>
                        <td className="p-3.5 text-secondary">
                          <div className="flex flex-wrap gap-1">
                            {shift.workingDays && shift.workingDays.map(day => (
                              <span key={day} className="bg-surface-container-low text-slate-600 font-bold px-1.5 py-0.5 rounded border border-outline-variant text-[8px] font-mono shadow-premium-sm">
                                {day.substring(0, 3)}
                              </span>
                            ))}
                          </div>
                        </td>
                        {canWriteAllMasterData && (
                          <td className="p-3.5 text-right select-none space-x-3">
                            <button
                              onClick={() => startEditShift(shift)}
                              className="text-primary hover:underline font-bold text-[10px] cursor-pointer"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete shift ${shift.name}?`)) {
                                  deleteShift(shift.id);
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

      </div>
    </div>
  );
};
