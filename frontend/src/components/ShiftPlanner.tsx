import React, { useState, useEffect } from 'react';
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
    role,
    products,
    productionSchedules,
    addProductionSchedule,
    deleteProductionSchedule
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

  // Batch Scheduler Modal states
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [targetProductId, setTargetProductId] = useState('');
  const [targetVolumeMt, setTargetVolumeMt] = useState<number | ''>('');
  const [batchNotes, setBatchNotes] = useState('');
  const [savingBatch, setSavingBatch] = useState(false);

  // Active production schedule for current filters
  const activeSchedule = (productionSchedules || []).find(
    s => s.date === selectedDate && s.shiftId === selectedShiftId && s.lineId === selectedLineId
  );

  // Check if active schedule has any overrides
  const activeOverrides = activeSchedule?.product?.workstationOverrides
    ? JSON.parse(activeSchedule.product.workstationOverrides)
    : null;
  const hasOverrides = activeOverrides && Object.keys(activeOverrides).length > 0;


  // Sync batch modal form state
  useEffect(() => {
    if (activeSchedule) {
      setTargetProductId(activeSchedule.productId);
      setTargetVolumeMt(activeSchedule.targetVolumeMt);
      setBatchNotes(activeSchedule.notes || '');
    } else {
      setTargetProductId('');
      setTargetVolumeMt('');
      setBatchNotes('');
    }
  }, [activeSchedule, showBatchModal]);

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

  // Batch save and delete handlers
  const handleSaveBatch = async () => {
    if (!targetProductId || !targetVolumeMt) {
      alert("Please select a product and enter target volume.");
      return;
    }
    setSavingBatch(true);
    const res = await addProductionSchedule({
      id: activeSchedule?.id,
      date: selectedDate,
      shiftId: selectedShiftId,
      lineId: selectedLineId,
      productId: targetProductId,
      targetVolumeMt: Number(targetVolumeMt),
      notes: batchNotes
    });
    setSavingBatch(false);
    if (res.success) {
      setShowBatchModal(false);
    } else {
      alert(res.message || "Failed to save schedule batch.");
    }
  };

  const handleDeleteBatch = async () => {
    if (!activeSchedule) return;
    if (!window.confirm("Are you sure you want to remove the scheduled batch for this shift?")) return;
    setSavingBatch(true);
    const res = await deleteProductionSchedule(activeSchedule.id);
    setSavingBatch(false);
    if (res.success) {
      setShowBatchModal(false);
    } else {
      alert(res.message || "Failed to delete schedule batch.");
    }
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
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background select-none animate-fade-in shift-planner-view">
      <style>{`
        .shift-planner-view {
          --po-canvas: #F4F5F3;        /* warm-neutral steel-gray */
          --po-surface: #FFFFFF;       /* card background */
          --po-surface-border: #E2E4E1;/* card borders */
          --po-ink: #1C2321;           /* primary text */
          --po-ink-muted: #6B7370;     /* secondary text */
          --po-line-teal: #0F766E;     /* primary accent */
          --po-line-teal-soft: #CCEAE6;/* light teal */
          --po-amber: #B45309;         /* attention states */
          --po-focus: #0F766E;         /* focus outline */
        }
      `}</style>
      
      {/* Top Tabs */}
      <div className="flex items-center gap-4 px-md pt-md pb-0 border-b border-outline-variant bg-surface shrink-0">
        <button 
          onClick={() => setPlannerTab('allocation')}
          className={`pb-2 px-2 text-[10px] font-label-caps font-bold uppercase tracking-wider transition-colors border-b-2 ${plannerTab === 'allocation' ? 'border-[var(--po-line-teal)] text-[var(--po-line-teal)]' : 'border-transparent text-secondary hover:text-on-surface cursor-pointer'}`}
        >
          Shift Allocation
        </button>
        <button 
          onClick={() => setPlannerTab('availability')}
          className={`pb-2 px-2 text-[10px] font-label-caps font-bold uppercase tracking-wider transition-colors border-b-2 ${plannerTab === 'availability' ? 'border-[var(--po-line-teal)] text-[var(--po-line-teal)]' : 'border-transparent text-secondary hover:text-on-surface cursor-pointer'}`}
        >
          Availability & Attendance
        </button>
      </div>

      {plannerTab === 'availability' ? (
        <AvailabilityTab />
      ) : (
      <div className="flex-grow flex flex-col overflow-hidden bg-[var(--po-canvas)] select-text p-6 lg:p-8 relative animate-fade-in">
        
        {/* Publish Shift Toast Alert */}
        {showPublishToast && (
          <div className="fixed top-20 right-8 bg-[#091426] text-white border border-slate-700 p-4 rounded-xl shadow-premium-lg z-50 flex items-center gap-3 animate-slide-up text-xs font-bold animate-fade-in">
            <span className="material-symbols-outlined text-emerald-500 font-bold">check_circle</span>
            <span>Shift schedule published to live roster and active plant database!</span>
          </div>
        )}

        {/* HEADER AND FILTERS BOX */}
        <div className="border-2 border-[var(--po-surface-border)] rounded-3xl p-6 bg-[var(--po-surface)] shadow-premium-lg flex flex-col gap-6 mb-6 select-none relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* PRODUCTION LINE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-[var(--po-ink-muted)] uppercase tracking-widest font-mono">PRODUCTION LINE</label>
              <select
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="py-2.5 px-3 bg-[var(--po-canvas)] border-2 border-[var(--po-surface-border)] hover:border-slate-350 focus:border-[var(--po-focus)] focus:ring-0 rounded-xl text-xs font-bold text-[var(--po-ink)] transition-all duration-200 cursor-pointer w-full"
              >
                {productionLines.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* ACTIVE SHIFT */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-[var(--po-ink-muted)] uppercase tracking-widest font-mono">ACTIVE SHIFT</label>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="py-2.5 px-3 bg-[var(--po-canvas)] border-2 border-[var(--po-surface-border)] hover:border-slate-350 focus:border-[var(--po-focus)] focus:ring-0 rounded-xl text-xs font-bold text-[var(--po-ink)] transition-all duration-200 cursor-pointer w-full"
              >
                {shifts.map(shift => (
                  <option key={shift.id} value={shift.id}>{shift.name} ({shift.timings})</option>
                ))}
              </select>
            </div>

            {/* PRODUCTION DATE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-[var(--po-ink-muted)] uppercase tracking-widest font-mono">PRODUCTION DATE</label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="py-2.5 px-3 pr-10 bg-[var(--po-canvas)] border-2 border-[var(--po-surface-border)] hover:border-slate-350 focus:border-[var(--po-focus)] focus:ring-0 rounded-xl text-xs font-bold text-[var(--po-ink)] transition-all duration-200 cursor-pointer w-full"
                />
                <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">calendar_today</span>
              </div>
            </div>

            {/* ACTIVE PRODUCTION BATCH / RECIPE */}
            <div className="md:col-span-3 border-t border-[var(--po-surface-border)] pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--po-line-teal-soft)] text-[var(--po-line-teal)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">local_pizza</span>
                </div>
                <div>
                  <h5 className="text-[10px] font-extrabold text-[var(--po-ink-muted)] uppercase tracking-widest font-mono">Active Production Batch</h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    {activeSchedule ? (
                      <>
                        <span className="text-xs font-black text-[var(--po-ink)]">{activeSchedule.product?.name || 'Unknown Product'}</span>
                        <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded font-mono border border-slate-200">
                          SKU: {activeSchedule.product?.skuCode}
                        </span>
                        <span className="bg-[var(--po-line-teal-soft)] text-[var(--po-line-teal)] text-[9px] font-extrabold px-2 py-0.5 rounded font-mono border border-[var(--po-line-teal-soft)]">
                          Target: {activeSchedule.targetVolumeMt} MT
                        </span>
                        {hasOverrides && (
                          <span className="bg-amber-50 text-amber-700 text-[9px] font-extrabold px-2 py-0.5 rounded font-mono border border-amber-200 flex items-center gap-0.5" title="Recipe overrides active skills on workstations">
                            <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>rule</span> Recipe Skill Overrides
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs italic text-[var(--po-ink-muted)] font-medium">No production batch scheduled for this shift. Default line settings apply.</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(true)}
                  className="py-1.5 px-4 bg-white border-2 border-[var(--po-line-teal)] text-[var(--po-line-teal)] hover:bg-[var(--po-line-teal)] hover:text-white font-extrabold rounded-full text-[9px] uppercase tracking-wider transition-all duration-200 cursor-pointer font-mono hover:scale-[1.02] shadow-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">edit_calendar</span>
                  {activeSchedule ? 'Change Scheduled Batch' : 'Schedule Production Batch'}
                </button>
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
              className="py-2.5 px-6 border-2 border-[var(--po-ink)] text-[var(--po-ink)] font-extrabold rounded-full hover:bg-[var(--po-ink)] hover:text-white text-[10px] uppercase tracking-widest transition-all duration-300 hover:scale-[1.03] shadow-md bg-[var(--po-surface)] cursor-pointer"
            >
              SAVE CONFIGURATION
            </button>

            <button
              type="button"
              onClick={() => handleAutoAllocate()}
              disabled={isOptimizing || currentLine.status !== 'ACTIVE'}
              className="py-2.5 px-6 bg-[var(--po-line-teal)] hover:bg-[#0d635c] text-white font-extrabold rounded-full text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-[var(--po-line-teal)]/10 hover:scale-[1.03] disabled:opacity-50"
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
            <div className="bg-[var(--po-surface)] border-2 border-[var(--po-surface-border)] rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3 shadow-premium-lg animate-fade-in">
              <span className="material-symbols-outlined text-3xl text-amber-500 animate-pulse">construction</span>
              <h4 className="font-bold text-xs text-[var(--po-ink)] uppercase font-mono tracking-wider">No Workstations Configured</h4>
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
                const wsAllocations = lineAllocations.filter(a => a.workstationId === ws.id);
                const capacity = ws.maxStaffCount || 1;
                const isFull = wsAllocations.length >= capacity;
                const hasSome = wsAllocations.length > 0;

                // Check for recipe overrides
                let displaySkill = ws.requiredSkillId;
                let displayLevel = ws.minSkillLevel;
                let isOverridden = false;
                
                if (activeOverrides && activeOverrides[ws.id]) {
                  const override = activeOverrides[ws.id];
                  if (override.requiredSkillId) displaySkill = override.requiredSkillId;
                  if (override.minSkillLevel) displayLevel = override.minSkillLevel;
                  isOverridden = true;
                }

                return (
                  <div
                    key={ws.id}
                    className="bg-[var(--po-surface)] border-2 border-[var(--po-surface-border)] border-l-[6px] border-l-[var(--po-line-teal)] rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:border-slate-350 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col p-6 h-full relative cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-extrabold text-[var(--po-ink-muted)] uppercase tracking-wider font-mono">STAGE {index < 9 ? `0${index + 1}` : index + 1}</span>
                      <span className="bg-[var(--po-line-teal-soft)] text-[var(--po-line-teal)] border border-[var(--po-line-teal-soft)] text-[8px] font-extrabold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider shadow-sm">ACTIVE</span>
                    </div>
                    
                    <h4 className="text-xl font-black text-[var(--po-ink)] leading-tight mb-4 min-h-[48px] hover:text-[var(--po-line-teal)] transition-colors">{ws.name}</h4>
                    
                    <div className="flex justify-between items-center text-xs mt-1.5 mb-2">
                      <span className="text-[var(--po-ink-muted)] font-extrabold font-mono text-[9px] uppercase tracking-widest">Staffing:</span>
                      <span className={`font-extrabold text-sm ${isFull ? 'text-[var(--po-line-teal)]' : 'text-[var(--po-amber)]'}`}>{wsAllocations.length}/{capacity}</span>
                    </div>
                    <div className="w-full bg-[var(--po-canvas)] h-2.5 rounded-full mb-5 overflow-hidden border border-[var(--po-surface-border)]">
                      <div 
                        className={`h-full ${hasSome ? 'bg-[var(--po-line-teal)] shadow-[0_0_8px_rgba(15,118,110,0.3)]' : 'bg-[var(--po-amber)]'}`}
                        style={{ width: `${Math.min(100, (wsAllocations.length / capacity) * 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 select-none">
                      <span className="text-[9px] font-extrabold text-[var(--po-ink-muted)] uppercase tracking-widest font-mono mb-1 flex items-center gap-1.5">
                        REQUIRED SKILLS
                        {isOverridden && (
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-2 py-0.5 rounded border border-amber-200 flex items-center gap-0.5" title="Overridden by active product recipe">
                            <span className="material-symbols-outlined text-[8px] font-extrabold">bolt</span> Recipe
                          </span>
                        )}
                      </span>
                      <div className={`inline-block border rounded-xl px-3.5 py-2 text-[10px] font-mono font-bold tracking-tight shadow-premium-sm truncate max-w-full ${
                        isOverridden 
                          ? 'border-amber-300 text-amber-800 bg-amber-50' 
                          : 'border-[var(--po-surface-border)] text-[var(--po-line-teal)] bg-[var(--po-line-teal-soft)]'
                      }`}>
                        {displaySkill} (Level &gt;= {displayLevel})
                      </div>
                    </div>

                    {/* ASSIGNED OPERATOR ROW */}
                    <div className="mt-5 min-h-[44px] flex flex-col gap-2 justify-center">
                      {hasSome ? (
                        wsAllocations.map(assigned => {
                          const assoc = associates.find(a => a.id === assigned.associateId);
                          if (!assoc) return null;
                          return (
                            <div key={assigned.id} className="w-full bg-[var(--po-surface)] text-[var(--po-ink)] rounded-xl py-2.5 px-3 flex items-center justify-between text-xs font-bold font-mono border-2 border-[var(--po-surface-border)] shadow-sm">
                              <span className="truncate max-w-[150px]">{assoc.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (role === 'Production Supervisor' || role === 'Plant Admin') {
                                    if (window.confirm(`Deallocate ${assoc.name} from ${ws.name}?`)) {
                                      handleDeallocate(ws.id, assoc.id);
                                    }
                                  }
                                }}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer font-bold text-sm w-5 h-5 rounded-full hover:bg-rose-50 flex items-center justify-center transition-all"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-[10px] text-[var(--po-ink-muted)] italic select-none text-center">Unallocated</div>
                      )}
                    </div>

                    {/* ASSIGN BUTTON */}
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(ws.id)}
                        className="w-full py-2.5 border-2 border-[var(--po-line-teal)] text-[var(--po-line-teal)] hover:bg-[var(--po-line-teal)] hover:text-white font-extrabold rounded-xl bg-white transition-all duration-200 text-[10px] uppercase tracking-widest cursor-pointer font-mono hover:scale-[1.02] shadow-sm hover:shadow-md"
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
      {/* Batch Scheduling Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 select-text">
          <div className="bg-surface-container-lowest w-[450px] max-w-full rounded-xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant animate-slide-up">
            {/* Modal Header */}
            <div className="p-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xs text-primary uppercase tracking-wider font-label-caps">Schedule Production Batch</h3>
                <p className="text-[9px] text-secondary mt-1 font-mono uppercase leading-tight">
                  Line: {currentLine.name} <br/>
                  Date: {selectedDate} • Shift: {shifts.find(s => s.id === selectedShiftId)?.name || selectedShiftId}
                </p>
              </div>
              <button 
                onClick={() => setShowBatchModal(false)}
                className="p-1 hover:bg-surface-container-high rounded text-secondary transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex flex-col gap-4 text-left">
              <div>
                <label className="text-[8.5px] font-bold text-primary block mb-1 font-label-caps uppercase tracking-wider">Select Product Recipe</label>
                <select
                  value={targetProductId}
                  onChange={(e) => setTargetProductId(e.target.value)}
                  className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:ring-2 focus:ring-primary text-on-surface"
                >
                  <option value="">-- Select Product --</option>
                  {(products || []).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.skuCode})</option>
                  ))}
                </select>
              </div>

              {targetProductId && (() => {
                const prod = products.find(p => p.id === targetProductId);
                if (!prod) return null;
                const overrides = prod.workstationOverrides ? JSON.parse(prod.workstationOverrides) : null;
                const overrideKeys = overrides ? Object.keys(overrides) : [];
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col gap-2">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Category: {prod.category}</span>
                      <span>Throughput: {prod.hourlyThroughputKgHr} kg/hr</span>
                    </div>
                    {overrideKeys.length > 0 ? (
                      <div className="mt-1">
                        <span className="text-[9px] font-extrabold text-amber-800 uppercase font-mono tracking-wider block mb-1">Recipe Workstation Skill Overrides:</span>
                        <div className="flex flex-col gap-1">
                          {overrideKeys.map(wsId => {
                            const wsName = workstations.find(w => w.id === wsId)?.name || wsId;
                            const override = overrides[wsId];
                            return (
                              <div key={wsId} className="flex justify-between text-[10px] bg-amber-50 border border-amber-200 px-2 py-1 rounded text-amber-900 font-mono">
                                <span>{wsName}</span>
                                <span>{override.requiredSkillId} (&gt;={override.minSkillLevel})</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No recipe overrides. Default workstation skills will be required.</p>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="text-[8.5px] font-bold text-primary block mb-1 font-label-caps uppercase tracking-wider">Target Production Volume (MT)</label>
                <input
                  type="number"
                  placeholder="e.g. 2.5"
                  value={targetVolumeMt}
                  onChange={(e) => setTargetVolumeMt(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:ring-2 focus:ring-primary text-on-surface"
                />
              </div>

              <div>
                <label className="text-[8.5px] font-bold text-primary block mb-1 font-label-caps uppercase tracking-wider">Production Notes</label>
                <textarea
                  placeholder="Additional batch notes (batch number, raw materials etc.)"
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  className="w-full p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs focus:ring-2 focus:ring-primary text-on-surface min-h-[60px]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-between gap-3">
              {activeSchedule ? (
                <button
                  onClick={handleDeleteBatch}
                  disabled={savingBatch}
                  className="px-4 py-2 border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg font-bold text-[9px] font-label-caps tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  REMOVE BATCH
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-xs font-bold text-secondary hover:text-primary hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBatch}
                  disabled={savingBatch || !targetProductId || !targetVolumeMt}
                  className="px-4 py-2 bg-[var(--po-line-teal)] hover:bg-[#0d635c] text-white rounded-lg font-bold text-[9px] font-label-caps tracking-wider disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {savingBatch ? 'SAVING...' : 'SCHEDULE BATCH'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
