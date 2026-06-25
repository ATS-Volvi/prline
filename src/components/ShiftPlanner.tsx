import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

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
    updateWorkstation,
    role
  } = useApp();

  // Active filters state
  const [selectedDate, setSelectedDate] = useState('2026-06-25');
  const [selectedShiftId, setSelectedShiftId] = useState('SHIFT-A');

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
  const activeWS = workstations.filter(w => w.lineId === currentLine.id);

  // Stats calculation for active line
  const lineAllocations = allocations.filter(a => a.date === selectedDate && a.shiftId === selectedShiftId && a.lineId === currentLine.id);
  const totalCapacity = activeWS.reduce((acc, ws) => acc + (ws.maxStaffCount || 1), 0);
  const staffedCount = lineAllocations.length;
  const openCount = Math.max(0, totalCapacity - staffedCount);
  const lineUtilization = totalCapacity ? Math.round((staffedCount / totalCapacity) * 100) : 0;

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

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background select-none animate-fade-in">
      {/* TopAppBar */}
      <header className="flex justify-between items-center px-margin-desktop h-16 w-full border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-headline-md font-bold">group_add</span>
          <h1 className="font-headline-md text-base font-bold text-primary">Shift Allocation</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold font-mono shadow-premium-sm text-secondary">
            <span className="material-symbols-outlined text-xs">calendar_today</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold font-mono text-on-surface focus:outline-none cursor-pointer p-0"
            />
          </div>
        </div>
      </header>

      {/* Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Control Sidebar */}
        <section className="w-72 h-full border-r border-slate-200 bg-slate-50 p-4.5 flex flex-col gap-4.5 custom-scrollbar overflow-y-auto shrink-0 select-none">
          {/* Shift Selection Box */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-premium-sm">
            <h2 className="font-label-caps text-[9px] text-[#182c47] border-b border-slate-100 pb-2 mb-3.5 tracking-wider font-bold">SHIFT SELECTION</h2>
            <div className="space-y-2">
              {shifts.map(shift => {
                const isActive = selectedShiftId === shift.id;
                return (
                  <button
                    key={shift.id}
                    onClick={() => setSelectedShiftId(shift.id)}
                    className={`w-full flex items-center justify-between p-3 border cursor-pointer transition-all duration-150 rounded-xl ${
                      isActive
                        ? 'border-2 border-[#182c47] bg-[#e2eafc]/50 text-[#182c47] font-bold shadow-premium-sm'
                        : 'border-slate-200 bg-white text-on-surface hover:border-slate-350'
                    }`}
                  >
                    <div className="flex flex-col items-start text-left">
                      <p className="text-xs font-bold leading-none">{shift.name}</p>
                      <p className="font-data-mono-md text-[9px] text-secondary mt-1">{shift.timings}</p>
                    </div>
                    <span className="material-symbols-outlined text-primary text-base">
                      {isActive ? 'check_circle' : 'circle'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Production Line Box */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-premium-sm">
            <h2 className="font-label-caps text-[9px] text-[#182c47] border-b border-slate-100 pb-2 mb-3.5 tracking-wider font-bold">PRODUCTION LINE</h2>
            <div className="relative mb-3">
              <select
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="w-full h-9 border border-slate-200 bg-white px-3 text-[10px] font-bold text-on-surface focus:border-primary focus:ring-0 appearance-none rounded-lg cursor-pointer shadow-premium-sm"
              >
                {productionLines.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-secondary text-sm" style={{ fontVariationSettings: "'wght' 600" }}>expand_more</span>
            </div>

            {/* Current Utilization Progress Meter */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between items-end mb-1 text-xs">
                <span className="font-label-caps text-[8px] text-secondary uppercase font-bold tracking-wider">Line Staffing</span>
                <span className="font-data-mono-md font-bold text-[10px]">{lineUtilization}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 w-full rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#182c47] rounded-full transition-all duration-300" 
                  style={{ width: `${lineUtilization}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action Trigger Block */}
          <div className="mt-auto flex flex-col gap-2.5">
            {(role === 'Production Supervisor' || role === 'Plant Admin') ? (
              <>
                <button
                  onClick={handleAutoAllocate}
                  disabled={isOptimizing || currentLine.status !== 'ACTIVE'}
                  className="w-full bg-[#182c47] hover:bg-[#293e5d] text-white h-11 flex items-center justify-center gap-2 transition-all font-label-caps text-[10px] tracking-wider rounded-lg font-bold cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-premium-sm"
                >
                  <span className={`material-symbols-outlined text-sm ${isOptimizing ? 'animate-spin' : ''}`}>
                    {isOptimizing ? 'sync' : 'bolt'}
                  </span>
                  {isOptimizing ? 'OPTIMIZING...' : 'AUTO-ALLOCATE RESOURCES'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all allocations for this line and shift?')) {
                      clearLineAllocations(selectedDate, selectedShiftId, currentLine.id);
                    }
                  }}
                  disabled={currentLine.status !== 'ACTIVE'}
                  className="w-full h-9 border border-slate-200 hover:bg-slate-50 text-on-surface rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-premium-sm"
                >
                  Clear Staffing
                </button>
              </>
            ) : (
              <div className="text-center p-3 bg-slate-100 rounded-xl text-[9px] text-secondary font-bold uppercase font-label-caps tracking-wider border border-slate-200/30">
                Read-only: {role}
              </div>
            )}
            <p className="text-[8px] text-center text-secondary/60 font-mono italic">Optimization based on Skill Matrix v4.2</p>
          </div>
        </section>

        {/* Right Workstation grid */}
        <section className="flex-1 h-full bg-slate-50/40 p-margin-desktop custom-scrollbar overflow-y-auto select-none animate-fade-in">
          {/* Grid Header Info */}
          <div className="mb-4.5 flex justify-between items-end">
            <div>
              <h2 className="font-headline-md text-xs font-bold text-on-surface tracking-tight uppercase">{currentLine.name} Workstations</h2>
              <p className="text-secondary text-[10px] font-semibold mt-0.5 font-mono">Roster: {selectedDate} • shift: {selectedShiftId.replace('SHIFT-', '')}</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded text-[9px] font-bold shadow-premium-sm">
                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                <span className="font-data-mono-md uppercase">{staffedCount} STAFFED</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-100 text-red-800 rounded text-[9px] font-bold shadow-premium-sm">
                <div className="w-1 h-1 rounded-full bg-red-500"></div>
                <span className="font-data-mono-md uppercase">{openCount} OPEN</span>
              </div>
            </div>
          </div>

          {/* Grid Content */}
          {activeWS.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-secondary gap-2 shadow-premium-sm">
              <span className="material-symbols-outlined text-2xl text-error">report</span>
              <span className="text-xs font-bold uppercase font-label-caps">No workstations configured.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {activeWS.map(ws => {
                const capacity = ws.maxStaffCount || 1;
                const assignedAllocations = allocations.filter(
                  a => a.date === selectedDate && a.shiftId === selectedShiftId && a.workstationId === ws.id
                );
                const isHalted = currentLine.status === 'HALTED';

                let tagColorClass = 'bg-slate-50 text-secondary border-slate-200/40';
                let tagLabel = 'IDLE';

                if (isHalted) {
                  tagColorClass = 'bg-red-50 text-red-700 border-red-100 font-bold';
                  tagLabel = 'HALTED';
                } else if (assignedAllocations.length > 0) {
                  const hasOverride = assignedAllocations.some(a => a.overrideReasonCode);
                  if (assignedAllocations.length >= capacity) {
                    tagColorClass = hasOverride
                      ? 'bg-amber-100 text-amber-800 border border-amber-200 font-bold'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold';
                    tagLabel = 'STAFFED';
                  } else {
                    tagColorClass = 'bg-blue-50 text-blue-700 border border-blue-100 font-bold';
                    tagLabel = 'PARTIAL';
                  }
                } else {
                  tagColorClass = 'bg-red-50 text-red-700 border border-red-100 font-bold';
                  tagLabel = 'VACANT';
                }

                return (
                  <div
                    key={ws.id}
                    className={`bg-white border border-slate-200 p-4.5 rounded-xl relative flex flex-col min-h-[190px] shadow-premium-sm transition-all duration-200 hover:shadow-premium-md group ${
                      isHalted ? 'opacity-70 grayscale-[0.3]' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="px-2 py-0.5 bg-slate-50 text-primary font-mono text-[9px] font-bold rounded border border-slate-200/40 shadow-premium-sm">{ws.id}</span>
                      <div className="flex items-center gap-1.5">
                        {/* Inline capacity controls */}
                        {(role === 'Production Supervisor' || role === 'Plant Admin') && (
                          <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shadow-premium-sm">
                            <button
                              title="Decrease capacity"
                              onClick={() => updateWorkstation({ ...ws, maxStaffCount: Math.max(1, capacity - 1) })}
                              disabled={capacity <= 1}
                              className="w-5 h-5 flex items-center justify-center text-secondary hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-[11px] font-bold"
                            >−</button>
                            <span className="px-1.5 text-[9px] font-bold font-mono text-primary">{capacity}</span>
                            <button
                              title="Increase capacity"
                              onClick={() => updateWorkstation({ ...ws, maxStaffCount: Math.min(10, capacity + 1) })}
                              disabled={capacity >= 10}
                              className="w-5 h-5 flex items-center justify-center text-secondary hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-[11px] font-bold"
                            >+</button>
                          </div>
                        )}
                        <span className={`font-label-caps text-[8px] px-2 py-0.5 uppercase rounded border shadow-premium-sm ${tagColorClass}`}>
                          {tagLabel}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-headline-md font-bold text-xs mb-2 text-on-surface leading-tight">{ws.name}</h3>

                    <div className="mt-auto space-y-3">
                      
                      {/* Requirements */}
                      <div className="space-y-1 bg-slate-50/70 p-2 rounded-lg border border-slate-200/30">
                        <p className="font-label-caps text-[8px] text-secondary font-bold tracking-wider">REQUIRED COMPLIANCE</p>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9.5px] font-bold font-data-mono-md text-[#182c47]">
                            {ws.requiredSkillId}
                          </span>
                          <span className="text-[9.5px] text-secondary font-mono">
                            (&gt;= {ws.minSkillLevel})
                          </span>
                        </div>
                      </div>

                      {/* Staffed Details or Assign Button */}
                      <div className="border-t border-slate-200 pt-3 mt-auto space-y-3">
                        {assignedAllocations.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {assignedAllocations.map(alloc => {
                              const assocDetails = associates.find(a => a.id === alloc.associateId);
                              if (!assocDetails) return null;
                              return (
                                <div key={alloc.id} className="flex justify-between items-center gap-2 p-1.5 bg-slate-50/40 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] uppercase text-[#182c47] font-mono shrink-0 shadow-premium-sm">
                                      {assocDetails.name.substring(0, 2)}
                                    </div>
                                    <div className="overflow-hidden">
                                      <div className="text-[11px] font-bold text-on-surface truncate leading-tight">
                                        {assocDetails.name}
                                        {alloc.overrideReasonCode && (
                                          <span className="ml-1 text-[8px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold font-mono" title={alloc.overrideReasonCode}>OVERRIDE</span>
                                        )}
                                      </div>
                                      <div className="text-[8.5px] text-secondary font-mono truncate">
                                        {assocDetails.id} • {assocDetails.category}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {(role === 'Production Supervisor' || role === 'Plant Admin') && (
                                    <button
                                      onClick={() => handleDeallocate(ws.id, assocDetails.id)}
                                      className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors cursor-pointer flex items-center justify-center shrink-0"
                                      title="Deallocate Operator"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {assignedAllocations.length < capacity ? (
                          <div className="flex flex-col gap-1.5">
                            {assignedAllocations.length === 0 && (
                              <div className="flex justify-between text-[9px] items-center mb-0.5">
                                <span className="text-secondary font-medium">Allocation Status</span>
                                <span className="font-data-mono-md font-bold text-red-500 bg-red-50 px-1.5 py-0.2 rounded border border-red-100">Vacant</span>
                              </div>
                            )}
                            {(role === 'Production Supervisor' || role === 'Plant Admin') ? (
                              <button
                                onClick={() => handleOpenAssignModal(ws.id)}
                                disabled={isHalted}
                                className="w-full py-1.5 border border-primary text-primary font-bold text-[8px] hover:bg-primary hover:text-white transition-all font-label-caps flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-premium-sm"
                              >
                                <span className="material-symbols-outlined text-sm">person_add</span>
                                ASSIGN OPERATOR
                              </button>
                            ) : (
                              <span className="text-xs text-secondary italic font-medium">Unassigned Slot</span>
                            )}
                          </div>
                        ) : (
                          (role === 'Production Supervisor' || role === 'Plant Admin') ? (
                            <button
                              onClick={() => handleOpenAssignModal(ws.id)}
                              disabled={isHalted}
                              className="w-full py-1.5 border border-dashed border-slate-355 text-secondary font-bold text-[8px] hover:border-primary hover:text-primary transition-all font-label-caps flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none rounded-lg"
                            >
                              <span className="material-symbols-outlined text-sm">sync</span>
                              ADD / MANAGE STAFF
                            </button>
                          ) : (
                            <div className="text-[10px] text-center text-secondary font-medium italic">Fully Staffed</div>
                          )
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}

              {/* Configure Station Shortcut Card */}
              {(role === 'Production Supervisor' || role === 'Plant Admin') && (
                <div 
                  onClick={() => {
                    localStorage.setItem('master_data_sub_tab', 'workstations');
                    setActiveTab('master_data');
                  }}
                  className="border border-dashed border-slate-350 rounded-xl flex flex-col items-center justify-center min-h-[190px] bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-premium-sm group"
                >
                  <div className="w-9 h-9 rounded-lg border border-dashed border-slate-350 flex items-center justify-center group-hover:border-primary transition-colors bg-slate-50/80 group-hover:bg-slate-100 shadow-premium-sm">
                    <span className="material-symbols-outlined text-secondary group-hover:text-primary text-base">add</span>
                  </div>
                  <p className="mt-2.5 font-label-caps text-[8px] text-secondary font-bold group-hover:text-primary tracking-wider">CONFIGURE STATION</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Auto-Allocation Success Modal */}
      {showAutoSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center opacity-100 pointer-events-auto p-4">
          <div className="bg-white w-96 p-5.5 rounded-xl shadow-2xl flex flex-col items-center text-center gap-4 border border-slate-200/50 animate-slide-up">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-premium-sm">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-primary uppercase tracking-wider font-label-caps">Allocation Synced</h3>
              <p className="text-xs text-secondary mt-2 px-1 leading-relaxed">
                Roster optimized successfully! **{successCount} workstations** staffed on {currentLine.name} in compliance with skill requirements.
              </p>
            </div>
            <button
              className="w-full py-2 bg-primary hover:bg-slate-800 text-white font-bold rounded-lg text-[9px] font-label-caps tracking-wider transition-all cursor-pointer shadow-premium-sm"
              onClick={() => setShowAutoSuccessModal(false)}
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Manual Allocation Drawer/Modal */}
      {assigningWSId && currentWS && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white w-[480px] max-w-full min-h-[400px] max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-slide-up">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
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
                    <span className={`mt-1.5 inline-flex items-center gap-1 text-[8.5px] font-bold font-mono px-1.5 py-0.5 rounded border ${slotsLeft > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      <span className="material-symbols-outlined text-[10px]">group</span>
                      {wsCurrentCount}/{wsCapacity} staffed • {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} open` : 'At capacity — swap only'}
                    </span>
                  );
                })()}
              </div>
              <button 
                onClick={handleCloseAssignModal}
                className="p-1 hover:bg-slate-250 rounded text-secondary transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
              
              {/* Eligible list */}
              <div>
                <h4 className="text-[8.5px] font-label-caps text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded font-bold tracking-wider mb-2 border border-emerald-100 flex justify-between items-center">
                  <span>Eligible Operators</span>
                  <span className="font-mono text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded">{eligibility.eligible.length}</span>
                </h4>
                {eligibility.eligible.length === 0 ? (
                  <div className="text-xs text-secondary/70 italic p-4 text-center border border-dashed border-slate-200 rounded-lg">
                    No compliant operators available. Override below if necessary.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {eligibility.eligible.map(({ associate, skillLevel, score }) => (
                      <button
                        key={associate.id}
                        onClick={() => handleDirectAssign(associate.id)}
                        className="w-full p-3 bg-white hover:bg-emerald-50/20 hover:border-emerald-300 border border-slate-200 rounded-lg flex justify-between items-center text-xs transition-all text-left cursor-pointer shadow-premium-sm"
                      >
                        <div>
                          <div className="font-bold text-on-surface">{associate.name}</div>
                          <div className="text-[10px] text-secondary font-mono mt-0.5">
                            {associate.id} • {associate.category} • Has: <span className="font-bold text-emerald-700">{skillLevel}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono border border-emerald-200/50 shadow-premium-sm">
                            SCORE: {score}
                          </span>
                          <span className="material-symbols-outlined text-emerald-600 text-sm">chevron_right</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ineligible List */}
              <div>
                <h4 className="text-[8.5px] font-label-caps text-red-800 bg-red-50 px-2.5 py-1 rounded font-bold tracking-wider mb-2 border border-red-100 flex justify-between items-center">
                  <span>Requires Override</span>
                  <span className="font-mono text-[9px] font-bold bg-red-650 text-white px-1.5 py-0.2 rounded">{eligibility.ineligible.length}</span>
                </h4>
                <div className="flex flex-col gap-2">
                  {eligibility.ineligible.map(({ associate, reason }) => (
                    <button
                      key={associate.id}
                      onClick={() => handleStartOverride(associate.id)}
                      className="w-full p-3 bg-white hover:bg-amber-50/40 hover:border-amber-300 border border-slate-200 rounded-lg flex justify-between items-center text-xs transition-all text-left cursor-pointer shadow-premium-sm"
                    >
                      <div>
                        <div className="font-bold text-on-surface">{associate.name}</div>
                        <div className="text-[10px] text-[#475569] font-mono mt-0.5">{associate.id} • {associate.category}</div>
                      </div>
                      <div className="flex items-center gap-1.5 text-right">
                        <span className="text-[8px] bg-red-50 text-red-700 border border-red-100 font-medium px-2 py-0.5 rounded leading-normal">
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
              <div className="p-4 bg-amber-50 border-t border-amber-200 flex flex-col gap-3 shadow-inner">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">warning</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 leading-tight">Compliance Override Triggered</h4>
                    <p className="text-[10px] text-amber-800 mt-1">
                      Allocating **{associates.find(a => a.id === overrideAssocId)?.name}** requires supervisor verification.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[8.5px] font-bold text-amber-900 block mb-1 font-label-caps">REASON CODE</label>
                    <select
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full p-1 px-1.5 bg-white border border-amber-300 rounded text-[10px] font-bold focus:outline-none text-on-surface"
                    >
                      <option value="EMERGENCY_COVER">EMERGENCY_COVER - Urgent shift cover</option>
                      <option value="SUPERVISOR_APPROVED">SUPERVISOR_APPROVED - Supervisor present</option>
                      <option value="TRAINING_UNDERSTUDY">TRAINING_UNDERSTUDY - Supervised learning</option>
                      <option value="MAINTENANCE_SHORTAGE">MAINTENANCE_SHORTAGE - Machinery breakdown cover</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8.5px] font-bold text-amber-900 block mb-1 font-label-caps">JUSTIFICATION</label>
                    <input
                      type="text"
                      placeholder="Comment..."
                      value={customReasonText}
                      onChange={(e) => setCustomReasonText(e.target.value)}
                      className="w-full p-1.5 px-2 bg-white border border-amber-300 rounded text-[10px] focus:outline-none text-on-surface"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-1.5">
                  <button
                    onClick={() => setOverrideAssocId(null)}
                    className="px-3 py-1 text-xs font-bold text-amber-850 hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmOverride}
                    disabled={!customReasonText.trim()}
                    className="px-4 py-1.5 bg-amber-600 text-white rounded font-bold text-[9px] font-label-caps tracking-wider hover:bg-amber-700 disabled:opacity-50 cursor-pointer shadow-premium-sm"
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
