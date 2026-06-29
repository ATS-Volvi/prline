import React, { useState } from 'react';
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

  const changeSubTab = (tab: 'associates' | 'workstations' | 'skills' | 'lines' | 'shifts') => {
    setActiveSubTab(tab);
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
      <header className="flex justify-between items-center px-margin-desktop h-16 w-full border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-headline-md font-bold">database</span>
          <h1 className="font-headline-md text-base font-bold text-primary">Master Data Configuration</h1>
        </div>

        {/* Sub tabs switcher */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-premium-sm">
          <button
            onClick={() => changeSubTab('associates')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === 'associates' ? 'bg-white text-primary shadow-premium-sm border border-slate-200' : 'text-secondary hover:text-primary'
            }`}
          >
            Associate Master
          </button>
          <button
            onClick={() => changeSubTab('workstations')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === 'workstations' ? 'bg-white text-primary shadow-premium-sm border border-slate-200' : 'text-secondary hover:text-primary'
            }`}
          >
            Workstation Master
          </button>
          <button
            onClick={() => changeSubTab('skills')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === 'skills' ? 'bg-white text-primary shadow-premium-sm border border-slate-200' : 'text-secondary hover:text-primary'
            }`}
          >
            Skill Register
          </button>
          <button
            onClick={() => changeSubTab('lines')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === 'lines' ? 'bg-white text-primary shadow-premium-sm border border-slate-200' : 'text-secondary hover:text-primary'
            }`}
          >
            Line Master
          </button>
          <button
            onClick={() => changeSubTab('shifts' as any)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === ('shifts' as any) ? 'bg-white text-primary shadow-premium-sm border border-slate-200' : 'text-secondary hover:text-primary'
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
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Associate List</h2>
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

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-premium-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
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
                        <tr key={assoc.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-primary">{assoc.id}</td>
                          <td className="p-3.5 font-bold text-on-surface">{assoc.name}</td>
                          <td className="p-3.5 font-mono text-secondary font-semibold">{assoc.plantIdRef || 'N/A'}</td>
                          <td className="p-3.5 text-secondary font-medium">{assoc.category}</td>
                          <td className="p-3.5 font-mono text-secondary">{assoc.joiningDate}</td>
                          <td className="p-3.5">
                            <span className="bg-slate-50 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 font-mono text-[9px] shadow-premium-sm">
                              {skillsCount} Skills
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider border shadow-premium-sm ${
                              assoc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'
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
          )}

          {/* Sub-tab: Workstations */}
          {activeSubTab === 'workstations' && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Workstations Directory</h2>
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

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-premium-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
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
                        <tr key={ws.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-primary">{ws.id}</td>
                          <td className="p-3.5 font-bold text-on-surface">{ws.name}</td>
                          <td className="p-3.5 text-secondary font-medium">{line?.name || ws.lineId}</td>
                          <td className="p-3.5 font-mono font-bold text-secondary">{ws.requiredSkillId}</td>
                          <td className="p-3.5">
                            <span className="bg-slate-50 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200 font-mono text-[9px] shadow-premium-sm">
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
                  <h2 className="text-sm font-bold text-on-surface">Skill Master Register</h2>
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

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-premium-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
                      <th className="p-3.5">SKILL CODE</th>
                      <th className="p-3.5">SKILL NAME</th>
                      <th className="p-3.5">DESCRIPTION & APPLICATION</th>
                      {canWriteAllMasterData && <th className="p-3.5 text-right">ACTIONS</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {skills.map(sk => (
                      <tr key={sk.id} className="hover:bg-slate-50/50 transition-colors">
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
                  <h2 className="text-sm font-bold text-on-surface">Production Lines Directory</h2>
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

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-premium-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
                      <th className="p-3.5">LINE ID</th>
                      <th className="p-3.5">LINE NAME</th>
                      <th className="p-3.5">CURRENT PRODUCT</th>
                      <th className="p-3.5">STATUS</th>
                      {canWriteAllMasterData && <th className="p-3.5 text-right">ACTIONS</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productionLines.map(line => (
                      <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-primary">{line.id}</td>
                        <td className="p-3.5 font-bold text-on-surface">{line.name}</td>
                        <td className="p-3.5 text-secondary font-medium">{line.currentProduct}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider border shadow-premium-sm ${
                            line.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : line.status === 'MAINTENANCE'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : line.status === 'HALTED'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
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
                  <h2 className="text-sm font-bold text-on-surface">Shifts Directory</h2>
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

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-premium-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
                      <th className="p-3.5">SHIFT ID</th>
                      <th className="p-3.5">SHIFT NAME</th>
                      <th className="p-3.5">TIMINGS</th>
                      <th className="p-3.5">WORKING DAYS</th>
                      {canWriteAllMasterData && <th className="p-3.5 text-right">ACTIONS</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shifts.map(shift => (
                      <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-primary">{shift.id}</td>
                        <td className="p-3.5 font-bold text-on-surface">{shift.name}</td>
                        <td className="p-3.5 font-mono text-secondary font-medium">{shift.timings}</td>
                        <td className="p-3.5 text-secondary">
                          <div className="flex flex-wrap gap-1">
                            {shift.workingDays && shift.workingDays.map(day => (
                              <span key={day} className="bg-slate-50 text-slate-600 font-bold px-1.5 py-0.5 rounded border border-slate-200 text-[8px] font-mono shadow-premium-sm">
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
          <aside className="w-[380px] h-full border-l border-slate-200 bg-white p-5 overflow-y-auto custom-scrollbar flex flex-col gap-5 shadow-premium-lg z-30 animate-slide-up">
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
                className="p-1 hover:bg-slate-100 rounded-lg text-secondary transition-colors flex items-center justify-center cursor-pointer"
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
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 font-mono disabled:opacity-65 shadow-premium-sm text-xs"
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
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 shadow-premium-sm text-xs"
                    placeholder="e.g. A. Mukhopadhyay"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">PLANT ID REFERENCE</label>
                  <input
                    type="text"
                    value={assocPlantIdRef}
                    onChange={(e) => setAssocPlantIdRef(e.target.value)}
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 shadow-premium-sm text-xs"
                    placeholder="e.g. PID-12345"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">CATEGORY</label>
                    <select
                      value={assocCategory}
                      onChange={(e) => setAssocCategory(e.target.value as AssociateCategory)}
                      className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white font-bold cursor-pointer shadow-premium-sm text-xs"
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
                      className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white font-bold cursor-pointer shadow-premium-sm text-xs"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Skill Matrix Selectors */}
                <div className="border-t border-slate-200 pt-4">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider block mb-2">ASSIGNED SKILLS</label>
                  <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {skills.map(sk => {
                      const isAssigned = assocSkills.find(s => s.skillId === sk.id);
                      return (
                        <div key={sk.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2 shadow-premium-sm">
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
                                className="rounded border-slate-300 text-primary focus:ring-0 cursor-pointer w-3.5 h-3.5"
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
                                  className="w-full p-1 bg-white border border-slate-200 rounded text-[9px] cursor-pointer"
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
                                  className="w-full p-0.5 px-1 bg-white border border-slate-200 rounded text-[9px] font-mono cursor-pointer"
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
                    className="py-2 px-3 border border-slate-200 bg-slate-50 font-mono disabled:opacity-65 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm text-xs"
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
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 shadow-premium-sm text-xs"
                    placeholder="e.g. Seasoning Tumbler B"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">PRODUCTION LINE</label>
                  <select
                    value={wsLineId}
                    onChange={(e) => setWsLineId(e.target.value)}
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white font-bold cursor-pointer shadow-premium-sm text-xs"
                  >
                    {productionLines.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider block mb-1">COMPLIANT SKILLS (CHECK ALL REQUIRED)</label>
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 border border-slate-200 rounded-lg p-2 bg-slate-50 shadow-inner">
                    {skills.map(sk => {
                      const isChecked = wsRequiredSkill.split(';').includes(sk.id);
                      return (
                        <label key={sk.id} className="flex items-center gap-2 cursor-pointer select-none py-0.5 hover:bg-slate-100/50 rounded px-1">
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
                            className="rounded border-slate-300 text-primary focus:ring-0 cursor-pointer w-3.5 h-3.5"
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
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white font-bold cursor-pointer shadow-premium-sm text-xs"
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
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 shadow-premium-sm text-xs"
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
                    className="py-2 px-3 border border-slate-200 bg-slate-50 font-mono disabled:opacity-65 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm text-xs"
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
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 shadow-premium-sm text-xs"
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
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 shadow-premium-sm text-xs"
                    placeholder="e.g. Lays Sticks Tangy Tomato"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">OPERATIONAL STATUS</label>
                  <select
                    value={lineStatus}
                    onChange={(e) => setLineStatus(e.target.value as LineStatus)}
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white font-bold cursor-pointer shadow-premium-sm text-xs"
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
                    className="py-2 px-3 border border-slate-200 bg-slate-50 font-mono disabled:opacity-65 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm text-xs"
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
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 shadow-premium-sm text-xs"
                    placeholder="e.g. Packing Quality Assurance"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">DESCRIPTION</label>
                  <textarea
                    rows={3}
                    value={skDesc}
                    onChange={(e) => setSkDesc(e.target.value)}
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 shadow-premium-sm text-xs"
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
                    className="py-2 px-3 border border-slate-200 bg-slate-50 font-mono disabled:opacity-65 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm text-xs"
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
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 shadow-premium-sm text-xs"
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
                    className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 shadow-premium-sm text-xs"
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
                            className="rounded border-slate-300 text-primary focus:ring-0 cursor-pointer w-3.5 h-3.5"
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
