import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setMasterDataSubTab?: (tab: string) => void;
}

const MASTER_DATA_TABS = ['associates', 'workstations', 'skills', 'lines', 'shifts'];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { role, user, associateSkills, logout } = useApp();

  // Whether the Master Data Configurator group is expanded
  const [masterExpanded, setMasterExpanded] = useState<boolean>(
    MASTER_DATA_TABS.includes(activeTab)
  );

  const expiringCount = React.useMemo(() => {
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);
    return (associateSkills || []).filter(s => {
      const expDate = new Date(s.expiryDate);
      return expDate >= today && expDate <= next7Days;
    }).length;
  }, [associateSkills]);

  const allRoles = ['Plant Admin', 'HR / Training Coordinator', 'Production Supervisor', 'Plant Manager'];

  // Top-level tabs (excluding the master data ones which are grouped)
  const topTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', roles: allRoles },
    { id: 'shift_planner', name: 'Shift Allocation', icon: 'edit_calendar', roles: allRoles },
    { id: 'production_planning', name: 'Production Planning', icon: 'timeline', roles: allRoles },
    { id: 'analytics', name: 'Reports', icon: 'analytics', roles: allRoles },
    { id: 'ai_reports', name: 'AI Reports', icon: 'smart_toy', roles: allRoles },
    { id: 'audit_logs', name: 'Audit Logs', icon: 'terminal', roles: allRoles },
  ];

  // Sub-items under Master Data Configurator
  const masterSubItems = [
    { id: 'associates', name: 'Associate Master', icon: 'badge', roles: allRoles },
    { id: 'workstations', name: 'Workstation Master', icon: 'desk', roles: allRoles },
    { id: 'skills', name: 'Skill Register', icon: 'military_tech', roles: allRoles },
    { id: 'lines', name: 'Line Master', icon: 'precision_manufacturing', roles: allRoles },
    { id: 'shifts', name: 'Shift Master', icon: 'schedule', roles: allRoles },
  ];

  const visibleTopTabs = topTabs.filter(t => t.roles.includes(role));
  const visibleMasterSubItems = masterSubItems.filter(t => t.roles.includes(role));
  const showMasterGroup = visibleMasterSubItems.length > 0;

  // Whether any master sub-tab is currently active
  const isMasterActive = MASTER_DATA_TABS.includes(activeTab);

  const handleMasterItemClick = (tabId: string) => {
    setActiveTab(tabId);
    setMasterExpanded(true);
  };

  const toggleMasterExpanded = () => {
    const next = !masterExpanded;
    setMasterExpanded(next);
    // If collapsing while a master sub-tab is active, navigate away to dashboard
    if (!next && isMasterActive) {
      setActiveTab('dashboard');
    }
  };

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
        {/* Top-level tabs before master group */}
        {visibleTopTabs.slice(0, 2).map(tab => {
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
            </button>
          );
        })}

        {/* Master Data Configurator Group */}
        {showMasterGroup && (
          <div className="flex flex-col">
            {/* Group header */}
            <button
              onClick={toggleMasterExpanded}
              className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-150 rounded-xl text-left cursor-pointer w-full ${
                isMasterActive
                  ? 'text-white font-semibold text-sm bg-on-primary-fixed-variant shadow-sm border-l-4 border-[#14b8a6]'
                  : 'text-[#94A3B8] font-medium text-sm hover:text-white hover:bg-primary-container border-l-4 border-transparent'
              }`}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={{ fontVariationSettings: isMasterActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                settings
              </span>
              <span className="text-[14px] flex-1">Master Data</span>
              {/* Chevron */}
              <span
                className="material-symbols-outlined text-base transition-transform duration-200"
                style={{ transform: masterExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                expand_more
              </span>
            </button>

            {/* Sub-items */}
            <div
              className="overflow-hidden transition-all duration-200"
              style={{ maxHeight: masterExpanded ? `${visibleMasterSubItems.length * 52}px` : '0px' }}
            >
              <div className="flex flex-col gap-0.5 mt-0.5 pl-3">
                {visibleMasterSubItems.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMasterItemClick(item.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 transition-all duration-150 rounded-lg text-left cursor-pointer w-full ${
                        isActive
                          ? 'text-white font-semibold text-sm bg-on-primary-fixed-variant/80 border-l-4 border-[#14b8a6]'
                          : 'text-[#94A3B8] font-medium text-sm hover:text-white hover:bg-primary-container/60 border-l-4 border-transparent'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {item.icon}
                      </span>
                      <span className="text-[13px]">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Remaining top-level tabs after master group */}
        {visibleTopTabs.slice(2).map(tab => {
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
