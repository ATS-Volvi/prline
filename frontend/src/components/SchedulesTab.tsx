import React from 'react';
import { useApp } from '../context/AppContext';

export const SchedulesTab: React.FC = () => {
  const { productionLines, workstations, allocations, associates, leaveRecords } = useApp();

  // Generate 7 days starting from today
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const todayStr = dates[0].toISOString().split('T')[0];

  // Calculate shift coverage for today
  const activeLines = productionLines.filter(l => l.status === 'ACTIVE').map(l => l.id);
  const activeWorkstations = workstations.filter(w => activeLines.includes(w.lineId));
  const todayAllocs = allocations.filter(a => a.date === todayStr && activeLines.includes(a.lineId));
  const staffedWSIds = new Set(todayAllocs.map(a => a.workstationId));
  const totalRequiredStaff = activeWorkstations.length;
  const staffedCount = activeWorkstations.filter(w => staffedWSIds.has(w.id)).length;
  const shiftCoverage = totalRequiredStaff ? Math.round((staffedCount / totalRequiredStaff) * 100) : 0;

  // Calculate upcoming time off (next 48h)
  const tomorrow = new Date(dates[1]);
  const dayAfter = new Date(dates[2]);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayAfterStr = dayAfter.toISOString().split('T')[0];
  const upcomingLeaves = leaveRecords.filter(l => l.date === tomorrowStr || l.date === dayAfterStr);
  const uniqueAssociatesOnLeave = new Set(upcomingLeaves.map(l => l.associateId)).size;

  return (
    <div className="flex-grow flex flex-col lg:flex-row h-full overflow-hidden bg-surface-container-low/40 animate-fade-in">
      {/* CONTENT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary tracking-tight">Operational Schedule</h2>
            <p className="text-[#45474c] text-sm mt-1">Managing floor distribution and labor allocation for Week 42.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-outline-variant rounded-lg px-3 py-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[#45474c] text-[18px] mr-1.5">calendar_today</span>
              <span className="font-semibold text-sm text-primary tracking-wider">{dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Schedule
            </button>
          </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-outline-variant p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-[#57657a] uppercase tracking-wider">Shift Coverage</p>
              <span className="material-symbols-outlined text-[#00301e]">trending_up</span>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-2xl font-bold text-primary">{shiftCoverage}%</p>
            </div>
            <div className="w-full h-1 mt-3 bg-[#eceef0] rounded-full overflow-hidden">
              <div className="h-full bg-[#00a472]" style={{ width: `${shiftCoverage}%` }}></div>
            </div>
          </div>
          <div className="bg-white border border-outline-variant p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <p className="text-xs font-semibold text-[#57657a] uppercase tracking-wider">Overtime Hours</p>
            <div className="mt-2">
              <p className="text-2xl font-bold text-primary">42h</p>
              <p className="text-[#45474c] text-xs italic mt-0.5">Accumulated this week</p>
            </div>
            <div className="mt-3 flex gap-1">
              <div className="h-2 w-full bg-[#d5e3fc] rounded-sm"></div>
              <div className="h-2 w-full bg-[#d5e3fc] rounded-sm"></div>
              <div className="h-2 w-full bg-[#d5e3fc] rounded-sm"></div>
              <div className="h-2 w-full bg-[#1e293b] rounded-sm"></div>
              <div className="h-2 w-full bg-[#c5c6cd] rounded-sm"></div>
            </div>
          </div>
          <div className="bg-white border border-outline-variant p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <p className="text-xs font-semibold text-[#57657a] uppercase tracking-wider">Upcoming Time Off</p>
            <div className="mt-2">
              <p className="text-2xl font-bold text-primary">{uniqueAssociatesOnLeave} <span className="text-base font-normal text-[#45474c]">Assoc.</span></p>
              <p className="text-[#ba1a1a] font-bold text-xs mt-0.5">Next 48h</p>
            </div>
            <div className="flex -space-x-2 mt-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white overflow-hidden">
                <img className="w-full h-full object-cover" alt="Worker" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8u0NKa49oVzcOuyULcOMsnzhA-c2uafXxvTZOfGNa80Lox6Qqg7w_A1_TdZj7NHHlPX0xG0qggexi5cbMzzRPgeHNxj1owRuY9rfCnolE4Dq5DjgO3a2Lx9ogc5BrIZhtG06R-peqmurZpSAnzFnfNn-6bHsFKCJOyS-KOmsuSQgoM5ZgoWPSIYcMhOao4MIuuNBVDcbznk_5PuaFkQu_KPztUXOC0Y8glyvJqBPHctHU-5P--bm93KrSAH83v5iyNQoGM_S2UPM"/>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white overflow-hidden">
                <img className="w-full h-full object-cover" alt="Worker" src="https://lh3.googleusercontent.com/aida-public/AB6AXuALbUbhMz1RDluF3c40XWytI0QdX-zY-WrGQLNT2RO59SQNL1BOi_F6jVryOXTh3b7QjHmVCm1uTDGLjlkRVHSIJVtnlGViAfvRJHO2LqaBRimkZuEEWS5vvHq_9INLLymCtzQyGwxoc-Vv6hWF98HZU_1ZSg3osFw5PnIPTZCEAKdfTctz2uylV_YKThQFt3PMvv7T2mlnAAuQDhvfHYH0GwNVjpvSOmK3qYNgF5uwoj4HfF1aWCi1-n-W0gCo6g1ZAjlUi8-1wlo"/>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-700">+6</div>
            </div>
          </div>
          <div className="bg-white border border-outline-variant p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <p className="text-xs font-semibold text-[#57657a] uppercase tracking-wider">Swap Requests</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-bold text-primary">5</p>
              <span className="text-[#45474c] text-xs font-semibold">Pending Review</span>
            </div>
            <button className="mt-3 text-primary text-sm font-semibold text-left hover:underline flex items-center gap-1">
              Review All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* CALENDAR GRID VIEW */}
        <div className="bg-white border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 border-b border-outline-variant bg-surface-container-low">
              <div className="p-3 text-sm font-semibold text-[#45474c] border-r border-outline-variant flex items-center">Production Line</div>
              {dates.map((date, idx) => (
                <div key={idx} className={`p-3 text-center text-sm font-semibold text-[#45474c] ${idx < 6 ? 'border-r border-outline-variant' : ''}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  <span className="block text-xs font-normal mt-0.5">{date.getDate()}</span>
                </div>
              ))}
            </div>
            
            {productionLines.filter(l => l.status === 'ACTIVE').map(line => (
              <div key={line.id} className="grid grid-cols-8 border-b border-outline-variant group">
                <div className="p-4 text-sm font-bold flex items-center border-r border-outline-variant bg-white text-primary">
                  {line.name}
                </div>
                {dates.map((date, idx) => {
                  const dateStr = date.toISOString().split('T')[0];
                  // Find allocations for this line and date
                  const lineAllocs = allocations.filter(a => a.lineId === line.id && a.date === dateStr);
                  const lineWS = workstations.filter(w => w.lineId === line.id);
                  const filledWsCount = new Set(lineAllocs.map(a => a.workstationId)).size;
                  const totalWs = lineWS.length;
                  
                  // Pick one associate to display (e.g. Line Lead or first assigned)
                  let displayAssocName = '';
                  if (lineAllocs.length > 0) {
                    const assoc = associates.find(a => a.id === lineAllocs[0].associateId);
                    if (assoc) {
                      const nameParts = assoc.name.split(' ');
                      displayAssocName = nameParts.length > 1 ? `${nameParts[0][0]}. ${nameParts[1]}` : assoc.name;
                    }
                  }

                  const isGap = filledWsCount > 0 && filledWsCount < totalWs;
                  const isCrit = filledWsCount > 0 && (filledWsCount / totalWs) < 0.7; // < 70% is crit
                  const isEmpty = filledWsCount === 0;

                  return (
                    <div key={idx} className={`p-1 ${idx < 6 ? 'border-r border-outline-variant' : ''} group-hover:bg-slate-50 transition-colors`}>
                      {isEmpty ? (
                        <div className="h-full rounded bg-surface-container-low/50"></div>
                      ) : isCrit ? (
                        <div className="h-full rounded bg-rose-50 border-l-[3px] border-rose-500 p-2">
                          <p className="text-xs font-semibold text-primary leading-tight">{displayAssocName}</p>
                          <p className="text-[9px] text-rose-600 font-bold mt-0.5">{filledWsCount}/{totalWs} CRIT</p>
                        </div>
                      ) : isGap ? (
                        <div className="h-full rounded bg-amber-500/10 border-l-[3px] border-amber-500 p-2">
                          <p className="text-xs font-semibold text-primary leading-tight">{displayAssocName}</p>
                          <p className="text-[9px] text-amber-600 font-bold mt-0.5">{filledWsCount}/{totalWs} GAP</p>
                        </div>
                      ) : (
                        <div className="h-full rounded bg-[#00301e]/5 border-l-[3px] border-[#00a472] p-2">
                          <p className="text-xs font-semibold text-primary leading-tight">{displayAssocName}</p>
                          <p className="text-[9px] text-[#00a472] font-bold mt-0.5">{filledWsCount}/{totalWs} CAP</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-8 flex justify-between items-center text-[#45474c] text-xs font-semibold border-t border-outline-variant pt-4 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00a472] animate-pulse"></span>
            Live System Sync
          </div>
          <p>Last updated 5 mins ago</p>
        </footer>
      </div>

      {/* RIGHT SIDEBAR: STAFFING ALERTS */}
      <aside className="w-full lg:w-80 h-full bg-white border-l border-outline-variant flex flex-col z-30 shrink-0 shadow-sm">
        <div className="p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest shrink-0">
          <h3 className="text-base font-bold text-primary">Staffing Alerts</h3>
          <span className="bg-[#ba1a1a] text-white text-[10px] font-black px-2 py-0.5 rounded-full">2</span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* ALERTS SECTION */}
          <div className="p-4 space-y-3">
            <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl">
              <div className="flex gap-2.5">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">warning</span>
                <div>
                  <p className="text-sm font-bold text-[#ba1a1a]">Critical Shortage</p>
                  <p className="text-xs text-[#45474c] mt-0.5 leading-relaxed">Night Shift - Line Alpha: 2 Operators short for Oct 24.</p>
                </div>
              </div>
              <button className="mt-3 w-full py-2 bg-[#ba1a1a] text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                Fill Position
              </button>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex gap-2.5">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">notification_important</span>
                <div>
                  <p className="text-sm font-bold text-amber-700">Gap Warning</p>
                  <p className="text-xs text-[#45474c] mt-0.5 leading-relaxed">Morning Shift - Line Charlie: 1 Forklift Lead out.</p>
                </div>
              </div>
            </div>
          </div>

          {/* TIME-OFF REQUESTS */}
          <div className="mt-2 border-t border-outline-variant">
            <div className="p-4 bg-surface-container-low/50 border-b border-outline-variant">
              <h4 className="text-xs font-bold text-[#57657a] uppercase tracking-wider">Time-off Requests</h4>
            </div>
            <div className="divide-y divide-outline-variant">
              {upcomingLeaves.length === 0 ? (
                <div className="p-4 text-xs text-center text-[#57657a] italic">No upcoming time-off requests.</div>
              ) : upcomingLeaves.map((leave, idx) => {
                const assoc = associates.find(a => a.id === leave.associateId);
                const leaveDate = new Date(leave.date);
                const dateLabel = leaveDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
                
                return (
                  <div key={leave.id || idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-200 overflow-hidden shadow-sm flex items-center justify-center text-primary font-bold text-sm">
                          {assoc ? assoc.name.split(' ').map(n => n[0]).join('') : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary leading-tight">{assoc ? assoc.name : 'Unknown'}</p>
                          <p className="text-[10px] text-[#57657a] font-medium mt-0.5">{leave.reason}</p>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-[#57657a] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{dateLabel}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-1.5 border border-outline-variant text-[#45474c] rounded-md text-xs font-bold hover:bg-slate-100 transition-all">Deny</button>
                      <button className="flex-1 py-1.5 bg-primary text-white rounded-md text-xs font-bold hover:opacity-90 transition-all shadow-sm">Approve</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant shrink-0">
              <button className="w-full text-center text-primary text-xs font-bold hover:underline cursor-pointer">
                View All Requests
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
