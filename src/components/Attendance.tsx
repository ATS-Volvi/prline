import React from 'react';
import { useApp } from '../context/AppContext';

export const Attendance: React.FC = () => {
  const { associates } = useApp();

  return (
    <div className="flex flex-col h-full w-full bg-background animate-fade-in overflow-hidden p-lg gap-lg">
      <div className="flex justify-between items-start shrink-0">
        <div className="flex flex-col">
          <h1 className="font-headline-lg text-primary">Availability & Attendance</h1>
          <p className="text-secondary text-body-md mt-xs">Manage weekly rosters, track leaves, and ensure coverage.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-surface-container-lowest border-b border-outline-variant p-md shrink-0 flex justify-between items-center rounded-xl shadow-sm">
        <div className="flex gap-md items-end">
          <div className="flex flex-col gap-xs">
            <label className="text-label-md text-on-surface-variant uppercase tracking-wider">Production Line</label>
            <select className="bg-surface-container border border-outline-variant rounded-lg px-md py-sm font-label-lg">
              <option>All Lines</option>
            </select>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-label-md text-on-surface-variant uppercase tracking-wider">Shift</label>
            <select className="bg-surface-container border border-outline-variant rounded-lg px-md py-sm font-label-lg">
              <option>All Shifts</option>
            </select>
          </div>
          <div className="flex items-center gap-sm bg-surface-container border border-outline-variant rounded-lg px-sm py-sm font-label-lg h-10">
            <button className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-primary cursor-pointer">chevron_left</button>
            <span className="min-w-[120px] text-center">Oct 23 - Oct 29</span>
            <button className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-primary cursor-pointer">chevron_right</button>
          </div>
        </div>
        <div className="flex gap-sm">
          <button className="border border-outline-variant bg-surface-container-lowest text-on-surface rounded-lg px-md py-sm font-label-lg shadow-sm hover:bg-surface-container cursor-pointer">
            ↓ Export PDF
          </button>
          <button className="bg-primary text-on-primary rounded-lg px-md py-sm font-label-lg shadow-sm hover:opacity-90 cursor-pointer">
            + Assign Shift
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-sm shrink-0">
        <button className="flex items-center gap-xs bg-surface-container border border-outline-variant rounded-full px-md py-xs text-body-sm hover:bg-surface-container-high transition-colors cursor-pointer">
          <div className="w-2 h-2 rounded-full bg-on-tertiary-container"></div> Available/Assigned
        </button>
        <button className="flex items-center gap-xs bg-surface-container border border-outline-variant rounded-full px-md py-xs text-body-sm hover:bg-surface-container-high transition-colors cursor-pointer">
          <div className="w-2 h-2 rounded-full bg-error"></div> Leave/Absence
        </button>
        <button className="flex items-center gap-xs bg-surface-container border border-outline-variant rounded-full px-md py-xs text-body-sm hover:bg-surface-container-high transition-colors cursor-pointer">
          Off-day
        </button>
      </div>

      {/* Roster Table */}
      <div className="flex-1 overflow-auto custom-scrollbar border border-outline-variant rounded-xl bg-surface-container-lowest shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
            <tr className="uppercase tracking-wider text-label-md text-on-surface-variant">
              <th className="p-md min-w-[200px]">ASSOCIATE DETAILS</th>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                <th key={d} className="p-md text-center">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {associates.map((assoc, i) => (
              <tr key={assoc.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[64px]">
                <td className="p-md">
                  <div className="flex flex-col">
                    <span className="font-label-lg text-on-surface">{assoc.name}</span>
                    <span className="font-mono text-[10px] text-on-surface-variant">{assoc.id} • {assoc.category}</span>
                  </div>
                </td>
                {/* Simulated weekly schedule */}
                {[...Array(7)].map((_, j) => {
                  let cellContent;
                  if (i % 3 === 0 && j === 4) {
                    cellContent = (
                      <div className="flex flex-col items-center">
                        <span className="bg-error-container text-on-error-container font-bold text-[10px] rounded px-xs py-0.5">Leave</span>
                        <span className="text-[8px] text-on-surface-variant mt-0.5">Sick</span>
                      </div>
                    );
                  } else if (j > 4 && i % 2 !== 0) {
                    cellContent = <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">OFF</span>;
                  } else {
                    cellContent = (
                      <div className="flex flex-col items-center">
                        <span className="bg-secondary-container text-on-secondary-container font-mono text-[9px] font-bold px-xs py-0.5 rounded">Shift {j % 2 === 0 ? 'A' : 'B'}</span>
                        <span className="text-[8px] text-on-surface-variant mt-0.5 font-mono">06:00-14:00</span>
                      </div>
                    );
                  }
                  return <td key={j} className="p-sm text-center border-l border-outline-variant">{cellContent}</td>;
                })}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-surface-container-low border-t border-outline-variant sticky bottom-0">
            <tr>
              <td className="p-md font-bold text-on-surface-variant text-label-md uppercase tracking-wider">DAILY COVERAGE</td>
              {[...Array(7)].map((_, j) => (
                <td key={j} className="p-sm text-center border-l border-outline-variant">
                  <div className="flex flex-col gap-0.5 items-center font-mono text-[9px] text-on-surface-variant">
                    <span>A:12</span>
                    <span>B:10</span>
                    <span>C:8</span>
                  </div>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary Tiles below */}
      <div className="grid grid-cols-3 gap-md shrink-0">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm shadow-sm">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Attendance Pulse</span>
          <div className="flex items-end gap-sm">
            <span className="font-mono text-[24px] font-bold text-primary">94.2%</span>
            <span className="material-symbols-outlined text-on-tertiary-container text-sm mb-1">trending_up</span>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm shadow-sm">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Open Shifts</span>
          <div className="flex items-end gap-sm">
            <span className="font-mono text-[24px] font-bold text-error">4</span>
            <span className="text-body-sm text-on-surface-variant mb-1">Affected: Line 1, Line 3</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm shadow-sm">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider font-bold">Upcoming Leave</span>
          <div className="flex flex-col gap-xs mt-xs">
            <span className="text-xs text-on-surface"><span className="font-bold">J. Doe</span> (Oct 25 - Oct 27)</span>
            <span className="text-xs text-on-surface"><span className="font-bold">M. Smith</span> (Oct 28 - Nov 2)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
