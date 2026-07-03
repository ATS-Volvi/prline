import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AvailabilityTab } from './AvailabilityTab';

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
    getEligibilityList,
    allocateAssociate,
    deallocateWorkstation,
    getConsecutiveWorkDays,
    role
  } = useApp();

  // Active filters state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShiftId, setSelectedShiftId] = useState('SHIFT-A');
  const [plannerTab, setPlannerTab] = useState<'allocation' | 'availability'>('allocation');
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
  // allocations placeholder

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
      </div>

      {plannerTab === 'availability' ? (
        <AvailabilityTab />
      ) : (
      <div className="flex-grow flex flex-col overflow-hidden bg-gradient-to-tr from-[#E2E8F0] via-[#F1F5F9] to-[#CBD5E1] select-text p-6 lg:p-8 relative animate-fade-in">
        
        {/* Publish Shift Toast Alert */}
        {showPublishToast && (
          <div className="fixed top-20 right-8 bg-[#091426] text-white border border-slate-700 p-4 rounded-xl shadow-premium-lg z-50 flex items-center gap-3 animate-slide-up text-xs font-bold animate-fade-in">
            <span className="material-symbols-outlined text-emerald-500 font-bold">check_circle</span>
            <span>Shift schedule published to live roster and active plant database!</span>
          </div>
        )}

        {/* HEADER AND FILTERS BOX */}
        <div className="border-2 border-[#4F46E5]/15 rounded-3xl p-6 bg-white/95 backdrop-blur-md shadow-premium-lg flex flex-col gap-6 mb-6 select-none relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* PRODUCTION LINE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-[#4F46E5] uppercase tracking-widest font-mono">PRODUCTION LINE</label>
              <select
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="py-2.5 px-3 bg-[#F8FAFC] border-2 border-slate-200 hover:border-slate-350 focus:border-[#4F46E5] focus:ring-0 rounded-xl text-xs font-bold text-slate-800 transition-all duration-200 cursor-pointer w-full"
              >
                {productionLines.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* ACTIVE SHIFT */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-[#4F46E5] uppercase tracking-widest font-mono">ACTIVE SHIFT</label>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="py-2.5 px-3 bg-[#F8FAFC] border-2 border-slate-200 hover:border-slate-350 focus:border-[#4F46E5] focus:ring-0 rounded-xl text-xs font-bold text-slate-800 transition-all duration-200 cursor-pointer w-full"
              >
                {shifts.map(shift => (
                  <option key={shift.id} value={shift.id}>{shift.name} ({shift.timings})</option>
                ))}
              </select>
            </div>

            {/* PRODUCTION DATE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-[#4F46E5] uppercase tracking-widest font-mono">PRODUCTION DATE</label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="py-2.5 px-3 pr-10 bg-[#F8FAFC] border-2 border-slate-200 hover:border-slate-350 focus:border-[#4F46E5] focus:ring-0 rounded-xl text-xs font-bold text-slate-800 transition-all duration-200 cursor-pointer w-full"
                />
                <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">calendar_today</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-3.5 mt-0.5">
            <button
              type="button"
              onClick={() => {
                setShowPublishToast(true);
                setTimeout(() => setShowPublishToast(false), 3000);
              }}
              className="py-2.5 px-6 border-2 border-[#0B192C] text-[#0B192C] font-extrabold rounded-full hover:bg-[#0B192C] hover:text-white text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-[1.03] shadow-md bg-white cursor-pointer"
            >
              SAVE CONFIGURATION
            </button>

            <button
              type="button"
              onClick={() => handleAutoAllocate()}
              disabled={isOptimizing || currentLine.status !== 'ACTIVE'}
              className="py-2.5 px-6 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] hover:from-[#4338CA] hover:to-[#0891B2] text-white font-extrabold rounded-full text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-[#4F46E5]/20 hover:scale-[1.03] disabled:opacity-50"
            >
              {isOptimizing ? (
                <>
                  <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                  <span>RUNNING ENGINE...</span>
                </>
              ) : (
                <span>AUTO-ALLOCATE STAFF</span>
              )}
            </button>
          </div>
        </div>

        {/* WORKSTATIONS GRID CANVAS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
          {activeWS.length === 0 ? (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3 shadow-premium-lg animate-fade-in">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {activeWS.map((ws, index) => {
                const assigned = lineAllocations.find(a => a.workstationId === ws.id);
                const assoc = assigned ? associates.find(a => a.id === assigned.associateId) : null;
                // assigned associate lookup

                return (
                  <div
                    key={ws.id}
                    className="bg-white border-2 border-slate-200 border-l-[6px] border-l-[#4F46E5] rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:border-slate-300 hover:border-l-[#06B6D4] transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col p-6 h-full relative cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">STAGE {index < 9 ? `0${index + 1}` : index + 1}</span>
                      <span className="bg-[#E0F2FE] text-[#0369A1] border border-[#BCE4FC] text-[8px] font-extrabold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider shadow-sm">ACTIVE</span>
                    </div>
                    
                    <h4 className="text-xl font-black text-slate-900 leading-tight mb-4 min-h-[48px] hover:text-[#4F46E5] transition-colors">{ws.name}</h4>
                    
                    <div className="flex justify-between items-center text-xs mt-1.5 mb-2">
                      <span className="text-slate-400 font-extrabold font-mono text-[9px] uppercase tracking-widest">Staffing:</span>
                      <span className={`font-extrabold text-sm ${assoc ? 'text-[#047857]' : 'text-[#B91C1C]'}`}>{assoc ? '1' : '0'}/1</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full mb-5 overflow-hidden border border-slate-200">
                      <div className={`h-full ${assoc ? 'bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] w-full shadow-[0_0_8px_rgba(79,70,229,0.35)]' : 'bg-slate-200 w-0'}`}></div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 select-none">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-1">REQUIRED SKILLS</span>
                      <div className="inline-block border-2 border-indigo-100/80 rounded-xl px-3.5 py-2 text-[10px] text-indigo-700 bg-indigo-50/50 font-mono font-bold tracking-tight shadow-premium-sm truncate max-w-full">
                        {ws.requiredSkillId} (Level &gt;= {ws.minSkillLevel})
                      </div>
                    </div>

                    {/* ASSIGNED OPERATOR ROW */}
                    <div className="mt-5 min-h-[44px] flex items-center justify-center">
                      {assoc ? (
                        <div className="w-full bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] text-slate-800 rounded-xl py-2.5 px-3 flex items-center justify-between text-xs font-bold font-mono border-2 border-slate-200/80 shadow-sm">
                          <span className="truncate max-w-[150px]">{assoc.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (assigned && (role === 'Production Supervisor' || role === 'Plant Admin')) {
                                if (window.confirm(`Deallocate ${assoc?.name} from ${ws.name}?`)) {
                                  handleDeallocate(ws.id, assoc?.id);
                                }
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer font-bold text-sm w-5 h-5 rounded-full hover:bg-rose-50 flex items-center justify-center transition-all"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic select-none">Unallocated</div>
                      )}
                    </div>

                    {/* ASSIGN BUTTON */}
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(ws.id)}
                        className="w-full py-2.5 border-2 border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white font-extrabold rounded-xl bg-white transition-all duration-200 text-[10px] uppercase tracking-widest cursor-pointer font-mono hover:scale-[1.02] shadow-sm hover:shadow-md"
                      >
                        ASSIGN
                      </button>
                    </div>
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
