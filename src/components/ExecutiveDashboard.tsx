import React, { useMemo, useState, useId } from 'react';
import {
  ResponsiveContainer, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ComposedChart, Area, AreaChart, Cell, PieChart, Pie
} from 'recharts';
import { useApp } from '../context/AppContext';
import KpiCard from './shared/KpiCard';
import ExportToolbar from './shared/ExportToolbar';
import { generateRecommendations } from '../utils/recommendations';
import { computeForecast, computeCertExpiryByMonth, computePlantHealthScore, computeOvertimeRisk } from '../utils/forecasting';

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981',
};
const PRIORITY_BG: Record<string, string> = {
  critical: 'bg-error-container border-outline-variant text-on-error-container',
  high: 'bg-secondary-container border-outline-variant text-on-secondary-container',
  medium: 'bg-secondary-container border-blue-200 text-on-secondary-container',
  low: 'bg-tertiary-fixed-dim/20 border-outline-variant text-on-tertiary-fixed-variant',
};
const LINE_STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#10b981', MAINTENANCE: '#f59e0b', HALTED: '#ef4444', IDLE: '#64748b',
};
const LINE_STATUS_BG: Record<string, string> = {
  ACTIVE: 'border-emerald-300 bg-tertiary-fixed-dim/20',
  MAINTENANCE: 'border-amber-300 bg-secondary-container',
  HALTED: 'border-red-300 bg-error-container',
  IDLE: 'border-outline bg-surface-container-low',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 shadow-md text-xs font-mono">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

interface ExecutiveDashboardProps {
  setActiveTab?: (tab: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ setActiveTab }) => {
  const {
    associates, associateSkills, workstations, productionLines,
    shifts, allocations, leaveRecords, skills,
  } = useApp();

  const pageId = useId().replace(/:/g, '');
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // ── Core computed metrics ────────────────────────────────────────────────
  const data = useMemo(() => ({
    associates, associateSkills, workstations, productionLines,
    shifts, allocations, leaveRecords, skills,
  }), [associates, associateSkills, workstations, productionLines, shifts, allocations, leaveRecords, skills]);

  const activeAssociates = useMemo(() => associates.filter(a => a.status === 'Active'), [associates]);
  const todayAllocs = useMemo(() => allocations.filter(a => a.date === todayStr), [allocations, todayStr]);
  const filledWS = useMemo(() => new Set(todayAllocs.map(a => a.workstationId)).size, [todayAllocs]);
  const fillRate = workstations.length > 0 ? Math.round((filledWS / workstations.length) * 100) : 0;

  const certExpired = useMemo(() => associateSkills.filter(s => new Date(s.expiryDate) < today), [associateSkills]);
  const certValid = useMemo(() => associateSkills.filter(s => new Date(s.expiryDate) >= today), [associateSkills]);
  const certCoverage = associateSkills.length > 0
    ? Math.round((certValid.length / associateSkills.length) * 100) : 100;

  const plantHealthScore = useMemo(() => computePlantHealthScore({
    associates, associateSkills, workstations, allocations, leaveRecords,
  }), [associates, associateSkills, workstations, allocations, leaveRecords]);

  const otRisk = useMemo(() => computeOvertimeRisk(allocations, activeAssociates), [allocations, activeAssociates]);
  const todayLeaves = useMemo(() => leaveRecords.filter(l => l.date === todayStr).length, [leaveRecords, todayStr]);
  const activeLines = useMemo(() => productionLines.filter(l => l.status === 'ACTIVE').length, [productionLines]);

  const forecast = useMemo(() => computeForecast(data), [data]);
  const certByMonth = useMemo(() => computeCertExpiryByMonth(associateSkills), [associateSkills]);
  const recommendations = useMemo(() => generateRecommendations(data), [data]);

  // ── Line detail (for plant map click) ─────────────────────────────────
  const selectedLine = useMemo(() =>
    productionLines.find(l => l.id === selectedLineId) ?? null,
    [productionLines, selectedLineId]);

  const lineDetail = useMemo(() => {
    if (!selectedLine) return null;
    const lineWS = workstations.filter(w => w.lineId === selectedLine.id);
    const lineAllocs = todayAllocs.filter(a => a.lineId === selectedLine.id);
    const filled = new Set(lineAllocs.map(a => a.workstationId)).size;
    const rate = lineWS.length > 0 ? Math.round((filled / lineWS.length) * 100) : 0;
    const operatorIds = [...new Set(lineAllocs.map(a => a.associateId))];
    const operators = operatorIds.map(id => associates.find(a => a.id === id)).filter(Boolean);
    return { lineWS, lineAllocs, filled, rate, operators };
  }, [selectedLine, todayAllocs, workstations, associates]);

  // ── Skill distribution for pie chart ──────────────────────────────────
  const skillDist = useMemo(() => {
    const counts: Record<string, number> = { Trainee: 0, Operator: 0, Certified: 0, Expert: 0 };
    certValid.forEach(s => { if (s.level in counts) counts[s.level]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [certValid]);

  const PIE_COLORS = ['#64748b', '#3b82f6', '#14b8a6', '#8b5cf6'];

  // ── Line fill rates for bar chart ──────────────────────────────────────
  const lineFillData = useMemo(() => productionLines.map(l => {
    const lWS = workstations.filter(w => w.lineId === l.id).length;
    const lFilled = new Set(todayAllocs.filter(a => a.lineId === l.id).map(a => a.workstationId)).size;
    const rate = lWS > 0 ? Math.round((lFilled / lWS) * 100) : 0;
    return { name: l.name.split(' - ')[0], 'Fill %': rate, status: l.status };
  }), [productionLines, workstations, todayAllocs]);

  return (
    <div className="flex-1 h-full flex flex-col overflow-y-auto bg-background select-none">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface-container-lowest border-b border-outline-variant px-6 h-16 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart_4_bars</span>
          <div>
            <h1 className="text-sm font-bold text-primary tracking-tight">Executive Operations Dashboard</h1>
            <p className="text-[10px] text-secondary font-mono">
              {today.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' '}• Live Data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Plant Health Score pill */}
          <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold font-mono ${
            plantHealthScore >= 80 ? 'bg-tertiary-fixed-dim/20 border-outline-variant text-on-tertiary-fixed-variant' :
            plantHealthScore >= 60 ? 'bg-secondary-container border-outline-variant text-on-secondary-container' :
            'bg-error-container border-outline-variant text-on-error-container'
          }`}>
            ● Plant Health: {plantHealthScore}%
          </div>
          <ExportToolbar
            elementId={`exec-dash-${pageId}`}
            reportTitle="Executive Operations Dashboard"
            filename="Executive_Dashboard"
            compact
          />
        </div>
      </header>

      {/* Printable content */}
      <div id={`exec-dash-${pageId}`} className="p-6 flex flex-col gap-6">

        {/* ── Row 1: KPI Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard
            label="Plant Health Score"
            value={plantHealthScore}
            unit="%"
            icon="monitor_heart"
            accentColor={plantHealthScore >= 80 ? '#10b981' : plantHealthScore >= 60 ? '#f59e0b' : '#ef4444'}
            trend={plantHealthScore >= 80 ? 'Healthy' : plantHealthScore >= 60 ? 'Monitor' : 'Critical'}
            trendUp={plantHealthScore >= 80 ? true : plantHealthScore >= 60 ? undefined : false}
            ring={plantHealthScore}
          />
          <KpiCard
            label="Staffing Fill Rate"
            value={fillRate}
            unit="%"
            icon="groups"
            accentColor="#14b8a6"
            trend={`${filledWS}/${workstations.length} WS`}
            trendUp={fillRate >= 80}
            ring={fillRate}
          />
          <KpiCard
            label="Cert Coverage"
            value={certCoverage}
            unit="%"
            icon="military_tech"
            accentColor="#8b5cf6"
            trend={certExpired.length > 0 ? `${certExpired.length} expired` : 'All current'}
            trendUp={certExpired.length === 0}
            ring={certCoverage}
          />
          <KpiCard
            label="Active Lines"
            value={activeLines}
            unit={`/ ${productionLines.length}`}
            icon="conveyor_belt"
            accentColor="#3b82f6"
            trend={`${productionLines.filter(l => l.status === 'MAINTENANCE').length} in maintenance`}
            trendUp={activeLines === productionLines.length}
          />
          <KpiCard
            label="Operators Online"
            value={activeAssociates.length - todayLeaves}
            unit={`/ ${activeAssociates.length}`}
            icon="person"
            accentColor="#10b981"
            trend={todayLeaves > 0 ? `${todayLeaves} on leave` : 'Full attendance'}
            trendUp={todayLeaves === 0}
          />
          <KpiCard
            label="OT Risk"
            value={otRisk.pct}
            unit="%"
            icon="schedule"
            accentColor={otRisk.level === 'none' || otRisk.level === 'low' ? '#10b981' : otRisk.level === 'medium' ? '#f59e0b' : '#ef4444'}
            trend={otRisk.label}
            trendUp={otRisk.level === 'none' || otRisk.level === 'low'}
          />
        </div>

        {/* ── Row 2: Plant Map (Line Status Grid) + Forecast Chart ─────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Plant Map */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Plant Floor Map</h3>
                <p className="text-[10px] text-secondary mt-0.5">Click a line to view live details</p>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-mono text-secondary">
                {Object.entries(LINE_STATUS_COLOR).map(([s, c]) => (
                  <span key={s} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {productionLines.map(line => {
                const lWS = workstations.filter(w => w.lineId === line.id).length;
                const lFilled = new Set(todayAllocs.filter(a => a.lineId === line.id).map(a => a.workstationId)).size;
                const rate = lWS > 0 ? Math.round((lFilled / lWS) * 100) : 0;
                const isSelected = selectedLineId === line.id;

                return (
                  <button
                    key={line.id}
                    onClick={() => setSelectedLineId(prev => prev === line.id ? null : line.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      isSelected ? 'border-primary shadow-md' : LINE_STATUS_BG[line.status] || 'border-outline-variant bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: LINE_STATUS_COLOR[line.status] }}
                      />
                      <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full ${
                        line.status === 'ACTIVE' ? 'bg-emerald-100 text-on-tertiary-fixed-variant' :
                        line.status === 'MAINTENANCE' ? 'bg-amber-100 text-on-secondary-container' :
                        line.status === 'HALTED' ? 'bg-red-100 text-on-error-container' :
                        'bg-surface-container text-slate-600'
                      }`}>
                        {line.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 leading-tight">{line.name.split(' - ')[0]}</p>
                    <p className="text-[9px] text-secondary mt-0.5 truncate">{line.currentProduct}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-[8px] font-mono text-secondary mb-0.5">
                        <span>Staffed</span><span>{rate}%</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${rate}%`, background: LINE_STATUS_COLOR[line.status] }}
                        />
                      </div>
                    </div>
                    {isSelected && <p className="text-[8px] text-primary font-bold mt-1.5">▼ Details below</p>}
                  </button>
                );
              })}
            </div>

            {/* Line detail panel */}
            {selectedLine && lineDetail && (
              <div className="mt-4 p-3 bg-surface-container-low border border-outline-variant rounded-xl animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold text-primary">{selectedLine.name}</h4>
                  <button onClick={() => setSelectedLineId(null)} className="text-secondary hover:text-primary cursor-pointer">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-center">
                    <p className="text-[8px] text-secondary font-mono uppercase">Workstations</p>
                    <p className="text-sm font-bold text-primary">{lineDetail.lineWS.length}</p>
                  </div>
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-center">
                    <p className="text-[8px] text-secondary font-mono uppercase">Staffed</p>
                    <p className="text-sm font-bold text-primary">{lineDetail.filled}</p>
                  </div>
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2 text-center">
                    <p className="text-[8px] text-secondary font-mono uppercase">Fill Rate</p>
                    <p className={`text-sm font-bold ${lineDetail.rate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {lineDetail.rate}%
                    </p>
                  </div>
                </div>
                {lineDetail.operators.length > 0 && (
                  <p className="text-[9px] text-secondary">
                    <span className="font-bold text-slate-700">Operators today: </span>
                    {lineDetail.operators.map((o: any) => o?.name).filter(Boolean).join(', ')}
                  </p>
                )}
                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab('shift_planner')}
                    className="mt-2 w-full py-1.5 rounded-lg bg-primary text-white text-[9px] font-bold font-mono cursor-pointer hover:bg-primary/90 transition-all"
                  >
                    Open Shift Planner →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 14-Day Forecast */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm" style={{ borderLeft: '4px solid #10b981' }}>
            <h3 className="text-xs font-bold text-slate-800 mb-1">14-Day Staffing Forecast</h3>
            <p className="text-[10px] text-secondary mb-3">Projected available operators vs workstation demand</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecast} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 8 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                  <Area type="monotone" dataKey="High" stroke="transparent" fill="#14b8a6" fillOpacity={0.08} name="Confidence High" />
                  <Area type="monotone" dataKey="Low" stroke="transparent" fill="#ffffff" fillOpacity={1} name="Confidence Low" />
                  <Bar dataKey="Forecast" fill="#14b8a6" opacity={0.8} name="Forecast Fill" />
                  <Line type="monotone" dataKey="Required" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Min Required" strokeDasharray="4 2" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Row 3: Line Fill Bar + Cert Expiry Timeline ──────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Line fill bar chart */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm" style={{ borderLeft: '4px solid #3b82f6' }}>
            <h3 className="text-xs font-bold text-slate-800 mb-1">Production Line Fill Rate Today</h3>
            <p className="text-[10px] text-secondary mb-3">Staffed workstations vs total capacity per line</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lineFillData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} domain={[0, 100]} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Fill %" radius={[4, 4, 0, 0]}>
                    {lineFillData.map((entry, i) => (
                      <Cell key={i} fill={LINE_STATUS_COLOR[entry.status] || '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cert expiry timeline */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm" style={{ borderLeft: '4px solid #f59e0b' }}>
            <h3 className="text-xs font-bold text-slate-800 mb-1">Certification Expiry Timeline</h3>
            <p className="text-[10px] text-secondary mb-3">Monthly renewal volume over next 12 months</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={certByMonth} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 8 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Expirations" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} name="Expirations" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Row 4: Skill Distribution Pie + Recommendations ──────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Pie chart */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <h3 className="text-xs font-bold text-slate-800 mb-1">Workforce Skill Distribution</h3>
            <p className="text-[10px] text-secondary mb-3">Valid certifications by proficiency tier</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={skillDist}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                    labelLine={false}
                  >
                    {skillDist.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendations — 2/3 width */}
          <div className="xl:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">AI Recommendations</h3>
                <p className="text-[10px] text-secondary mt-0.5">Generated from live plant data</p>
              </div>
              <span className="text-[9px] font-mono font-bold bg-primary/5 text-primary px-2 py-0.5 rounded-full border border-primary/10">
                {recommendations.length} actions
              </span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[280px] pr-1">
              {recommendations.map(r => (
                <div key={r.id} className={`p-3 rounded-xl border text-xs flex gap-3 items-start ${PRIORITY_BG[r.priority]}`}>
                  <span
                    className="material-symbols-outlined text-sm mt-0.5 shrink-0"
                    style={{ color: PRIORITY_COLORS[r.priority] }}
                  >
                    {r.priority === 'critical' ? 'emergency' : r.priority === 'high' ? 'warning' : r.priority === 'medium' ? 'info' : 'check_circle'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold leading-tight">{r.title}</p>
                    <p className="text-[10px] mt-0.5 opacity-80 leading-relaxed">{r.message}</p>
                    {r.action && (
                      <p className="text-[9px] mt-1 font-bold opacity-70">→ {r.action}</p>
                    )}
                  </div>
                  <span
                    className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full border shrink-0 uppercase"
                    style={{ color: PRIORITY_COLORS[r.priority], borderColor: PRIORITY_COLORS[r.priority], background: `${PRIORITY_COLORS[r.priority]}15` }}
                  >
                    {r.priority}
                  </span>
                </div>
              ))}
              {recommendations.length === 0 && (
                <div className="text-center py-8 text-secondary text-xs">
                  <span className="material-symbols-outlined text-3xl text-emerald-300 block mb-2">check_circle</span>
                  All systems nominal — no action items.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[9px] text-secondary font-mono pb-4">
          PlantOps Executive Dashboard • PepsiCo Kolkata • Data refreshes on page load • {new Date().toLocaleString()}
        </div>

      </div>
    </div>
  );
};

export default ExecutiveDashboard;
