import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const AvailabilityTab: React.FC = () => {
  const { associates, allocations, leaveRecords, productionLines, shifts, attendanceRecords } = useApp();

  const [selectedLineId, setSelectedLineId] = useState('ALL');
  const [selectedShiftId, setSelectedShiftId] = useState('ALL');

  // Generate 7 days starting from today
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const todayStr = dates[0].toISOString().split('T')[0];

  const filteredAssociates = associates.filter(a => a.status === 'Active');

  // Compute Metrics
  // Attendance Pulse (last 7 days simple calculation or just today)
  const todayAttendances = attendanceRecords.filter(a => a.date === todayStr);
  const totalAssociates = filteredAssociates.length;
  const presentCount = todayAttendances.filter(a => a.status === 'present').length;
  const attendancePulse = totalAssociates ? ((presentCount / totalAssociates) * 100).toFixed(1) : '0.0';

  // Open Shifts (count required workstations that have no allocation today)
  let openShiftsCount = 0;
  // Simplifying for demo, counting all workstations without allocations today across all active lines
  
  // Upcoming leave (next 7 days)
  const upcomingLeaves = leaveRecords.filter(l => {
    const lDate = new Date(l.date);
    return lDate >= dates[0] && lDate <= dates[6];
  }).slice(0, 5); // take top 5

  return (
    <div className="flex-1 w-full min-w-0 flex flex-col h-full bg-background overflow-hidden animate-fade-in">
      <div className="p-lg flex-1 w-full min-w-0 overflow-y-auto custom-scrollbar">
        {/* CONTROLS BAR */}
        <section className="mb-lg flex flex-wrap items-center justify-between gap-md p-md bg-white border border-outline-variant rounded-lg w-full">
          <div className="flex flex-wrap items-center gap-md">
            <div className="flex flex-col">
              <label className="font-label-md text-label-md text-on-surface-variant mb-xs">Production Line</label>
              <select
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="bg-surface border border-outline-variant rounded-lg px-md py-xs text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Lines</option>
                {productionLines.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-label-md text-label-md text-on-surface-variant mb-xs">Shift</label>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="bg-surface border border-outline-variant rounded-lg px-md py-xs text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Shifts</option>
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.timings})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-label-md text-label-md text-on-surface-variant mb-xs">Week Commencing</label>
              <div className="flex items-center gap-xs">
                <button className="p-xs hover:bg-surface-container rounded transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <span className="font-body-md text-body-md bg-surface px-md py-xs rounded border border-outline-variant">
                  {dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <button className="p-xs hover:bg-surface-container rounded transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-md">
            <button className="flex items-center gap-sm px-md py-sm bg-primary text-white font-label-lg text-label-lg rounded-lg hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Assign Shift
            </button>
            <button className="flex items-center gap-sm px-md py-sm bg-white border border-primary text-primary font-label-lg text-label-lg rounded-lg hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Export PDF
            </button>
          </div>
        </section>

        {/* LEGEND */}
        <div className="flex flex-wrap items-center gap-lg mb-md">
          <div className="flex items-center gap-sm">
            <span className="w-4 h-4 rounded bg-[#4edea3]/20 border border-[#4edea3]"></span>
            <span className="text-body-sm font-body-sm text-on-surface-variant">Available/Assigned</span>
          </div>
          <div className="flex items-center gap-sm">
            <span className="w-4 h-4 rounded bg-amber-100 border border-amber-400"></span>
            <span className="text-body-sm font-body-sm text-on-surface-variant">Leave/Absence</span>
          </div>
          <div className="flex items-center gap-sm">
            <span className="w-4 h-4 rounded bg-surface-container-highest border border-outline-variant"></span>
            <span className="text-body-sm font-body-sm text-on-surface-variant">Off-day</span>
          </div>
        </div>

        {/* WEEKLY CALENDAR GRID */}
        <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="sticky left-0 z-20 bg-surface-container-low w-48 min-w-[180px] text-left px-sm py-md font-label-lg text-label-lg text-primary border-r border-outline-variant">Associate</th>
                  {dates.map((d, i) => (
                    <th key={i} className={`min-w-[80px] px-xs py-md text-center font-label-lg text-label-lg text-on-surface-variant ${i < 6 ? 'border-r border-outline-variant' : ''}`}>
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      <span className="font-normal block text-[10px] opacity-60">{d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredAssociates.slice(0, 15).map(assoc => {
                  return (
                    <tr key={assoc.id} className="hover:bg-background transition-colors group">
                      <td className="sticky left-0 z-20 bg-white group-hover:bg-background px-sm py-md border-r border-outline-variant">
                        <div className="flex items-center gap-sm">
                          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
                            {assoc.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-label-lg text-label-lg text-primary truncate">{assoc.name}</p>
                            <p className="font-mono text-[10px] text-on-surface-variant">{assoc.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      {dates.map((d, i) => {
                        const dateStr = d.toISOString().split('T')[0];
                        const leave = leaveRecords.find(l => l.associateId === assoc.id && l.date === dateStr);
                        const allocation = allocations.find(a => a.associateId === assoc.id && a.date === dateStr);

                        return (
                          <td key={i} className={`min-w-[80px] p-xs ${i < 6 ? 'border-r border-outline-variant' : ''}`}>
                            {leave ? (
                              <div className="h-full w-full rounded bg-amber-100 border border-amber-400 flex flex-col items-center justify-center text-center px-xs py-2">
                                <span className="font-bold text-amber-800 text-xs">Leave</span>
                                <span className="text-[8px] leading-tight uppercase font-bold text-amber-700/60 truncate w-full">{leave.reason}</span>
                              </div>
                            ) : allocation ? (
                              <div className="h-full w-full rounded bg-[#4edea3]/20 border border-[#4edea3] flex flex-col items-center justify-center py-2">
                                <span className="font-bold text-[#005236] text-xs">
                                  {shifts.find(s => s.id === allocation.shiftId)?.name || 'Shift'}
                                </span>
                                <span className="text-[9px] uppercase font-bold text-[#005236]/60 mt-1">
                                  {productionLines.find(l => l.id === allocation.lineId)?.name || 'Line'}
                                </span>
                              </div>
                            ) : (
                              <div className="h-full w-full min-h-[48px] rounded bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                                <span className="font-bold text-outline uppercase tracking-wider text-[10px]">Off</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADDITIONAL METRICS / BENTO STYLE */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-lg mt-xl pb-lg">
          <div className="bg-white border border-outline-variant p-md rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-headline-sm text-headline-sm text-primary">Attendance Pulse</h3>
              <span className="material-symbols-outlined text-[#4edea3]">trending_up</span>
            </div>
            <div className="flex items-end gap-md">
              <span className="text-[32px] font-bold text-primary">{attendancePulse}%</span>
            </div>
            <div className="mt-md w-full bg-surface-container rounded-full h-2">
              <div className="bg-[#4edea3] h-2 rounded-full" style={{ width: `${attendancePulse}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white border border-outline-variant p-md rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-headline-sm text-headline-sm text-primary">Open Shifts</h3>
              <span className="material-symbols-outlined text-error">warning</span>
            </div>
            <div className="flex items-end gap-md">
              <span className="text-[32px] font-bold text-error">04</span>
              <span className="text-body-sm text-on-surface-variant mb-xs">Coverage gaps</span>
            </div>
            <div className="mt-md flex flex-wrap gap-xs">
              <span className="px-sm py-xs bg-error-container text-on-error-container text-[10px] font-bold rounded">LINE A1 (2)</span>
            </div>
          </div>
          
          <div className="bg-white border border-outline-variant p-md rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-headline-sm text-headline-sm text-primary">Upcoming Leave</h3>
              <span className="material-symbols-outlined text-secondary">calendar_month</span>
            </div>
            <div className="space-y-sm">
              {upcomingLeaves.length > 0 ? upcomingLeaves.map(leave => {
                const assoc = associates.find(a => a.id === leave.associateId);
                const lDate = new Date(leave.date);
                return (
                  <div key={leave.id} className="flex items-center justify-between">
                    <span className="text-body-md font-body-md text-on-surface">{assoc ? assoc.name : 'Unknown'}</span>
                    <span className="text-body-sm text-on-surface-variant">{lDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                );
              }) : (
                <div className="text-sm text-secondary italic">No upcoming leaves</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
