import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedLineId: (id: string) => void;
}

const AVATAR_MAP: Record<string, string> = {
  'A. Chen': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAydgxGZ1cRjLaaM6nvDCZsKmCjSrcMrbQjRhaCwVaqVJOZFJmdiSMiyiwvJflUMbw1iQptEe_bMHRVATb_gA6FYOJO-aLsE74_QXj4_Kl2FTk7yY_PWzEXQZRaWym7kCQAV-XrBil1UHCD2aiLZXTKTEEZaQKu5mh-LnmJqq1skul-35kvreKpqH6JIvr1jcPc8_6L0AwmQqZzzPD7M1wcAgWduaGVaA4IVwpw9QkniAF5GhpXd6C1fN8SXz-vIaxh1PTeeISjmA',
  'S. Miller': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCM01CfWTqPmpeXCrePxa0bTcQuUzJvGmprl1k8tVanu5W8M-bTfITWtcfm0VUJzpF51hrvmbMr7ggggEdcVA07m3gbd_xcH3Ls1MYXqZF059l0XuIi6SdBVoejGzGjIQdKqNpJqheF1Nx3tDLHVpPxclS4Qj-mk3O1Z87262o-OcaDDS6PgE-an4DvGppsKcYd_H7XTm4gbpXEk3Rl9bwQF_karlJ6OqS3VX33gqXyrCiw9BQVefqaeI6Zf7TlWNbial3X7MQpxQ',
  'D. Petrova': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGMrzqPoWSlXgUo_aZmTB7avgP4_VJr-J6ZfvpBnnpxtKmi4xkgUpVgEE7TbywVtwRZGJN2wHD92zEIiI0q64Np0E93skIyCpx8Dts-AwDHyKd6UvX8kt9dBPtUZXiF8XfXGrdb4tvnW9hB1WfixyAzHIDAGE900jrR3l-Ic-5cyQDKuo5SIXXxexlD0skYbXLKZq6EHrUahDoBgvNHQKVd1eoGt7J2oyAYg9QhvtyA_nau8QT4CEMY7DUwDg1lLWr8NaYMgyqrw'
};

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, setSelectedLineId }) => {
  const { productionLines, workstations, allocations, associates, associateSkills, leaveRecords, role, user } = useApp();

  const [dashboardSubTab, setDashboardSubTab] = useState<'overview' | 'assets'>('overview');
  
  // Asset filter state
  const [filterLine, setFilterLine] = useState('All Lines');
  const [filterStatus, setFilterStatus] = useState('All');

  const [assetsList, setAssetsList] = useState([
    { id: 'CNC-01', name: 'Milling Station', status: 'ACTIVE', load: 94, loadMap: [94, 88, 75, 92, 85, 90, 94, 91, 95, 94], line: 'Assembly Line A' },
    { id: 'CNC-02', name: 'Turning Center', status: 'IDLE', load: 12, loadMap: [10, 8, 12, 15, 12, 8, 10, 11, 14, 12], line: 'Assembly Line A' },
    { id: 'ARM-09', name: 'Pick & Place Bot', status: 'MAINTENANCE', load: 0, loadMap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], line: 'Assembly Line A' },
    { id: 'CNC-04', name: 'Precision Grinder', status: 'CRITICAL', load: 68, loadMap: [85, 90, 88, 92, 94, 91, 68, 68, 68, 68], line: 'Assembly Line A', issue: 'High Vibration' },
    { id: 'PR-01', name: '3D Printer Array', status: 'ACTIVE', load: 88, loadMap: [80, 82, 85, 88, 87, 85, 88, 86, 88, 88], line: 'Assembly Line A' },
    { id: 'WLD-02', name: 'Laser Welder', status: 'ACTIVE', load: 75, loadMap: [70, 72, 75, 74, 76, 73, 75, 74, 75, 75], line: 'Assembly Line A' },
  ]);

  const [criticalAlert, setCriticalAlert] = useState<{ id: string; assetId: string; issue: string; desc: string; time: string } | null>({
    id: 'ALERT-01',
    assetId: 'CNC-04',
    issue: 'High Vibration',
    desc: 'Spindle vibration exceeded threshold (12.4mm/s). Immediate inspection required.',
    time: '2m ago'
  });

  const [timelineActivities, setTimelineActivities] = useState([
    { id: 'ACT-01', title: 'ARM-09 Maintenance Start', desc: 'Routine hydraulic fluid replacement initiated by User: J. Doe.', time: '10:35 AM', color: 'bg-emerald-500' },
    { id: 'ACT-02', title: 'CNC-02 Status Change', desc: 'System transitioned from Active to Idle. Queue cleared.', time: '10:12 AM', color: 'bg-[#64748B]' },
    { id: 'ACT-03', title: 'PR-01 Batch Completed', desc: 'Batch ID #9822 successfully completed (48/48 parts).', time: '09:45 AM', color: 'bg-emerald-500' },
    { id: 'ACT-04', title: 'System Login', desc: 'Administrator session started from Terminal-12.', time: '09:00 AM', color: 'bg-[#64748B]' },
  ]);

  const renderAssetsSubTab = () => {
    const activeAssets = assetsList.filter(a => {
      const lineMatch = filterLine === 'All Lines' || a.line === filterLine;
      const statusMatch = filterStatus === 'All' || a.status === filterStatus;
      return lineMatch && statusMatch;
    });

    const totalUptime = "96.4%";
    const underMaintenanceCount = assetsList.filter(a => a.status === 'MAINTENANCE').length;
    
    const activeUtilization = Math.round(
      assetsList.filter(a => a.status === 'ACTIVE').reduce((sum, curr) => sum + curr.load, 0) / 
      assetsList.filter(a => a.status === 'ACTIVE').length
    ) || 82;

    const criticalCount = criticalAlert ? 1 : 0;

    const handleDispatchTech = (assetId: string) => {
      setAssetsList(prev => prev.map(a => {
        if (a.id === assetId) {
          return { ...a, status: 'MAINTENANCE', load: 0, loadMap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
        }
        return a;
      }));
      setCriticalAlert(null);
      
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setTimelineActivities(prev => [
        {
          id: `ACT-${Date.now()}`,
          title: `${assetId} Technician Dispatched`,
          desc: `Maintenance team dispatched to resolve active warning alert. Status set to Maintenance.`,
          time: timeStr,
          color: 'bg-blue-500'
        },
        ...prev
      ]);
    };

    const handleAcknowledge = (assetId: string) => {
      setAssetsList(prev => prev.map(a => {
        if (a.id === assetId) {
          return { ...a, status: 'ACTIVE' };
        }
        return a;
      }));
      setCriticalAlert(null);
      
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setTimelineActivities(prev => [
        {
          id: `ACT-${Date.now()}`,
          title: `${assetId} Alert Acknowledged`,
          desc: `Critical vibration warning acknowledged by Supervisor. Status set back to Active.`,
          time: timeStr,
          color: 'bg-emerald-500'
        },
        ...prev
      ]);
    };

    return (
      <div className="flex-grow flex flex-col lg:flex-row gap-6 p-margin-desktop overflow-y-auto custom-scrollbar select-text bg-surface-container-low/40">
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-outline-variant rounded-xl p-5 shadow-premium-sm">
            <div>
              <h2 className="text-lg font-bold text-primary">Asset Health & Utilization</h2>
              <p className="text-[11px] text-secondary mt-0.5">Operational status monitoring for all connected hardware.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 select-none">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Filter By Line</label>
                <select
                  value={filterLine}
                  onChange={(e) => setFilterLine(e.target.value)}
                  className="py-1.5 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-[10px] cursor-pointer shadow-premium-sm"
                >
                  <option value="All Lines">All Lines</option>
                  <option value="Assembly Line A">Assembly Line A</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-secondary uppercase font-mono tracking-wider">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="py-1.5 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-bold text-[10px] cursor-pointer shadow-premium-sm"
                >
                  <option value="All">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="IDLE">Idle</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <button
                type="button"
                className="mt-4 py-1.5 px-4 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-slate-900 flex items-center gap-1.5 shadow-premium-md cursor-pointer transition-all uppercase tracking-wider font-mono"
              >
                <span className="material-symbols-outlined text-xs">filter_alt</span> Filter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
              <div>
                <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Total Uptime</p>
                <h3 className="text-xl font-bold text-[#0F172A] mt-1">{totalUptime}</h3>
                <span className="text-[9px] font-bold text-emerald-600 mt-1 inline-block">+1.2%</span>
              </div>
              <span className="material-symbols-outlined text-emerald-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
              <div>
                <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Under Maintenance</p>
                <h3 className="text-xl font-bold text-[#0F172A] mt-1">{underMaintenanceCount} units</h3>
                <span className="text-[9px] text-secondary font-medium mt-1 inline-block">Scheduled</span>
              </div>
              <span className="material-symbols-outlined text-secondary text-lg">build</span>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
              <div>
                <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Avg. Utilization</p>
                <h3 className="text-xl font-bold text-[#0F172A] mt-1">{activeUtilization}%</h3>
                <span className="text-[9px] text-secondary font-medium mt-1 inline-block">Target 85%</span>
              </div>
              <span className="material-symbols-outlined text-secondary text-lg">speed</span>
            </div>

            <div className="bg-white border-l-4 border-l-rose-500 border border-outline-variant rounded-xl p-4 shadow-premium-sm flex justify-between items-start">
              <div>
                <p className="text-[10px] text-secondary font-bold uppercase font-mono tracking-wider">Critical Alerts</p>
                <h3 className="text-xl font-bold text-[#0F172A] mt-1">{criticalCount}</h3>
                <span className={`text-[9px] font-bold mt-1 inline-block ${criticalCount > 0 ? 'text-rose-600 animate-pulse' : 'text-secondary'}`}>
                  {criticalCount > 0 ? 'Action Required' : 'No Action Required'}
                </span>
              </div>
              <span className={`material-symbols-outlined text-lg ${criticalCount > 0 ? 'text-rose-500 animate-pulse' : 'text-secondary'}`} style={{ fontVariationSettings: criticalCount > 0 ? "'FILL' 1" : "" }}>error</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">Assembly Line A</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAssets.map(asset => {
                const isCritical = asset.status === 'CRITICAL';
                
                let cardBorder = "border-outline-variant hover:border-primary";
                let headerBg = "bg-surface-container-lowest";
                
                if (isCritical) {
                  cardBorder = "border-rose-350 bg-rose-50/20";
                  headerBg = "bg-rose-50 border-b border-rose-100";
                }

                return (
                  <div key={asset.id} className={`bg-white border rounded-xl overflow-hidden shadow-premium-sm transition-all flex flex-col ${cardBorder}`}>
                    <div className={`px-4 py-3 border-b flex justify-between items-center ${headerBg} shrink-0`}>
                      <div>
                        <h4 className="font-bold text-xs text-[#0F172A]">{asset.id}</h4>
                        <p className="text-[9px] text-secondary font-medium mt-0.5">{asset.name}</p>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider border shadow-premium-sm ${
                        asset.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        asset.status === 'IDLE' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        asset.status === 'MAINTENANCE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                      }`}>
                        {asset.status}
                      </span>
                    </div>

                    <div className="p-4 flex items-center justify-between gap-6 flex-grow">
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle cx="24" cy="24" r="18" className="stroke-slate-100" strokeWidth="3" fill="transparent" />
                          <circle 
                            cx="24" 
                            cy="24" 
                            r="18" 
                            className={
                              asset.status === 'CRITICAL' ? 'stroke-rose-500' :
                              asset.status === 'MAINTENANCE' ? 'stroke-blue-400' :
                              asset.status === 'IDLE' ? 'stroke-slate-300' : 'stroke-primary'
                            } 
                            strokeWidth="3.5" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 18}
                            strokeDashoffset={2 * Math.PI * 18 * (1 - asset.load / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-bold text-[#0F172A]">{asset.load}%</span>
                      </div>

                      <div className="flex-1 flex flex-col items-end">
                        {isCritical ? (
                          <div className="text-right mb-1">
                            <span className="text-[8px] font-bold text-rose-600 uppercase font-mono tracking-widest animate-pulse">HIGH VIBRATION DETECTED</span>
                          </div>
                        ) : (
                          <span className="text-[8px] font-bold text-secondary uppercase font-mono tracking-wider mb-1">24H Load Map</span>
                        )}

                        <div className="flex items-end gap-[3px] h-8 mt-1 select-none">
                          {asset.loadMap.map((height, barIdx) => {
                            const scaledHeight = (height / 100) * 32;
                            let barBg = "bg-[#091426]";
                            if (asset.status === 'CRITICAL') {
                              barBg = "bg-rose-500";
                            } else if (asset.status === 'MAINTENANCE') {
                              barBg = "bg-blue-200/40";
                            } else if (asset.status === 'IDLE') {
                              barBg = "bg-[#091426]/10";
                            }
                            return (
                              <div 
                                key={barIdx} 
                                style={{ height: `${scaledHeight}px` }} 
                                className={`w-[6px] rounded-t-sm transition-all duration-300 ${barBg}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          <section className="bg-white border border-outline-variant rounded-xl p-5 shadow-premium-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold uppercase font-mono tracking-wider text-[10px]">
              <span className="material-symbols-outlined text-[18px]">report</span>
              <span>Critical Alerts</span>
            </div>
            
            {criticalAlert ? (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-xs text-rose-950">{criticalAlert.assetId}: {criticalAlert.issue}</h4>
                  <span className="text-[8px] text-rose-500 font-mono font-semibold">{criticalAlert.time}</span>
                </div>
                <p className="text-[10px] text-rose-800 leading-normal">{criticalAlert.desc}</p>
                
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => handleDispatchTech(criticalAlert.assetId)}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold cursor-pointer transition-all shadow-premium-sm"
                  >
                    DISPATCH TECH
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAcknowledge(criticalAlert.assetId)}
                    className="flex-1 py-1.5 border border-rose-300 hover:bg-rose-100 text-rose-850 rounded text-[9px] font-bold cursor-pointer transition-all"
                  >
                    ACKNOWLEDGE
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl p-4 flex items-center gap-2.5 text-[10px] font-bold shadow-premium-sm">
                <span className="material-symbols-outlined text-sm font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span>No active critical alerts on connected nodes.</span>
              </div>
            )}
          </section>

          <section className="bg-white border border-outline-variant rounded-xl p-5 shadow-premium-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-secondary font-bold uppercase font-mono tracking-wider text-[10px]">
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>Recent Activity</span>
            </div>
            
            <div className="relative border-l border-outline-variant pl-4 ml-2.5 py-1 space-y-5">
              {timelineActivities.map(activity => (
                <div key={activity.id} className="relative">
                  <div className={`absolute left-[-21px] top-1.5 w-2.5 h-2.5 rounded-full border border-white shadow-premium-sm ${activity.color}`} />
                  
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h5 className="font-bold text-[10.5px] text-[#0F172A]">{activity.title}</h5>
                      <span className="text-[8px] text-secondary font-mono font-semibold shrink-0 mt-0.5">{activity.time}</span>
                    </div>
                    <p className="text-[10px] text-secondary leading-normal mt-0.5">{activity.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-outline-variant rounded-xl p-5 shadow-premium-sm flex flex-col gap-3">
            <div className="flex justify-between items-center text-[10px] font-bold text-secondary uppercase font-mono tracking-wider">
              <span>Connected Nodes</span>
              <span className="text-emerald-600">93.3% Online</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-[#0F172A]">42</span>
              <span className="text-xs text-secondary">/45</span>
            </div>
            
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200/50 shadow-premium-sm">
              <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: '93.3%' }} />
            </div>
          </section>
        </div>
      </div>
    );
  };

  // Get current date string formatted as YYYY-MM-DD (e.g. 2026-06-29)
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Calculations
  const activeLines = productionLines.filter(l => l.status === 'ACTIVE').length;
  const activeLineIds = productionLines.filter(l => l.status === 'ACTIVE').map(l => l.id);
  const activeWorkstations = workstations.filter(w => activeLineIds.includes(w.lineId));
  const totalRequiredStaff = activeWorkstations.length;
  
  // Count unique workstations staffed today across ALL shifts (not just SHIFT-A)
  const todayAllocs = allocations.filter(a => a.date === todayDateStr && activeLineIds.includes(a.lineId));
  const staffedWSIds = new Set(todayAllocs.map(a => a.workstationId));
  const staffedCount = activeWorkstations.filter(w => staffedWSIds.has(w.id)).length;

  const fillRate = totalRequiredStaff ? Math.round((staffedCount / totalRequiredStaff) * 100) : 0;
  const openSlotsCount = Math.max(0, totalRequiredStaff - staffedCount);

  // Alerts calculations
  const alerts: { id: string; type: 'error' | 'warning' | 'info'; message: string; actionText?: string; actionTab?: string }[] = [];

  // Understaffed workstations alert
  productionLines.forEach(line => {
    if (line.status === 'ACTIVE') {
      const lineWS = workstations.filter(w => w.lineId === line.id);
      const currentAllocations = allocations.filter(a => a.date === todayDateStr && a.lineId === line.id);
      const lineStaffedWSIds = new Set(currentAllocations.map((a: any) => a.workstationId));
      if (lineStaffedWSIds.size < lineWS.length) {
        alerts.push({
          id: `understaffed-${line.id}`,
          type: 'warning',
          message: `${line.name} is understaffed: ${lineStaffedWSIds.size} of ${lineWS.length} operational roles filled.`,
          actionText: 'Roster Line',
          actionTab: 'shift_planner',
        });
      }
    }
  });

  // Expiring/Expired certification alert
  const currentDate = new Date();
  associateSkills.forEach(as => {
    const expiry = new Date(as.expiryDate);
    const diffTime = expiry.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const assoc = associates.find(a => a.id === as.associateId);
    
    if (assoc && assoc.status === 'Active') {
      if (diffDays < 0) {
        alerts.push({
          id: `expired-${as.associateId}-${as.skillId}`,
          type: 'error',
          message: `EXPIRED CERTIFICATION: ${assoc.name} holding ${as.skillId} was due on ${as.expiryDate}.`,
          actionText: 'Review Certs',
          actionTab: 'skill_matrix',
        });
      } else if (diffDays <= 7) {
        alerts.push({
          id: `expiring-${as.associateId}-${as.skillId}`,
          type: 'warning',
          message: `RENEWAL DUE: ${assoc.name}'s certification for ${as.skillId} expires in ${diffDays} days.`,
          actionText: 'Renew Skill',
          actionTab: 'skill_matrix',
        });
      }
    }
  });

  // Available pool: operators not yet allocated anywhere today across all shifts
  const availablePool = associates.filter(assoc => {
    if (assoc.status !== 'Active') return false;
    const onLeave = leaveRecords.some(l => l.associateId === assoc.id && l.date === todayDateStr);
    if (onLeave) return false;
    const isAllocated = allocations.some(a => a.date === todayDateStr && a.associateId === assoc.id);
    return !isAllocated;
  });

  const handleLineClick = (lineId: string) => {
    setSelectedLineId(lineId);
    setActiveTab('shift_planner');
  };

  const userName = user?.name || (role === 'Plant Admin' ? 'A. Mukhopadhyay' : role === 'HR / Training Coordinator' ? 'P. Banerjee' : role === 'Plant Manager' ? 'S. Chatterjee' : 'R. Sharma');

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background">
      {/* Top Header */}
      <header className="flex justify-between items-center px-margin-desktop h-16 w-full border-b border-outline-variant shrink-0 select-none z-10 bg-surface-container-lowest">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base font-bold">dashboard</span>
            <h1 className="text-base font-bold text-[#0F172A]" style={{ fontFamily: "'Inter', sans-serif" }}>Plant Dashboard</h1>
          </div>
          
          <div className="h-6 w-[1px] bg-outline-variant hidden sm:block"></div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setDashboardSubTab('overview')}
              className={`pb-1 text-xs font-bold transition-all cursor-pointer relative ${
                dashboardSubTab === 'overview' ? 'text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              Overview
              {dashboardSubTab === 'overview' && (
                <div className="absolute bottom-[-18px] left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setDashboardSubTab('assets')}
              className={`pb-1 text-xs font-bold transition-all cursor-pointer relative ${
                dashboardSubTab === 'assets' ? 'text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              Assets
              {dashboardSubTab === 'assets' && (
                <div className="absolute bottom-[-18px] left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-container-low border border-outline-variant rounded-lg text-[13px] font-normal text-[#64748B]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <span className="material-symbols-outlined text-xs">calendar_today</span>
            <span>{todayStr}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10 text-[11px] font-semibold uppercase tracking-[0.05em] text-primary">
            <span className="material-symbols-outlined text-xs animate-pulse text-[#14b8a6]">schedule</span>
            <span>SHIFT A • ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {dashboardSubTab === 'overview' ? (
        <div className="flex-1 overflow-y-auto p-margin-desktop space-y-6 custom-scrollbar select-none animate-fade-in bg-surface-container-low/40">
        
        {/* Welcome Banner Card (Fixed wrap bug using flex-1 and w-full text layout) */}
        <section className="relative overflow-hidden rounded-xl p-6 md:p-8 bg-gradient-to-r from-[#182c47] to-[#293e5d] text-white shadow-premium-sm animate-fade-in border border-[#182c47]/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-surface-container-lowest/5 rounded-full -translate-y-40 translate-x-40 blur-2xl pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 flex-1 w-full md:w-auto">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/10 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#14b8a6]">
                <span className="material-symbols-outlined text-[10px] animate-pulse">sparkles</span>
                System Operational
              </div>
              <h1 className="text-3xl font-bold leading-tight text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                Welcome back, {userName}!
              </h1>
              <p className="text-[13px] font-normal text-slate-300 leading-normal" style={{ fontFamily: "'Inter', sans-serif" }}>
                Zone 4 Kolkata workforce allocation dashboard is active. You can automatically fill remaining vacancies, resolve compliance exceptions, or track operator skill coverages.
              </p>
            </div>
            
            <div className="flex items-center gap-3 self-start md:self-center shrink-0">
              <button 
                onClick={() => setActiveTab('shift_planner')}
                className="px-4 py-2 bg-[#14b8a6] hover:bg-[#0f9f8e] text-white font-semibold text-[11px] uppercase tracking-[0.05em] rounded-lg transition-all duration-150 shadow-premium-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">bolt</span>
                ALLOCATE SHIFT
              </button>
            </div>
          </div>
        </section>        {/* KPI Grid Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Staffing Ratio */}
          <div className="group relative overflow-hidden bg-surface-container-lowest border border-outline-variant p-4.5 rounded-xl transition-all duration-200 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] font-medium text-[#475569] block mb-1">STAFFING RATIO</span>
                <span className="font-data-mono text-emerald-600">{fillRate}%</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center border border-outline-variant shrink-0">
                <span className="material-symbols-outlined text-lg">check_circle</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-surface-container w-full rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${fillRate}%` }}></div>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-emerald-600 block">▲ NOMINAL COVERAGE</span>
            </div>
          </div>

          {/* Open Slots */}
          <div className="group relative overflow-hidden bg-surface-container-lowest border border-outline-variant p-4.5 rounded-xl transition-all duration-200 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] font-medium text-[#475569] block mb-1">VACANT STATIONS</span>
                <span className="font-data-mono text-error">
                  {openSlotsCount < 10 ? `0${openSlotsCount}` : openSlotsCount}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center border border-outline-variant shrink-0">
                <span className="material-symbols-outlined text-lg">report</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-surface-container w-full rounded-full overflow-hidden">
                <div className="h-full bg-error rounded-full transition-all duration-300" style={{ width: `${totalRequiredStaff ? (openSlotsCount / totalRequiredStaff) * 100 : 0}%` }}></div>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-error block">REQUIRES PLACEMENT</span>
            </div>
          </div>

          {/* Compliance Alerts */}
          <div className="group relative overflow-hidden bg-surface-container-lowest border border-outline-variant p-4.5 rounded-xl transition-all duration-200 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] font-medium text-[#475569] block mb-1">COMPLIANCE GAP</span>
                <span className="font-data-mono text-amber-500">
                  {alerts.length < 10 ? `0${alerts.length}` : alerts.length}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center border border-outline-variant shrink-0">
                <span className="material-symbols-outlined text-lg font-bold">warning</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-surface-container w-full rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${alerts.length ? Math.min(100, alerts.length * 15) : 0}%` }}></div>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-amber-600 block">RE-CERTIFICATIONS DUE</span>
            </div>
          </div>

          {/* Active Lines */}
          <div className="group relative overflow-hidden bg-surface-container-lowest border border-outline-variant p-4.5 rounded-xl transition-all duration-200 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[13px] font-medium text-[#475569] block mb-1">RUNNING LINES</span>
                <span className="font-data-mono text-[#0F172A]">{activeLines}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center border border-outline-variant shrink-0">
                <span className="material-symbols-outlined text-lg">precision_manufacturing</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-surface-container w-full rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(activeLines / productionLines.length) * 100}%` }}></div>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-primary block">/ {productionLines.length} OPERATIONS CHANNELS</span>
            </div>
          </div>
        </section>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-5">
          {/* Left Side: Active Production Lines Grid */}
          <section className="col-span-12 xl:col-span-8 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-headline-md text-xs font-bold text-on-surface tracking-tight uppercase">Active Production Lines</h2>
              <span className="text-[13px] font-normal text-[#64748B] bg-surface-container/80 px-2 py-0.5 rounded border border-outline-variant/50" style={{ fontFamily: "'Inter', sans-serif" }}>Today's Roster Details</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productionLines.map(line => {
                const lineWS = workstations.filter(w => w.lineId === line.id);
                // Count unique workstations staffed on this line today (any shift)
                const lineAlloc = allocations.filter(a => a.date === todayDateStr && a.lineId === line.id);
                const lineStaffedSet = new Set(lineAlloc.map(a => a.workstationId));
                const pct = lineWS.length ? Math.round((lineStaffedSet.size / lineWS.length) * 100) : 0;
                
                let tagColor = 'bg-surface-container-low text-secondary border border-outline-variant/40';
                let indicatorColor = 'bg-slate-400';
                
                if (line.status === 'ACTIVE') {
                  tagColor = pct < 100 ? 'bg-error-container text-on-error-container border border-outline-variant' : 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant border border-emerald-150';
                  indicatorColor = pct < 100 ? 'bg-red-500' : 'bg-emerald-500';
                } else if (line.status === 'HALTED') {
                  tagColor = 'bg-error-container text-on-error-container border border-outline-variant';
                  indicatorColor = 'bg-red-500';
                } else if (line.status === 'MAINTENANCE') {
                  tagColor = 'bg-secondary-container text-on-secondary-container border border-outline-variant';
                  indicatorColor = 'bg-amber-500';
                }
                
                return (
                  <div 
                    key={line.id} 
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4.5 relative flex flex-col justify-between min-h-[180px] shadow-premium-sm transition-all duration-200 hover:shadow-premium-md group"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2 py-0.5 bg-surface-container-low text-[#182c47] font-mono text-[9px] font-bold rounded border border-outline-variant/40 shadow-premium-sm">{line.id}</span>
                      <span className={`font-label-caps text-[8px] font-bold px-2 py-0.5 uppercase rounded ${tagColor}`}>
                        {pct < 100 && line.status === 'ACTIVE' ? 'UNDERSTAFFED' : line.status}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-headline-md font-bold text-xs mb-1.5 text-on-surface">{line.name}</h3>
                      <p className="text-[10px] text-secondary">
                        Running Product: <span className="font-bold text-[#182c47]">{line.status === 'ACTIVE' ? line.currentProduct : 'OFFLINE'}</span>
                      </p>
                    </div>
                    
                    <div className="mt-3.5 space-y-2.5">
                      {line.status === 'ACTIVE' && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-end text-[9px]">
                            <span className="text-secondary font-medium">Roster coverage</span>
                            <span className="font-data-mono-md font-bold">{lineStaffedSet.size} / {lineWS.length} filled</span>
                          </div>
                          <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${indicatorColor}`} 
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
 
                      <div className="pt-2 border-t border-outline-variant flex justify-between items-center">
                        <span className="font-label-caps text-[8px] text-secondary font-bold">
                          {lineWS.length} ACTIVE STATIONS
                        </span>
                        {line.status === 'ACTIVE' ? (
                          <button 
                            onClick={() => handleLineClick(line.id)}
                            className="flex items-center gap-0.5 text-primary font-bold hover:underline font-label-caps text-[9px] tracking-wider cursor-pointer"
                          >
                            MANAGE <span className="material-symbols-outlined text-xs transition-transform group-hover:translate-x-0.5">arrow_right_alt</span>
                          </button>
                        ) : (
                          <span className="text-[9px] text-secondary/55 italic font-label-caps">STANDBY</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Side: Operational Alerts & Gaps */}
          <section className="col-span-12 xl:col-span-4 flex flex-col">
            <h2 className="font-headline-md text-xs font-bold text-on-surface tracking-tight mb-3 uppercase">Compliance Alerts & Gaps</h2>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex-1 flex flex-col gap-2.5 max-h-[390px] overflow-y-auto custom-scrollbar shadow-premium-sm">
              {alerts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-secondary py-12 gap-2">
                  <div className="w-10 h-10 bg-tertiary-fixed-dim/20 border border-outline-variant text-emerald-600 rounded-lg flex items-center justify-center shadow-premium-sm">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                  </div>
                  <p className="text-[9px] font-bold font-label-caps text-emerald-800 tracking-wider">SYSTEM SECURE</p>
                  <p className="text-[10px] text-center text-on-surface-variant/80 px-1 leading-relaxed">No expired safety qualifications or understaffed machines reported.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {alerts.map((alert, idx) => {
                    const isError = alert.type === 'error';
                    const alertBg = isError ? 'bg-rose-50/40 hover:bg-rose-50/60' : 'bg-secondary-container/30 hover:bg-secondary-container/50';
                    const alertBorder = isError ? 'border-l-rose-500 border-rose-200' : 'border-l-amber-500 border-outline-variant';
                    const iconColor = isError ? 'text-rose-600' : 'text-amber-600';
                    const icon = isError ? 'report' : 'warning';
 
                    return (
                      <div 
                        key={alert.id || idx} 
                        className={`p-3 bg-surface-container-lowest border border-l-4 rounded-lg shadow-premium-sm ${alertBorder} ${alertBg} flex flex-col justify-between gap-1.5 transition-colors`}
                      >
                        <div className="flex gap-1.5 items-start">
                          <span className={`material-symbols-outlined text-sm ${iconColor} shrink-0`}>{icon}</span>
                          <div className="text-[10.5px] text-on-surface font-semibold leading-relaxed">{alert.message}</div>
                        </div>
                        {alert.actionText && alert.actionTab && (
                          <button 
                            onClick={() => {
                              if (alert.actionTab === 'shift_planner') {
                                const match = alert.id.match(/understaffed-(.*)/);
                                if (match && match[1]) setSelectedLineId(match[1]);
                              }
                              setActiveTab(alert.actionTab!);
                            }}
                            className="text-[8px] font-bold text-primary font-label-caps hover:underline text-left self-start flex items-center gap-0.5 cursor-pointer uppercase tracking-wider"
                          >
                            {alert.actionText} <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Available operator pool */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-premium-sm overflow-hidden animate-slide-up">
          <div className="px-5 py-3.5 border-b border-outline-variant flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-xs font-bold text-on-surface tracking-tight uppercase">Available Operator Pool</h2>
              <p className="text-[8px] text-secondary font-bold uppercase tracking-wider mt-0.5">Operators ready for assignment</p>
            </div>
            <button 
              onClick={() => setActiveTab('master_data')}
              className="flex items-center gap-0.5 text-primary font-bold hover:underline font-label-caps text-[8px] tracking-wider cursor-pointer"
            >
              FULL ROSTER
              <span className="material-symbols-outlined text-xs">trending_flat</span>
            </button>
          </div>
          <div className="p-4 flex gap-4.5 overflow-x-auto custom-scrollbar pb-5">
            {availablePool.length === 0 ? (
              <div className="text-xs text-secondary/70 italic py-6 w-full text-center">
                All active operators deployed on Shift A. Workforce pool empty.
              </div>
            ) : (
              availablePool.map(assoc => {
                const skillsForAssoc = associateSkills.filter(s => s.associateId === assoc.id && !s.reCertificationRequired);
                const avatar = AVATAR_MAP[assoc.name] || '';
 
                return (
                  <div key={assoc.id} className="flex-shrink-0 w-56 border border-outline-variant bg-surface-container-lowest p-3.5 rounded-lg transition-all duration-150 hover:shadow-premium-md hover:border-slate-350 hover:-translate-y-0.5 group">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      {avatar ? (
                        <img className="w-9 h-9 rounded-lg bg-surface-container-low object-cover border border-outline-variant shadow-premium-sm" src={avatar} alt={assoc.name} />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center font-bold text-primary text-xs font-mono shadow-premium-sm">
                          {assoc.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="font-bold text-xs text-on-surface truncate">{assoc.name}</p>
                        <p className="text-[8px] text-emerald-600 font-bold font-label-caps tracking-wider uppercase">AVAILABLE</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 min-h-[18px] items-center">
                      {skillsForAssoc.slice(0, 2).map(s => (
                        <span 
                          key={s.skillId} 
                          className="px-1.5 py-0.5 bg-surface-container-low text-slate-800 text-[8px] font-data-mono-md border border-outline-variant rounded shadow-premium-sm"
                        >
                          {s.skillId.replace('_OPT', '').replace('_MGMT', '').replace('_CERT', '')}
                        </span>
                      ))}
                      {skillsForAssoc.length > 2 && (
                        <span className="px-1 py-0.5 bg-surface-container-low text-[8px] font-bold text-secondary border border-dashed border-outline-variant rounded">
                          +{skillsForAssoc.length - 2}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => {
                        const activeLine = productionLines.find(l => l.status === 'ACTIVE');
                        if (activeLine) setSelectedLineId(activeLine.id);
                        setActiveTab('shift_planner');
                      }}
                      className="w-full mt-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg font-bold text-[8px] font-label-caps tracking-wider transition-all cursor-pointer shadow-premium-sm"
                    >
                      ASSIGN OPERATOR
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
      ) : (
        renderAssetsSubTab()
      )}
    </div>
  );
};
