import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500',
  MAINTENANCE: 'bg-amber-500',
  HALTED: 'bg-red-500',
  IDLE: 'bg-slate-400',
};

const STATUS_TEXT: Record<string, string> = {
  ACTIVE: 'text-on-tertiary-fixed-variant bg-tertiary-fixed-dim/20 border-outline-variant',
  MAINTENANCE: 'text-on-secondary-container bg-secondary-container border-outline-variant',
  HALTED: 'text-on-error-container bg-error-container border-outline-variant',
  IDLE: 'text-slate-700 bg-surface-container-low border-outline-variant',
};

interface PlantMapProps {
  setActiveTab?: (tab: string) => void;
  setSelectedLineId?: (id: string) => void;
}

export const PlantMap: React.FC<PlantMapProps> = ({ setActiveTab, setSelectedLineId }) => {
  const { productionLines, workstations, allocations, associates } = useApp();
  const [selectedLine, setSelectedLine] = useState<any>(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const lineStats = useMemo(() => {
    return productionLines.map(line => {
      const lineWS = workstations.filter(w => w.lineId === line.id);
      const lineAllocs = allocations.filter(a => a.date === todayStr && a.lineId === line.id);
      const filled = new Set(lineAllocs.map(a => a.workstationId)).size;
      const rate = lineWS.length > 0 ? Math.round((filled / lineWS.length) * 100) : 0;
      
      const operators = lineAllocs
        .map(a => associates.find(assoc => assoc.id === a.associateId))
        .filter(Boolean);

      return {
        ...line,
        workstationsCount: lineWS.length,
        filledCount: filled,
        fillRate: rate,
        operators,
        workstationsList: lineWS,
      };
    });
  }, [productionLines, workstations, allocations, associates, todayStr]);

  const handleLineClick = (line: any) => {
    setSelectedLine(line);
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-y-auto bg-background select-none">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface-container-lowest border-b border-outline-variant px-6 h-16 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            map
          </span>
          <div>
            <h1 className="text-sm font-bold text-primary tracking-tight">Kolkata Plant Floor View</h1>
            <p className="text-[10px] text-secondary">Interactive schematic map of active production lines</p>
          </div>
        </div>
      </header>

      <div className="p-6 flex flex-col lg:flex-row gap-6 h-[calc(100%-4rem)] overflow-hidden">
        {/* Schematic Grid layout */}
        <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm overflow-auto flex flex-col justify-center items-center min-h-[400px]">
          <div className="w-full max-w-3xl border-2 border-dashed border-outline-variant rounded-xl p-8 bg-surface-container-low/50 relative">
            <span className="absolute top-3 left-3 font-mono text-[9px] font-bold text-secondary uppercase tracking-widest">
              KOLKATA PLANT FLOOR AREA A
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              {lineStats.map(line => {
                const isSelected = selectedLine?.id === line.id;
                return (
                  <div
                    key={line.id}
                    onClick={() => handleLineClick(line)}
                    className={`relative p-5 rounded-2xl border bg-surface-container-lowest shadow-sm transition-all duration-200 cursor-pointer flex flex-col gap-3 ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/10 -translate-y-1 shadow-md'
                        : 'border-outline-variant hover:border-outline hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[line.status] || 'bg-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-800 font-sans tracking-tight">
                          {line.name.split(' - ')[0]}
                        </span>
                      </div>
                      <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded-full border ${STATUS_TEXT[line.status]}`}>
                        {line.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-secondary">
                      <p className="font-mono">Product: <span className="font-bold text-slate-700">{line.currentProduct}</span></p>
                    </div>

                    <div className="mt-1">
                      <div className="flex justify-between text-[9px] font-mono text-secondary mb-1">
                        <span>Staffing fill</span>
                        <span className="font-bold">{line.fillRate}%</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${line.fillRate}%`,
                            backgroundColor: line.status === 'ACTIVE' ? '#10b981' : '#f59e0b',
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono text-secondary border-t border-outline-variant pt-2 mt-1">
                      <span>Workstations: {line.workstationsCount}</span>
                      <span>Assigned: {line.filledCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Detail Side panel */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm overflow-y-auto">
          {selectedLine ? (
            <div className="flex flex-col gap-4 h-full animate-fade-in">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{selectedLine.name.split(' - ')[0]}</h3>
                  <p className="text-[9px] text-secondary font-mono mt-0.5">Live status details</p>
                </div>
                <span className={`text-[9px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${STATUS_TEXT[selectedLine.status]}`}>
                  {selectedLine.status}
                </span>
              </div>

              <div>
                <p className="text-[9px] font-bold text-secondary font-mono uppercase tracking-wider mb-2">Workstation Audit</p>
                <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {selectedLine.workstationsList.map((ws: any) => {
                    const allocated = allocations.some(
                      a => a.date === todayStr && a.workstationId === ws.id
                    );
                    return (
                      <div key={ws.id} className="flex justify-between items-center p-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs">
                        <span className="font-sans font-medium text-slate-700 truncate pr-2">{ws.name}</span>
                        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full border uppercase ${
                          allocated ? 'bg-tertiary-fixed-dim/20 border-outline-variant text-on-tertiary-fixed-variant' : 'bg-error-container border-outline-variant text-on-error-container'
                        }`}>
                          {allocated ? 'Staffed' : 'Empty'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-bold text-secondary font-mono uppercase tracking-wider mb-2">Allocated Operators</p>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {selectedLine.operators.map((op: any) => (
                    <div key={op.id} className="p-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs flex justify-between items-center">
                      <span className="font-bold text-slate-700 truncate">{op.name}</span>
                      <span className="text-[8px] font-mono text-secondary px-1.5 py-0.5 bg-surface-container-lowest rounded border border-outline-variant">{op.category}</span>
                    </div>
                  ))}
                  {selectedLine.operators.length === 0 && (
                    <p className="text-[10px] text-secondary italic text-center py-2">No operators assigned today.</p>
                  )}
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-outline-variant">
                {setActiveTab && setSelectedLineId && (
                  <button
                    onClick={() => {
                      setSelectedLineId(selectedLine.id);
                      setActiveTab('shift_planner');
                    }}
                    className="w-full py-2 rounded-xl bg-primary text-white text-xs font-bold font-mono hover:bg-primary/90 transition-all cursor-pointer shadow-sm text-center"
                  >
                    Open in Roster Planner
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-secondary py-12">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">touch_app</span>
              <p className="text-xs font-bold text-slate-500">Select a Production Line</p>
              <p className="text-[10px] mt-1">Click any production line on the map to audit live staffing and workstation allocations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantMap;
