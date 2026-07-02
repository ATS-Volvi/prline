import React from 'react';
import { useApp } from '../context/AppContext';

export const Analytics: React.FC = () => {
  const { skills, associates, associateSkills, workstations } = useApp();

  const currentDate = new Date('2026-06-25');

  // Heatmap calculation: Skill vs Category counts
  const skillCoverageData = skills.map(sk => {
    const trained = associateSkills.filter(s => s.skillId === sk.id);
    const activeTrained = trained.filter(s => {
      const assoc = associates.find(a => a.id === s.associateId);
      const isNotExpired = new Date(s.expiryDate) >= currentDate;
      return assoc?.status === 'Active' && isNotExpired;
    });

    const expertCount = activeTrained.filter(s => s.level === 'Expert').length;
    const certCount = activeTrained.filter(s => s.level === 'Certified').length;
    const operatorCount = activeTrained.filter(s => s.level === 'Operator').length;
    const traineeCount = activeTrained.filter(s => s.level === 'Trainee').length;
    const totalCount = activeTrained.length;

    // How many active workstations require this skill?
    const wsRequiring = workstations.filter(w => w.requiredSkillId === sk.id).length;

    // Coverage adequacy rating:
    // Green (Adequate): totalCount > wsRequiring
    // Amber (Tight): totalCount === wsRequiring
    // Red (Critical Gap): totalCount < wsRequiring
    let adequacy: 'Adequate' | 'Tight' | 'Critical' = 'Adequate';
    if (totalCount < wsRequiring) adequacy = 'Critical';
    else if (totalCount === wsRequiring) adequacy = 'Tight';

    return {
      skillId: sk.id,
      name: sk.name,
      expertCount,
      certCount,
      operatorCount,
      traineeCount,
      totalCount,
      wsRequiring,
      adequacy,
    };
  });

  // Training Needs: Expiring certifications in next 90 days or already expired
  const expiringRecords = associateSkills
    .map(as => {
      const assoc = associates.find(a => a.id === as.associateId);
      const skill = skills.find(s => s.id === as.skillId);
      const expiry = new Date(as.expiryDate);
      const diffTime = expiry.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...as,
        assocName: assoc?.name || 'Unknown',
        assocStatus: assoc?.status || 'Inactive',
        skillName: skill?.name || as.skillId,
        diffDays,
      };
    })
    .filter(r => r.assocStatus === 'Active' && (r.diffDays <= 90))
    .sort((a, b) => a.diffDays - b.diffDays);

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background select-none animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center px-margin-desktop h-16 w-full border-b border-outline-variant shrink-0 bg-surface-container-lowest">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-headline-md font-bold">analytics</span>
          <h1 className="text-base font-bold text-[#0F172A]">Skill Gap & Capacity Analysis</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-margin-desktop flex flex-col gap-6 custom-scrollbar">
        
        {/* Top metrics dashboard */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant shadow-premium-sm flex items-start gap-4 transition-all duration-300 hover:shadow-premium-md hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-xl font-bold shadow-premium-sm">report</span>
            <div>
              <span className="text-[9px] font-label-caps text-secondary font-bold tracking-wider block mb-1">Critical Skill Gaps</span>
              <span className="font-data-mono-lg text-2xl font-bold text-rose-600 block">
                {skillCoverageData.filter(d => d.adequacy === 'Critical').length} Skills
              </span>
              <span className="text-[10px] text-secondary mt-1 block">Configured stations exceed active workforce</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant shadow-premium-sm flex items-start gap-4 transition-all duration-300 hover:shadow-premium-md hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-amber-500 bg-secondary-container border border-outline-variant p-2.5 rounded-lg text-xl font-bold shadow-premium-sm">warning</span>
            <div>
              <span className="text-[9px] font-label-caps text-secondary font-bold tracking-wider block mb-1">Tight Skill Capacity</span>
              <span className="font-data-mono-lg text-2xl font-bold text-amber-600 block">
                {skillCoverageData.filter(d => d.adequacy === 'Tight').length} Skills
              </span>
              <span className="text-[10px] text-secondary mt-1 block">Single operator coverage (No backup safety margin)</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant shadow-premium-sm flex items-start gap-4 transition-all duration-300 hover:shadow-premium-md hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-emerald-600 bg-tertiary-fixed-dim/20 border border-outline-variant p-2.5 rounded-lg text-xl font-bold shadow-premium-sm">check_circle</span>
            <div>
              <span className="text-[9px] font-label-caps text-secondary font-bold tracking-wider block mb-1">Sufficient Depth</span>
              <span className="font-data-mono-lg text-2xl font-bold text-emerald-600 block">
                {skillCoverageData.filter(d => d.adequacy === 'Adequate').length} Skills
              </span>
              <span className="text-[10px] text-secondary mt-1 block">Multiple active operators registered</span>
            </div>
          </div>
        </section>

        {/* Heatmap Grid */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-premium-sm">
          <div className="mb-4">
            <h2 className="font-headline-md text-xs font-bold text-on-surface tracking-tight uppercase">Skill Capacity & Adequacy Heatmap</h2>
            <p className="text-[10px] text-secondary">Roster metrics of qualified operators compared with operational demand</p>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar border border-outline-variant rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
                  <th className="p-3.5">SKILL ID</th>
                  <th className="p-3.5">SKILL NAME</th>
                  <th className="p-3.5 text-center">EXPERT</th>
                  <th className="p-3.5 text-center">CERTIFIED</th>
                  <th className="p-3.5 text-center">OPERATOR</th>
                  <th className="p-3.5 text-center">TRAINEE</th>
                  <th className="p-3.5 text-center bg-surface-container-low">TOTAL AVAILABLE</th>
                  <th className="p-3.5 text-center bg-surface-container-low">STATIONS REQUIRING</th>
                  <th className="p-3.5 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {skillCoverageData.map(data => {
                  let statusBg = 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant border-outline-variant';
                  let statusText = 'ADEQUATE';
                  if (data.adequacy === 'Critical') {
                    statusBg = 'bg-rose-50 text-rose-700 border-rose-100';
                    statusText = 'CRITICAL GAP';
                  } else if (data.adequacy === 'Tight') {
                    statusBg = 'bg-secondary-container text-on-secondary-container border-outline-variant';
                    statusText = 'TIGHT COVER';
                  }

                  return (
                    <tr key={data.skillId} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-primary">{data.skillId}</td>
                      <td className="p-3.5 font-semibold text-on-surface">{data.name}</td>
                      <td className="p-3.5 text-center font-bold font-mono text-blue-900">{data.expertCount || '-'}</td>
                      <td className="p-3.5 text-center font-bold font-mono text-indigo-600">{data.certCount || '-'}</td>
                      <td className="p-3.5 text-center font-bold font-mono text-on-tertiary-fixed-variant">{data.operatorCount || '-'}</td>
                      <td className="p-3.5 text-center font-bold font-mono text-amber-600">{data.traineeCount || '-'}</td>
                      <td className="p-3.5 text-center font-extrabold bg-surface-container-low text-primary font-mono">{data.totalCount}</td>
                      <td className="p-3.5 text-center font-extrabold bg-surface-container-low text-secondary font-mono">{data.wsRequiring}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider border shadow-premium-sm ${statusBg}`}>
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Training Needs Table */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-premium-sm mb-4">
          <div className="mb-4">
            <h2 className="font-headline-md text-xs font-bold text-on-surface tracking-tight uppercase">Training Needs & Expiring Certifications</h2>
            <p className="text-[10px] text-secondary">Active operators whose qualifications expire inside 90 days. Retraining should be prioritized.</p>
          </div>

          <div className="overflow-x-auto custom-scrollbar border border-outline-variant rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps">
                  <th className="p-3.5">ASSOCIATE</th>
                  <th className="p-3.5">EMPLOYEE ID</th>
                  <th className="p-3.5">SKILL CERTIFICATE</th>
                  <th className="p-3.5">CURRENT LEVEL</th>
                  <th className="p-3.5">EXPIRY DATE</th>
                  <th className="p-3.5">DAYS REMAINING</th>
                  <th className="p-3.5 text-right select-none">ACTION REQUIRED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiringRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-secondary italic">
                      No expiring training certifications found. All certifications healthy.
                    </td>
                  </tr>
                ) : (
                  expiringRecords.map((rec, idx) => {
                    const isExpired = rec.diffDays < 0;
                    
                    let daysBg = 'bg-surface-container-low text-secondary border-outline-variant';
                    if (isExpired) {
                      daysBg = 'bg-rose-50 text-rose-700 border-rose-100 font-bold';
                    } else if (rec.diffDays <= 7) {
                      daysBg = 'bg-rose-50 text-rose-700 border border-rose-100 font-bold';
                    } else if (rec.diffDays <= 30) {
                      daysBg = 'bg-secondary-container text-on-secondary-container border border-outline-variant font-bold';
                    }

                    return (
                      <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="p-3.5 font-bold text-on-surface">{rec.assocName}</td>
                        <td className="p-3.5 font-mono font-bold text-primary">{rec.associateId}</td>
                        <td className="p-3.5 font-mono font-bold text-secondary">{rec.skillId} ({rec.skillName})</td>
                        <td className="p-3.5 font-medium">{rec.level}</td>
                        <td className="p-3.5 font-mono text-secondary">{rec.expiryDate}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] border shadow-premium-sm ${daysBg}`}>
                            {isExpired ? `EXPIRED (${Math.abs(rec.diffDays)}d ago)` : `${rec.diffDays} Days`}
                          </span>
                        </td>
                        <td className="p-3.5 text-right select-none">
                          <button
                            onClick={() => alert(`Roster request generated for retraining ${rec.assocName} on skill ${rec.skillId}.`)}
                            className="px-2.5 py-1 border border-primary text-primary hover:bg-primary hover:text-white text-[9px] font-bold rounded-lg transition-all shadow-premium-sm cursor-pointer font-label-caps tracking-wider"
                          >
                            SCHEDULE RETRAINING
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};
