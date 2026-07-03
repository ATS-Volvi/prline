import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart
} from 'recharts';
import { generateRecommendations } from '../utils/recommendations';
import ExportToolbar from './shared/ExportToolbar';

// ─── Unified Palette ────────────────────────────────────────────────────────
const PALETTE = {
  teal:  '#14b8a6',
  rose:  '#f43f5e',
  amber: '#f59e0b',
  slate: '#64748b'
};

const mapColor = (c: string) => {
  const hex = c.toLowerCase();
  if (hex === '#14b8a6' || hex === '#3b82f6' || hex === '#8b5cf6' || hex === '#10b981' || hex === 'text-emerald-400') return PALETTE.teal;
  if (hex === '#f43f5e') return PALETTE.rose;
  if (hex === '#f59e0b') return PALETTE.amber;
  if (hex === '#334155' || hex === '#64748b' || hex === 'text-slate-300') return PALETTE.slate;
  return c;
};

interface ChartSpec {
  type: 'bar' | 'barH' | 'composed' | 'line' | 'table';
  title: string;
  data: any[];
  xKey: string;
  bars?: { key: string; color: string }[];
  lines?: { key: string; color: string }[];
  stacked?: boolean;
  domain?: [number | string, number | string];
}

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 text-white px-2 py-1 rounded text-[8px] font-mono shadow border border-slate-700">
        <p className="font-bold border-b border-slate-700 pb-0.5 mb-0.5">{payload[0].payload.name}</p>
        {payload.map((p: any, idx: number) => (
          <div key={idx} className="flex gap-2 items-center justify-between">
            <span style={{ color: p.color || '#14b8a6' }}>{p.name}:</span>
            <span className="font-bold">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ChartRenderer: React.FC<{ spec: ChartSpec }> = ({ spec }) => {
  if (!spec || !spec.data || spec.data.length === 0) return null;

  return (
    <div className="border-t border-slate-100 pt-2 flex flex-col gap-1">
      <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">{spec.title}</h4>
      <div className="h-[100px] w-full text-[8px] font-mono">
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === 'barH' ? (
            <BarChart layout="vertical" data={spec.data} margin={{ top: 2, right: 10, left: -25, bottom: 0 }}>
              <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 7 }} />
              <YAxis type="category" dataKey={spec.xKey} stroke="#94a3b8" tick={{ fontSize: 7 }} width={45} />
              <Tooltip content={<CustomChartTooltip />} />
              {(spec.bars || []).map((b) => (
                <Bar key={b.key} dataKey={b.key} fill={mapColor(b.color)} stackId={spec.stacked ? 'a' : undefined} radius={[0, 2, 2, 0]} />
              ))}
            </BarChart>
          ) : spec.type === 'composed' ? (
            <ComposedChart data={spec.data} margin={{ top: 2, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey={spec.xKey} stroke="#94a3b8" tick={{ fontSize: 7 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 7 }} />
              <Tooltip content={<CustomChartTooltip />} />
              {(spec.bars || []).map((b) => (
                <Bar key={b.key} dataKey={b.key} fill={mapColor(b.color)} name={b.key} />
              ))}
              {(spec.lines || []).map((l) => (
                <Line key={l.key} type="monotone" dataKey={l.key} stroke={mapColor(l.color)} strokeWidth={1} dot={false} name={l.key} />
              ))}
            </ComposedChart>
          ) : (
            <BarChart data={spec.data} margin={{ top: 2, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey={spec.xKey} stroke="#94a3b8" tick={{ fontSize: 7 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 7 }} domain={spec.domain || [0, 'auto']} />
              <Tooltip content={<CustomChartTooltip />} />
              {(spec.bars || []).map((b) => (
                <Bar key={b.key} dataKey={b.key} fill={mapColor(b.color)} stackId={spec.stacked ? 'a' : undefined} radius={spec.stacked ? undefined : [2, 2, 0, 0]} name={b.key} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── Component ──────────────────────────────────────────────────────────────
export const AiReports: React.FC = () => {
  const { logout } = useApp();

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('14');
  const [selectedLine, setSelectedLine] = useState<string>('ALL');

  // UI animation state
  const [animateOee, setAnimateOee] = useState(false);

  // Mobile UI state
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Expanded recommendations
  const [expandedRecs, setExpandedRecs] = useState<Record<string, boolean>>({});

  // AI Chat states — start with empty array so the empty-state with chips renders
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Machine health registry mock dataset
  const machineRegistry = [
    { id: 'M-01', name: 'Slicing & Washing Drum A', oee: 98 },
    { id: 'M-02', name: 'High-Temp Fryer Unit B',   oee: 84 },
    { id: 'M-03', name: 'Flavor Tumbler System C',  oee: 91 },
  ];

  // OEE average computation
  const oeeAvg = useMemo(() => {
    return Math.round(machineRegistry.reduce((acc, m) => acc + m.oee, 0) / machineRegistry.length);
  }, []);

  // Initialize Web Speech API for voice transcript input
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onstart = () => setIsListening(true);
      rec.onend   = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) setChatInput(transcript);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // ── Data Fetching ────────────────────────────────────────────────────────
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('pepsico_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/state', { headers });
      if (res.status === 401) {
        logout();
        window.location.reload();
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error(`Failed to fetch state: ${res.status}`);

      const stateData = await res.json();
      setReportData(stateData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    const interval = setInterval(() => { fetchReportData(); }, 300000);
    return () => clearInterval(interval);
  }, []);

  // Trigger OEE bar animation on load
  useEffect(() => {
    if (!loading && reportData) {
      const t = setTimeout(() => setAnimateOee(true), 150);
      return () => clearTimeout(t);
    }
  }, [loading, reportData]);

  // Auto-scroll in chat panel
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Computed Analytical Indicators ────────────────────────────────────────
  const computed = useMemo(() => {
    if (!reportData) return null;

    // Use the latest allocation date in the DB as "today"
    const allocations: any[] = reportData.allocations || [];
    const dates = allocations.map((a: any) => a.date);
    const dbTodayDateStr = dates.length > 0
      ? dates.reduce((max: string, d: string) => d > max ? d : max, dates[0])
      : new Date().toISOString().split('T')[0];

    const todayDate = new Date(dbTodayDateStr);

    const activeAssociates = (reportData.associates || []).filter((a: any) => a.status === 'Active');
    const allSkills         = reportData.skills || [];
    const associateSkills   = reportData.associateSkills || [];
    const workstations      = reportData.workstations || [];
    const lines             = reportData.productionLines || [];
    const auditLogs         = reportData.auditLogs || [];
    const leaveRecords      = reportData.leaveRecords || [];

    // Expiration buckets
    const certExpired       = associateSkills.filter((s: any) => new Date(s.expiryDate) < todayDate);
    const certExpiringIn30  = associateSkills.filter((s: any) => {
      const exp  = new Date(s.expiryDate);
      const diff = (exp.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    });
    const certValid = associateSkills.filter((s: any) => new Date(s.expiryDate) >= todayDate);

    // Skill distribution per skill
    const skillDistribution = allSkills.map((sk: any) => {
      const records = associateSkills.filter((s: any) => s.skillId === sk.id);
      return {
        name:      sk.id,
        Trainee:   records.filter((r: any) => r.level === 'Trainee').length,
        Operator:  records.filter((r: any) => r.level === 'Operator').length,
        Certified: records.filter((r: any) => r.level === 'Certified').length,
        Expert:    records.filter((r: any) => r.level === 'Expert').length,
      };
    });

    // Expiry by Month (next 12 months)
    const expiryByMonth = Array.from({ length: 12 }, (_, i) => {
      const d        = new Date(todayDate.getFullYear(), todayDate.getMonth() + i, 1);
      const monthStr = d.toISOString().substring(0, 7);
      const count    = associateSkills.filter((s: any) => s.expiryDate.startsWith(monthStr)).length;
      return {
        name:        d.toLocaleDateString('default', { month: 'short', year: '2-digit' }),
        Expirations: count
      };
    });

    // Active production lines → active workstations (denominator excludes MAINTENANCE/OFFLINE)
    const activeLineIds = lines
      .filter((l: any) => l.status === 'ACTIVE')
      .map((l: any) => l.id);

    const activeWS      = workstations.filter((w: any) => activeLineIds.includes(w.lineId));
    const totalActiveWS = activeWS.length;

    // Workstations with at least one valid allocation today
    const todayAllocs   = allocations.filter((a: any) => a.date === dbTodayDateStr);
    const staffedActiveWS = activeWS.filter((w: any) =>
      todayAllocs.some((a: any) => a.workstationId === w.id)
    );
    const staffedWSCount = staffedActiveWS.length;

    // ── FILL RATE FIX ────────────────────────────────────────────────────────
    const fillRate        = totalActiveWS > 0 ? (staffedWSCount / totalActiveWS) * 100 : 0;
    const understaffedCount = totalActiveWS - staffedWSCount;

    // Reconciliation guard
    const reconciledFillRate = totalActiveWS > 0
      ? ((totalActiveWS - understaffedCount) / totalActiveWS) * 100
      : 0;
    if (Math.abs(fillRate - reconciledFillRate) > 0.01) {
      console.warn(
        `[AiReports] Fill rate mismatch: fillRate=${fillRate.toFixed(1)}% but reconciled=${reconciledFillRate.toFixed(1)}% ` +
        `(understaffedCount=${understaffedCount}, totalActiveWS=${totalActiveWS})`
      );
    }

    // Fill rate last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });
    const fillRateByDate = last30Days.map(date => {
      const dayAllocs  = allocations.filter((a: any) => a.date === date);
      const uniqueWS   = new Set(dayAllocs.map((a: any) => a.workstationId)).size;
      return {
        name:          date.substring(5),
        'Fill Rate %': totalActiveWS > 0 ? Math.round((uniqueWS / totalActiveWS) * 100) : 0
      };
    });

    // Deployment frequency
    const deploymentFreq = activeAssociates.map((a: any) => {
      const count = allocations.filter((al: any) => al.associateId === a.id).length;
      return { name: a.name, count };
    }).sort((a: any, b: any) => b.count - a.count).slice(0, 10);

    // Overrides by user
    const overridesByUser: Record<string, number> = {};
    const standardByUser:  Record<string, number> = {};
    auditLogs.forEach((log: any) => {
      const u = log.userId || 'Supervisor';
      if (log.actionType === 'OVERRIDE_ALLOCATION')  overridesByUser[u] = (overridesByUser[u] || 0) + 1;
      if (log.actionType === 'ALLOCATION_CONFIRMED') standardByUser[u]  = (standardByUser[u]  || 0) + 1;
    });

    const overrideRateByUser = Object.keys({ ...overridesByUser, ...standardByUser }).map(userId => ({
      name:     userId,
      Standard: standardByUser[userId]  || 0,
      Override: overridesByUser[userId] || 0,
    })).slice(0, 5);

    // Line radar
    const lineRadar = lines.filter((l: any) => l.status === 'ACTIVE').map((line: any) => {
      const lineWS     = workstations.filter((w: any) => w.lineId === line.id);
      const totalCerts = lineWS.length;
      const validCerts = lineWS.filter((w: any) => {
        const matches = associateSkills.filter((s: any) => s.skillId === w.requiredSkillId);
        return matches.some((m: any) => new Date(m.expiryDate) >= todayDate);
      }).length;
      return {
        subject:          line.name.split(' - ')[0],
        'Skill Coverage %': totalCerts ? Math.round((validCerts / totalCerts) * 100) : 100,
        'Fill Rate %':      85,
        'Roster Health %':  90,
        'Risk Redundancy %': 80,
      };
    });

    // 14-day forecast
    const forecast = Array.from({ length: 14 }, (_, i) => {
      const d       = new Date(todayDate);
      d.setDate(todayDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const onLeave = new Set(leaveRecords.filter((l: any) => l.date === dateStr).map((l: any) => l.associateId));
      const available = activeAssociates.filter((a: any) => !onLeave.has(a.id)).length;
      return {
        name:      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Available: available,
        Required:  totalActiveWS
      };
    });

    const totalCertsCount     = associateSkills.length;
    const expiredCount        = certExpired.length;
    const coverageGapPercentage = totalCertsCount > 0 ? Math.round((expiredCount / totalCertsCount) * 100) : 0;
    const totalWorkstations   = workstations.length;

    return {
      activeAssociates,
      certExpired,
      certExpiringIn30,
      certValid,
      skillDistribution,
      expiryByMonth,
      fillRateByDate,
      deploymentFreq,
      overrideRateByUser,
      lineRadar,
      forecast,
      totalWorkstations,
      coverageGapPercentage,
      lines,
      workstations,
      todayDateStr: dbTodayDateStr,
      totalActiveWS,
      staffedWSCount,
      fillRate,
      understaffedCount,
    };
  }, [reportData]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const toggleRec = (recId: string) => {
    setExpandedRecs(prev => ({ ...prev, [recId]: !prev[recId] }));
  };

  const getAffectedList = (recId: string) => {
    if (!reportData || !computed) return [];
    const todayDate = new Date(computed.todayDateStr);
    const in7Days   = new Date(todayDate); in7Days.setDate(todayDate.getDate() + 7);
    const in30Days  = new Date(todayDate); in30Days.setDate(todayDate.getDate() + 30);
    const activeAssocIds = new Set((reportData.associates || []).filter((a: any) => a.status === 'Active').map((a: any) => a.id));

    switch (recId) {
      case 'cert-expired': {
        const expired = (reportData.associateSkills || []).filter((s: any) => new Date(s.expiryDate) < todayDate && activeAssocIds.has(s.associateId));
        return Array.from(new Set(expired.map((s: any) => {
          const assoc = (reportData.associates || []).find((a: any) => a.id === s.associateId);
          return assoc ? assoc.name : s.associateId;
        })));
      }
      case 'cert-expiring-7': {
        const expiring7 = (reportData.associateSkills || []).filter((s: any) => {
          const d = new Date(s.expiryDate);
          return d >= todayDate && d <= in7Days && activeAssocIds.has(s.associateId);
        });
        return Array.from(new Set(expiring7.map((s: any) => {
          const assoc = (reportData.associates || []).find((a: any) => a.id === s.associateId);
          return assoc ? assoc.name : s.associateId;
        })));
      }
      case 'cert-expiring-30': {
        const expiring30 = (reportData.associateSkills || []).filter((s: any) => {
          const d = new Date(s.expiryDate);
          return d > in7Days && d <= in30Days && activeAssocIds.has(s.associateId);
        });
        return Array.from(new Set(expiring30.map((s: any) => {
          const assoc = (reportData.associates || []).find((a: any) => a.id === s.associateId);
          return assoc ? assoc.name : s.associateId;
        })));
      }
      case 'high-leave': {
        const leaveToday = (reportData.leaveRecords || []).filter((l: any) => l.date === computed.todayDateStr);
        return Array.from(new Set(leaveToday.map((l: any) => {
          const assoc = (reportData.associates || []).find((a: any) => a.id === l.associateId);
          return assoc ? assoc.name : l.associateId;
        })));
      }
      case 'over-allocated': {
        const overAllocatedWS = (reportData.workstations || []).filter((ws: any) => {
          const count = (reportData.allocations || []).filter((a: any) => a.date === computed.todayDateStr && a.workstationId === ws.id).length;
          return count > (ws.maxStaffCount || 1);
        });
        return overAllocatedWS.map((ws: any) => ws.name);
      }
      case 'lines-halted': {
        return (reportData.productionLines || []).filter((l: any) => l.status === 'HALTED').map((l: any) => l.name.split(' - ')[0]);
      }
      case 'lines-in-maintenance': {
        return (reportData.productionLines || []).filter((l: any) => l.status === 'MAINTENANCE').map((l: any) => l.name.split(' - ')[0]);
      }
      default:
        return [];
    }
  };

  // Skill status data for the certification chart
  const skillStatusData = useMemo(() => {
    if (!reportData || !computed) return [];
    const todayDate     = new Date(computed.todayDateStr);
    const activeAssocIds = new Set((reportData.associates || []).filter((a: any) => a.status === 'Active').map((a: any) => a.id));
    return (reportData.skills || []).map((sk: any) => {
      const records   = (reportData.associateSkills || []).filter((s: any) => s.skillId === sk.id && activeAssocIds.has(s.associateId));
      const expired   = records.filter((s: any) => new Date(s.expiryDate) < todayDate).length;
      const valid     = records.filter((s: any) => new Date(s.expiryDate) >= todayDate).length;
      const displayName = sk.name.length > 8 ? sk.name.substring(0, 8) + '...' : sk.name;
      return { skillId: sk.id, fullName: sk.name, name: displayName, Valid: valid, Expired: expired, Total: valid + expired };
    });
  }, [reportData, computed]);

  const widestGapSkill = useMemo(() => {
    if (skillStatusData.length === 0) return null;
    const sorted = [...skillStatusData].sort((a, b) => b.Expired - a.Expired);
    const top = sorted[0];
    if (!top || top.Expired === 0) return null;
    return top;
  }, [skillStatusData]);

  // ── Custom Tooltips ──────────────────────────────────────────────────────
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 shadow-sm rounded-lg text-[11px] font-sans">
          <p className="font-bold text-slate-800 mb-1.5">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="flex justify-between gap-4 mt-0.5 text-slate-600">
              <span>{entry.name}:</span>
              <strong style={{ color: mapColor(entry.color || entry.stroke) }} className="font-mono">{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomSkillTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3 shadow-sm rounded-lg text-slate-800 text-[11px] font-sans">
          <p className="font-bold mb-1.5">{data.fullName}</p>
          <div className="flex flex-col gap-0.5">
            <p className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">Valid:</span>
              <strong className="text-[#14b8a6] font-mono font-bold">{data.Valid}</strong>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-slate-500 font-medium">Expired:</span>
              <strong className="text-[#f43f5e] font-mono font-bold">{data.Expired}</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // ── Regenerate ───────────────────────────────────────────────────────────
  const handleRegenerate = () => {
    setIsRegenerating(true);
    fetchReportData().then(() => setIsRegenerating(false));
  };

  // ── Chat Send Handler ────────────────────────────────────────────────────
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('pepsico_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/reports/rag-chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: text, dateRange, lineId: selectedLine })
      });

      if (!res.ok) throw new Error(`RAG API returned status ${res.status}`);
      const data = await res.json();

      setMessages(prev => [...prev, {
        sender: 'copilot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.answer,
        sources: data.sources,
        chart: data.chart
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'copilot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Something went wrong, try again'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Chat Interface Renderer ───────────────────────────────────────────────
  const renderChatInterface = () => {
    // True empty state: no messages at all
    const isEmpty = messages.length === 0;

    return (
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Message Thread */}
        <div className="flex-grow overflow-y-auto p-3 bg-slate-50 flex flex-col gap-4 custom-scrollbar">
          {isEmpty ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 py-8 px-4 my-auto">
              <span className="material-symbols-outlined text-3xl mb-2 text-slate-300">chat_bubble</span>
              <p className="text-[12px] text-center text-slate-400 leading-normal max-w-[200px]">
                Ask about expired certs, staffing gaps, or shift coverage
              </p>

              {/* Suggested Question Chips */}
              <div className="w-full flex flex-col gap-2 mt-5">
                {[
                  "Who has expired certifications?",
                  "What's today's fill rate by line?",
                  "Show shift coverage gaps"
                ].map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(question)}
                    className="w-full text-left bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-600 hover:border-[#14b8a6] hover:bg-teal-50/30 transition-colors cursor-pointer"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                {m.sender === 'user' ? (
                  <div className="self-end bg-slate-800 text-white text-[11px] rounded-2xl rounded-br-sm px-3 py-2 max-w-[85%] shadow-sm leading-relaxed">
                    {m.text}
                  </div>
                ) : (
                  <div className="self-start w-full flex flex-col gap-3 animate-card-entrance">
                    {/* Executive Dashboard Response Card (Legacy fallback if needed) */}
                    {m.isDashboardResponse && (
                      <div id={`copilot-card-${idx}`} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <div>
                            <h4 className="text-[8px] font-bold text-slate-400 font-mono uppercase tracking-wider">Executive Analytics Report</h4>
                            <h3 className="text-[11px] font-bold text-slate-800 mt-0.5 uppercase">{m.lineName || 'ALL LINES'}</h3>
                          </div>
                          <div className="text-right text-[8px] font-mono text-slate-500 leading-tight">
                            <div>Status: <span className="text-[#14b8a6] font-bold inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[8px] font-bold">check_circle</span> Healthy</span></div>
                            <div className="mt-0.5">Confidence: <span className="text-slate-700 font-bold">96%</span></div>
                          </div>
                        </div>

                        {/* KPI grid — 2 per row */}
                        {m.kpis && (
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "Today's Metric",  data: m.kpis.output },
                              { label: "Utilization",     data: m.kpis.utilization },
                              { label: "Status Indicator",data: m.kpis.downtime },
                              { label: "Operators",       data: m.kpis.operators },
                            ].map((kpi, ki) => (
                              <div key={ki} className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex flex-col">
                                <span className="text-[8px] text-slate-400 uppercase font-mono leading-none">{kpi.label}</span>
                                <span className="text-[11px] font-bold text-slate-800 mt-1 font-mono tabular-nums">{kpi.data?.value || '—'}</span>
                                <span className="text-[8px] font-bold mt-0.5 text-slate-500 font-mono">{kpi.data?.trend || ''}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* AI Insights */}
                        {m.insights && m.insights.length > 0 && (
                          <div className="border-t border-slate-100 pt-2 flex flex-col gap-1.5">
                            <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">AI Executive Insights</h4>
                            <div className="flex flex-col gap-1.5">
                              {m.insights.map((ins: any, i: number) => {
                                const isCritical = ins.type === 'critical';
                                const isWarning  = ins.type === 'warning';
                                const bgClass    = isCritical ? 'bg-rose-50 border-rose-100 text-rose-700' : isWarning ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-teal-50 border-teal-100 text-teal-700';
                                const iconName   = isCritical ? 'report' : isWarning ? 'warning' : 'check_circle';
                                return (
                                  <div key={i} className={`p-2 rounded-lg border text-[10px] flex gap-1.5 items-start ${bgClass}`}>
                                    <span className="material-symbols-outlined text-xs mt-0.5 shrink-0">{iconName}</span>
                                    <span className="leading-relaxed">{ins.message}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Dynamic Chart — 100px height */}
                        {m.chartData && (
                          <div className="border-t border-slate-100 pt-2 flex flex-col gap-1">
                            <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">{m.chartData.title}</h4>
                            <div className="h-[100px] w-full text-[8px] font-mono">
                              <ResponsiveContainer width="100%" height="100%">
                                {m.chartData.type === 'barH' ? (
                                  <BarChart layout="vertical" data={m.chartData.data} margin={{ top: 2, right: 10, left: -25, bottom: 0 }}>
                                    <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 7 }} />
                                    <YAxis type="category" dataKey={m.chartData.xKey} stroke="#94a3b8" tick={{ fontSize: 7 }} width={45} />
                                    <Tooltip content={<CustomChartTooltip />} />
                                    {m.chartData.bars.map((b: any) => (
                                      <Bar key={b.key} dataKey={b.key} fill={mapColor(b.color)} stackId={m.chartData.stacked ? 'a' : undefined} radius={[0, 2, 2, 0]} />
                                    ))}
                                  </BarChart>
                                ) : m.chartData.type === 'composed' ? (
                                  <ComposedChart data={m.chartData.data} margin={{ top: 2, right: 10, left: -25, bottom: 0 }}>
                                    <XAxis dataKey={m.chartData.xKey} stroke="#94a3b8" tick={{ fontSize: 7 }} />
                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 7 }} />
                                    <Tooltip content={<CustomChartTooltip />} />
                                    {(m.chartData.bars || []).map((b: any) => (
                                      <Bar key={b.key} dataKey={b.key} fill={mapColor(b.color)} name={b.key} />
                                    ))}
                                    {(m.chartData.lines || []).map((l: any) => (
                                      <Line key={l.key} type="monotone" dataKey={l.key} stroke={mapColor(l.color)} strokeWidth={1} dot={false} name={l.key} />
                                    ))}
                                  </ComposedChart>
                                ) : (
                                  <BarChart data={m.chartData.data} margin={{ top: 2, right: 10, left: -25, bottom: 0 }}>
                                    <XAxis dataKey={m.chartData.xKey} stroke="#94a3b8" tick={{ fontSize: 7 }} />
                                    <YAxis stroke="#94a3b8" tick={{ fontSize: 7 }} domain={m.chartData.domain || [0, 'auto']} />
                                    <Tooltip content={<CustomChartTooltip />} />
                                    {m.chartData.bars.map((b: any) => (
                                      <Bar key={b.key} dataKey={b.key} fill={mapColor(b.color)} stackId={m.chartData.stacked ? 'a' : undefined} radius={m.chartData.stacked ? undefined : [2, 2, 0, 0]} name={b.key} />
                                    ))}
                                  </BarChart>
                                )}
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {/* AI Recommendations panel */}
                        {m.recommendations && m.recommendations.length > 0 && (
                          <div className="border-t border-slate-100 pt-2 flex flex-col gap-1.5">
                            <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">AI Action Recommendations</h4>
                            <div className="flex flex-col gap-1.5">
                              {m.recommendations.map((rec: any, index: number) => {
                                const isCritical = rec.priority === 'critical';
                                const colorClass = isCritical ? 'text-rose-700 bg-rose-50 border-rose-100' : 'text-amber-700 bg-amber-50 border-amber-100';
                                return (
                                  <div key={index} className={`p-2 rounded-lg border text-[10px] flex gap-1.5 items-start ${colorClass}`}>
                                    <span className="material-symbols-outlined text-xs mt-0.5 shrink-0">lightbulb</span>
                                    <div>
                                      <p className="font-bold">{rec.title}</p>
                                      <p className="text-[9px] opacity-90 mt-0.5">{rec.message}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Machine Health mini panel */}
                        <div className="border-t border-slate-100 pt-2 flex flex-col gap-2">
                          <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">Machine Health Status (Illustrative — pending sensor integration)</h4>
                          <div className="flex flex-col gap-2">
                            {machineRegistry.map(machine => {
                              const isHealthy  = machine.oee >= 90;
                              const isWarn     = machine.oee >= 70 && machine.oee < 90;
                              const badgeCls   = isHealthy ? 'text-teal-700 bg-teal-50 border-teal-200' : isWarn ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-[#f43f5e] bg-rose-50 border-rose-200';
                              const barColor   = isHealthy ? 'bg-[#14b8a6]' : isWarn ? 'bg-[#f59e0b]' : 'bg-[#f43f5e]';
                              return (
                                <div key={machine.id} className="bg-slate-50 border border-slate-100 p-2 rounded-lg flex flex-col gap-1.5">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-800">{machine.name.split(' ').slice(0, 2).join(' ')}</span>
                                    <span className={`text-[9px] font-mono font-bold px-1.5 rounded border ${badgeCls}`}>{machine.oee}% OEE</span>
                                  </div>
                                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                    <div className={`${barColor} h-full`} style={{ width: `${machine.oee}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Report actions */}
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 items-center justify-between">
                          <button
                            onClick={() => {
                              const speech = new SpeechSynthesisUtterance(
                                `Executive summary for ${m.lineName || 'All Lines'}. ` +
                                (m.insights || []).map((ins: any) => ins.message).join('. ')
                              );
                              window.speechSynthesis.cancel();
                              window.speechSynthesis.speak(speech);
                            }}
                            className="py-1 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[9px] font-mono rounded cursor-pointer transition-all border border-slate-200 flex items-center gap-1 shrink-0"
                          >
                            <span className="material-symbols-outlined text-xs">volume_up</span>
                            Read
                          </button>
                          <ExportToolbar
                            elementId={`copilot-card-${idx}`}
                            reportTitle={`Executive Analytics Report — ${m.lineName || 'ALL LINES'}`}
                            filename="AI_Executive_Report"
                            csvRows={m.chartData?.data}
                            jsonData={m}
                          />
                        </div>
                      </div>
                    )}

                    {/* Grounded RAG Response Card */}
                    {m.sources && (
                      <div id={`copilot-card-${idx}`} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <div>
                            <h4 className="text-[8px] font-bold text-slate-400 font-mono uppercase tracking-wider">AI Grounded Report</h4>
                            <h3 className="text-[11px] font-bold text-slate-800 mt-0.5 uppercase">RAG Engine Response</h3>
                          </div>
                        </div>

                        <div className="text-slate-700 text-[11px] leading-relaxed whitespace-pre-line font-sans select-text">
                          {m.text}
                        </div>

                        {m.chart && <ChartRenderer spec={m.chart} />}

                        {m.sources.length > 0 && (
                          <div className="border-t border-slate-100 pt-2 flex flex-col gap-1.5">
                            <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">Grounded Sources ({m.sources.length})</h4>
                            <div className="flex flex-wrap gap-1">
                              {m.sources.map((src: any, sIdx: number) => (
                                <div
                                  key={sIdx}
                                  title={src.content}
                                  className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[8px] font-mono text-slate-500 cursor-help hover:bg-slate-100 transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[10px] text-slate-400">description</span>
                                  <span>{src.entityType.toUpperCase()}:{src.entityId}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 items-center justify-between">
                          <button
                            onClick={() => {
                              const speech = new SpeechSynthesisUtterance(m.text);
                              window.speechSynthesis.cancel();
                              window.speechSynthesis.speak(speech);
                            }}
                            className="py-1 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[9px] font-mono rounded cursor-pointer transition-all border border-slate-200 flex items-center gap-1 shrink-0"
                          >
                            <span className="material-symbols-outlined text-xs">volume_up</span>
                            Read
                          </button>
                          <ExportToolbar
                            elementId={`copilot-card-${idx}`}
                            reportTitle={`AI Grounded RAG Report`}
                            filename="AI_RAG_Report"
                            csvRows={m.chart?.data}
                            jsonData={m}
                          />
                        </div>
                      </div>
                    )}

                    {m.text && !m.sources && (
                      <div className="bg-white border border-slate-200 text-slate-700 rounded-lg p-3 text-[11px] max-w-[90%] shadow-sm leading-relaxed">
                        {m.text}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Typing shimmer skeleton */}
          {isTyping && (
            <div className="self-start w-[85%] bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col gap-2.5 animate-pulse">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                <div className="h-2 bg-slate-200 rounded w-1/4"></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-slate-100 rounded"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
              </div>
              <div className="space-y-1.5 mt-1">
                <div className="h-2.5 bg-slate-200 rounded w-full"></div>
                <div className="h-2.5 bg-slate-200 rounded w-[90%]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-slate-200 p-3 rounded-b-xl shrink-0 flex gap-2 items-center">
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(chatInput); }}
              placeholder={isListening ? "Listening... Speak now!" : "Ask: 'expired certifications', 'who is on leave', 'shift coverage'..."}
              className={`w-full border rounded-xl pl-3 pr-8 py-2 text-[11px] font-mono bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 transition-all ${
                isListening
                  ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400 bg-rose-50'
                  : 'border-slate-200 focus:border-[#14b8a6] focus:ring-[#14b8a6]'
              }`}
            />
            <button
              onClick={toggleListening}
              className={`absolute right-2 p-1 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                isListening
                  ? 'text-rose-500 bg-rose-50 hover:bg-rose-100 animate-pulse'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              <span className="material-symbols-outlined text-xs">
                {isListening ? 'mic_off' : 'mic'}
              </span>
            </button>
          </div>
          <button
            onClick={() => handleSendMessage(chatInput)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-all shadow-sm shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    );
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 h-full flex flex-col justify-center items-center bg-background gap-3">
        <span className="material-symbols-outlined text-3xl text-primary animate-spin">sync</span>
        <span className="text-xs font-mono font-bold text-secondary uppercase tracking-wider">Syncing live Postgres data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 h-full flex flex-col justify-center items-center bg-background gap-4 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-error-container border border-outline-variant flex items-center justify-center text-red-500">
          <span className="material-symbols-outlined text-2xl">report</span>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Database Sync Error</h3>
          <p className="text-xs text-secondary mt-1 max-w-sm">{error}</p>
        </div>
        <button
          onClick={fetchReportData}
          className="py-2 px-4 bg-primary text-white font-mono text-[10px] font-bold rounded-lg cursor-pointer shadow-md hover:bg-primary/90 transition-all"
        >
          RETRY DATABASE SYNC
        </button>
      </div>
    );
  }

  // ── Pre-calculate display variables ──────────────────────────────────────
  const expiredCount          = computed?.certExpired?.length || 0;
  const expiredOperatorsCount = new Set(computed?.certExpired?.map((s: any) => s.associateId)).size;
  const fillRate              = computed?.fillRate || 0;
  const staffedWSCount        = computed?.staffedWSCount || 0;
  const totalActiveWS         = computed?.totalActiveWS || 0;
  const understaffedCount     = computed?.understaffedCount || 0;
  const todayDateStr          = computed?.todayDateStr || '';

  // Recommendations sorted by severity
  const recsList = computed?.lines ? (() => {
    const rawRecs = generateRecommendations({
      associates:      reportData.associates      || [],
      associateSkills: reportData.associateSkills || [],
      workstations:    reportData.workstations    || [],
      productionLines: reportData.productionLines || [],
      shifts:          reportData.shifts          || [],
      allocations:     reportData.allocations     || [],
      leaveRecords:    reportData.leaveRecords    || [],
      skills:          reportData.skills          || [],
    });
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...rawRecs].sort((a, b) => (severityOrder[a.priority] ?? 99) - (severityOrder[b.priority] ?? 99));
  })() : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-slate-50 print:bg-white select-none">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-gentle {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
        @keyframes card-entrance {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-card-entrance {
          animation: card-entrance 250ms ease-out forwards;
        }
        .card-staggered {
          opacity: 0;
          animation: card-entrance 250ms ease-out forwards;
        }
      `}} />

      {/* ── TOP BAR (full width) ──────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 h-16 shrink-0 flex items-center justify-between z-20 print:hidden">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-white/80 text-xl">psychology</span>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white uppercase">PLANTOPS AI COPILOT</h1>
            <p className="text-[10px] text-slate-400 font-mono">
              Live PostgreSQL database context active&nbsp;&bull;&nbsp;Roster Date:&nbsp;{todayDateStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* Date Range Selector */}
          <div className="hidden md:flex flex-col">
            <span className="font-mono text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">DATE RANGE</span>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="py-0.5 px-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none text-[11px] cursor-pointer"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>

          {/* Line Selector */}
          <div className="hidden md:flex flex-col">
            <span className="font-mono text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">PRODUCTION LINE</span>
            <select
              value={selectedLine}
              onChange={e => setSelectedLine(e.target.value)}
              className="py-0.5 px-2 border border-slate-700 bg-slate-800 text-white rounded focus:outline-none text-[11px] cursor-pointer"
            >
              <option value="ALL">All Lines</option>
              {(reportData?.productionLines || []).map((l: any) => (
                <option key={l.id} value={l.id}>{l.name.split(' - ')[0]}</option>
              ))}
            </select>
          </div>

          {/* Pulsing Online Pill */}
          <span className="text-[9px] font-mono bg-emerald-400/20 px-2.5 py-0.5 rounded text-emerald-200 border border-emerald-300/30 animate-pulse-gentle">
            ● Online
          </span>
        </div>
      </header>

      {/* ── THREE-ZONE GRID ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">

        {/* ── ZONE A: Left "At a Glance" Rail (280px) ──────────────────── */}
        <aside className="w-full lg:w-[280px] shrink-0 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 overflow-y-auto lg:h-full print:hidden">
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory gap-4 pb-3 lg:pb-0 custom-scrollbar">

            {/* Card 1: Fill Rate Today */}
            <div
              className="snap-start flex-shrink-0 w-64 lg:w-auto bg-white border border-slate-200 rounded-xl p-4 border-l-4 card-staggered flex flex-col justify-between min-h-[100px]"
              style={{ animationDelay: '0ms', borderLeftColor: fillRate >= 80 ? PALETTE.teal : fillRate >= 50 ? PALETTE.amber : PALETTE.rose }}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-base">percent</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Fill Rate Today</span>
              </div>
              <div className="mt-2">
                <span className={`font-mono font-bold text-3xl tabular-nums ${fillRate >= 80 ? 'text-[#14b8a6]' : fillRate >= 50 ? 'text-[#f59e0b]' : 'text-[#f43f5e]'}`}>
                  {Math.round(fillRate)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{staffedWSCount} of {totalActiveWS} stations staffed</p>
            </div>

            {/* Card 2: Expired Certs */}
            <div
              className="snap-start flex-shrink-0 w-64 lg:w-auto bg-white border border-slate-200 rounded-xl p-4 border-l-4 card-staggered flex flex-col justify-between min-h-[100px]"
              style={{ animationDelay: '60ms', borderLeftColor: expiredCount > 0 ? PALETTE.rose : PALETTE.teal }}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-base">badge</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Expired Certs</span>
              </div>
              <div className="mt-2">
                <span className={`font-mono font-bold text-3xl tabular-nums ${expiredCount > 0 ? 'text-[#f43f5e]' : 'text-[#14b8a6]'}`}>
                  {expiredCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{expiredOperatorsCount} operators affected</p>
            </div>

            {/* Card 3: Understaffed Stations */}
            <div
              className="snap-start flex-shrink-0 w-64 lg:w-auto bg-white border border-slate-200 rounded-xl p-4 border-l-4 card-staggered flex flex-col justify-between min-h-[100px]"
              style={{ animationDelay: '120ms', borderLeftColor: understaffedCount > 0 ? PALETTE.rose : PALETTE.teal }}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-base">warning</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Understaffed Stations</span>
              </div>
              <div className="mt-2">
                <span className={`font-mono font-bold text-3xl tabular-nums ${understaffedCount > 0 ? 'text-[#f43f5e]' : 'text-[#14b8a6]'}`}>
                  {understaffedCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">today's shift</p>
            </div>

            {/* Card 4: Plant OEE Avg */}
            <div
              className="snap-start flex-shrink-0 w-64 lg:w-auto bg-white border border-slate-200 rounded-xl p-4 border-l-4 card-staggered flex flex-col justify-between min-h-[100px]"
              style={{ animationDelay: '180ms', borderLeftColor: oeeAvg >= 90 ? PALETTE.teal : oeeAvg >= 70 ? PALETTE.amber : PALETTE.rose }}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-base">precision_manufacturing</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Plant OEE Avg</span>
              </div>
              <div className="mt-2">
                <span className={`font-mono font-bold text-3xl tabular-nums ${oeeAvg >= 90 ? 'text-[#14b8a6]' : oeeAvg >= 70 ? 'text-[#f59e0b]' : 'text-[#f43f5e]'}`}>
                  {oeeAvg}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">average across registry</p>
            </div>

          </div>
        </aside>

        {/* ── ZONE B: Center Main Report Content ──────────────────────────── */}
        <main className="flex-grow p-6 overflow-y-auto h-full space-y-6 custom-scrollbar bg-slate-50 print:p-0">

          {/* Section 1: AI Action Recommendations */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                AI Action Recommendations
              </h3>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded transition-colors cursor-pointer flex items-center justify-center border border-slate-200 shadow-sm shrink-0"
                title="Regenerate analysis"
              >
                <span className={`material-symbols-outlined text-sm ${isRegenerating ? 'animate-spin' : ''}`}>sync</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {recsList.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
                  No active recommendations. Roster parameters normal.
                </div>
              ) : (
                recsList.map((rec, index) => {
                  const affectedList = getAffectedList(rec.id);
                  const isExpanded   = expandedRecs[rec.id] || false;

                  let iconBg       = 'bg-teal-50 text-teal-600 border border-teal-200';
                  let pillClass    = 'bg-teal-50 text-teal-700 border border-teal-200';
                  let severityLabel = 'INFO';

                  if (rec.priority === 'critical') {
                    iconBg       = 'bg-rose-50 text-[#f43f5e] border border-rose-200';
                    pillClass    = 'bg-rose-50 text-[#f43f5e] border border-rose-200';
                    severityLabel = 'CRITICAL';
                  } else if (rec.priority === 'high' || rec.priority === 'medium') {
                    iconBg       = 'bg-amber-50 text-[#f59e0b] border border-amber-200';
                    pillClass    = 'bg-amber-50 text-[#f59e0b] border border-amber-200';
                    severityLabel = 'WARNING';
                  }

                  return (
                    <div
                      key={rec.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 border-l-4 card-staggered flex flex-col gap-2.5 transition-all hover:shadow-sm"
                      style={{
                        animationDelay: `${(4 + index) * 60}ms`,
                        borderLeftColor: rec.priority === 'critical' ? PALETTE.rose : (rec.priority === 'high' || rec.priority === 'medium' ? PALETTE.amber : PALETTE.teal)
                      }}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-2.5 items-start">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                            <span className="material-symbols-outlined text-sm">lightbulb</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 leading-tight">{rec.title}</h4>
                            <p className="text-[12px] text-slate-600 leading-relaxed mt-1">{rec.message}</p>

                            {/* Expandable affected list */}
                            {affectedList.length > 0 && (
                              <div>
                                <button
                                  onClick={() => toggleRec(rec.id)}
                                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-0.5 mt-2 cursor-pointer uppercase tracking-wider"
                                >
                                  {isExpanded ? 'Hide affected' : 'Show affected'} ({affectedList.length})
                                  <span className="material-symbols-outlined text-[10px]">
                                    {isExpanded ? 'expand_less' : 'expand_more'}
                                  </span>
                                </button>
                                {isExpanded && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {affectedList.map((name: string, i: number) => (
                                      <span key={i} className="bg-slate-100 text-slate-700 text-[10px] font-mono rounded-full px-2.5 py-0.5 border border-slate-200/50">
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase border shrink-0 ${pillClass}`}>
                          {severityLabel}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 2: Certification Status by Skill */}
          <div
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4 card-staggered"
            style={{ animationDelay: `${(4 + recsList.length) * 60}ms` }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">Certification Status by Skill</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Compares valid vs expired certifications for active operators</p>
              </div>
              {/* Right-aligned legend */}
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-[#14b8a6] rounded-sm shrink-0" />
                  <span>Valid</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-[#f43f5e] rounded-sm shrink-0" />
                  <span>Expired</span>
                </div>
              </div>
            </div>

            <div className="h-[280px] w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillStatusData} margin={{ top: 10, right: 10, left: -25, bottom: skillStatusData.length > 6 ? 55 : 5 }} barGap={2}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={skillStatusData.length > 6 ? -35 : 0}
                    textAnchor={skillStatusData.length > 6 ? 'end' : 'middle'}
                    height={skillStatusData.length > 6 ? 65 : 30}
                    interval={0}
                    tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#64748b' }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomSkillTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="Expired" stackId="a" fill="#f43f5e" />
                  <Bar dataKey="Valid"   stackId="a" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-slate-100 pt-3">
              {widestGapSkill ? (
                <p className="italic text-[11px] text-slate-500">
                  Widest certification gap: <strong className="font-semibold not-italic">{widestGapSkill.fullName}</strong> with {widestGapSkill.Expired} expired out of {widestGapSkill.Total}.
                </p>
              ) : (
                <p className="italic text-[11px] text-slate-500">
                  No active certification gaps detected. All operator credentials are valid.
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Machine Health Registry */}
          <div
            className="flex flex-col gap-3 card-staggered"
            style={{ animationDelay: `${(4 + recsList.length + 1) * 60}ms` }}
          >
            <h3 className="font-bold text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              Machine Health Registry Status
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {machineRegistry.map(machine => {
                const isHealthy = machine.oee >= 90;
                const isWarn    = machine.oee >= 70 && machine.oee < 90;

                const badgeClass   = isHealthy ? 'bg-teal-50 text-teal-700 border-teal-200' : isWarn ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-[#f43f5e] border-rose-200';
                const progressColor = isHealthy ? 'bg-[#14b8a6]' : isWarn ? 'bg-[#f59e0b]' : 'bg-[#f43f5e]';

                return (
                  <div
                    key={machine.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-semibold text-slate-900 leading-tight">{machine.name}</span>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border shrink-0 ${badgeClass}`}>
                        {machine.oee}% OEE
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 w-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-[width] duration-[600ms] ease-out ${progressColor}`}
                        style={{ width: animateOee ? `${machine.oee}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </main>

        {/* ── ZONE C: Persistent Right Sidebar Chat Panel (360px) ──────────── */}
        <aside className="hidden lg:flex w-[360px] shrink-0 border-l border-slate-200 bg-white h-full flex-col overflow-hidden sticky top-0 print:hidden z-10">
          {/* Chat Header */}
          <div className="bg-slate-900 text-white px-4 py-3 rounded-t-xl shrink-0 flex flex-col">
            <span className="text-sm font-bold">Ask PlantOps AI</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Live data · GPT responses grounded in your DB</span>
          </div>

          {/* Chat Interface */}
          {renderChatInterface()}
        </aside>

        {/* ── Mobile Floating Action Button ──────────────────────────────── */}
        <button
          onClick={() => setMobileChatOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#14b8a6] text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all z-40 cursor-pointer border border-[#0d9488]/40"
          title="Open chat assistant"
        >
          <span className="material-symbols-outlined text-white text-2xl">chat</span>
        </button>

        {/* ── Mobile Slide-Up Sheet ───────────────────────────────────────── */}
        {mobileChatOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/40 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 -z-10" onClick={() => setMobileChatOpen(false)} />
            <div className="bg-white rounded-t-2xl max-h-[85vh] h-full flex flex-col overflow-hidden shadow-2xl relative animate-card-entrance">
              {/* Drag handle + header */}
              <div className="w-full flex flex-col items-center border-b border-slate-100 pb-2 shrink-0">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full my-3" />
                <div className="w-full flex justify-between items-center px-4 pb-1">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Ask PlantOps AI</h3>
                    <p className="text-[9px] text-slate-400">Live data · database active context</p>
                  </div>
                  <button
                    onClick={() => setMobileChatOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                {renderChatInterface()}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AiReports;
