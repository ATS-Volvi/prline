import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

export const ProductionPlanning: React.FC = () => {
  const { token, logout, productionLines } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'assumptions' | 'plan' | 'manpower' | 'variance'>('assumptions');

  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assumptions data state
  const [assumptions, setAssumptions] = useState<any>({
    fyLabel: 'FY 2026-27',
    fyStartDate: '2026-04-01',
    numLines: 3,
    ratedCapacityKgHr: 2200,
    hoursPerShift: 8,
    shiftsPerDay: 3,
    workingDaysPerMonth: 26,
    plannedDowntimePct: 0.08,
    rejectionPct: 0.015,
    annualTargetMt: 36000
  });

  const [seasonality, setSeasonality] = useState<any[]>([]);
  const [manpowerNorms, setManpowerNorms] = useState<any[]>([]);
  const [coverageBuffers, setCoverageBuffers] = useState<any>({
    workingDaysPerAssociatePerWeek: 6,
    offFactorAdj: 1.167,
    absenteeBufferPct: 0.05
  });

  // Plan tab states
  const [planGranularity, setPlanGranularity] = useState<'monthly' | 'weekly' | 'daily' | 'quarterly' | 'annual'>('monthly');
  const [planData, setPlanData] = useState<any>(null);

  // Manpower tab states
  const [manpowerPlanData, setManpowerPlanData] = useState<any[]>([]);
  const [currentAllocCount, setCurrentAllocCount] = useState(0);

  // Actuals & Variance tab states
  const [varianceAsOfDate, setVarianceAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [varianceReport, setVarianceReport] = useState<any>(null);
  const [actualInput, setActualInput] = useState({
    productionDate: new Date().toISOString().split('T')[0],
    lineId: 'LINE-01',
    shift: 'A',
    actualOutputMt: '',
    notes: ''
  });
  const [savingActual, setSavingActual] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ─── Live capacity derived from current form inputs ──────────────────────
  const liveCapacity = (() => {
    const oee = (1 - Number(assumptions.plannedDowntimePct)) * (1 - Number(assumptions.rejectionPct));
    const theoretical =
      (Number(assumptions.numLines) *
        Number(assumptions.ratedCapacityKgHr) *
        Number(assumptions.hoursPerShift) *
        Number(assumptions.shiftsPerDay) *
        Number(assumptions.workingDaysPerMonth) *
        12 *
        oee) /
      1000;
    const target = Number(assumptions.annualTargetMt);
    const utilization = theoretical > 0 ? target / theoretical : 0;
    const optimal80 = Math.round(theoretical * 0.8);
    return { theoretical: Math.round(theoretical), utilization, optimal80, target };
  })();
  const capacityStatus =
    liveCapacity.utilization <= 0.8 ? 'safe'
    : liveCapacity.utilization <= 1.0 ? 'caution'
    : 'over';


  // Helper fetch wrapper
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired');
    }
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'API request failed');
    }
    return json;
  };

  // Load assumptions on mount
  const loadAssumptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWithAuth(`/api/v1/planning/assumptions?t=${Date.now()}`);
      if (res.data) {
        setAssumptions({
          fyLabel: res.data.fyLabel || 'FY 2026-27',
          fyStartDate: res.data.fyStartDate || '2026-04-01',
          numLines: res.data.numLines ?? 3,
          ratedCapacityKgHr: Number(res.data.ratedCapacityKgHr) ?? 2200,
          hoursPerShift: Number(res.data.hoursPerShift) ?? 8,
          shiftsPerDay: res.data.shiftsPerDay ?? 3,
          workingDaysPerMonth: Number(res.data.workingDaysPerMonth) ?? 26,
          plannedDowntimePct: Number(res.data.plannedDowntimePct) ?? 0.08,
          rejectionPct: Number(res.data.rejectionPct) ?? 0.015,
          annualTargetMt: Number(res.data.annualTargetMt) ?? 36000
        });
        if (res.data.seasonality) setSeasonality(res.data.seasonality);
        if (res.data.norms) setManpowerNorms(res.data.norms);
        if (res.data.buffers) setCoverageBuffers(res.data.buffers);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load assumptions');
    } finally {
      setLoading(false);
    }
  };

  // Save assumptions
  const handleSaveAssumptions = async () => {
    if (capacityStatus !== 'safe') {
      const confirmAnyway = window.confirm(
        capacityStatus === 'over'
          ? `⚠️ Annual target (${liveCapacity.target.toLocaleString()} MT) exceeds 100% of theoretical capacity (${liveCapacity.theoretical.toLocaleString()} MT). This is physically impossible. Please reduce the target or add more lines/shifts before saving.\n\nPress Cancel to go back and fix it.`
          : `⚠️ Annual target (${liveCapacity.target.toLocaleString()} MT) exceeds the recommended 80% utilization ceiling (${liveCapacity.optimal80.toLocaleString()} MT optimal). High utilization risks unplanned downtime.\n\nPress OK to save anyway, or Cancel to revise.`
      );
      if (!confirmAnyway) return;
    }
    try {
      setLoading(true);
      setError(null);
      await fetchWithAuth('/api/v1/planning/assumptions', {
        method: 'PUT',
        body: JSON.stringify({
          assumptions,
          seasonality,
          norms: manpowerNorms,
          buffers: coverageBuffers
        })
      });
      alert('Assumptions updated successfully!');
      loadAssumptions();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save assumptions');
      setLoading(false);
    }
  };

  // Load production plan
  const loadPlan = async () => {
    try {
      setError(null);
      const res = await fetchWithAuth(`/api/v1/planning/plan?granularity=${planGranularity}&t=${Date.now()}`);
      setPlanData(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load plan');
    }
  };

  // Load manpower norms
  const loadManpower = async () => {
    try {
      setError(null);
      const res = await fetchWithAuth(`/api/v1/planning/manpower?t=${Date.now()}`);
      setManpowerPlanData(res.data || []);
      setCurrentAllocCount(res.currentAllocationsCount || 0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load manpower plan');
    }
  };

  // Load variance report
  const loadVariance = async () => {
    try {
      setError(null);
      const res = await fetchWithAuth(`/api/v1/planning/variance?asOf=${varianceAsOfDate}&t=${Date.now()}`);
      setVarianceReport(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load variance report');
    }
  };

  // Submit actual output
  const handleSubmitActual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualInput.actualOutputMt || isNaN(Number(actualInput.actualOutputMt))) {
      alert('Please enter a valid numeric actual output value.');
      return;
    }

    try {
      setSavingActual(true);
      setSaveSuccess(false);
      await fetchWithAuth('/api/v1/planning/actuals', {
        method: 'POST',
        body: JSON.stringify({
          ...actualInput,
          actualOutputMt: Number(actualInput.actualOutputMt)
        })
      });
      setSaveSuccess(true);
      setActualInput(prev => ({ ...prev, actualOutputMt: '', notes: '' }));
      loadVariance();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to log actual output');
    } finally {
      setSavingActual(false);
    }
  };

  useEffect(() => {
    loadAssumptions();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'plan') loadPlan();
    if (activeSubTab === 'manpower') loadManpower();
    if (activeSubTab === 'variance') loadVariance();
  }, [activeSubTab, planGranularity, varianceAsOfDate]);

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background select-none animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center px-margin-desktop h-16 w-full border-b border-outline-variant shrink-0 bg-surface-container-lowest">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-headline-md font-bold">timeline</span>
          <h1 className="text-base font-bold text-[#0F172A]">Production & Manpower Planning</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant bg-surface-container-lowest shrink-0 px-6">
        <button
          onClick={() => setActiveSubTab('assumptions')}
          className={`py-3 px-4 text-[10px] font-bold tracking-wider border-b-2 transition-all ${
            activeSubTab === 'assumptions' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          ASSUMPTIONS
        </button>
        <button
          onClick={() => setActiveSubTab('plan')}
          className={`py-3 px-4 text-[10px] font-bold tracking-wider border-b-2 transition-all ${
            activeSubTab === 'plan' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          PRODUCTION PLAN
        </button>
        <button
          onClick={() => setActiveSubTab('manpower')}
          className={`py-3 px-4 text-[10px] font-bold tracking-wider border-b-2 transition-all ${
            activeSubTab === 'manpower' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          MANPOWER PLAN
        </button>
        <button
          onClick={() => setActiveSubTab('variance')}
          className={`py-3 px-4 text-[10px] font-bold tracking-wider border-b-2 transition-all ${
            activeSubTab === 'variance' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          ACTUALS & VARIANCE
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-margin-desktop flex flex-col gap-6 custom-scrollbar bg-slate-50/50">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20 bg-white border border-outline-variant rounded-xl shadow-premium-sm">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
              <p className="mt-4 text-xs font-bold text-secondary uppercase tracking-wider">Recalculating snack planner matrix...</p>
            </div>
          </div>
        ) : (
          <>
            {/* 1. ASSUMPTIONS SUB TAB */}
            {activeSubTab === 'assumptions' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: General Assumptions Form */}
                <div className="lg:col-span-2 bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm flex flex-col gap-5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Capacity & Target Config</h3>
                    <button
                      onClick={handleSaveAssumptions}
                      className="py-1.5 px-4 bg-primary hover:bg-primary-hover text-[10px] font-bold text-white rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-premium-sm uppercase tracking-wider"
                    >
                      <span className="material-symbols-outlined text-xs">save</span> Save Config
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Fiscal Year Label</label>
                      <input
                        type="text"
                        value={assumptions.fyLabel}
                        onChange={e => setAssumptions({ ...assumptions, fyLabel: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">FY Start Date</label>
                      <input
                        type="date"
                        value={assumptions.fyStartDate}
                        onChange={e => setAssumptions({ ...assumptions, fyStartDate: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Active Lines</label>
                      <input
                        type="number"
                        value={assumptions.numLines}
                        onChange={e => setAssumptions({ ...assumptions, numLines: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Rated Line Capacity (kg/hr)</label>
                      <input
                        type="number"
                        value={assumptions.ratedCapacityKgHr}
                        onChange={e => setAssumptions({ ...assumptions, ratedCapacityKgHr: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Hours Per Shift</label>
                      <input
                        type="number"
                        value={assumptions.hoursPerShift}
                        onChange={e => setAssumptions({ ...assumptions, hoursPerShift: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Shifts Per Day</label>
                      <input
                        type="number"
                        value={assumptions.shiftsPerDay}
                        onChange={e => setAssumptions({ ...assumptions, shiftsPerDay: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Working Days Per Month</label>
                      <input
                        type="number"
                        value={assumptions.workingDaysPerMonth}
                        onChange={e => setAssumptions({ ...assumptions, workingDaysPerMonth: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Annual Volume Target (MT)</label>
                      <input
                        type="number"
                        value={assumptions.annualTargetMt}
                        onChange={e => setAssumptions({ ...assumptions, annualTargetMt: Number(e.target.value) })}
                        className={`w-full text-xs p-2.5 border rounded-lg focus:outline-none font-medium transition-colors ${
                          capacityStatus === 'safe' ? 'border-slate-200 focus:border-primary'
                          : capacityStatus === 'caution' ? 'border-amber-400 focus:border-amber-500 bg-amber-50/40'
                          : 'border-rose-400 focus:border-rose-500 bg-rose-50/40'
                        }`}
                      />

                      {/* Capacity gauge bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <span>0%</span>
                          <span className="text-emerald-600">80% Optimal</span>
                          <span className="text-rose-500">100% Max</span>
                        </div>
                        <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          {/* Colour zones */}
                          <div className="absolute inset-y-0 left-0 w-[80%] bg-emerald-100 rounded-l-full" />
                          <div className="absolute inset-y-0 left-[80%] w-[20%] bg-amber-100 rounded-r-full" />
                          {/* Filled bar */}
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                              capacityStatus === 'safe' ? 'bg-emerald-500'
                              : capacityStatus === 'caution' ? 'bg-amber-500'
                              : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(liveCapacity.utilization * 100, 100)}%` }}
                          />
                          {/* 80% tick */}
                          <div className="absolute inset-y-0 left-[80%] w-px bg-emerald-600" />
                        </div>
                        <p className={`text-[10px] font-bold mt-1 ${
                          capacityStatus === 'safe' ? 'text-emerald-600'
                          : capacityStatus === 'caution' ? 'text-amber-600'
                          : 'text-rose-600'
                        }`}>
                          {(liveCapacity.utilization * 100).toFixed(1)}% utilization
                          {capacityStatus === 'safe' && ' — within optimal range ✓'}
                          {capacityStatus === 'caution' && ' — above recommended 80% ceiling ⚠'}
                          {capacityStatus === 'over' && ' — exceeds physical capacity ✗'}
                        </p>
                      </div>

                      {/* Reference cards */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
                          <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Optimal Target</p>
                          <p className="text-sm font-bold text-emerald-800 mt-0.5">{liveCapacity.optimal80.toLocaleString()} MT</p>
                          <p className="text-[8px] text-emerald-600 font-medium">80% of capacity</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Max Theoretical</p>
                          <p className="text-sm font-bold text-slate-700 mt-0.5">{liveCapacity.theoretical.toLocaleString()} MT</p>
                          <p className="text-[8px] text-slate-400 font-medium">100% OEE capacity</p>
                        </div>
                        <div className={`rounded-lg p-2.5 text-center border ${
                          capacityStatus === 'safe' ? 'bg-emerald-50 border-emerald-200'
                          : capacityStatus === 'caution' ? 'bg-amber-50 border-amber-300'
                          : 'bg-rose-50 border-rose-300'
                        }`}>
                          <p className={`text-[9px] font-bold uppercase tracking-wider ${
                            capacityStatus === 'safe' ? 'text-emerald-700'
                            : capacityStatus === 'caution' ? 'text-amber-700'
                            : 'text-rose-700'
                          }`}>Current Target</p>
                          <p className={`text-sm font-bold mt-0.5 ${
                            capacityStatus === 'safe' ? 'text-emerald-800'
                            : capacityStatus === 'caution' ? 'text-amber-800'
                            : 'text-rose-800'
                          }`}>{liveCapacity.target.toLocaleString()} MT</p>
                          <p className={`text-[8px] font-medium ${
                            capacityStatus === 'safe' ? 'text-emerald-600'
                            : capacityStatus === 'caution' ? 'text-amber-600'
                            : 'text-rose-600'
                          }`}>{(liveCapacity.utilization * 100).toFixed(1)}% utilization</p>
                        </div>
                      </div>

                      {/* Warning banner */}
                      {capacityStatus !== 'safe' && (
                        <div className={`mt-3 flex items-start gap-2.5 rounded-lg px-3 py-2.5 border text-xs font-semibold ${
                          capacityStatus === 'caution'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}>
                          <span className="material-symbols-outlined text-sm shrink-0 mt-px">
                            {capacityStatus === 'caution' ? 'warning' : 'error'}
                          </span>
                          <div>
                            {capacityStatus === 'caution' ? (
                              <>
                                <span className="font-bold">Above recommended ceiling.</span> Your target ({liveCapacity.target.toLocaleString()} MT) exceeds 80% of theoretical capacity.
                                The optimal sustainable target for this configuration is <span className="font-bold">{liveCapacity.optimal80.toLocaleString()} MT</span>.
                                Operating above 80% increases unplanned downtime risk.
                              </>
                            ) : (
                              <>
                                <span className="font-bold">Impossible target.</span> Your target ({liveCapacity.target.toLocaleString()} MT) exceeds the physical maximum capacity
                                of <span className="font-bold">{liveCapacity.theoretical.toLocaleString()} MT</span> ({(liveCapacity.utilization * 100).toFixed(1)}% utilization).
                                Add more lines or shifts, or reduce the target to ≤{liveCapacity.optimal80.toLocaleString()} MT.
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Planned Downtime %</label>
                      <input
                        type="number"
                        step="0.001"
                        value={assumptions.plannedDowntimePct}
                        onChange={e => setAssumptions({ ...assumptions, plannedDowntimePct: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Product Rejection %</label>
                      <input
                        type="number"
                        step="0.001"
                        value={assumptions.rejectionPct}
                        onChange={e => setAssumptions({ ...assumptions, rejectionPct: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Coverage & Attendance Buffers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Working Days/Associate/Week</label>
                        <input
                          type="number"
                          value={coverageBuffers.workingDaysPerAssociatePerWeek}
                          onChange={e => setCoverageBuffers({ ...coverageBuffers, workingDaysPerAssociatePerWeek: Number(e.target.value) })}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Off-Day Adjustment Factor</label>
                        <input
                          type="number"
                          step="0.001"
                          value={coverageBuffers.offFactorAdj}
                          onChange={e => setCoverageBuffers({ ...coverageBuffers, offFactorAdj: Number(e.target.value) })}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Absentee Buffer %</label>
                        <input
                          type="number"
                          step="0.001"
                          value={coverageBuffers.absenteeBufferPct}
                          onChange={e => setCoverageBuffers({ ...coverageBuffers, absenteeBufferPct: Number(e.target.value) })}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Monthly Seasonality Table */}
                <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Monthly Seasonality</h3>
                  <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-2">Month</th>
                          <th className="py-2">Index Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seasonality.map((s, idx) => (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-2 font-semibold text-slate-700">{s.month}</td>
                            <td className="py-1">
                              <input
                                type="number"
                                step="0.01"
                                value={s.indexValue}
                                onChange={e => {
                                  const updated = [...seasonality];
                                  updated[idx] = { ...s, indexValue: Number(e.target.value) };
                                  setSeasonality(updated);
                                }}
                                className="w-24 p-1 text-xs border border-slate-200 rounded text-center focus:outline-none focus:border-primary font-medium"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PLAN GRANULARITY & cascade */}
            {activeSubTab === 'plan' && planData && (
              <div className="flex flex-col gap-6">
                <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-premium-sm flex justify-between items-center">
                  <div className="flex gap-2">
                    {['annual', 'quarterly', 'monthly', 'weekly', 'daily'].map((g: any) => (
                      <button
                        key={g}
                        onClick={() => setPlanGranularity(g)}
                        className={`py-1.5 px-4 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                          planGranularity === g
                            ? 'bg-primary text-white border-primary shadow-premium-sm'
                            : 'bg-white text-secondary border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Annual Detail Card */}
                {planGranularity === 'annual' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Annual Production Target</span>
                      <span className="text-3xl font-bold text-primary block">{planData.annualTarget?.toLocaleString()} MT</span>
                    </div>
                    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Theoretical Factory Capacity</span>
                      <span className="text-3xl font-bold text-[#14b8a6] block">{planData.theoreticalCapacity?.toFixed(1)} MT</span>
                    </div>
                    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Capacity Utilization</span>
                      <span className="text-3xl font-bold text-slate-800 block">{(planData.utilization * 100)?.toFixed(1)}%</span>
                    </div>
                  </div>
                )}

                {/* Table & Chart layout */}
                {planGranularity !== 'annual' && Array.isArray(planData) && (
                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    {/* Left 3 cols: Table */}
                    <div className="xl:col-span-3 bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm flex flex-col gap-4">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Plan Cascade Table</h3>
                      <div className="overflow-x-auto max-h-[450px] custom-scrollbar">
                        <table className="min-w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                              {planGranularity === 'monthly' && (
                                <>
                                  <th className="py-2">Month</th>
                                  <th className="py-2">Index</th>
                                  <th className="py-2">Target (MT)</th>
                                  <th className="py-2">Daily Target</th>
                                  <th className="py-2">Capacity</th>
                                  <th className="py-2">Util %</th>
                                </>
                              )}
                              {planGranularity === 'quarterly' && (
                                <>
                                  <th className="py-2">Quarter</th>
                                  <th className="py-2">Target (MT)</th>
                                  <th className="py-2">Capacity (MT)</th>
                                  <th className="py-2">Util %</th>
                                </>
                              )}
                              {planGranularity === 'weekly' && (
                                <>
                                  <th className="py-2">Week #</th>
                                  <th className="py-2">Start Date</th>
                                  <th className="py-2">End Date</th>
                                  <th className="py-2">Target (MT)</th>
                                  <th className="py-2">Daily Target</th>
                                </>
                              )}
                              {planGranularity === 'daily' && (
                                <>
                                  <th className="py-2">Date</th>
                                  <th className="py-2">Day of Week</th>
                                  <th className="py-2">Week #</th>
                                  <th className="py-2">Target (MT)</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {planData.map((row: any, idx: number) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                                {planGranularity === 'monthly' && (
                                  <>
                                    <td className="py-2.5 font-bold text-slate-700">{row.month}</td>
                                    <td className="py-2.5 font-medium text-slate-600">{Number(row.seasonalityIndex).toFixed(2)}</td>
                                    <td className="py-2.5 font-bold text-primary">{Number(row.monthlyTarget).toFixed(1)}</td>
                                    <td className="py-2.5 font-semibold text-slate-700">{Number(row.dailyOutputRequired).toFixed(1)}</td>
                                    <td className="py-2.5 text-slate-500">{Number(row.monthlyCapacity).toFixed(1)}</td>
                                    <td className="py-2.5">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        row.utilization > 0.85 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {(Number(row.utilization) * 100).toFixed(1)}%
                                      </span>
                                    </td>
                                  </>
                                )}
                                {planGranularity === 'quarterly' && (
                                  <>
                                    <td className="py-3 font-bold text-slate-800">{row.quarter}</td>
                                    <td className="py-3 font-bold text-primary">{Number(row.quarterlyTarget).toFixed(1)}</td>
                                    <td className="py-3 text-slate-500">{Number(row.quarterlyCapacity).toFixed(1)}</td>
                                    <td className="py-3">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                        {(Number(row.utilization) * 100).toFixed(1)}%
                                      </span>
                                    </td>
                                  </>
                                )}
                                {planGranularity === 'weekly' && (
                                  <>
                                    <td className="py-2.5 font-bold text-slate-700">Week {row.weekNum}</td>
                                    <td className="py-2.5 font-medium text-slate-600">{row.startDate}</td>
                                    <td className="py-2.5 font-medium text-slate-600">{row.endDate}</td>
                                    <td className="py-2.5 font-bold text-primary">{Number(row.weeklyTarget).toFixed(1)}</td>
                                    <td className="py-2.5 font-semibold text-slate-700">{Number(row.dailyTarget).toFixed(1)}</td>
                                  </>
                                )}
                                {planGranularity === 'daily' && (
                                  <>
                                    <td className="py-2 font-bold text-slate-700">{row.date}</td>
                                    <td className="py-2 font-medium text-slate-600">{row.dayOfWeek}</td>
                                    <td className="py-2 text-slate-500">Week {row.weekNum}</td>
                                    <td className="py-2 font-bold text-primary">{Number(row.target).toFixed(2)}</td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right 2 cols: Chart */}
                    <div className="xl:col-span-2 bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm flex flex-col gap-4">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Targets Chart</h3>
                      <div className="h-[320px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={planData.slice(0, planGranularity === 'daily' ? 14 : undefined)}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <XAxis
                              dataKey={
                                planGranularity === 'monthly'
                                  ? 'month'
                                  : planGranularity === 'quarterly'
                                  ? 'quarter'
                                  : planGranularity === 'weekly'
                                  ? 'weekNum'
                                  : 'date'
                              }
                              tick={{ fontSize: 9, fill: '#64748b' }}
                            />
                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ fontSize: '10px' }} />
                            <Bar
                              dataKey={
                                planGranularity === 'monthly'
                                  ? 'monthlyTarget'
                                  : planGranularity === 'quarterly'
                                  ? 'quarterlyTarget'
                                  : planGranularity === 'weekly'
                                  ? 'weeklyTarget'
                                  : 'target'
                              }
                              name="Target Volume (MT)"
                              fill="#1e293b"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. MANPOWER SUB TAB */}
            {activeSubTab === 'manpower' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Header card for totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Manpower Associates Required</span>
                    <span className="text-3xl font-bold text-primary block">
                      {manpowerPlanData.reduce((sum, row) => sum + row.associatesRequired, 0)} Associates
                    </span>
                  </div>
                  <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Current Allocated Associates (Today)</span>
                    <span className="text-3xl font-bold text-[#14b8a6] block">{currentAllocCount} Headcount</span>
                  </div>
                </div>

                <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Resource & Manpower Plan Cascade</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-3">Role Designation</th>
                          <th className="py-3">Skill Group</th>
                          <th className="py-3">Manpower Scale Scope</th>
                          <th className="py-3 text-center">Positions / Shift</th>
                          <th className="py-3 text-center">Positions / Day</th>
                          <th className="py-3 text-center">Associates Required (Buffer Adj)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manpowerPlanData.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-3.5 font-bold text-slate-800">{row.role}</td>
                            <td className="py-3.5 font-semibold text-slate-600">{row.category}</td>
                            <td className="py-3.5 font-medium text-slate-500 uppercase tracking-wider text-[10px]">
                              {row.scope.replace(/_/g, ' ')}
                            </td>
                            <td className="py-3.5 text-center font-semibold text-slate-700">{row.positionsPerShift}</td>
                            <td className="py-3.5 text-center font-semibold text-slate-700">{row.positionsPerDay}</td>
                            <td className="py-3.5 text-center">
                              <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg font-bold">
                                {row.associatesRequired}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ACTUALS & VARIANCE */}
            {activeSubTab === 'variance' && (
              <div className="flex flex-col gap-6">
                {/* Form and variance KPI cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Actual entry form */}
                  <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Log Actual Output</h3>
                    <form onSubmit={handleSubmitActual} className="flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Production Date</label>
                        <input
                          type="date"
                          value={actualInput.productionDate}
                          onChange={e => setActualInput({ ...actualInput, productionDate: e.target.value })}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Production Line</label>
                        <select
                          value={actualInput.lineId}
                          onChange={e => setActualInput({ ...actualInput, lineId: e.target.value })}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-semibold text-slate-700 bg-white"
                        >
                          <option value="">Plant-wide Total</option>
                          {productionLines.map(line => (
                            <option key={line.id} value={line.id}>
                              {line.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Shift</label>
                        <select
                          value={actualInput.shift}
                          onChange={e => setActualInput({ ...actualInput, shift: e.target.value })}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-semibold text-slate-700 bg-white"
                        >
                          <option value="">All Day</option>
                          <option value="A">Shift A</option>
                          <option value="B">Shift B</option>
                          <option value="C">Shift C</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Actual Output (MT)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 110.5"
                          value={actualInput.actualOutputMt}
                          onChange={e => setActualInput({ ...actualInput, actualOutputMt: e.target.value })}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Notes</label>
                        <input
                          type="text"
                          placeholder="Batch info, downtime remarks..."
                          value={actualInput.notes}
                          onChange={e => setActualInput({ ...actualInput, notes: e.target.value })}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-medium"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingActual}
                        className="py-2.5 px-4 bg-primary hover:bg-primary-hover text-[10px] font-bold text-white rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-premium-sm uppercase tracking-wider mt-2"
                      >
                        {savingActual ? (
                          <>
                            <span className="material-symbols-outlined text-xs animate-spin">sync</span> Submitting...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-xs">add_circle</span> Log Actual Output
                          </>
                        )}
                      </button>
                      {saveSuccess && (
                        <p className="text-[10px] text-green-600 font-bold text-center">Output log saved successfully!</p>
                      )}
                    </form>
                  </div>

                  {/* Variance report KPI dashboard */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-premium-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Variance Analysis</h4>
                        <p className="text-[10px] text-slate-500 font-medium">As of selected reporting date</p>
                      </div>
                      <div>
                        <input
                          type="date"
                          value={varianceAsOfDate}
                          onChange={e => setVarianceAsOfDate(e.target.value)}
                          className="text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary font-semibold text-slate-700 bg-white"
                        />
                      </div>
                    </div>

                    {varianceReport && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Planned Target (Cumulative)</span>
                            <span className="text-2xl font-bold text-slate-800">
                              {Number(varianceReport.plannedToDate).toLocaleString(undefined, { maximumFractionDigits: 1 })} MT
                            </span>
                          </div>
                          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actual Output (Cumulative)</span>
                            <span className="text-2xl font-bold text-[#14b8a6]">
                              {Number(varianceReport.actualToDate).toLocaleString(undefined, { maximumFractionDigits: 1 })} MT
                            </span>
                          </div>
                          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Production Volume Gap</span>
                            <span className={`text-2xl font-bold ${varianceReport.gapMT >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                              {varianceReport.gapMT >= 0 ? '+' : ''}
                              {Number(varianceReport.gapMT).toLocaleString(undefined, { maximumFractionDigits: 1 })} MT (
                              {(Number(varianceReport.gapPct) * 100).toFixed(1)}%)
                            </span>
                          </div>
                          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm flex flex-col gap-1 border-l-4 border-l-primary">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Required Daily Rate to Catch Up</span>
                            <span className="text-2xl font-bold text-primary">
                              {Number(varianceReport.requiredDailyRateToRecover).toFixed(2)} MT / day
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {varianceReport.catchUpDeltaVsOriginalPlan > 0
                                ? `+${Number(varianceReport.catchUpDeltaVsOriginalPlan).toFixed(2)} MT/day delta vs original planned rate`
                                : `${Number(varianceReport.catchUpDeltaVsOriginalPlan).toFixed(2)} MT/day delta vs original rate`}
                            </span>
                          </div>
                        </div>

                        {varianceReport.chartSeries && (
                          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-premium-sm flex flex-col gap-4 mt-6">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Cumulative Target vs Actual Performance</h3>
                            <div className="h-[280px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={varianceReport.chartSeries}
                                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} />
                                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                  <Tooltip contentStyle={{ fontSize: '10px' }} />
                                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                                  <Line type="monotone" dataKey="planned" name="Planned Cumulative Target (MT)" stroke="#64748b" strokeWidth={2} activeDot={{ r: 4 }} />
                                  <Line type="monotone" dataKey="actual" name="Actual Cumulative Output (MT)" stroke="#14b8a6" strokeWidth={2.5} connectNulls />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default ProductionPlanning;
