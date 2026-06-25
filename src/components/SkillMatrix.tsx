import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import type { SkillLevel, AssociateSkill } from '../types';

const PAGE_SIZE = 25;

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

  // ── Search & Filter state ─────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Contract' | 'Company' | 'NTCI'>('ALL');
  const [filterSkill, setFilterSkill] = useState('ALL');
  const [filterExpiry, setFilterExpiry] = useState<'ALL' | 'expired' | 'expiring_soon' | 'valid'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Training form states ──────────────────────────────────────────────────
  const [trSearch, setTrSearch] = useState('');
  const [trAssocId, setTrAssocId] = useState('');
  const [trAssocName, setTrAssocName] = useState('');
  const [trSkillId, setTrSkillId] = useState('');
  const [trLevel, setTrLevel] = useState<SkillLevel>('Operator');
  const [trCertifier, setTrCertifier] = useState('T. Supervisor');
  const [trExpiry, setTrExpiry] = useState('2027-12-31');
  const [showTrDropdown, setShowTrDropdown] = useState(false);

  // ── Bulk import state ─────────────────────────────────────────────────────
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const today = useMemo(() => new Date(), []);
  const in30Days = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; }, []);

  // ── O(1) skill lookup: Map<associateId, Map<skillId, AssociateSkill>> ─────
  const skillMap = useMemo(() => {
    const map = new Map<string, Map<string, AssociateSkill>>();
    for (const s of associateSkills) {
      if (!map.has(s.associateId)) map.set(s.associateId, new Map());
      map.get(s.associateId)!.set(s.skillId, s);
    }
    return map;
  }, [associateSkills]);

  // ── Per-associate expiry summary (for the expiry filter) ─────────────────
  const assocExpiryStatus = useMemo(() => {
    const result = new Map<string, 'expired' | 'expiring_soon' | 'valid'>();
    for (const assoc of associates) {
      const aSkills = skillMap.get(assoc.id);
      if (!aSkills) { result.set(assoc.id, 'valid'); continue; }
      let worst: 'expired' | 'expiring_soon' | 'valid' = 'valid';
      for (const s of aSkills.values()) {
        const exp = new Date(s.expiryDate);
        if (exp < today) { worst = 'expired'; break; }
        if (exp <= in30Days) worst = 'expiring_soon';
      }
      result.set(assoc.id, worst);
    }
    return result;
  }, [associates, skillMap, today, in30Days]);

  // ── Filtered + searched associates ───────────────────────────────────────
  const filteredAssociates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return associates.filter(a => {
      if (filterCategory !== 'ALL' && a.category !== filterCategory) return false;
      if (filterExpiry !== 'ALL' && assocExpiryStatus.get(a.id) !== filterExpiry) return false;
      if (filterSkill !== 'ALL') {
        const aSkills = skillMap.get(a.id);
        if (!aSkills || !aSkills.has(filterSkill)) return false;
      }
      if (q && !a.name.toLowerCase().includes(q) && !a.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [associates, search, filterCategory, filterExpiry, filterSkill, skillMap, assocExpiryStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredAssociates.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageAssociates = filteredAssociates.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page on filter change
  const handleSearch = useCallback((v: string) => { setSearch(v); setCurrentPage(1); }, []);
  const handleCategoryFilter = useCallback((v: any) => { setFilterCategory(v); setCurrentPage(1); }, []);
  const handleSkillFilter = useCallback((v: string) => { setFilterSkill(v); setCurrentPage(1); }, []);
  const handleExpiryFilter = useCallback((v: any) => { setFilterExpiry(v); setCurrentPage(1); }, []);

  // ── Training form: searchable combobox ────────────────────────────────────
  const trFilteredAssociates = useMemo(() => {
    const q = trSearch.trim().toLowerCase();
    if (!q) return associates.filter(a => a.status === 'Active').slice(0, 8);
    return associates
      .filter(a => a.status === 'Active' && (a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [associates, trSearch]);

  const handleSaveTraining = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trAssocId || !trSkillId) { alert('Please select both associate and skill.'); return; }
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
    setTrAssocId(''); setTrAssocName(''); setTrSearch(''); setTrSkillId('');
  };

  const handleCsvImport = () => {
    if (!bulkCsvText.trim()) { setImportStatus({ type: 'error', message: 'Please paste valid CSV content first.' }); return; }
    setImportStatus({ type: 'success', message: 'Importing...' });
    bulkImportAssociates(bulkCsvText).then(res => {
      setImportStatus({ type: res.success ? 'success' : 'error', message: res.message });
      if (res.success) setBulkCsvText('');
    }).catch(err => setImportStatus({ type: 'error', message: err.message || 'Import failed.' }));
  };

  const downloadTemplate = () => {
    const csv = "data:text/csv;charset=utf-8,employee_id,name,category,skills\nEMP120,Rajesh Sen,Contract,BLADE_OPT:Certified:2027-06-30;HYGIENE_L2:Operator:2026-12-31\n";
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'snackpro_import_template.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const hasWriteAccess = role === 'Plant Admin' || role === 'HR / Training Coordinator';

  // ── Cell renderer (memoized style lookup) ────────────────────────────────
  const getCellStyle = (level: SkillLevel, expired: boolean) => {
    if (expired) return 'bg-rose-50 text-rose-700 border-rose-100 font-bold';
    if (level === 'Expert') return 'bg-blue-50 text-primary border-blue-100 font-bold';
    if (level === 'Certified') return 'bg-indigo-50 text-indigo-700 font-bold border-indigo-100';
    if (level === 'Operator') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  // Expiry badge for filter button
  const expiryBadge = (status: string) => {
    if (status === 'expired') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (status === 'expiring_soon') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background select-none animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center px-margin-desktop h-16 w-full border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-headline-md font-bold">military_tech</span>
          <h1 className="font-headline-md text-base font-bold text-primary">Skill & Training Matrix</h1>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-premium-sm">
          {(['matrix', 'training', 'bulk'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${activeSubTab === tab ? 'bg-white text-primary shadow-premium-sm border border-slate-200' : 'text-secondary hover:text-primary'}`}>
              {tab === 'matrix' ? 'Compliance Grid' : tab === 'training' ? 'Log Training' : 'Bulk Import CSV'}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-margin-desktop flex flex-col gap-4">

        {/* ── Compliance Grid ───────────────────────────────────────────── */}
        {activeSubTab === 'matrix' && (
          <div className="flex-1 flex flex-col gap-3 overflow-hidden animate-fade-in">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-[320px]">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-sm pointer-events-none">search</span>
                <input
                  type="text"
                  placeholder="Search by name or ID…"
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm"
                />
                {search && (
                  <button onClick={() => handleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary cursor-pointer">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>

              {/* Category filter */}
              <select value={filterCategory} onChange={e => handleCategoryFilter(e.target.value)}
                className="py-2 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm cursor-pointer">
                <option value="ALL">All Categories</option>
                <option value="Contract">Contract</option>
                <option value="Company">Company</option>
                <option value="NTCI">NTCI</option>
              </select>

              {/* Skill filter */}
              <select value={filterSkill} onChange={e => handleSkillFilter(e.target.value)}
                className="py-2 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm cursor-pointer">
                <option value="ALL">All Skills</option>
                {skills.map(sk => <option key={sk.id} value={sk.id}>{sk.name}</option>)}
              </select>

              {/* Expiry filter */}
              <select value={filterExpiry} onChange={e => handleExpiryFilter(e.target.value)}
                className="py-2 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm cursor-pointer">
                <option value="ALL">All Expiry Status</option>
                <option value="expired">⛔ Expired</option>
                <option value="expiring_soon">⚠️ Expiring in 30 days</option>
                <option value="valid">✅ Valid</option>
              </select>

              {/* Count badge */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] text-secondary font-mono">
                  <span className="font-bold text-on-surface">{filteredAssociates.length}</span> / {associates.length} operators
                </span>
                {(search || filterCategory !== 'ALL' || filterSkill !== 'ALL' || filterExpiry !== 'ALL') && (
                  <button onClick={() => { setSearch(''); setFilterCategory('ALL'); setFilterSkill('ALL'); setFilterExpiry('ALL'); setCurrentPage(1); }}
                    className="text-[9px] font-bold text-rose-600 hover:underline font-label-caps tracking-wider cursor-pointer flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">filter_alt_off</span>CLEAR
                  </button>
                )}
              </div>
            </div>

            {/* Grid Table */}
            <div className="flex-1 overflow-auto border border-slate-200 rounded-lg shadow-premium-sm bg-white custom-scrollbar">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="text-on-surface font-semibold font-mono">
                    <th className="p-3.5 bg-slate-50 min-w-[180px] sticky top-0 left-0 border-r border-b border-slate-200 z-20 font-bold text-[9px] tracking-widest uppercase font-label-caps">
                      OPERATOR
                    </th>
                    {skills.map(sk => (
                      <th key={sk.id} className="p-3.5 text-center font-mono font-bold text-[9px] tracking-widest sticky top-0 bg-slate-50 border-b border-slate-200 z-10 whitespace-nowrap" title={sk.name}>
                        {sk.id}
                      </th>
                    ))}
                    <th className="p-3.5 text-center font-mono font-bold text-[9px] tracking-widest sticky top-0 bg-slate-50 border-b border-slate-200 z-10 whitespace-nowrap">
                      COVERAGE
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageAssociates.length === 0 ? (
                    <tr>
                      <td colSpan={skills.length + 2} className="p-8 text-center text-secondary text-xs">
                        <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">search_off</span>
                        No operators match your filters
                      </td>
                    </tr>
                  ) : pageAssociates.map(assoc => {
                    const aSkills = skillMap.get(assoc.id);
                    const certifiedCount = aSkills ? [...aSkills.values()].filter(s => new Date(s.expiryDate) >= today).length : 0;
                    const coveragePct = skills.length > 0 ? Math.round((certifiedCount / skills.length) * 100) : 0;
                    const expiryStatus = assocExpiryStatus.get(assoc.id);

                    return (
                      <tr key={assoc.id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Sticky name column */}
                        <td className="p-3.5 bg-white sticky left-0 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.015)] z-10 group-hover:bg-slate-50/50">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${expiryStatus === 'expired' ? 'bg-rose-500' : expiryStatus === 'expiring_soon' ? 'bg-amber-400' : 'bg-emerald-400'}`} title={expiryStatus} />
                            <div>
                              <div className="font-bold text-xs text-on-surface leading-tight">{assoc.name}</div>
                              <div className="text-[9px] text-secondary font-mono mt-0.5">{assoc.id} • {assoc.category}</div>
                            </div>
                          </div>
                        </td>

                        {/* Skill cells — O(1) lookup */}
                        {skills.map(sk => {
                          const s = aSkills?.get(sk.id);
                          if (!s) return <td key={sk.id} className="p-3 text-center text-slate-300 font-mono text-[10px]">–</td>;
                          const expired = new Date(s.expiryDate) < today;
                          return (
                            <td key={sk.id} className="p-2 text-center">
                              <div
                                className={`px-2 py-1.5 rounded text-[9px] font-mono leading-none border flex flex-col gap-0.5 justify-center items-center shadow-premium-sm transition-all hover:scale-[1.04] ${getCellStyle(s.level, expired)}`}
                                title={`${s.level} | Certified by ${s.certifiedBy} | Expires: ${s.expiryDate}`}
                              >
                                <span className="font-bold tracking-wider">{s.level.toUpperCase()}</span>
                                {expired
                                  ? <span className="text-[7px] font-bold text-rose-600 uppercase font-sans">EXPIRED</span>
                                  : <span className="text-[7px] opacity-70 font-mono">{s.expiryDate.slice(5).replace('-', '/')}</span>
                                }
                              </div>
                            </td>
                          );
                        })}

                        {/* Coverage column */}
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-[10px] font-bold font-mono ${coveragePct === 100 ? 'text-emerald-600' : coveragePct >= 50 ? 'text-primary' : 'text-rose-600'}`}>
                              {coveragePct}%
                            </span>
                            <div className="w-10 h-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${coveragePct === 100 ? 'bg-emerald-400' : coveragePct >= 50 ? 'bg-primary' : 'bg-rose-400'}`}
                                style={{ width: `${coveragePct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination + Legend */}
            <div className="flex items-center justify-between">
              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-[9px] font-bold font-mono tracking-widest">
                {[
                  { color: 'bg-blue-50 border-blue-100', label: 'EXPERT' },
                  { color: 'bg-indigo-50 border-indigo-100', label: 'CERTIFIED' },
                  { color: 'bg-emerald-50 border-emerald-100', label: 'OPERATOR' },
                  { color: 'bg-amber-50 border-amber-100', label: 'TRAINEE' },
                  { color: 'bg-rose-50 border-rose-100', label: 'EXPIRED' },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 ${color} border rounded`} />{label}
                  </span>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-secondary font-mono">
                    Page <span className="font-bold text-on-surface">{safePage}</span> of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-premium-sm"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>

                  {/* Page number pills */}
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page = i + 1;
                    if (totalPages > 7) {
                      const start = Math.max(1, Math.min(safePage - 3, totalPages - 6));
                      page = start + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${page === safePage ? 'bg-primary text-white border-primary shadow-premium-sm' : 'bg-white border-slate-200 hover:bg-slate-50 text-secondary shadow-premium-sm'}`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-premium-sm"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Log Training ──────────────────────────────────────────────── */}
        {activeSubTab === 'training' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-premium-md flex flex-col gap-5 w-full max-w-[512px] mx-auto animate-slide-up">
            <div>
              <h2 className="text-sm font-bold text-on-surface">Log Training & Recertifications</h2>
              <p className="text-[10px] text-secondary">Record a new operator qualification. Saving updates the shift allocator instantly.</p>
            </div>
            {hasWriteAccess ? (
              <form onSubmit={handleSaveTraining} className="flex flex-col gap-4 text-xs">
                {/* Searchable associate picker */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">SELECT OPERATOR</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-sm pointer-events-none">search</span>
                    <input
                      type="text"
                      placeholder="Search by name or ID…"
                      value={trAssocId ? `${trAssocName} (${trAssocId})` : trSearch}
                      onFocus={() => { if (trAssocId) { setTrSearch(''); setTrAssocId(''); setTrAssocName(''); } setShowTrDropdown(true); }}
                      onChange={e => { setTrSearch(e.target.value); setTrAssocId(''); setTrAssocName(''); setShowTrDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowTrDropdown(false), 150)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm text-xs"
                    />
                  </div>
                  {showTrDropdown && trFilteredAssociates.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-premium-lg z-50 overflow-hidden">
                      {trFilteredAssociates.map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onMouseDown={() => { setTrAssocId(a.id); setTrAssocName(a.name); setTrSearch(''); setShowTrDropdown(false); }}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                          <span className="font-bold text-on-surface text-xs">{a.name}</span>
                          <span className="font-mono text-[9px] text-secondary">{a.id} • {a.category}</span>
                        </button>
                      ))}
                      {trSearch && trFilteredAssociates.length === 8 && (
                        <div className="px-3 py-1.5 text-[9px] text-secondary text-center border-t border-slate-100 font-mono">Showing top 8 — type more to narrow</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">SELECT COMPLIANT SKILL</label>
                  <select required value={trSkillId} onChange={e => setTrSkillId(e.target.value)}
                    className="py-2 px-3 border border-slate-200 bg-white font-bold rounded-lg focus:ring-1 focus:ring-primary focus:outline-none shadow-premium-sm text-xs cursor-pointer">
                    <option value="">-- Choose Skill --</option>
                    {skills.map(sk => <option key={sk.id} value={sk.id}>{sk.name} ({sk.id})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">COMPETENCY LEVEL</label>
                    <select value={trLevel} onChange={e => setTrLevel(e.target.value as SkillLevel)}
                      className="py-2 px-3 border border-slate-200 bg-white font-bold rounded-lg focus:ring-1 focus:ring-primary focus:outline-none shadow-premium-sm text-xs cursor-pointer">
                      <option value="Trainee">Trainee</option>
                      <option value="Operator">Operator</option>
                      <option value="Certified">Certified</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">EXPIRY DATE</label>
                    <input type="date" required value={trExpiry} onChange={e => setTrExpiry(e.target.value)}
                      className="py-1.5 px-3 border border-slate-200 bg-white font-mono rounded-lg focus:ring-1 focus:ring-primary focus:outline-none shadow-premium-sm text-xs cursor-pointer" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">CERTIFIED BY / ASSESSOR</label>
                  <input type="text" required value={trCertifier} onChange={e => setTrCertifier(e.target.value)}
                    className="py-2 px-3 border border-slate-200 bg-slate-50 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none shadow-premium-sm text-xs"
                    placeholder="e.g. B. Sengupta (Quality Lead)" />
                </div>

                <button type="submit"
                  className="w-full mt-2 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-slate-800 text-[10px] font-label-caps tracking-wider uppercase shadow-premium-md hover:shadow-premium-lg cursor-pointer transition-all">
                  Confirm Certification Log
                </button>
              </form>
            ) : (
              <div className="bg-rose-50 text-rose-800 text-xs p-4 rounded-lg border border-rose-100 font-semibold text-center">
                Access Denied: Only HR coordinators and Plant Admins can log training records.
              </div>
            )}
          </div>
        )}

        {/* ── Bulk Import ───────────────────────────────────────────────── */}
        {activeSubTab === 'bulk' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-premium-md flex flex-col gap-5 w-full max-w-[576px] mx-auto animate-slide-up">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-on-surface">CSV Workforce Importer</h2>
                <p className="text-[10px] text-secondary">Pre-configure operators and skills in bulk.</p>
              </div>
              <button onClick={downloadTemplate}
                className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer shadow-premium-sm font-label-caps tracking-wider">
                <span className="material-symbols-outlined text-xs">download</span> Sample Template
              </button>
            </div>

            {hasWriteAccess ? (
              <div className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface-variant/80 font-mono text-[9px] tracking-wider">PASTE CSV CONTENT</label>
                  <textarea rows={6} value={bulkCsvText} onChange={e => setBulkCsvText(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-lg font-mono text-[10px] focus:ring-1 focus:ring-primary focus:outline-none bg-slate-50 shadow-premium-sm"
                    placeholder={"employee_id,name,category,skills\nEMP125,A. Banerjee,Company,BLADE_OPT:Expert:2027-12-31;HYGIENE_L2:Certified:2026-10-15"} />
                </div>

                {importStatus.type && (
                  <div className={`p-3 rounded-lg text-xs font-semibold border ${importStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-950' : 'bg-rose-50 border-rose-100 text-rose-950'}`}>
                    {importStatus.message}
                  </div>
                )}

                <button onClick={handleCsvImport}
                  className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-slate-800 text-[10px] font-label-caps tracking-wider uppercase shadow-premium-md hover:shadow-premium-lg cursor-pointer transition-all">
                  Process CSV Import
                </button>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[9px] text-secondary leading-relaxed">
                  <span className="font-bold text-primary block mb-1">CSV Guidelines:</span>
                  1. Headers: <strong>employee_id,name,category,skills</strong><br />
                  2. Category: <strong>Company</strong>, <strong>Contract</strong>, or <strong>NTCI</strong><br />
                  3. Skills: <strong>SKILL_CODE:Level:YYYY-MM-DD</strong> separated by semicolons
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 text-rose-800 text-xs p-4 rounded-lg border border-rose-100 font-semibold text-center">
                Access Denied: Only HR coordinators and Plant Admins can perform bulk import actions.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
