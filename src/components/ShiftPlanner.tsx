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
    attendanceRecords,
    markAttendance,
    getConsecutiveWorkDays,
    associateSkills,
    role
  } = useApp();

  // Active filters state
  const [selectedDate, setSelectedDate] = useState('2026-06-25');
  const [selectedShiftId, setSelectedShiftId] = useState('SHIFT-A');
  const [rightTab, setRightTab] = useState<'personnel' | 'attendance'>('personnel');

  // Attendance state
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [personnelSearch, setPersonnelSearch] = useState('');

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
        <div className="text-center p-8 bg-white border border-slate-200 rounded-xl shadow-premium-sm">
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

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background select-none animate-fade-in">
      {/* Workspace Split */}
      <div className="flex-1 flex overflow-hidden p-md gap-md">
        
        {/* Left main content canvas */}
        <div className="flex-1 flex flex-col gap-md overflow-hidden">
          
          {/* Controls Bar (Matching code.html mockup look) */}
          <section className="bg-surface p-sm border border-outline flex items-center justify-between gap-md rounded-lg shadow-sm shrink-0">
            <div className="flex items-center gap-lg">
              <div className="flex flex-col">
                <label className="font-label-caps text-[10px] text-secondary mb-1 uppercase tracking-wider">Production Line</label>
                <select
                  value={selectedLineId}
                  onChange={(e) => setSelectedLineId(e.target.value)}
                  className="bg-surface-dim border-outline text-on-surface font-body-lg text-xs font-bold rounded-lg focus:ring-primary focus:border-primary py-1 pr-8"
                >
                  {productionLines.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="font-label-caps text-[10px] text-secondary mb-1 uppercase tracking-wider">Active Shift</label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="bg-surface-dim border-outline text-on-surface font-body-lg text-xs font-bold rounded-lg focus:ring-primary focus:border-primary py-1 pr-8"
                >
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>{shift.name} ({shift.timings})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="font-label-caps text-[10px] text-secondary mb-1 uppercase tracking-wider">Production Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-surface-dim border-outline text-on-surface font-body-lg text-xs font-bold rounded-lg focus:ring-primary focus:border-primary py-1 px-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-sm">
              <button
                onClick={() => {
                  setActiveTab('shift_planner');
                  if (window.confirm('Are you sure you want to clear all allocations for this line and shift?')) {
                    clearLineAllocations(selectedDate, selectedShiftId, currentLine.id);
                  }
                }}
                disabled={currentLine.status !== 'ACTIVE'}
                className="bg-surface border border-primary text-primary px-4 py-1.5 font-label-caps text-[10px] font-bold rounded-lg hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Save Configuration
              </button>
              <button
                onClick={handleAutoAllocate}
                disabled={isOptimizing || currentLine.status !== 'ACTIVE'}
                className="bg-primary text-white px-5 py-1.5 font-label-caps text-[10px] font-bold rounded-lg hover:opacity-90 transition-all active:scale-95 shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isOptimizing && <span className="material-symbols-outlined text-xs animate-spin">sync</span>}
                {isOptimizing ? 'Allocating...' : 'Auto-Allocate Staff'}
              </button>
            </div>
          </section>

          {/* Grid Layout (Matching Mockup look: bold stage numbers, outline-variant containers, and thick black left borders) */}
          <section className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {activeWS.length === 0 ? (
              <div className="bg-white border border-dashed border-outline rounded-lg p-12 flex flex-col items-center justify-center text-secondary gap-2">
                <span className="material-symbols-outlined text-2xl text-error">report</span>
                <span className="text-xs font-bold uppercase font-label-caps">No workstations configured.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md pb-md">
                {activeWS.map((ws, index) => {
                  const capacity = ws.maxStaffCount || 1;
                  const assignedAllocations = allocations.filter(
                    a => a.date === selectedDate && a.shiftId === selectedShiftId && a.workstationId === ws.id
                  );
                  const isHalted = currentLine.status === 'HALTED';

                  // Semantic styling classes mirroring mockup
                  let isCritical = !isHalted && assignedAllocations.length === 0;
                  let isUnderstaffed = !isHalted && assignedAllocations.length > 0 && assignedAllocations.length < capacity;
                  let isStaffed = !isHalted && assignedAllocations.length >= capacity;

                  let borderClass = 'border-l-4 border-primary';
                  let badgeText = 'ACTIVE';
                  let badgeClass = 'bg-[#d5e3fd] text-[#57657b]';
                  let staffColorClass = 'text-primary';

                  if (isHalted) {
                    borderClass = 'border-l-4 border-secondary';
                    badgeText = 'HALTED';
                    badgeClass = 'bg-surface-container-high text-secondary';
                  } else if (isCritical) {
                    borderClass = 'border-l-4 border-error';
                    badgeText = 'CRITICAL';
                    badgeClass = 'bg-error-container text-on-error-container';
                    staffColorClass = 'text-error';
                  } else if (isUnderstaffed) {
                    borderClass = 'border-l-4 border-error';
                    badgeText = 'UNDERSTAFFED';
                    badgeClass = 'bg-error-container text-on-error-container';
                    staffColorClass = 'text-error';
                  } else if (isStaffed) {
                    borderClass = 'border-l-4 border-primary';
                    badgeText = 'ACTIVE';
                    badgeClass = 'bg-primary-container text-on-primary-container';
                  }

                  const stageIndexStr = String(index + 1).padStart(2, '0');

                  return (
                    <div
                      key={ws.id}
                      className={`bg-surface border border-outline p-md flex flex-col gap-sm rounded-lg hover:shadow-md transition-shadow ${borderClass}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-label-caps text-[9px] text-secondary block uppercase tracking-wider font-bold">Stage {stageIndexStr}</span>
                          <h3 className="font-headline-md text-xs font-black text-on-surface mt-0.5 tracking-tight">{ws.name}</h3>
                        </div>
                        <span className={`px-2 py-0.5 text-[8px] font-label-caps font-bold rounded ${badgeClass}`}>{badgeText}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-body-sm text-xs text-secondary font-medium">Staffing:</span>
                        <span className={`font-data-display text-base font-bold ${staffColorClass}`}>{assignedAllocations.length}/{capacity}</span>
                      </div>

                      {/* Staffing progress track */}
                      <div className="h-2 w-full bg-surface-dim rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isCritical || isUnderstaffed ? 'bg-error' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, (assignedAllocations.length / capacity) * 100)}%` }}
                        ></div>
                      </div>

                      <div className="text-on-surface-variant pt-1">
                        <p className="font-label-caps text-[8px] text-secondary uppercase font-bold tracking-wider mb-1">Required Skills</p>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[9px] border border-outline px-2 py-0.2 rounded-full font-mono font-bold">
                            {ws.requiredSkillId} (Level &gt;= {ws.minSkillLevel})
                          </span>
                        </div>
                      </div>

                      {/* Display assigned workers inline */}
                      {assignedAllocations.length > 0 && (
                        <div className="mt-2 space-y-1.5 border-t border-outline-variant pt-2">
                          {assignedAllocations.map(alloc => {
                            const assocDetails = associates.find(a => a.id === alloc.associateId);
                            if (!assocDetails) return null;
                            const consecutiveDays = getConsecutiveWorkDays(assocDetails.id, selectedDate);
                            return (
                              <div key={alloc.id} className="flex justify-between items-center gap-2 p-1 bg-surface-dim rounded border border-outline-variant">
                                <span className="text-[10px] font-bold text-on-surface truncate">{assocDetails.name}</span>
                                <div className="flex items-center gap-1">
                                  {consecutiveDays >= 5 && (
                                    <span className="bg-amber-500 text-white text-[8px] px-1 rounded font-bold font-mono">OT</span>
                                  )}
                                  {(role === 'Production Supervisor' || role === 'Plant Admin') && (
                                    <button
                                      onClick={() => handleDeallocate(ws.id, assocDetails.id)}
                                      className="text-rose-600 hover:text-rose-700 font-bold px-1 text-xs cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Primary card assign button */}
                      {(role === 'Production Supervisor' || role === 'Plant Admin') ? (
                        <button
                          onClick={() => handleOpenAssignModal(ws.id)}
                          className={`mt-auto w-full py-1.5 font-label-caps text-[9px] font-bold rounded transition-colors cursor-pointer border ${
                            isCritical || isUnderstaffed
                              ? 'bg-error border-error text-on-error hover:opacity-90'
                              : 'border-primary text-primary hover:bg-[#d5e3fd]/20'
                          }`}
                        >
                          {isCritical || isUnderstaffed ? 'PRIORITY ASSIGN' : 'ASSIGN'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-secondary text-center italic mt-auto">Read-only view</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar available personnel (Tabbed: Available List & Clock-in Daily Records) */}
        <aside className="w-80 bg-white border border-outline flex flex-col rounded-lg shadow-lg overflow-hidden shrink-0">
          <div className="p-md bg-surface-container border-b border-outline">
            <h3 className="font-headline-md text-sm font-bold text-on-surface">Available Personnel</h3>
            <p className="font-label-caps text-[9px] text-secondary font-bold uppercase tracking-wider mt-0.5">
              {rightTab === 'personnel' ? `Current Pool: ${(associates || []).filter(a => a.status === 'Active').length} Operators` : 'Roster Records'}
            </p>
          </div>

          <div className="flex border-b border-outline-variant bg-surface-container-low shrink-0">
            <button
              onClick={() => setRightTab('personnel')}
              className={`flex-1 py-2 text-[9px] font-bold font-label-caps tracking-wider text-center uppercase cursor-pointer border-b-2 ${
                rightTab === 'personnel' ? 'border-primary text-primary' : 'border-transparent text-secondary'
              }`}
            >
              Personnel
            </button>
            <button
              onClick={() => setRightTab('attendance')}
              className={`flex-1 py-2 text-[9px] font-bold font-label-caps tracking-wider text-center uppercase cursor-pointer border-b-2 ${
                rightTab === 'attendance' ? 'border-primary text-primary' : 'border-transparent text-secondary'
              }`}
            >
              Roster Clock-In
            </button>
          </div>

          <div className="p-sm bg-surface-container-low border-b border-outline-variant shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder={rightTab === 'personnel' ? "Search skills or ID..." : "Search associate..."}
                value={rightTab === 'personnel' ? personnelSearch : attendanceSearch}
                onChange={(e) => rightTab === 'personnel' ? setPersonnelSearch(e.target.value) : setAttendanceSearch(e.target.value)}
                className="w-full bg-white border border-outline rounded-lg text-xs py-1.5 pl-3 pr-8 focus:ring-0 focus:outline-none"
              />
              <span className="material-symbols-outlined absolute right-2.5 top-2 text-secondary text-sm">search</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-sm flex flex-col gap-sm">
            {rightTab === 'personnel' ? (
              (() => {
                const filtered = (associates || [])
                  .filter(assoc => assoc.status === 'Active')
                  .filter(assoc => {
                    const matchQuery = personnelSearch.toLowerCase();
                    const skillsMatch = (associateSkills || [])
                      .filter(s => s.associateId === assoc.id)
                      .some(s => s.skillId.toLowerCase().includes(matchQuery));
                    return assoc.name.toLowerCase().includes(matchQuery) ||
                           assoc.id.toLowerCase().includes(matchQuery) ||
                           assoc.category.toLowerCase().includes(matchQuery) ||
                           skillsMatch;
                  });

                if (filtered.length === 0) {
                  return <p className="text-[10px] text-secondary/60 italic text-center py-4">No matching personnel found</p>;
                }

                return filtered.map(assoc => {
                  const initials = assoc.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const assocSkillsList = (associateSkills || [])
                    .filter(s => s.associateId === assoc.id)
                    .map(s => s.skillId);

                  return (
                    <div key={assoc.id} className="bg-surface-container-lowest border border-outline p-sm rounded-lg flex flex-col gap-sm hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-xs">
                          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container text-xs shrink-0 font-mono">
                            {initials}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-body-lg text-xs font-bold text-on-surface leading-tight truncate">{assoc.name}</h4>
                            <span className="font-mono text-[9px] text-secondary block mt-0.5">ID: {assoc.id.replace('ASSOC-', '')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {assocSkillsList.length > 0 ? (
                          assocSkillsList.map(skId => (
                            <span key={skId} className="text-[9px] bg-primary-container text-on-primary-container px-2 py-0.2 rounded-full font-bold">
                              {skId}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] text-secondary border border-outline px-2 py-0.2 rounded-full">
                            {assoc.category}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              (() => {
                const filtered = (associates || [])
                  .filter(assoc => assoc.status === 'Active')
                  .filter(assoc => 
                    assoc.name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                    assoc.id.toLowerCase().includes(attendanceSearch.toLowerCase())
                  );

                if (filtered.length === 0) {
                  return <p className="text-[10px] text-secondary/60 italic text-center py-4">No associates found</p>;
                }

                return filtered.map(assoc => {
                  const initials = assoc.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const record = (attendanceRecords || []).find(r => r.associateId === assoc.id && r.date === selectedDate && r.shiftId === selectedShiftId);
                  const isPresent = record?.status === 'present';
                  const isAbsent = record?.status === 'absent';

                  return (
                    <div key={assoc.id} className="p-2 bg-surface-container-lowest border border-outline rounded-lg flex items-center justify-between">
                      <div className="flex gap-2 overflow-hidden items-center">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs uppercase text-secondary shrink-0 font-mono">
                          {initials}
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-primary truncate block leading-tight">{assoc.name}</span>
                          <span className="text-[8.5px] text-secondary font-mono block mt-0.5">{assoc.id}</span>
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => markAttendance(selectedDate, selectedShiftId, assoc.id, 'present')}
                          className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer border ${
                            isPresent 
                              ? 'bg-emerald-500 border-emerald-500 text-white font-bold' 
                              : 'bg-white border-slate-200 text-slate-400 hover:bg-emerald-50'
                          }`}
                          title="Mark Present"
                        >
                          <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                        </button>
                        <button
                          onClick={() => markAttendance(selectedDate, selectedShiftId, assoc.id, 'absent')}
                          className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer border ${
                            isAbsent 
                              ? 'bg-rose-500 border-rose-500 text-white font-bold' 
                              : 'bg-white border-slate-200 text-slate-400 hover:bg-rose-50'
                          }`}
                          title="Mark Absent"
                        >
                          <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>

          <div className="p-sm bg-surface-container-lowest border-t border-outline shrink-0">
            <button
              onClick={() => setRightTab('attendance')}
              className="w-full py-1.5 bg-surface-container-high text-on-surface font-label-caps text-[9px] font-bold rounded hover:bg-surface-variant transition-colors flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">groups</span>
              VIEW ALL CLOCKED-IN
            </button>
          </div>
        </aside>
      </div>

      {/* Auto-Allocation Success Modal */}
      {showAutoSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-96 p-5.5 rounded-xl shadow-2xl flex flex-col items-center text-center gap-4 border border-slate-200 animate-slide-up">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
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
                className="p-1 hover:bg-slate-200 rounded text-secondary transition-colors cursor-pointer flex items-center justify-center"
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
                    {eligibility.eligible.map(({ associate, skillLevel, score }) => {
                      const consecutiveDays = getConsecutiveWorkDays(associate.id, selectedDate);
                      return (
                        <button
                          key={associate.id}
                          onClick={() => handleDirectAssign(associate.id)}
                          className="w-full p-3 bg-white hover:bg-emerald-50/20 hover:border-emerald-300 border border-slate-200 rounded-lg flex justify-between items-center text-xs transition-all text-left cursor-pointer shadow-sm"
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
                              {associate.id} • {associate.category} • Has: <span className="font-bold text-emerald-700">{skillLevel}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono border border-emerald-200/50">
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
                <h4 className="text-[8.5px] font-label-caps text-red-800 bg-red-50 px-2.5 py-1 rounded font-bold tracking-wider mb-2 border border-red-100 flex justify-between items-center">
                  <span>Requires Override</span>
                  <span className="font-mono text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.2 rounded">{eligibility.ineligible.length}</span>
                </h4>
                <div className="flex flex-col gap-2">
                  {eligibility.ineligible.map(({ associate, reason }) => (
                    <button
                      key={associate.id}
                      onClick={() => handleStartOverride(associate.id)}
                      className="w-full p-3 bg-white hover:bg-amber-50/40 hover:border-amber-300 border border-slate-200 rounded-lg flex justify-between items-center text-xs transition-all text-left cursor-pointer shadow-sm"
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
                    className="px-4 py-1.5 bg-amber-600 text-white rounded font-bold text-[9px] font-label-caps tracking-wider hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
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
