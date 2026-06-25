import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { SkillLevel, AssociateSkill } from '../types';

export const SkillMatrix: React.FC = () => {
  const {
    associates,
    skills,
    associateSkills,
    addTrainingRecord,
    bulkImportAssociates,
    role
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'training' | 'bulk'>('matrix');

  // Training form states
  const [trAssocId, setTrAssocId] = useState('');
  const [trSkillId, setTrSkillId] = useState('');
  const [trLevel, setTrLevel] = useState<SkillLevel>('Operator');
  const [trCertifier, setTrCertifier] = useState('T. Supervisor');
  const [trExpiry, setTrExpiry] = useState('2027-12-31');

  // Bulk paste state
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const handleSaveTraining = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trAssocId || !trSkillId) {
      alert('Please select both associate and skill.');
      return;
    }

    const record: AssociateSkill = {
      associateId: trAssocId,
      skillId: trSkillId,
      level: trLevel,
      trainingDate: new Date().toISOString().split('T')[0],
      certifiedBy: trCertifier,
      expiryDate: trExpiry,
      reCertificationRequired: new Date(trExpiry) < new Date(),
    };

    addTrainingRecord(record);
    alert('Training record logged successfully!');
    setTrAssocId('');
    setTrSkillId('');
  };

  const handleCsvImport = () => {
    if (!bulkCsvText.trim()) {
      setImportStatus({ type: 'error', message: 'Please paste or drag valid CSV content first.' });
      return;
    }
    setImportStatus({ type: 'success', message: 'Importing...' });
    bulkImportAssociates(bulkCsvText).then(res => {
      if (res.success) {
        setImportStatus({ type: 'success', message: res.message });
        setBulkCsvText('');
      } else {
        setImportStatus({ type: 'error', message: res.message });
      }
    }).catch(err => {
      setImportStatus({ type: 'error', message: err.message || 'Import failed.' });
    });
  };

  // Download simple sample template
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,employee_id,name,category,skills\nEMP120,Rajesh Sen,Contract,BLADE_OPT:Certified:2027-06-30;HYGIENE_L2:Operator:2026-12-31\nEMP121,Priya Das,Company,HEAT_SAFETY:Expert:2028-10-15;OIL_MGMT:Certified:2027-08-20\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "snackpro_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasWriteAccess = role === 'Plant Admin' || role === 'HR / Training Coordinator';

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background select-none animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center px-margin-desktop h-16 w-full border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-headline-md font-bold">military_tech</span>
          <h1 className="font-headline-md text-base font-bold text-primary">Skill & Training Matrix</h1>
        </div>

        {/* Sub tabs switcher */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-premium-sm">
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === 'matrix' ? 'bg-white text-primary shadow-premium-sm border border-slate-200' : 'text-secondary hover:text-primary'
            }`}
          >
            Compliance Grid
          </button>
          <button
            onClick={() => setActiveSubTab('training')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === 'training' ? 'bg-white text-primary shadow-premium-sm border border-slate-200' : 'text-secondary hover:text-primary'
            }`}
          >
            Log Training
          </button>
          <button
            onClick={() => setActiveSubTab('bulk')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeSubTab === 'bulk' ? 'bg-white text-primary shadow-premium-sm border border-slate-200' : 'text-secondary hover:text-primary'
            }`}
          >
            Bulk Import CSV
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-margin-desktop flex flex-col gap-6">
        
        {/* Sub-tab: Compliance Grid */}
        {activeSubTab === 'matrix' && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-on-surface">Compliance Skill Matrix</h2>
                <p className="text-[10px] text-secondary">Roster skill registers, certification expirations, and competency mapping</p>
              </div>
            </div>

            {/* Matrix Scrollable Container */}
            <div className="flex-1 overflow-auto border border-slate-200 rounded-lg shadow-premium-sm bg-white custom-scrollbar">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="text-on-surface font-semibold font-mono">
                    <th className="p-3.5 bg-slate-50 min-w-[160px] sticky top-0 left-0 border-r border-b border-slate-200 z-20 font-bold text-[9px] tracking-widest uppercase font-label-caps">OPERATOR</th>
                    {skills.map(sk => (
                      <th key={sk.id} className="p-3.5 text-center font-mono font-bold text-[9px] tracking-widest sticky top-0 bg-slate-50 border-b border-slate-200 z-10" title={sk.name}>
                        {sk.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {associates.map(assoc => (
                    <tr key={assoc.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Sticky Column */}
                      <td className="p-3.5 font-semibold text-primary bg-white sticky left-0 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.015)] z-10">
                        <div className="font-bold text-xs text-on-surface leading-tight">{assoc.name}</div>
                        <div className="text-[9px] text-secondary font-mono mt-0.5">
                          {assoc.id} • {assoc.category}
                        </div>
                      </td>

                      {/* Skills cells */}
                      {skills.map(sk => {
                        const assocSkill = associateSkills.find(s => s.associateId === assoc.id && s.skillId === sk.id);
                        if (!assocSkill) {
                          return (
                            <td key={sk.id} className="p-3 text-center text-slate-350 font-mono text-[10px]">
                              -
                            </td>
                          );
                        }

                        const isExpired = new Date(assocSkill.expiryDate) < new Date('2026-06-25');
                        
                        let cellStyle = 'bg-slate-50 text-slate-800 border-slate-200';
                        if (isExpired) {
                          cellStyle = 'bg-rose-50 text-rose-700 border-rose-100 font-bold';
                        } else if (assocSkill.level === 'Expert') {
                          cellStyle = 'bg-blue-50 text-primary border-blue-100 font-bold';
                        } else if (assocSkill.level === 'Certified') {
                          cellStyle = 'bg-indigo-50 text-indigo-700 font-bold border-indigo-100';
                        } else if (assocSkill.level === 'Operator') {
                          cellStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                        } else if (assocSkill.level === 'Trainee') {
                          cellStyle = 'bg-amber-50 text-amber-700 border-amber-100';
                        }

                        return (
                          <td key={sk.id} className="p-2.5 text-center">
                            <div 
                              className={`px-2 py-1.5 rounded text-[9px] font-mono leading-none border flex flex-col gap-0.5 justify-center items-center shadow-premium-sm transition-all duration-200 hover:scale-[1.02] ${cellStyle}`}
                              title={`Certified: ${assocSkill.trainingDate} by ${assocSkill.certifiedBy}. Expires: ${assocSkill.expiryDate}`}
                            >
                              <span className="font-bold tracking-wider">{assocSkill.level.toUpperCase()}</span>
                              {isExpired ? (
                                <span className="text-[7px] font-bold text-rose-600 uppercase font-sans mt-0.5">EXPIRED</span>
                              ) : (
                                <span className="text-[7px] opacity-75 font-mono leading-none mt-0.5">{assocSkill.expiryDate.split('-').slice(1).join('/')}</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend Bar */}
            <div className="flex flex-wrap gap-4.5 justify-end p-3.5 bg-white rounded-lg border border-slate-200 text-[9px] font-bold font-mono tracking-widest shadow-premium-sm">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-50 border border-blue-100 rounded"></span> EXPERT</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-50 border border-indigo-100 rounded"></span> CERTIFIED</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-50 border border-emerald-100 rounded"></span> OPERATOR</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-50 border border-amber-100 rounded"></span> TRAINEE</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-50 border border-rose-100 rounded"></span> EXPIRED</span>
            </div>
          </div>
        )}

        {/* Sub-tab: Record Training */}
        {activeSubTab === 'training' && (
          <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-lg p-6 shadow-premium-md flex flex-col gap-5 animate-slide-up w-full">
            <div>
              <h2 className="text-sm font-bold text-on-surface">Log Training & Recertifications</h2>
              <p className="text-[10px] text-secondary">Record a new operator qualification. Saving updates the shift allocator instantly.</p>
            </div>

            {hasWriteAccess ? (
              <form onSubmit={handleSaveTraining} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">SELECT OPERATOR</label>
                  <select
                    required
                    value={trAssocId}
                    onChange={(e) => setTrAssocId(e.target.value)}
                    className="py-2 px-3 border border-slate-200 bg-white font-bold rounded-lg focus:ring-1 focus:ring-primary focus:outline-none shadow-premium-sm text-xs cursor-pointer"
                  >
                    <option value="">-- Choose Operator --</option>
                    {associates.filter(a => a.status === 'Active').map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">SELECT COMPLIANT SKILL</label>
                  <select
                    required
                    value={trSkillId}
                    onChange={(e) => setTrSkillId(e.target.value)}
                    className="py-2 px-3 border border-slate-200 bg-white font-bold rounded-lg focus:ring-1 focus:ring-primary focus:outline-none shadow-premium-sm text-xs cursor-pointer"
                  >
                    <option value="">-- Choose Skill --</option>
                    {skills.map(sk => (
                      <option key={sk.id} value={sk.id}>{sk.name} ({sk.id})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">COMPETENCY LEVEL</label>
                    <select
                      value={trLevel}
                      onChange={(e) => setTrLevel(e.target.value as SkillLevel)}
                      className="py-2 px-3 border border-slate-200 bg-white font-bold rounded-lg focus:ring-1 focus:ring-primary focus:outline-none shadow-premium-sm text-xs cursor-pointer"
                    >
                      <option value="Trainee">Trainee</option>
                      <option value="Operator">Operator</option>
                      <option value="Certified">Certified</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">EXPIRY DATE</label>
                    <input
                      type="date"
                      required
                      value={trExpiry}
                      onChange={(e) => setTrExpiry(e.target.value)}
                      className="py-1.5 px-3 border border-slate-200 bg-white font-mono rounded-lg focus:ring-1 focus:ring-primary focus:outline-none shadow-premium-sm text-xs cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">CERTIFIED BY / ASSESSOR</label>
                  <input
                    type="text"
                    required
                    value={trCertifier}
                    onChange={(e) => setTrCertifier(e.target.value)}
                    className="py-2 px-3 border border-slate-200 bg-slate-50 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none shadow-premium-sm text-xs"
                    placeholder="e.g. B. Sengupta (Quality Lead)"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-slate-800 text-[10px] font-label-caps tracking-wider uppercase shadow-premium-md hover:shadow-premium-lg cursor-pointer transition-all"
                >
                  Confirm Certification Log
                </button>
              </form>
            ) : (
              <div className="bg-rose-50 text-rose-800 text-xs p-4 rounded-lg border border-rose-100 font-semibold text-center mt-sm">
                Access Denied: Only HR coordinators and Plant Admins can log training records.
              </div>
            )}
          </div>
        )}

        {/* Sub-tab: Bulk Import */}
        {activeSubTab === 'bulk' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-lg p-6 shadow-premium-md flex flex-col gap-5 animate-slide-up w-full">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-on-surface">CSV Workforce Importer</h2>
                <p className="text-[10px] text-secondary">Pre-configure operators and skills in bulk.</p>
              </div>
              <button 
                onClick={downloadTemplate}
                className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer shadow-premium-sm font-label-caps tracking-wider"
              >
                <span className="material-symbols-outlined text-xs">download</span> Sample Template
              </button>
            </div>

            {hasWriteAccess ? (
              <div className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">PASTE CSV CONTENT</label>
                  <textarea
                    rows={6}
                    value={bulkCsvText}
                    onChange={(e) => setBulkCsvText(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-lg font-mono text-[10px] focus:ring-1 focus:ring-primary focus:outline-none bg-slate-50 shadow-premium-sm"
                    placeholder="employee_id,name,category,skills&#10;EMP125,A. Banerjee,Company,BLADE_OPT:Expert:2027-12-31;HYGIENE_L2:Certified:2026-10-15&#10;EMP126,M. Sen,Contract,SPICE_MIX:Operator:2026-08-30"
                  />
                </div>

                {importStatus.type && (
                  <div className={`p-3 rounded-lg text-xs font-semibold border ${
                    importStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-950' : 'bg-rose-50 border-rose-100 text-rose-950'
                  }`}>
                    {importStatus.message}
                  </div>
                )}

                <button
                  onClick={handleCsvImport}
                  className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-slate-800 text-[10px] font-label-caps tracking-wider uppercase shadow-premium-md hover:shadow-premium-lg cursor-pointer transition-all"
                >
                  Process CSV Import
                </button>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[9px] text-secondary leading-relaxed">
                  <span className="font-bold text-primary block mb-1">CSV Guidelines:</span>
                  1. Headers must match: **employee_id,name,category,skills**<br/>
                  2. Category values: **Company**, **Contract**, or **NTCI**.<br/>
                  3. Skills format: **SKILL_CODE:Level:ExpiryDate** separated by semicolon. (Level: Trainee/Operator/Certified/Expert. Date: YYYY-MM-DD).
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 text-rose-800 text-xs p-4 rounded-lg border border-rose-100 font-semibold text-center mt-sm">
                Access Denied: Only HR coordinators and Plant Admins can perform bulk import actions.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
