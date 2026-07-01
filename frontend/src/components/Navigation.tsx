import React from 'react';
import { useApp } from '../context/AppContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setMasterDataSubTab?: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { role, user, associateSkills, logout } = useApp();

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
    { id: 'lines', name: 'Production Lines', icon: 'precision_manufacturing', roles: ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'] },
    { id: 'associates', name: 'Associates', icon: 'groups', roles: ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'] },
    { id: 'workstations', name: 'Workstations', icon: 'desk', roles: ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'] },
    { id: 'skills', name: 'Skills', icon: 'military_tech', roles: ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'] },
    { id: 'analytics', name: 'Reports', icon: 'analytics', roles: ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'] },
    { id: 'audit_logs', name: 'Audit Logs', icon: 'terminal', roles: ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'] }
  ];

  const visibleTabs = tabs.filter(t => t.roles.includes(role));

  return (
    <aside className="w-64 bg-primary text-on-primary flex flex-col h-full shrink-0 select-none z-40 border-r border-outline-variant shadow-md">
      {/* Header Section */}
      <div className="p-5 border-b border-outline-variant flex flex-col bg-primary">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#14b8a6] text-white">
            <span className="material-symbols-outlined text-white text-base">factory</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>Plant Ops</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">Kolkata Plant • Roster</div>
          </div>
        </div>

        {/* Profile Card / ID Badge */}
        <div className="mt-4 flex flex-col gap-2.5 p-3 bg-primary-container/30 border border-outline-variant rounded-xl">
          <div className="flex items-center gap-3">
            <img 
              className="w-10 h-10 rounded-lg border border-outline-variant object-cover shadow-sm" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdgJNACyT_CWwq_Gk3iuVS92due0LKPya-WGA-i8hJezbLXHIbSSgaqAiE9jFCILMbJLRHkU-9ztYRluhVrrHFICR7BGLMengv2pLiAeSPLSIO-H_pkmel5pdMoHxmvyx0iHojUCAXXY8esSQ4dKcLXZGr0QvPRtAgq0HSRrbzJSTjNh-9pURuUUo78Vf8VLEL0quupTsh13jqWlak_S4EOXEzgsGfFQSgK97F7vrEn9JnRbSDcrn_ZxHtwuc982ituyVcJs-KpA" 
              alt="User avatar"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                {user?.name || 'Unknown User'}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B] truncate mt-0.5">
                {role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar flex flex-col gap-1 bg-primary">
        {visibleTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-150 rounded-xl text-left cursor-pointer w-full ${
                isActive
                  ? 'text-white font-semibold text-sm bg-on-primary-fixed-variant shadow-sm border-l-4 border-[#14b8a6]'
                  : 'text-[#94A3B8] font-medium text-sm hover:text-white hover:bg-primary-container border-l-4 border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
              <span className="text-[14px]">{tab.name}</span>
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
          className="flex items-center gap-3 px-4 py-2.5 mt-4 transition-all duration-150 rounded-xl text-left text-sm font-medium text-error hover:text-white hover:bg-error-container/20 cursor-pointer border-l-4 border-transparent"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span className="text-[14px]">Logout System</span>
        </button>
      </nav>



      {/* Footer Section */}
      <div className="mt-auto p-4 border-t border-outline-variant bg-[#050b18]">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">OPERATIONS NOMINAL</span>
          <div className="relative flex items-center justify-center h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#14b8a6]"></span>
          </div>
        </div>
        <div className="text-[8px] text-on-primary-container/70 text-center font-mono leading-none">
          PEPSICO KOLKATA PORTAL
        </div>
      </div>
    </aside>
  );
};
