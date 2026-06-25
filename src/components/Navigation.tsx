import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setMasterDataSubTab?: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { role, setRole, associateSkills, associates, workstations, skills, productionLines, logout } = useApp();
  const [masterDataOpen, setMasterDataOpen] = useState(true);

  const expiringCount = React.useMemo(() => {
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);
    return (associateSkills || []).filter(s => {
      const expDate = new Date(s.expiryDate);
      return expDate >= today && expDate <= next7Days;
    }).length;
  }, [associateSkills]);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', roles: ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'] },
    { id: 'shift_planner', name: 'Shift Allocation', icon: 'group_add', roles: ['Plant Admin', 'Production Supervisor', 'Plant Manager'] },
    { id: 'skill_matrix', name: 'Skill Matrix', icon: 'military_tech', roles: ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'] },
    { id: 'analytics', name: 'Skill Gap Analysis', icon: 'analytics', roles: ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'] },
    { id: 'master_data', name: 'Master Data Setup', icon: 'database', roles: ['Plant Admin', 'HR / Training Coordinator'] },
    { id: 'ai_reports', name: 'AI Predictive Reports', icon: 'psychology', roles: ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'] },
    { id: 'audit_logs', name: 'Audit Logs & Reports', icon: 'terminal', roles: ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'] },
  ];

  const visibleTabs = tabs.filter(t => t.roles.includes(role));

  return (
    <aside className="w-64 bg-[#182c47] text-[#e2eafc] flex flex-col h-full shrink-0 select-none z-40 border-r border-[#293e5d]/60 shadow-md">
      {/* Header Section */}
      <div className="p-5 border-b border-[#293e5d]/60 flex flex-col">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#14b8a6] shadow-premium-sm text-white">
            <span className="material-symbols-outlined text-white text-base">factory</span>
          </div>
          <div>
            <div className="font-headline-md text-sm text-white font-bold tracking-tight">Plant Ops</div>
            <div className="font-label-caps text-[8px] text-[#94a3b8] tracking-wider">Kolkata Plant • Roster</div>
          </div>
        </div>

        {/* Profile Card / ID Badge with interactive Role Switcher */}
        <div className="mt-4 flex flex-col gap-2.5 p-3 bg-[#293e5d]/30 border border-[#293e5d]/50 rounded-xl">
          <div className="flex items-center gap-3">
            <img 
              className="w-10 h-10 rounded-lg border border-[#293e5d]/70 object-cover shadow-premium-sm" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdgJNACyT_CWwq_Gk3iuVS92due0LKPya-WGA-i8hJezbLXHIbSSgaqAiE9jFCILMbJLRHkU-9ztYRluhVrrHFICR7BGLMengv2pLiAeSPLSIO-H_pkmel5pdMoHxmvyx0iHojUCAXXY8esSQ4dKcLXZGr0QvPRtAgq0HSRrbzJSTjNh-9pURuUUo78Vf8VLEL0quupTsh13jqWlak_S4EOXEzgsGfFQSgK97F7vrEn9JnRbSDcrn_ZxHtwuc982ituyVcJs-KpA" 
              alt="User avatar"
            />
            <div className="overflow-hidden">
              <p className="font-body-md text-xs font-bold text-white truncate">
                {role === 'Plant Admin' ? 'A. Mukhopadhyay' : role === 'HR / Training Coordinator' ? 'P. Banerjee' : role === 'Plant Manager' ? 'S. Chatterjee' : 'R. Sharma'}
              </p>
              <p className="font-label-caps text-[8px] text-[#94a3b8]/75 truncate">
                ID: {role === 'Plant Admin' ? '#101' : role === 'HR / Training Coordinator' ? '#103' : role === 'Plant Manager' ? '#104' : '#102'}
              </p>
            </div>
          </div>
          <div className="relative mt-1">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full h-7 border border-[#293e5d]/85 bg-[#182c47] px-2 text-[9px] font-bold text-[#e2eafc] focus:outline-none appearance-none rounded-lg cursor-pointer shadow-premium-sm"
            >
              <option value="Production Supervisor">Production Supervisor</option>
              <option value="HR / Training Coordinator">HR / Training Coordinator</option>
              <option value="Plant Manager">Plant Manager</option>
              <option value="Plant Admin">Plant Admin</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1.5 pointer-events-none text-[#94a3b8] text-xs">expand_more</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar flex flex-col gap-1">
        {visibleTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-150 rounded-xl text-left font-body-md cursor-pointer w-full ${
                isActive
                  ? 'text-white font-bold bg-[#293e5d] shadow-premium-sm border-l-4 border-[#14b8a6]'
                  : 'text-[#e2eafc]/80 hover:text-white hover:bg-[#293e5d]/40 border-l-4 border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
              <span className="font-label-caps text-[10px] tracking-wider">{tab.name}</span>
              {tab.id === 'skill_matrix' && expiringCount > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono animate-pulse" title={`${expiringCount} skills expiring in 7 days`}>
                  {expiringCount}
                </span>
              )}
            </button>
          );
        })}
        
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 mt-4 transition-all duration-150 rounded-xl text-left font-body-md text-rose-350 hover:text-white hover:bg-rose-950/25 cursor-pointer border-l-4 border-transparent"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span className="font-label-caps text-[10px] tracking-wider">Logout System</span>
        </button>
      </nav>


      {/* Master Data Quick Config Panel */}
      {(role === 'Plant Admin' || role === 'HR / Training Coordinator') && (
        <div className="px-3 pb-3">
          <button
            onClick={() => setMasterDataOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#293e5d]/40 hover:bg-[#293e5d]/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#14b8a6] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>database</span>
              <span className="font-label-caps text-[9px] text-[#94a3b8] tracking-widest font-bold">MASTER DATA</span>
            </div>
            <span className={`material-symbols-outlined text-xs text-[#94a3b8] transition-transform duration-200 ${masterDataOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>

          {masterDataOpen && (
            <div className="mt-2 grid grid-cols-2 gap-1.5 animate-fade-in">
              {/* Associates */}
              <button
                onClick={() => { setActiveTab('master_data'); localStorage.setItem('master_data_sub_tab', 'associates'); }}
                className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border transition-all cursor-pointer group hover:border-[#14b8a6]/40 hover:bg-[#293e5d]/60 ${activeTab === 'master_data' ? 'border-[#293e5d]/80 bg-[#293e5d]/50' : 'border-[#293e5d]/40 bg-[#182c47]'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="material-symbols-outlined text-[#14b8a6] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                  <span className="text-white font-mono font-bold text-sm leading-none">{associates?.length ?? 0}</span>
                </div>
                <span className="font-label-caps text-[8px] text-[#94a3b8] tracking-wider leading-tight">Associates</span>
              </button>

              {/* Workstations */}
              <button
                onClick={() => { setActiveTab('master_data'); localStorage.setItem('master_data_sub_tab', 'workstations'); }}
                className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border transition-all cursor-pointer group hover:border-[#14b8a6]/40 hover:bg-[#293e5d]/60 ${activeTab === 'master_data' ? 'border-[#293e5d]/80 bg-[#293e5d]/50' : 'border-[#293e5d]/40 bg-[#182c47]'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="material-symbols-outlined text-[#14b8a6] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
                  <span className="text-white font-mono font-bold text-sm leading-none">{workstations?.length ?? 0}</span>
                </div>
                <span className="font-label-caps text-[8px] text-[#94a3b8] tracking-wider leading-tight">Workstations</span>
              </button>

              {/* Skills */}
              <button
                onClick={() => { setActiveTab('master_data'); localStorage.setItem('master_data_sub_tab', 'skills'); }}
                className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border transition-all cursor-pointer group hover:border-[#14b8a6]/40 hover:bg-[#293e5d]/60 ${activeTab === 'master_data' ? 'border-[#293e5d]/80 bg-[#293e5d]/50' : 'border-[#293e5d]/40 bg-[#182c47]'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="material-symbols-outlined text-[#14b8a6] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                  <span className="text-white font-mono font-bold text-sm leading-none">{skills?.length ?? 0}</span>
                </div>
                <span className="font-label-caps text-[8px] text-[#94a3b8] tracking-wider leading-tight">Skills</span>
              </button>

              {/* Production Lines */}
              <button
                onClick={() => { setActiveTab('master_data'); localStorage.setItem('master_data_sub_tab', 'lines'); }}
                className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border transition-all cursor-pointer group hover:border-[#14b8a6]/40 hover:bg-[#293e5d]/60 ${activeTab === 'master_data' ? 'border-[#293e5d]/80 bg-[#293e5d]/50' : 'border-[#293e5d]/40 bg-[#182c47]'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="material-symbols-outlined text-[#14b8a6] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>conveyor_belt</span>
                  <span className="text-white font-mono font-bold text-sm leading-none">{productionLines?.length ?? 0}</span>
                </div>
                <span className="font-label-caps text-[8px] text-[#94a3b8] tracking-wider leading-tight">Prod. Lines</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer Section */}
      <div className="mt-auto p-4 border-t border-[#293e5d]/50 bg-[#12243d]">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="font-label-caps text-[8px] text-[#94a3b8] tracking-widest font-bold">OPERATIONS NOMINAL</span>
          <div className="relative flex items-center justify-center h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#14b8a6]"></span>
          </div>
        </div>
        <div className="text-[8px] text-[#94a3b8]/70 text-center font-mono leading-none">
          PEPSICO KOLKATA PORTAL
        </div>
      </div>
    </aside>
  );
};
