import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AuditLogs: React.FC = () => {
  const { auditLogs } = useApp();

  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtering logs
  const filteredLogs = auditLogs.filter(log => {
    // Action Type filter
    if (filterAction !== 'ALL') {
      if (filterAction === 'OVERRIDE' && log.actionType !== 'OVERRIDE_ALLOCATION') return false;
      if (filterAction === 'ALLOCATION' && log.actionType !== 'ALLOCATION_CONFIRMED') return false;
      if (filterAction === 'TRAINING' && log.actionType !== 'TRAINING_ADDED') return false;
      if (filterAction === 'MASTER_DATA' && log.actionType !== 'MASTER_DATA_UPDATED') return false;
    }

    // Text search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchText = `${log.details} ${log.actionType} ${log.userId} ${log.userRole}`.toLowerCase();
      return matchText.includes(query);
    }

    return true;
  });

  // Export filtered logs as CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No logs available to export.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,ID,Timestamp,Action Type,User,Role,Details\n";
    filteredLogs.forEach(log => {
      const cleanDetails = log.details.replace(/"/g, '""');
      csvContent += `"${log.id}","${log.timestamp}","${log.actionType}","${log.userId}","${log.userRole}","${cleanDetails}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `snackpro_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export filtered logs as JSON
  const handleExportJSON = () => {
    if (filteredLogs.length === 0) {
      alert('No logs available to export.');
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `snackpro_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background select-none animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center px-margin-desktop h-16 w-full border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-headline-md font-bold">terminal</span>
          <h1 className="font-headline-md text-base font-bold text-primary">Audit Trail & Compliance Logs</h1>
        </div>
        
        {/* Export Buttons */}
        <div className="flex gap-3 select-none">
          <button
            onClick={handleExportCSV}
            className="py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold rounded-lg flex items-center gap-1.5 text-primary cursor-pointer shadow-premium-sm transition-all font-label-caps tracking-wider hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-sm">download</span> EXPORT CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold rounded-lg flex items-center gap-1.5 text-primary cursor-pointer shadow-premium-sm transition-all font-label-caps tracking-wider hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-sm">download</span> EXPORT JSON
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-margin-desktop flex flex-col gap-6 animate-fade-in">
        
        {/* Filters bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-premium-sm flex flex-col md:flex-row gap-5 justify-between">
          <div className="flex flex-wrap gap-5 items-center">
            {/* Action Type Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-secondary font-mono tracking-wider">ACTION CATEGORY</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white font-bold cursor-pointer shadow-premium-sm text-xs"
              >
                <option value="ALL">All Actions</option>
                <option value="ALLOCATION">Roster Allocations</option>
                <option value="OVERRIDE">Compliance Overrides</option>
                <option value="TRAINING">Training Certifications</option>
                <option value="MASTER_DATA">Master Data Updates</option>
              </select>
            </div>

            {/* Total Count Display */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-secondary font-mono tracking-wider invisible md:visible">COUNT</label>
              <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex gap-2 items-center text-xs font-semibold shadow-premium-sm h-[34px]">
                <span className="text-secondary">Loaded Logs:</span>
                <span className="font-mono font-bold bg-primary text-white px-2 py-0.5 rounded text-[10px]">
                  {filteredLogs.length}
                </span>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex flex-col gap-1.5 md:w-80">
            <label className="text-[9px] font-bold text-secondary font-mono tracking-wider">SEARCH KEYWORDS</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-sm text-secondary">search</span>
              <input
                type="text"
                placeholder="Search operator, supervisor, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-premium-sm"
              />
            </div>
          </div>
        </div>

        {/* Logs Table Area */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg shadow-premium-sm bg-white custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-secondary/80 gap-3 py-20">
              <span className="material-symbols-outlined text-4xl text-secondary">history</span>
              <span className="text-xs font-bold font-label-caps">No logs matched this query</span>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-on-surface font-semibold font-mono text-[9px] tracking-widest uppercase font-label-caps sticky top-0 z-10 select-none">
                  <th className="p-3.5">TIMESTAMP</th>
                  <th className="p-3.5">ACTION</th>
                  <th className="p-3.5">DETAILS</th>
                  <th className="p-3.5">USER ID</th>
                  <th className="p-3.5">USER ROLE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const isOverride = log.actionType === 'OVERRIDE_ALLOCATION';
                  const rowClass = isOverride ? 'bg-rose-50/20 hover:bg-rose-50/40 transition-colors' : 'hover:bg-slate-50/50 transition-colors';
                  
                  let badgeStyle = 'bg-slate-50 text-slate-700 border-slate-200';
                  if (log.actionType === 'OVERRIDE_ALLOCATION') {
                    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-100 font-bold';
                  } else if (log.actionType === 'ALLOCATION_CONFIRMED') {
                    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  } else if (log.actionType === 'TRAINING_ADDED') {
                    badgeStyle = 'bg-blue-50 text-primary border-blue-100';
                  } else if (log.actionType === 'MASTER_DATA_UPDATED') {
                    badgeStyle = 'bg-purple-50 text-purple-700 border-purple-100';
                  }

                  return (
                    <tr key={log.id} className={rowClass}>
                      <td className="p-3.5 font-mono text-secondary whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5 select-none whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider border shadow-premium-sm ${badgeStyle}`}>
                          {log.actionType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-on-surface max-w-[450px]">
                        {isOverride ? (
                          <div className="flex gap-1.5 items-start">
                            <span className="material-symbols-outlined text-amber-500 text-base leading-none mt-0.5">warning</span>
                            <span className="leading-relaxed">{log.details}</span>
                          </div>
                        ) : (
                          <span className="leading-relaxed">{log.details}</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-primary">{log.userId}</td>
                      <td className="p-3.5 font-medium text-secondary">{log.userRole}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};
