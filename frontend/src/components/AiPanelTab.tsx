import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AiPanelTab: React.FC = () => {
  const {
    associates,
    productionLines,
    shifts,
    autoAllocateLine,
    role
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState('SHIFT-A');
  const [targetLineId, setTargetLineId] = useState('LINE-01');
  const [targetShiftId, setTargetShiftId] = useState('SHIFT-A');
  const [optimizationPriority, setOptimizationPriority] = useState('throughput'); // 'throughput' | 'workload' | 'overrides'
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastRunTime, setLastRunTime] = useState('05:45 AM');

  // Filter pool
  const filteredPool = associates.filter(a => {
    if (a.status !== 'Active') return false;
    
    // category filter
    if (categoryFilter !== 'ALL') {
      const isCompany = a.category === 'Company';
      if (categoryFilter === 'Company' && !isCompany) return false;
      if (categoryFilter === 'Contract' && isCompany) return false;
    }
    
    return true;
  });

  const handleRunEngine = () => {
    if (role !== 'Production Supervisor' && role !== 'Plant Admin') {
      alert('Access Denied: Only Production Supervisors and Plant Admins can run the allocation engine.');
      return;
    }
    setIsOptimizing(true);
    setTimeout(() => {
      autoAllocateLine(new Date().toISOString().split('T')[0], targetShiftId, targetLineId).then(res => {
        setIsOptimizing(false);
        const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setLastRunTime(now);
        alert(`AI Optimization complete! Automatically allocated ${res.allocatedCount} operators to workstations on line ${targetLineId}.`);
      });
    }, 1500);
  };

  // Profile picture map matching mockup exactly
  const getAvatarUrl = (name: string) => {
    if (name.includes("Marcus")) {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuDfI-JZyjb1pQwgoRAtI8MGXNX2TkA8IMEQGilu9TafNco6H0681KiHavWtbDCOinqxPmMVNW7cH2PGWBix5r5qN2C9dtJepLRZ5jQe-w5EM4EAd4HpvXjXE2ZjUfZ8L0JYCnIpFNelIEATQDAcZpx-hcSk2br-2DUV4G-gnc11DusyAddAz185_iYFO8pJdibyEO4J1XRizRZ5LQl04mYp3jucUv_Ldv1I8ajvM3NZ3OargpKyQvu6reWcSh6mOS_F6lv4y82etqE";
    }
    if (name.includes("Sarah")) {
      return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80";
    }
    if (name.includes("David")) {
      return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80";
    }
    const malePortraits = [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
    ];
    const femalePortraits = [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
    ];
    const isFemale = name.match(/[aieou]$/i) || name.includes("Elena") || name.includes("Linda") || name.includes("Hart");
    const list = isFemale ? femalePortraits : malePortraits;
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return list[hash % list.length];
  };

  // Mock employee specific details matching mockup
  const getEmployeeMockDetails = (name: string) => {
    if (name.includes("Sarah") || name.includes("Jenkins")) {
      return { id: "#49012", role: "PRIMARY PACKAGING", level: "CERTIFIED L3", levelClass: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    }
    if (name.includes("Marcus") || name.includes("Thorne") || name.includes("Chen")) {
      return { id: "#49105", role: "FRYING UNIT", level: "MASTER CLASS", levelClass: "bg-emerald-50 text-emerald-750 border-emerald-100" };
    }
    if (name.includes("David") || name.includes("Chen")) {
      return { id: "#48821", role: "QC INSPECTION", level: "EXPERT", levelClass: "bg-emerald-50 text-emerald-800 border-emerald-100" };
    }
    if (name.includes("Elena") || name.includes("Rodriguez")) {
      return { id: "#49220", role: "SLICING & WASHING", level: "STANDARD", levelClass: "bg-slate-100 text-slate-700 border-slate-200" };
    }
    if (name.includes("James") || name.includes("Wilson")) {
      return { id: "#49311", role: "SEASONING STATION", level: "EXPERT", levelClass: "bg-emerald-50 text-emerald-800 border-emerald-100" };
    }
    if (name.includes("Linda") || name.includes("Hart")) {
      return { id: "#49002", role: "QC INSPECTION", level: "CERTIFIED L2", levelClass: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    }
    
    // Default fallback
    return { id: `#${Math.floor(48000 + Math.random() * 2000)}`, role: "GENERAL OPERATIONS", level: "STANDARD", levelClass: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  return (
    <div className="flex-grow flex flex-col lg:flex-row h-full bg-background overflow-hidden animate-fade-in relative p-md gap-md">
      {/* Loading Overlay */}
      {isOptimizing && (
        <div className="absolute inset-0 bg-[#091426]/30 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl animate-fade-in">
          <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-premium-lg flex flex-col items-center gap-4 max-w-xs text-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
            <div>
              <h4 className="font-bold text-xs text-primary uppercase font-mono tracking-wider">Optimizing Allocations</h4>
              <p className="text-[10px] text-secondary mt-1">AI algorithm is matching employee certifications, line priorities, and overtime thresholds...</p>
            </div>
          </div>
        </div>
      )}

      {/* Left Column: Logged-in Employee Pool */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-outline rounded-xl p-6 min-w-0 shadow-sm">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none shrink-0">
          <div>
            <h2 className="text-sm font-bold text-primary uppercase font-mono tracking-wider">Logged-in Employee Pool</h2>
            <p className="text-[10px] text-secondary mt-0.5">Manage and view real-time availability of plant associates.</p>
          </div>

          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-3 border border-outline-variant rounded-lg bg-white font-bold text-[10px] cursor-pointer shadow-premium-sm"
            >
              <option value="ALL">All Categories</option>
              <option value="Company">Company Staff</option>
              <option value="Contract">Contractors</option>
            </select>

            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="py-1.5 px-3 border border-outline-variant rounded-lg bg-white font-bold text-[10px] cursor-pointer shadow-premium-sm"
            >
              {shifts.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Employee Cards Grid */}
        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 min-h-0">
          {filteredPool.length === 0 ? (
            <div className="p-8 border border-dashed border-outline-variant rounded-xl text-center text-secondary text-xs">
              No active employees in the pool matching current filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md pb-md">
              {filteredPool.map(assoc => {
                const avatar = getAvatarUrl(assoc.name);
                const details = getEmployeeMockDetails(assoc.name);
                
                return (
                  <div 
                    key={assoc.id} 
                    className="bg-surface border border-outline rounded-xl p-4 flex gap-4 hover:shadow-premium-md hover:border-primary transition-all shadow-premium-sm select-none"
                  >
                    {/* Photo with active indicator */}
                    <div className="relative shrink-0 w-12 h-12">
                      <img 
                        src={avatar} 
                        alt={assoc.name} 
                        className="w-full h-full object-cover rounded-lg border border-outline-variant shadow-premium-sm"
                      />
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center"></span>
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-xs text-[#0F172A] truncate leading-tight">{assoc.name}</h4>
                        <span className="text-[9px] font-mono text-secondary shrink-0 font-bold">{details.id}</span>
                      </div>
                      
                      {/* Department / Station skill role */}
                      <div className="mt-2 text-[9px] font-bold text-secondary font-mono tracking-wider bg-slate-50 border border-slate-200 px-2 py-0.5 rounded uppercase max-w-fit truncate">
                        {details.role}
                      </div>

                      {/* Certification Level Tag */}
                      <div className={`mt-1.5 text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase max-w-fit ${details.levelClass}`}>
                        {details.level}
                      </div>

                      {/* Ready for Allocation Text */}
                      <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-bold text-emerald-600">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span>Ready for Allocation</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: AI Allocation Controller Side Panel */}
      <div className="w-full lg:w-80 shrink-0 bg-white border border-outline rounded-xl p-6 flex flex-col justify-between shadow-premium-sm overflow-y-auto custom-scrollbar select-none">
        
        <div className="space-y-6">
          {/* System Status block */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-secondary font-mono uppercase tracking-wider">
              <span>System Status</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Idle - Ready
              </span>
            </div>
            
            {/* Stats widgets */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-slate-50 border border-outline-variant rounded-xl p-3.5 shadow-premium-sm">
                <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Logged In</span>
                <div className="text-xl font-bold text-[#0F172A] mt-1">42</div>
                <span className="text-[8px] text-secondary/70">Associates</span>
              </div>
              <div className="bg-slate-50 border border-outline-variant rounded-xl p-3.5 shadow-premium-sm">
                <span className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Pending</span>
                <div className="text-xl font-bold text-[#0F172A] mt-1">15</div>
                <span className="text-[8px] text-secondary/70">Workstations</span>
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant pt-5">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">Trigger Automated Allocation</h3>
            
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Target Production Line</label>
                <select
                  value={targetLineId}
                  onChange={(e) => setTargetLineId(e.target.value)}
                  className="py-2 px-3 border border-outline-variant rounded-lg bg-white font-bold text-xs cursor-pointer shadow-premium-sm"
                >
                  {productionLines.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Operational Shift</label>
                <select
                  value={targetShiftId}
                  onChange={(e) => setTargetShiftId(e.target.value)}
                  className="py-2 px-3 border border-outline-variant rounded-lg bg-white font-bold text-xs cursor-pointer shadow-premium-sm"
                >
                  {shifts.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.timings})</option>
                  ))}
                </select>
              </div>

              {/* Optimization priority radio buttons */}
              <div className="flex flex-col gap-2 pt-1.5">
                <label className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Optimization Priority</label>
                
                <label className="flex items-center justify-between border border-outline-variant rounded-lg px-3 py-2 bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-premium-sm">
                  <span className="text-[11px] font-semibold text-slate-800">Maximize Throughput</span>
                  <input
                    type="radio"
                    name="priority"
                    checked={optimizationPriority === 'throughput'}
                    onChange={() => setOptimizationPriority('throughput')}
                    className="accent-primary cursor-pointer w-3.5 h-3.5"
                  />
                </label>

                <label className="flex items-center justify-between border border-outline-variant rounded-lg px-3 py-2 bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-premium-sm">
                  <span className="text-[11px] font-semibold text-slate-800">Balance Workload</span>
                  <input
                    type="radio"
                    name="priority"
                    checked={optimizationPriority === 'workload'}
                    onChange={() => setOptimizationPriority('workload')}
                    className="accent-primary cursor-pointer w-3.5 h-3.5"
                  />
                </label>

                <label className="flex items-center justify-between border border-outline-variant rounded-lg px-3 py-2 bg-white cursor-pointer hover:bg-slate-50 transition-colors shadow-premium-sm">
                  <span className="text-[11px] font-semibold text-slate-800">Minimize Overrides</span>
                  <input
                    type="radio"
                    name="priority"
                    checked={optimizationPriority === 'overrides'}
                    onChange={() => setOptimizationPriority('overrides')}
                    className="accent-primary cursor-pointer w-3.5 h-3.5"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Run engine button & panel status logs */}
        <div className="space-y-4 pt-6 border-t border-outline-variant mt-6">
          <button
            type="button"
            onClick={handleRunEngine}
            className="w-full py-3 bg-[#091426] text-white font-bold rounded-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-premium-md cursor-pointer text-[10px] uppercase font-mono tracking-wider"
          >
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            <span>Run AI Allocation Engine</span>
          </button>
          
          <p className="text-[9px] text-secondary/80 text-center leading-relaxed font-medium">
            Running the engine will automatically assign associates to optimal snack processing roles like Frying Unit or Seasoning Station based on certifications.
          </p>
          
          <div className="flex justify-between items-center text-[9px] font-bold text-secondary uppercase font-mono tracking-wider pt-2 border-t border-slate-100 px-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              <span>Last Run: {lastRunTime}</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="material-symbols-outlined text-[12px] font-bold">check_circle</span>
              <span>Auto-Sync Enabled</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
