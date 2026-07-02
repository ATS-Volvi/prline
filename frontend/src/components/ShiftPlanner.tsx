import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AvailabilityTab } from './AvailabilityTab';
import { AiPanelTab } from './AiPanelTab';

interface ShiftPlannerProps {
  selectedLineId: string;
  setSelectedLineId: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export const ShiftPlanner: React.FC<ShiftPlannerProps> = ({ selectedLineId, setSelectedLineId, setActiveTab }) => {
  const {
    productionLines,
    workstations,
    allocations,
    associates,
    shifts,
    autoAllocateLine,
    clearLineAllocations,
    getEligibilityList,
    allocateAssociate,
    deallocateWorkstation,
    getConsecutiveWorkDays,
    role
  } = useApp();

  // Active filters state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShiftId, setSelectedShiftId] = useState('SHIFT-A');
  const [plannerTab, setPlannerTab] = useState<'allocation' | 'availability' | 'engine'>('allocation');
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showPublishToast, setShowPublishToast] = useState(false);

  // Animation & Modal states
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAutoSuccessModal, setShowAutoSuccessModal] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  // Manual Assign Modal state
  const [assigningWSId, setAssigningWSId] = useState<string | null>(null);
  
  // Override verification dialog state
  const [overrideAssocId, setOverrideAssocId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('EMERGENCY_COVER');
  const [customReasonText, setCustomReasonText] = useState('');

  const currentLine = productionLines.find(l => l.id === selectedLineId) || productionLines[0];

  if (!currentLine) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-premium-sm">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
          <p className="mt-4 text-xs font-bold text-secondary uppercase tracking-wider">Loading Shift Planner...</p>
        </div>
      </div>
    );
  }

  const activeWS = workstations.filter(w => w.lineId === currentLine.id);



  // Auto-allocate handler
  const handleAutoAllocate = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      autoAllocateLine(selectedDate, selectedShiftId, currentLine.id).then(res => {
        setIsOptimizing(false);
        if (res.success) {
          setSuccessCount(res.allocatedCount);
          setShowAutoSuccessModal(true);
        }
      });
    }, 1200);
  };

  // Open manual assign modal
  const handleOpenAssignModal = (wsId: string) => {
    if (role !== 'Production Supervisor' && role !== 'Plant Admin') {
      alert('Access Denied: Only Production Supervisors and Plant Admins can modify allocations.');
      return;
    }
    setAssigningWSId(wsId);
  };

  // Close modal helper
  const handleCloseAssignModal = () => {
    setAssigningWSId(null);
    setOverrideAssocId(null);
    setCustomReasonText('');
  };

  // Direct allocation handler (eligible)
  const handleDirectAssign = async (assocId: string) => {
    if (!assigningWSId) return;

    // OT check
    const consecutiveDays = getConsecutiveWorkDays(assocId, selectedDate);
    if (consecutiveDays >= 5) {
      const confirmOt = window.confirm(`This operator has worked ${consecutiveDays} consecutive days. Assigning them will trigger Overtime. Do you want to proceed?`);
      if (!confirmOt) return;
    }

    const res = await allocateAssociate(selectedDate, selectedShiftId, currentLine.id, assigningWSId, assocId, null);
    if (res.success) {
      handleCloseAssignModal();
    } else {
      alert(res.message);
    }
  };

  // Direct deallocate handler
  const handleDeallocate = (wsId: string, associateId?: string) => {
    if (role !== 'Production Supervisor' && role !== 'Plant Admin') {
      alert('Access Denied: Only Production Supervisors and Plant Admins can modify allocations.');
      return;
    }
    deallocateWorkstation(selectedDate, selectedShiftId, currentLine.id, wsId, associateId);
  };

  // Start override process (ineligible clicked)
  const handleStartOverride = (assocId: string) => {
    setOverrideAssocId(assocId);
  };

  // Confirm override
  const handleConfirmOverride = async () => {
    if (!assigningWSId || !overrideAssocId) return;
    const finalReason = `${overrideReason}: ${customReasonText || 'Supervisor override approved'}`;
    const res = await allocateAssociate(selectedDate, selectedShiftId, currentLine.id, assigningWSId, overrideAssocId, finalReason);
    if (res.success) {
      handleCloseAssignModal();
    } else {
      alert(res.message);
    }
  };

  // Get active workstation specific lists
  const currentWS = workstations.find(w => w.id === assigningWSId);
  const eligibility = assigningWSId ? getEligibilityList(assigningWSId, selectedDate, selectedShiftId) : { eligible: [], ineligible: [] };

  const lineAllocations = allocations.filter(
    a => a.date === selectedDate && a.shiftId === selectedShiftId && a.lineId === currentLine.id
  );
  const allocatedCount = lineAllocations.length;
  const unallocatedCount = Math.max(0, activeWS.length - allocatedCount);
  const totalPoolCount = associates.filter(a => a.status === 'Active').length;

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background select-none animate-fade-in">
      {/* Top Tabs */}
      <div className="flex items-center gap-4 px-md pt-md pb-0 border-b border-outline-variant bg-surface shrink-0">
        <button 
          onClick={() => setPlannerTab('allocation')}
          className={`pb-2 px-2 text-[10px] font-label-caps font-bold uppercase tracking-wider transition-colors border-b-2 ${plannerTab === 'allocation' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface cursor-pointer'}`}
        >
          Shift Allocation
        </button>
        <button 
          onClick={() => setPlannerTab('availability')}
          className={`pb-2 px-2 text-[10px] font-label-caps font-bold uppercase tracking-wider transition-colors border-b-2 ${plannerTab === 'availability' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface cursor-pointer'}`}
        >
          Availability & Attendance
        </button>
        <button 
          onClick={() => setPlannerTab('engine')}
          className={`pb-2 px-2 text-[10px] font-label-caps font-bold uppercase tracking-wider transition-colors border-b-2 ${plannerTab === 'engine' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface cursor-pointer'}`}
        >
          AI Run Panel
        </button>
      </div>

      {plannerTab === 'availability' ? (
        <AvailabilityTab />
      ) : plannerTab === 'engine' ? (
        <AiPanelTab />
      ) : (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/20 select-text p-6 lg:p-8 relative animate-fade-in">
        
        {/* Publish Shift Toast Alert */}
        {showPublishToast && (
          <div className="fixed top-20 right-8 bg-[#091426] text-white border border-slate-700 p-4 rounded-xl shadow-premium-lg z-50 flex items-center gap-3 animate-slide-up text-xs font-bold animate-fade-in">
            <span className="material-symbols-outlined text-emerald-500 font-bold">check_circle</span>
            <span>Shift schedule published to live roster and active plant database!</span>
          </div>
        )}

        {/* PAGE HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-6 select-none relative">
          <div>
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-sm font-bold">precision_manufacturing</span>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Line {currentLine.name}</span>
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] mt-1">Shift Planning</h2>
            <p className="text-[11px] text-secondary mt-0.5 font-mono">
              {shifts.find(s => s.id === selectedShiftId)?.name} ({shifts.find(s => s.id === selectedShiftId)?.timings}) • {
                new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Filter Trigger Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilterPopover(!showFilterPopover)}
                className={`py-2 px-4 border border-outline-variant rounded-lg font-bold text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5 transition-all shadow-premium-sm cursor-pointer ${
                  showFilterPopover ? 'bg-slate-100 text-primary' : 'bg-white text-secondary hover:text-primary hover:bg-slate-55'
                }`}
              >
                <span className="material-symbols-outlined text-sm">filter_alt</span>
                <span>Filter</span>
              </button>

              {/* Collapsible Filter Popover Card */}
              {showFilterPopover && (
                <div className="absolute right-0 top-11 mt-2 w-80 bg-white border border-outline-variant rounded-xl p-5 shadow-premium-lg z-50 flex flex-col gap-4 animate-slide-up select-none">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-[10px] font-mono tracking-wider text-[#0F172A] uppercase">Planner Context</h4>
                    <button onClick={() => setShowFilterPopover(false)} className="text-secondary hover:text-primary font-bold text-xs">×</button>
                  </div>
                  
                  <div className="flex flex-col gap-3 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-secondary text-[9px] uppercase font-mono">Production Line</label>
                      <select
                        value={selectedLineId}
                        onChange={(e) => setSelectedLineId(e.target.value)}
                        className="py-1.5 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-[10px] cursor-pointer"
                      >
                        {productionLines.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-secondary text-[9px] uppercase font-mono">Active Shift</label>
                      <select
                        value={selectedShiftId}
                        onChange={(e) => setSelectedShiftId(e.target.value)}
                        className="py-1.5 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-[10px] cursor-pointer"
                      >
                        {shifts.map(shift => (
                          <option key={shift.id} value={shift.id}>{shift.name} ({shift.timings})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-secondary text-[9px] uppercase font-mono">Production Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="py-1.5 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-[10px]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFilterPopover(false);
                        handleAutoAllocate();
                      }}
                      disabled={isOptimizing || currentLine.status !== 'ACTIVE'}
                      className="w-full py-2 bg-primary text-white text-[9px] font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer uppercase shadow-premium-sm disabled:opacity-50"
                    >
                      {isOptimizing && <span className="material-symbols-outlined text-xs animate-spin">sync</span>}
                      <span>{isOptimizing ? 'Running Engine...' : 'Run AI Allocation'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFilterPopover(false);
                        if (window.confirm('Clear all assignments for this shift and date?')) {
                          clearLineAllocations(selectedDate, selectedShiftId, currentLine.id);
                        }
                      }}
                      disabled={currentLine.status !== 'ACTIVE'}
                      className="w-full py-2 border border-rose-600 text-rose-600 bg-white text-[9px] font-bold rounded-lg hover:bg-rose-50 transition-all flex items-center justify-center gap-1 cursor-pointer uppercase"
                    >
                      Clear Allocations
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPublishToast(true);
                setTimeout(() => setShowPublishToast(false), 3000);
              }}
              className="py-2 px-4 bg-[#091426] text-white font-bold rounded-lg hover:bg-slate-900 transition-all flex items-center gap-1.5 shadow-premium-md cursor-pointer text-[10px] uppercase font-mono tracking-wider"
            >
              <span className="material-symbols-outlined text-sm font-bold">publish</span>
              <span>Publish Shift</span>
            </button>
          </div>
        </header>

        {/* SUMMARY METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6 select-none font-mono">
          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
            <div>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Total Machines</p>
              <h3 className="text-xl font-bold text-[#0F172A] mt-1">{String(activeWS.length).padStart(2, '0')}</h3>
              <span className="text-[8px] text-secondary font-medium mt-1.5 inline-block">Active on {currentLine.name}</span>
            </div>
            <span className="material-symbols-outlined text-secondary text-[22px]">precision_manufacturing</span>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
            <div>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Unallocated</p>
              <h3 className="text-xl font-bold text-rose-600 mt-1">{String(unallocatedCount).padStart(2, '0')}</h3>
              <span className="text-[8px] text-rose-600 font-medium mt-1.5 inline-block animate-pulse">Requires attention</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="material-symbols-outlined text-rose-600 text-[20px] font-bold">warning</span>
            </div>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
            <div>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Efficiency</p>
              <h3 className="text-xl font-bold text-[#0F172A] mt-1">94.2%</h3>
              <span className="text-[8px] text-emerald-600 font-bold mt-1.5 inline-block">▲ +2.4% from last shift</span>
            </div>
            <span className="material-symbols-outlined text-secondary text-[22px]">trending_up</span>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
            <div>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Associates</p>
              <h3 className="text-xl font-bold text-[#0F172A] mt-1">{allocatedCount}/{totalPoolCount}</h3>
              <span className="text-[8px] text-secondary font-medium mt-1.5 inline-block">On-site today</span>
            </div>
            <span className="material-symbols-outlined text-secondary text-[22px]">group</span>
          </div>
        </div>

        {/* WORKSTATION ALLOCATION LIST HEADING */}
        <div className="flex justify-between items-center mb-4 shrink-0 select-none">
          <h3 className="text-xs font-bold text-[#0f172a] uppercase font-mono tracking-wider">Workstation Allocation</h3>
          <div className="flex items-center gap-3 text-[10px] font-bold font-mono text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span>Unallocated ({unallocatedCount})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#14b8a6]"></span>
              <span>Allocated ({allocatedCount})</span>
            </span>
          </div>
        </div>

        {/* WORKSTATIONS GRID CANVAS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
          {activeWS.length === 0 ? (
            <div className="bg-white border border-outline-variant rounded-xl p-12 flex flex-col items-center justify-center text-center gap-3 shadow-premium-sm animate-fade-in">
              <span className="material-symbols-outlined text-3xl text-amber-500 animate-pulse">construction</span>
              <h4 className="font-bold text-xs text-[#0f172a] uppercase font-mono tracking-wider">No Workstations Configured</h4>
              <p className="text-[10px] text-secondary mt-1">Configure machines and operations for this line in Master Data.</p>
              <button
                type="button"
                onClick={() => setActiveTab('master_data')}
                className="mt-2 py-1.5 px-4 bg-primary text-white font-bold rounded-lg text-[10px] font-mono tracking-wider uppercase hover:bg-slate-800 transition-all cursor-pointer shadow-premium-sm"
              >
                Configure Workstations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {activeWS.map(ws => {
                const assigned = lineAllocations.find(a => a.workstationId === ws.id);
                const assoc = assigned ? associates.find(a => a.id === assigned.associateId) : null;
                const isHalted = currentLine.status === 'HALTED';
                const isCritical = !isHalted && !assoc;

                // Profile picture matching Unsplash premium style
                const getAvatarUrl = (name: string) => {
                  if (name.includes("Marcus")) {
                    return "https://lh3.googleusercontent.com/aida-public/AB6AXuDfI-JZyjb1pQwgoRAtI8MGXNX2TkA8IMEQGilu9TafNco6H0681KiHavWtbDCOinqxPmMVNW7cH2PGWBix5r5qN2C9dtJepLRZ5jQe-w5EM4EAd4HpvXjXE2ZjUfZ8L0JYCnIpFNelIEATQDAcZpx-hcSk2br-2DUV4G-gnc11DusyAddAz185_iYFO8pJdibyEO4J1XRizRZ5LQl04mYp3jucUv_Ldv1I8ajvM3NZ3OargpKyQvu6reWcSh6mOS_F6lv4y82etqE";
                  }
                  if (name.includes("Sarah")) {
                    return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80";
                  }
                  if (name.includes("David") || name.includes("Chen")) {
                    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80";
                  }
                  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=091426&color=fff`;
                };

                return (
                  <div
                    key={ws.id}
                    className={`bg-white border rounded-xl overflow-hidden shadow-premium-sm transition-all hover:shadow-premium-md flex flex-col justify-between ${
                      isCritical ? 'border-rose-150' : 'border-outline-variant hover:border-slate-350'
                    }`}
                  >
                    {/* Header */}
                    <div className={`p-4 border-b border-outline-variant flex justify-between items-start ${
                      isCritical ? 'bg-rose-50/20' : 'bg-slate-50/40'
                    }`}>
                      <div>
                        <h4 className="font-bold text-xs text-[#0F172A] tracking-tight">{ws.name}</h4>
                        <p className="text-[9px] font-mono text-secondary mt-0.5 uppercase tracking-wider">Asset ID: {ws.id}</p>
                      </div>
                      {isCritical ? (
                        <span className="material-symbols-outlined text-rose-600 text-[18px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                      ) : (
                        <span className="material-symbols-outlined text-emerald-600 text-[18px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col items-center justify-center gap-2 flex-grow min-h-[90px]">
                      <span className="text-[8px] font-bold text-secondary uppercase font-mono tracking-widest select-none font-label-caps">Required Skill</span>
                      <span className="bg-slate-100 border border-slate-200 text-secondary font-mono text-[9px] font-bold px-3 py-1 rounded tracking-wider uppercase select-none">
                        Required Skill: {ws.minSkillLevel}
                      </span>
                    </div>

                    {/* Footer */}
                    {isCritical ? (
                      <div className="bg-rose-700 text-white px-4 py-3 flex justify-between items-center select-none shrink-0 border-t border-rose-100">
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">error</span>
                          <span>UNALLOCATED</span>
                        </span>
                        {(role === 'Production Supervisor' || role === 'Plant Admin') ? (
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(ws.id)}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded text-[8px] font-bold flex items-center gap-1 transition-all uppercase tracking-wider cursor-pointer"
                          >
                            <span>Assign</span>
                          </button>
                        ) : (
                          <span className="text-[8px] italic opacity-75">Read-Only</span>
                        )}
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          if (assigned && (role === 'Production Supervisor' || role === 'Plant Admin')) {
                            if (window.confirm(`Deallocate ${assoc?.name} from ${ws.name}?`)) {
                              handleDeallocate(ws.id, assoc?.id);
                            }
                          }
                        }}
                        className="bg-[#0B2C1A] text-white px-4 py-3 flex justify-between items-center select-none shrink-0 border-t border-emerald-900/40 cursor-pointer group hover:bg-rose-800 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 group-hover:hidden">
                          <img
                            alt={assoc?.name}
                            className="w-5 h-5 rounded-full object-cover border border-emerald-500/20 shrink-0 shadow-premium-sm"
                            src={getAvatarUrl(assoc?.name || '')}
                          />
                          <div className="flex flex-col min-w-0 leading-tight">
                            <span className="text-[7px] text-emerald-400 font-bold uppercase font-mono tracking-widest leading-none">ALLOCATED TO</span>
                            <span className="text-[10px] font-bold text-white truncate max-w-[110px] mt-0.5">{assoc?.name}</span>
                          </div>
                        </div>

                        <span className="text-[8px] font-bold text-emerald-400 uppercase font-mono tracking-widest flex items-center gap-1 shrink-0 group-hover:hidden">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Active</span>
                        </span>

                        {/* Hover Deallocate Action text */}
                        <div className="hidden group-hover:flex items-center justify-center gap-1.5 w-full text-center text-[9px] font-bold uppercase tracking-wider text-white">
                          <span className="material-symbols-outlined text-xs">person_remove</span>
                          <span>Deallocate Operator</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
      )}

      {/* Auto-Allocation Success Modal */}
      {showAutoSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-96 p-5.5 rounded-xl shadow-2xl flex flex-col items-center text-center gap-4 border border-outline-variant animate-slide-up">
            <div className="w-12 h-12 bg-tertiary-fixed-dim/20 border border-outline-variant text-emerald-600 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-primary uppercase tracking-wider font-label-caps">Allocation Synced</h3>
              <p className="text-xs text-secondary mt-2 px-1 leading-relaxed">
                Roster optimized successfully! **{successCount} workstations** staffed on {currentLine.name} in compliance with skill requirements.
              </p>
            </div>
            <button
              className="w-full py-2 bg-primary hover:bg-slate-800 text-white font-bold rounded-lg text-[9px] font-label-caps tracking-wider transition-all cursor-pointer"
              onClick={() => setShowAutoSuccessModal(false)}
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Manual Allocation Drawer/Modal */}
      {assigningWSId && currentWS && (
        <div className="fixed inset-0 bg-black/50 z-45 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-[480px] max-w-full min-h-[400px] max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant animate-slide-up">
            {/* Modal Header */}
            <div className="p-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xs text-primary uppercase tracking-wider font-label-caps">Staff Workstation</h3>
                <p className="text-[10px] text-secondary font-bold mt-1 font-mono uppercase leading-tight">
                  {currentWS.id} : {currentWS.name} <br/>
                  <span className="text-secondary font-mono tracking-normal lowercase">(requires {currentWS.requiredSkillId} &gt;= {currentWS.minSkillLevel})</span>
                </p>
                {(() => {
                  const wsCapacity = currentWS.maxStaffCount || 1;
                  const wsCurrentCount = allocations.filter(a => a.date === selectedDate && a.shiftId === selectedShiftId && a.workstationId === currentWS.id).length;
                  const slotsLeft = wsCapacity - wsCurrentCount;
                  return (
                    <span className={`mt-1.5 inline-flex items-center gap-1 text-[8.5px] font-bold font-mono px-1.5 py-0.5 rounded border ${slotsLeft > 0 ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant border-outline-variant' : 'bg-secondary-container text-on-secondary-container border-outline-variant'}`}>
                      <span className="material-symbols-outlined text-[10px]">group</span>
                      {wsCurrentCount}/{wsCapacity} staffed • {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} open` : 'At capacity — swap only'}
                    </span>
                  );
                })()}
              </div>
              <button 
                onClick={handleCloseAssignModal}
                className="p-1 hover:bg-surface-container-high rounded text-secondary transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
              
              {/* Eligible list */}
              <div>
                <h4 className="text-[8.5px] font-label-caps text-emerald-800 bg-tertiary-fixed-dim/20 px-2.5 py-1 rounded font-bold tracking-wider mb-2 border border-outline-variant flex justify-between items-center">
                  <span>Eligible Operators</span>
                  <span className="font-mono text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded">{eligibility.eligible.length}</span>
                </h4>
                {eligibility.eligible.length === 0 ? (
                  <div className="text-xs text-secondary/70 italic p-4 text-center border border-dashed border-outline-variant rounded-lg">
                    No compliant operators available. Override below if necessary.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {eligibility.eligible.map(({ associate, skillLevel, score }) => {
                      const consecutiveDays = getConsecutiveWorkDays(associate.id, selectedDate);
                      return (
                        <button
                          key={associate.id}
                          onClick={() => handleDirectAssign(associate.id)}
                          className="w-full p-3 bg-surface-container-lowest hover:bg-tertiary-fixed-dim/20/20 hover:border-emerald-300 border border-outline-variant rounded-lg flex justify-between items-center text-xs transition-all text-left cursor-pointer shadow-sm"
                        >
                          <div>
                            <div className="font-bold text-on-surface flex items-center gap-1.5">
                              {associate.name}
                              {consecutiveDays >= 5 && (
                                <span className="inline-flex items-center bg-amber-500 text-white text-[8px] px-1.5 py-0.2 rounded font-bold font-mono" title={`Worked ${consecutiveDays} consecutive days`}>
                                  ⚠️ OT ({consecutiveDays}d)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-secondary font-mono mt-0.5">
                              {associate.id} • {associate.category} • Has: <span className="font-bold text-on-tertiary-fixed-variant">{skillLevel}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono border border-outline-variant/50">
                              SCORE: {score}
                            </span>
                            <span className="material-symbols-outlined text-emerald-600 text-sm">chevron_right</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ineligible List */}
              <div>
                <h4 className="text-[8.5px] font-label-caps text-red-800 bg-error-container px-2.5 py-1 rounded font-bold tracking-wider mb-2 border border-outline-variant flex justify-between items-center">
                  <span>Requires Override</span>
                  <span className="font-mono text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.2 rounded">{eligibility.ineligible.length}</span>
                </h4>
                <div className="flex flex-col gap-2">
                  {eligibility.ineligible.map(({ associate, reason }) => (
                    <button
                      key={associate.id}
                      onClick={() => handleStartOverride(associate.id)}
                      className="w-full p-3 bg-surface-container-lowest hover:bg-secondary-container/40 hover:border-amber-300 border border-outline-variant rounded-lg flex justify-between items-center text-xs transition-all text-left cursor-pointer shadow-sm"
                    >
                      <div>
                        <div className="font-bold text-on-surface">{associate.name}</div>
                        <div className="text-[10px] text-[#475569] font-mono mt-0.5">{associate.id} • {associate.category}</div>
                      </div>
                      <div className="flex items-center gap-1.5 text-right">
                        <span className="text-[8px] bg-error-container text-on-error-container border border-outline-variant font-medium px-2 py-0.5 rounded leading-normal">
                          {reason}
                        </span>
                        <span className="material-symbols-outlined text-amber-500 text-sm">warning</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Override Confirmation Panel */}
            {overrideAssocId && (
              <div className="p-4 bg-surface-container-low border-t border-outline-variant flex flex-col gap-3">
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg flex gap-2 items-start">
                  <span className="material-symbols-outlined text-[#D97706] text-lg shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <div>
                    <h4 className="text-xs font-bold text-[#92400E] leading-tight">Compliance Override Triggered</h4>
                    <p className="text-[10px] text-[#B45309] mt-0.5">
                      Allocating <strong className="font-bold">{associates.find(a => a.id === overrideAssocId)?.name}</strong> requires supervisor justification. This action will be audited.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[8.5px] font-bold text-primary block mb-1 font-label-caps uppercase tracking-wider">Reason Code</label>
                    <select
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-primary text-on-surface"
                    >
                      <option value="EMERGENCY_COVER">Emergency Labor Shortage</option>
                      <option value="SUPERVISOR_APPROVED">Supervised Training Session</option>
                      <option value="TRAINING_UNDERSTUDY">Critical Production Deadline</option>
                      <option value="MAINTENANCE_SHORTAGE">Interim Skill Certification</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8.5px] font-bold text-primary block mb-1 font-label-caps uppercase tracking-wider">Justification</label>
                    <input
                      type="text"
                      placeholder="Supervisor notes..."
                      value={customReasonText}
                      onChange={(e) => setCustomReasonText(e.target.value)}
                      className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-[10px] focus:ring-2 focus:ring-primary text-on-surface"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-1.5">
                  <button
                    onClick={() => setOverrideAssocId(null)}
                    className="px-3 py-1 text-xs font-bold text-secondary hover:text-primary hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmOverride}
                    disabled={!customReasonText.trim()}
                    className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] active:bg-[#92400E] text-white rounded-lg font-bold text-[9px] font-label-caps tracking-wider disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    CONFIRM OVERRIDE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
