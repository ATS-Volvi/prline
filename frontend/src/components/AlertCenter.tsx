import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateRecommendations, type RecommendationPriority } from '../utils/recommendations';

const PRIORITY_COLORS: Record<RecommendationPriority, string> = {
  critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981',
};
const PRIORITY_BG: Record<RecommendationPriority, string> = {
  critical: 'bg-error-container border-outline-variant',
  high: 'bg-secondary-container border-outline-variant',
  medium: 'bg-secondary-container border-blue-200',
  low: 'bg-tertiary-fixed-dim/20 border-outline-variant',
};
const PRIORITY_TEXT: Record<RecommendationPriority, string> = {
  critical: 'text-on-error-container', high: 'text-on-secondary-container', medium: 'text-on-secondary-container', low: 'text-on-tertiary-fixed-variant',
};
const PRIORITY_ICON: Record<RecommendationPriority, string> = {
  critical: 'emergency', high: 'warning', medium: 'info', low: 'check_circle',
};
const CATEGORY_ICON: Record<string, string> = {
  staffing: 'groups', certification: 'military_tech', safety: 'safety_check',
  production: 'conveyor_belt', overtime: 'schedule', forecast: 'trending_up', maintenance: 'build',
};

type FilterPriority = RecommendationPriority | 'all';
type FilterStatus = 'active' | 'dismissed' | 'all';

interface AlertCenterProps {
  setActiveTab?: (tab: string) => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({ setActiveTab }) => {
  const {
    associates, associateSkills, workstations, productionLines,
    shifts, allocations, leaveRecords, skills,
  } = useApp();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const data = useMemo(() => ({
    associates, associateSkills, workstations, productionLines,
    shifts, allocations, leaveRecords, skills,
  }), [associates, associateSkills, workstations, productionLines, shifts, allocations, leaveRecords, skills]);

  const allRecs = useMemo(() => generateRecommendations(data), [data]);

  const filtered = useMemo(() => {
    return allRecs.filter(r => {
      if (filterStatus === 'active' && dismissedIds.has(r.id)) return false;
      if (filterStatus === 'dismissed' && !dismissedIds.has(r.id)) return false;
      if (filterPriority !== 'all' && r.priority !== filterPriority) return false;
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())
        && !r.message.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allRecs, dismissedIds, filterPriority, filterStatus, filterCategory, search]);

  const dismiss = (id: string) => setDismissedIds(prev => { const s = new Set(prev); s.add(id); return s; });
  const restore = (id: string) => setDismissedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  const dismissAll = () => setDismissedIds(new Set(allRecs.map(r => r.id)));

  const counts = useMemo(() => ({
    critical: allRecs.filter(r => r.priority === 'critical' && !dismissedIds.has(r.id)).length,
    high: allRecs.filter(r => r.priority === 'high' && !dismissedIds.has(r.id)).length,
    medium: allRecs.filter(r => r.priority === 'medium' && !dismissedIds.has(r.id)).length,
    low: allRecs.filter(r => r.priority === 'low' && !dismissedIds.has(r.id)).length,
  }), [allRecs, dismissedIds]);

  const categories = useMemo(() => [...new Set(allRecs.map(r => r.category))], [allRecs]);

  return (
    <div className="flex-1 h-full flex flex-col overflow-y-auto bg-background select-none">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface-container-lowest border-b border-outline-variant px-6 h-16 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            notifications_active
          </span>
          <div>
            <h1 className="text-sm font-bold text-primary tracking-tight">Alert Center</h1>
            <p className="text-[10px] text-secondary">
              {counts.critical + counts.high} action{counts.critical + counts.high !== 1 ? 's' : ''} require attention
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(counts.critical + counts.high + counts.medium + counts.low) > 0 && (
            <button
              onClick={dismissAll}
              className="px-3 py-1.5 text-[10px] font-mono font-bold text-secondary border border-outline-variant rounded-lg hover:bg-surface-container-low cursor-pointer transition-all"
            >
              Dismiss All
            </button>
          )}
        </div>
      </header>

      <div className="p-6 flex flex-col gap-5">

        {/* Summary severity pills */}
        <div className="grid grid-cols-4 gap-3">
          {(['critical', 'high', 'medium', 'low'] as RecommendationPriority[]).map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(prev => prev === p ? 'all' : p)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                filterPriority === p ? 'border-slate-400 shadow-sm scale-[1.02]' : 'border-outline-variant hover:border-outline'
              } ${PRIORITY_BG[p]}`}
            >
              <div className={`text-lg font-bold font-mono ${PRIORITY_TEXT[p]}`}>
                {p === 'critical' ? counts.critical : p === 'high' ? counts.high : p === 'medium' ? counts.medium : counts.low}
              </div>
              <div className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${PRIORITY_TEXT[p]}`}>{p}</div>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[180px] relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-secondary">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search alerts..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-surface-container-lowest text-slate-700 font-mono"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as FilterStatus)}
            className="py-2 px-3 border border-outline-variant bg-surface-container-lowest text-slate-700 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-mono"
          >
            <option value="active">Active</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All</option>
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="py-2 px-3 border border-outline-variant bg-surface-container-lowest text-slate-700 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-mono"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>

          <span className="text-[10px] text-secondary font-mono ml-auto">
            {filtered.length} of {allRecs.length} alert{allRecs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Alert list */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-secondary">
              <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">
                {filterStatus === 'dismissed' ? 'check_circle' : 'notifications_off'}
              </span>
              <p className="text-sm font-bold text-slate-500">
                {filterStatus === 'dismissed' ? 'No dismissed alerts' : 'No alerts match your filters'}
              </p>
              <p className="text-xs mt-1">
                {filterStatus === 'active' && allRecs.length > 0
                  ? 'All alerts have been dismissed'
                  : 'Adjust filters or check back later'}
              </p>
            </div>
          )}

          {filtered.map(r => {
            const isDismissed = dismissedIds.has(r.id);
            return (
              <div
                key={r.id}
                className={`bg-surface-container-lowest border rounded-xl p-4 flex gap-4 items-start transition-all shadow-sm ${
                  isDismissed ? 'opacity-50 border-outline-variant' : `${PRIORITY_BG[r.priority]} border`
                }`}
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${PRIORITY_COLORS[r.priority]}15` }}
                >
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ color: PRIORITY_COLORS[r.priority], fontVariationSettings: "'FILL' 1" }}
                  >
                    {PRIORITY_ICON[r.priority]}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full border uppercase"
                      style={{
                        color: PRIORITY_COLORS[r.priority],
                        borderColor: PRIORITY_COLORS[r.priority],
                        background: `${PRIORITY_COLORS[r.priority]}12`,
                      }}
                    >
                      {r.priority}
                    </span>
                    <span className="text-[9px] text-secondary font-mono flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">{CATEGORY_ICON[r.category] || 'label'}</span>
                      {r.category}
                    </span>
                    {r.affectedEntity && (
                      <span className="text-[9px] text-secondary font-mono">• {r.affectedEntity}</span>
                    )}
                  </div>

                  <h3 className={`text-xs font-bold leading-tight ${PRIORITY_TEXT[r.priority]}`}>{r.title}</h3>
                  <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{r.message}</p>

                  {r.action && !isDismissed && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-secondary">arrow_forward</span>
                      <span className="text-[9px] font-bold text-secondary">{r.action}</span>
                      {r.affectedEntity && setActiveTab && (
                        <button
                          onClick={() => setActiveTab(
                            r.affectedEntity === 'Shift Planner' ? 'shift_planner' :
                            r.affectedEntity === 'Skill Matrix' ? 'skill_matrix' :
                            r.affectedEntity === 'Dashboard' ? 'dashboard' : 'dashboard'
                          )}
                          className="ml-1 text-[9px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Go →
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-[8px] text-secondary font-mono mt-1.5">
                    {new Date(r.timestamp).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => isDismissed ? restore(r.id) : dismiss(r.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold font-mono border transition-all cursor-pointer shrink-0 hover:shadow-sm"
                  style={{
                    color: isDismissed ? '#10b981' : PRIORITY_COLORS[r.priority],
                    borderColor: isDismissed ? '#10b981' : PRIORITY_COLORS[r.priority],
                    background: isDismissed ? '#ecfdf5' : 'transparent',
                  }}
                >
                  {isDismissed ? 'Restore' : 'Dismiss'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AlertCenter;
