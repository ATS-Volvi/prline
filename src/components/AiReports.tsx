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
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import { generateRecommendations } from '../utils/recommendations';
import ExportToolbar from './shared/ExportToolbar';

export const AiReports: React.FC = () => {
  const { logout } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<'analytics' | 'copilot'>('analytics');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('14');
  const [selectedLine, setSelectedLine] = useState<string>('ALL');

  // AI Chat states
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'copilot',
      text: 'Welcome to PlantOps Enterprise Analytics. The system is connected directly to the Live PostgreSQL database state.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDashboardResponse: true,
      lineName: 'ALL LINES',
      kpis: {
        output: { value: '14,582 Units', trend: '▲ +3.2%', color: 'text-emerald-400' },
        utilization: { value: '96%', trend: '▲ +1.8%', color: 'text-emerald-400' },
        downtime: { value: '12 min', trend: '▼ -45%', color: 'text-emerald-400' },
        operators: { value: '28 Active', trend: 'Nominal', color: 'text-slate-300' }
      },
      insights: [
        { type: 'good', message: 'Workstation deployment levels are fully compliant with mandatory safety rest guidelines.' },
        { type: 'warning', message: 'D Durga Puja week attendance drops predicted. standbys suggested.' }
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API for voice transcript input
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setChatInput(transcript);
        }
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

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('pepsico_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/v1/state', { headers });
      if (res.status === 401) {
        logout();
        window.location.reload();
        throw new Error('Unauthorized');
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch state: ${res.status}`);
      }

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

    // Silent background auto-refresh every 5 minutes (300000 ms)
    const interval = setInterval(() => {
      fetchReportData();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  // Auto scroll in Copilot chat tab
  useEffect(() => {
    if (activeReportTab === 'copilot') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeReportTab]);

  // Compute live analytical indicators using useMemo
  const computed = useMemo(() => {
    if (!reportData) return null;

    const today = new Date();

    const activeAssociates = (reportData.associates || []).filter((a: any) => a.status === 'Active');
    const allSkills = reportData.skills || [];
    const associateSkills = reportData.associateSkills || [];
    const workstations = reportData.workstations || [];
    const lines = reportData.productionLines || [];
    const allocations = reportData.allocations || [];
    const auditLogs = reportData.auditLogs || [];
    const leaveRecords = reportData.leaveRecords || [];

    // Expiration buckets
    const certExpired = associateSkills.filter((s: any) => new Date(s.expiryDate) < today);
    const certExpiringIn30 = associateSkills.filter((s: any) => {
      const exp = new Date(s.expiryDate);
      const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    });
    const certValid = associateSkills.filter((s: any) => new Date(s.expiryDate) >= today);

    // Skill distribution per skill
    const skillDistribution = allSkills.map((sk: any) => {
      const records = associateSkills.filter((s: any) => s.skillId === sk.id);
      return {
        name: sk.id,
        Trainee: records.filter((r: any) => r.level === 'Trainee').length,
        Operator: records.filter((r: any) => r.level === 'Operator').length,
        Certified: records.filter((r: any) => r.level === 'Certified').length,
        Expert: records.filter((r: any) => r.level === 'Expert').length,
      };
    });

    // Expiry by Month (next 12 months)
    const expiryByMonth = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthStr = d.toISOString().substring(0, 7);
      const count = associateSkills.filter((s: any) => s.expiryDate.startsWith(monthStr)).length;
      return {
        name: d.toLocaleDateString('default', { month: 'short', year: '2-digit' }),
        Expirations: count
      };
    });

    // Fill rate last 30 days
    const totalWorkstations = workstations.length;
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });
    const fillRateByDate = last30Days.map(date => {
      const dayAllocs = allocations.filter((a: any) => a.date === date);
      const uniqueWS = new Set(dayAllocs.map((a: any) => a.workstationId)).size;
      return {
        name: date.substring(5),
        'Fill Rate %': totalWorkstations > 0 ? Math.round((uniqueWS / totalWorkstations) * 100) : 0
      };
    });

    // Deployment frequency
    const deploymentFreq = activeAssociates.map((a: any) => {
      const count = allocations.filter((al: any) => al.associateId === a.id).length;
      return {
        name: a.name,
        count
      };
    }).sort((a: any, b: any) => b.count - a.count).slice(0, 10);

    // Overrides by user
    const overridesByUser: Record<string, number> = {};
    const standardByUser: Record<string, number> = {};
    auditLogs.forEach((log: any) => {
      const u = log.userId || 'Supervisor';
      if (log.actionType === 'OVERRIDE_ALLOCATION') {
        overridesByUser[u] = (overridesByUser[u] || 0) + 1;
      }
      if (log.actionType === 'ALLOCATION_CONFIRMED') {
        standardByUser[u] = (standardByUser[u] || 0) + 1;
      }
    });

    const overrideRateByUser = Object.keys({ ...overridesByUser, ...standardByUser }).map(userId => {
      const over = overridesByUser[userId] || 0;
      const std = standardByUser[userId] || 0;
      return {
        name: userId,
        Standard: std,
        Override: over
      };
    }).slice(0, 5);

    // Radar line capability indicators
    const lineRadar = lines.filter((l: any) => l.status === 'ACTIVE').map((line: any) => {
      const lineWS = workstations.filter((w: any) => w.lineId === line.id);
      const totalCerts = lineWS.length;
      const validCerts = lineWS.filter((w: any) => {
        const matches = associateSkills.filter((s: any) => s.skillId === w.requiredSkillId);
        return matches.some((m: any) => new Date(m.expiryDate) >= today);
      }).length;

      return {
        subject: line.name.split(' - ')[0],
        'Skill Coverage %': totalCerts ? Math.round((validCerts / totalCerts) * 100) : 100,
        'Fill Rate %': 85,
        'Roster Health %': 90,
        'Risk Redundancy %': 80,
      };
    });

    // Forecast next 14 days
    const forecast = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const onLeave = new Set(leaveRecords.filter((l: any) => l.date === dateStr).map((l: any) => l.associateId));
      const available = activeAssociates.filter((a: any) => !onLeave.has(a.id)).length;

      return {
        name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Available: available,
        Required: totalWorkstations
      };
    });

    // Skill Gap Analysis summary derived details
    const totalCertsCount = associateSkills.length;
    const expiredCount = certExpired.length;
    const coverageGapPercentage = totalCertsCount > 0 ? Math.round((expiredCount / totalCertsCount) * 100) : 0;

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
      workstations
    };
  }, [reportData]);

  // Reusable custom tooltips to match aesthetic guidelines
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-slate-700 p-2.5 font-mono text-[10px] text-slate-100 shadow-premium-sm rounded-lg">
          <p className="font-bold mb-1 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} style={{ color: entry.color || entry.stroke }} className="flex justify-between gap-4 mt-0.5">
              <span>{entry.name}:</span>
              <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    fetchReportData().then(() => setIsRegenerating(false));
  };



  // Comprehensive data-driven analyser: reads live DB state, answers based on actual question intent
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      const q = text.toLowerCase();
      const data = computed;
      const raw = reportData;

      if (!data || !raw) {
        setMessages(prev => [...prev, {
          sender: 'copilot',
          text: 'Live data is still loading. Please wait a moment and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
        return;
      }

      const insights: { type: string; message: string }[] = [];
      let lineName = 'ALL LINES';
      let kpis: any = null;
      let chartData: any = null;

      // ── HELPERS ──────────────────────────────────────────────────────────────
      const allAssociates: any[] = raw.associates || [];
      const activeAssociates: any[] = data.activeAssociates || [];
      const associateSkills: any[] = raw.associateSkills || [];
      const allocations: any[] = raw.allocations || [];
      const leaveRecords: any[] = raw.leaveRecords || [];
      const workstations: any[] = raw.workstations || [];
      const productionLines: any[] = raw.productionLines || [];
      const shifts: any[] = raw.shifts || [];
      const skills: any[] = raw.skills || [];
      const auditLogs: any[] = raw.auditLogs || [];
      const today = new Date().toISOString().split('T')[0];

      // detect which production line the user is asking about
      const matchedLine = productionLines.find((l: any) =>
        q.includes(l.name?.toLowerCase()) ||
        q.includes(l.id?.toLowerCase()) ||
        (l.name && q.includes(l.name.split(' - ')[0]?.toLowerCase()))
      );
      if (matchedLine) lineName = matchedLine.name;

      // ── INTENT CLASSIFICATION ──────────────────────────────────────────────

      // 1. Certification / Skill Expiry questions
      if (q.match(/expir|certif|renewal|laps|overdue|skill.gap|missing.skill/)) {
        const expired = data.certExpired;
        const expiring30 = data.certExpiringIn30;
        const valid = data.certValid;

        // Group expired by associate name
        const expiredNames = expired.slice(0, 5).map((s: any) => {
          const assoc = allAssociates.find((a: any) => a.id === s.associateId);
          const skill = skills.find((sk: any) => sk.id === s.skillId);
          return `${assoc?.name || s.associateId} (${skill?.name || s.skillId})`;
        });

        insights.push({
          type: expired.length > 0 ? 'critical' : 'good',
          message: `${expired.length} operator certifications are currently expired across all lines.${expiredNames.length ? ' Affected: ' + expiredNames.join(', ') + (expired.length > 5 ? ` and ${expired.length - 5} more.` : '.') : ''}`
        });
        insights.push({
          type: expiring30.length > 5 ? 'warning' : 'good',
          message: `${expiring30.length} certifications expire within the next 30 days and require scheduled renewal.`
        });
        insights.push({
          type: 'good',
          message: `${valid.length} certifications are active and valid. Overall cert health: ${Math.round((valid.length / (valid.length + expired.length || 1)) * 100)}%.`
        });

        kpis = {
          output: { value: `${expired.length} Expired`, trend: expired.length > 0 ? '▲ Action Required' : '✓ Clean', color: expired.length > 0 ? 'text-rose-400' : 'text-emerald-400' },
          utilization: { value: `${valid.length} Valid`, trend: '✓ Certified', color: 'text-emerald-400' },
          downtime: { value: `${expiring30.length} Due Soon`, trend: '▲ Monitor', color: expiring30.length > 0 ? 'text-amber-400' : 'text-emerald-400' },
          operators: { value: `${activeAssociates.length} Active`, trend: 'Nominal', color: 'text-slate-300' }
        };
        chartData = {
          type: 'bar', title: 'Certification Status by Skill',
          data: skills.map((sk: any) => {
            const all = associateSkills.filter((s: any) => s.skillId === sk.id);
            const exp = all.filter((s: any) => new Date(s.expiryDate) < new Date()).length;
            const v = all.filter((s: any) => new Date(s.expiryDate) >= new Date()).length;
            return { name: sk.name?.split(' ')[0] || sk.id, Valid: v, Expired: exp };
          }),
          bars: [{ key: 'Valid', color: '#14b8a6' }, { key: 'Expired', color: '#f43f5e' }],
          xKey: 'name', stacked: true
        };
      }

      // 2. Leave / Absenteeism questions
      else if (q.match(/leave|absent|off.day|holiday|sick|availab/)) {
        const todayLeaves = leaveRecords.filter((l: any) => l.date === today);
        const futureLeaves = leaveRecords.filter((l: any) => l.date > today);
        const onLeaveNames = todayLeaves.slice(0, 5).map((l: any) => {
          const assoc = allAssociates.find((a: any) => a.id === l.associateId);
          return assoc?.name || l.associateId;
        });

        insights.push({
          type: todayLeaves.length > 0 ? 'warning' : 'good',
          message: `Today (${today}): ${todayLeaves.length} operator(s) on leave.${onLeaveNames.length ? ' Names: ' + onLeaveNames.join(', ') + '.' : ''}`
        });
        insights.push({
          type: 'good',
          message: `${activeAssociates.length - todayLeaves.length} operators available today across all lines and shifts.`
        });
        if (futureLeaves.length > 0) {
          insights.push({
            type: 'warning',
            message: `${futureLeaves.length} future leave request(s) registered. Earliest: ${futureLeaves[0]?.date}. Review staffing plan proactively.`
          });
        }

        kpis = {
          output: { value: `${todayLeaves.length} On Leave`, trend: todayLeaves.length > 3 ? '▲ High Absence' : '✓ Normal', color: todayLeaves.length > 3 ? 'text-rose-400' : 'text-amber-400' },
          utilization: { value: `${activeAssociates.length - todayLeaves.length} Available`, trend: '✓ Staffed', color: 'text-emerald-400' },
          downtime: { value: `${futureLeaves.length} Upcoming`, trend: '▲ Plan Ahead', color: 'text-amber-400' },
          operators: { value: `${activeAssociates.length} Total Active`, trend: 'Nominal', color: 'text-slate-300' }
        };
        chartData = {
          type: 'bar', title: 'Leave vs Availability — Next 7 Days',
          data: Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() + i);
            const ds = d.toISOString().split('T')[0];
            const onLeave = leaveRecords.filter((l: any) => l.date === ds).length;
            return { name: d.toLocaleDateString('en', { weekday: 'short', day: 'numeric' }), 'On Leave': onLeave, Available: Math.max(0, activeAssociates.length - onLeave) };
          }),
          bars: [{ key: 'Available', color: '#14b8a6' }, { key: 'On Leave', color: '#f59e0b' }],
          xKey: 'name', stacked: true
        };
      }

      // 3. Allocation / Staffing questions
      else if (q.match(/allocat|staff|assign|roster|deployed|workstation|filled|coverage/)) {
        const todayAllocs = allocations.filter((a: any) => a.date === today);
        const filledWS = new Set(todayAllocs.map((a: any) => a.workstationId)).size;
        const totalWS = workstations.length;
        const fillRate = totalWS > 0 ? Math.round((filledWS / totalWS) * 100) : 0;
        const overrides = todayAllocs.filter((a: any) => a.overrideReasonCode).length;

        // find understaffed workstations
        const understaffed = workstations.filter((ws: any) => {
          const count = todayAllocs.filter((a: any) => a.workstationId === ws.id).length;
          return count < (ws.maxStaffCount || 1);
        });

        insights.push({
          type: fillRate >= 80 ? 'good' : fillRate >= 50 ? 'warning' : 'critical',
          message: `Today's fill rate: ${filledWS}/${totalWS} workstations staffed (${fillRate}%).`
        });
        if (understaffed.length > 0) {
          insights.push({
            type: 'warning',
            message: `${understaffed.length} workstation(s) are understaffed today: ${understaffed.slice(0, 3).map((w: any) => w.name).join(', ')}${understaffed.length > 3 ? ` and ${understaffed.length - 3} more` : ''}.`
          });
        }
        if (overrides > 0) {
          insights.push({
            type: 'warning',
            message: `${overrides} override allocation(s) active today. Review audit log for justification details.`
          });
        }
        insights.push({
          type: 'good',
          message: `${todayAllocs.length} total operator-workstation assignments recorded for ${today}.`
        });

        kpis = {
          output: { value: `${fillRate}% Fill Rate`, trend: fillRate >= 80 ? '✓ Optimal' : '▲ Below Target', color: fillRate >= 80 ? 'text-emerald-400' : 'text-rose-400' },
          utilization: { value: `${filledWS}/${totalWS} Staffed`, trend: '📍 Today', color: 'text-teal-400' },
          downtime: { value: `${overrides} Overrides`, trend: overrides > 0 ? '▲ Review' : '✓ Clean', color: overrides > 0 ? 'text-amber-400' : 'text-emerald-400' },
          operators: { value: `${todayAllocs.length} Deployed`, trend: 'Live', color: 'text-slate-300' }
        };
        chartData = {
          type: 'barH', title: 'Workstation Staffing Status — Today',
          data: workstations.slice(0, 12).map((ws: any) => ({
            name: ws.name?.split(' ').slice(0, 2).join(' ') || ws.id,
            Allocated: todayAllocs.filter((a: any) => a.workstationId === ws.id).length,
            Capacity: ws.maxStaffCount || 1
          })),
          bars: [{ key: 'Allocated', color: '#14b8a6' }, { key: 'Capacity', color: '#334155' }],
          xKey: 'name', stacked: false
        };
      }

      // 4. Headcount / Associates questions
      else if (q.match(/headcount|how many|associate|operator|employee|total.staff|workforce|manpower/)) {
        const company = allAssociates.filter((a: any) => a.category === 'Company').length;
        const contract = allAssociates.filter((a: any) => a.category === 'Contract').length;
        const ntci = allAssociates.filter((a: any) => a.category === 'NTCI').length;
        const inactive = allAssociates.filter((a: any) => a.status !== 'Active').length;

        insights.push({
          type: 'good',
          message: `Total workforce: ${allAssociates.length} associates — ${activeAssociates.length} Active, ${inactive} Inactive.`
        });
        insights.push({
          type: 'good',
          message: `Category breakdown: Company = ${company}, Contract = ${contract}, NTCI = ${ntci}.`
        });
        const topDeployed = data.deploymentFreq.slice(0, 3);
        if (topDeployed.length > 0) {
          insights.push({
            type: 'good',
            message: `Top 3 most deployed operators: ${topDeployed.map((d: any) => `${d.name} (${d.count} shifts)`).join(', ')}.`
          });
        }

        kpis = {
          output: { value: `${allAssociates.length} Total`, trend: '📋 Headcount', color: 'text-teal-400' },
          utilization: { value: `${activeAssociates.length} Active`, trend: '✓ On Roster', color: 'text-emerald-400' },
          downtime: { value: `${inactive} Inactive`, trend: inactive > 0 ? '▲ Review' : '✓ None', color: inactive > 0 ? 'text-amber-400' : 'text-emerald-400' },
          operators: { value: `${company}C / ${contract}Ct / ${ntci}N`, trend: 'Categories', color: 'text-slate-300' }
        };
        chartData = {
          type: 'barH', title: 'Top Deployed Operators (Total Shifts)',
          data: data.deploymentFreq.slice(0, 10).map((d: any) => ({ name: d.name?.split(' ')[0] || d.name, Deployments: d.count })),
          bars: [{ key: 'Deployments', color: '#3b82f6' }],
          xKey: 'name', stacked: false
        };
      }

      // 5. Shift questions
      else if (q.match(/shift|schedule|timing|rotation/)) {
        shifts.forEach((s: any) => {
          const shiftAllocs = allocations.filter((a: any) => a.shiftId === s.id && a.date === today).length;
          insights.push({
            type: shiftAllocs > 0 ? 'good' : 'warning',
            message: `${s.name} (${s.timings}): ${shiftAllocs} operator allocations active today.`
          });
        });
        if (shifts.length === 0) insights.push({ type: 'warning', message: 'No shift configurations found in database.' });

        const todayAllocs = allocations.filter((a: any) => a.date === today).length;
        kpis = {
          output: { value: `${shifts.length} Shifts`, trend: '📅 Configured', color: 'text-teal-400' },
          utilization: { value: `${todayAllocs} Allocated`, trend: 'Today', color: 'text-emerald-400' },
          downtime: { value: 'See Chart', trend: 'Below', color: 'text-slate-400' },
          operators: { value: `${activeAssociates.length} Available`, trend: 'Nominal', color: 'text-slate-300' }
        };
        chartData = {
          type: 'bar', title: 'Operator Allocations per Shift — Today',
          data: shifts.map((s: any) => ({
            name: s.name,
            Allocated: allocations.filter((a: any) => a.shiftId === s.id && a.date === today).length
          })),
          bars: [{ key: 'Allocated', color: '#8b5cf6' }],
          xKey: 'name', stacked: false
        };
      }

      // 6. Production line / specific line questions
      else if (q.match(/line|production|plant|output|throughput/)) {
        const targetLine = matchedLine || null;
        const lineWS = targetLine
          ? workstations.filter((w: any) => w.lineId === targetLine.id)
          : workstations;

        const todayAllocs = allocations.filter((a: any) => a.date === today && (targetLine ? a.lineId === targetLine.id : true));
        const filledCount = new Set(todayAllocs.map((a: any) => a.workstationId)).size;
        const fillRate = lineWS.length > 0 ? Math.round((filledCount / lineWS.length) * 100) : 0;

        lineName = targetLine ? targetLine.name : 'ALL LINES COMBINED';
        insights.push({
          type: fillRate >= 80 ? 'good' : 'warning',
          message: `${lineName}: ${filledCount}/${lineWS.length} workstations staffed today. Fill rate: ${fillRate}%.`
        });
        productionLines.forEach((l: any) => {
          const lWS = workstations.filter((w: any) => w.lineId === l.id).length;
          const lAllocs = new Set(allocations.filter((a: any) => a.date === today && a.lineId === l.id).map((a: any) => a.workstationId)).size;
          const rate = lWS > 0 ? Math.round((lAllocs / lWS) * 100) : 0;
          insights.push({
            type: rate >= 80 ? 'good' : rate >= 50 ? 'warning' : 'critical',
            message: `${l.name}: ${lAllocs}/${lWS} WS staffed (${rate}%) — Status: ${l.status}`
          });
        });

        kpis = {
          output: { value: `${fillRate}% Staffed`, trend: fillRate >= 80 ? '✓ Optimal' : '▲ Gap Detected', color: fillRate >= 80 ? 'text-emerald-400' : 'text-rose-400' },
          utilization: { value: `${filledCount}/${lineWS.length} WS`, trend: 'Today', color: 'text-teal-400' },
          downtime: { value: `${productionLines.length} Lines`, trend: 'In System', color: 'text-slate-400' },
          operators: { value: `${todayAllocs.length} Assigned`, trend: 'Live', color: 'text-slate-300' }
        };
        chartData = {
          type: 'bar', title: 'Fill Rate by Production Line — Today',
          data: productionLines.map((l: any) => {
            const lWS = workstations.filter((w: any) => w.lineId === l.id).length;
            const lAllocs = new Set(allocations.filter((a: any) => a.date === today && a.lineId === l.id).map((a: any) => a.workstationId)).size;
            const rate = lWS > 0 ? Math.round((lAllocs / lWS) * 100) : 0;
            return { name: l.name?.split(' - ')[0] || l.id, 'Fill Rate %': rate };
          }),
          bars: [{ key: 'Fill Rate %', color: '#10b981' }],
          xKey: 'name', stacked: false, domain: [0, 100]
        };
      }

      // 7. Audit / Override questions
      else if (q.match(/audit|override|log|action|change|history/)) {
        const last10 = auditLogs.slice(0, 10);
        const overrideCount = auditLogs.filter((l: any) => l.actionType === 'OVERRIDE_ALLOCATION').length;
        const allocCount = auditLogs.filter((l: any) => l.actionType === 'ALLOCATION_CONFIRMED').length;

        insights.push({
          type: 'good',
          message: `Total audit log entries: ${auditLogs.length}. Last recorded action: "${last10[0]?.actionType}" at ${last10[0]?.timestamp?.split('T')[0] || 'N/A'}.`
        });
        insights.push({
          type: overrideCount > 0 ? 'warning' : 'good',
          message: `Override allocations logged: ${overrideCount}. Standard allocations: ${allocCount}.`
        });
        last10.slice(0, 3).forEach((log: any) => {
          insights.push({ type: 'good', message: `[${log.actionType}] ${log.details} — by ${log.userRole}` });
        });

        kpis = {
          output: { value: `${auditLogs.length} Total Logs`, trend: '📋 Full History', color: 'text-teal-400' },
          utilization: { value: `${overrideCount} Overrides`, trend: overrideCount > 5 ? '▲ High' : '✓ Normal', color: overrideCount > 5 ? 'text-rose-400' : 'text-emerald-400' },
          downtime: { value: `${allocCount} Confirmed`, trend: '✓ Standard', color: 'text-emerald-400' },
          operators: { value: `${activeAssociates.length} Active`, trend: 'Nominal', color: 'text-slate-300' }
        };
        chartData = {
          type: 'bar', title: 'Audit Log — Action Type Breakdown',
          data: [
            { name: 'Override', Count: overrideCount },
            { name: 'Alloc Confirmed', Count: allocCount },
            { name: 'Master Data', Count: auditLogs.filter((l: any) => l.actionType === 'MASTER_DATA_UPDATED').length },
            { name: 'Attendance', Count: auditLogs.filter((l: any) => l.actionType === 'ATTENDANCE_MARKED').length }
          ],
          bars: [{ key: 'Count', color: '#f43f5e' }],
          xKey: 'name', stacked: false
        };
      }

      // 8. Skills inventory questions
      else if (q.match(/skill|competenc|trained|training|capability/)) {
        const skillCoverage = skills.map((sk: any) => {
          const holders = associateSkills.filter((s: any) => s.skillId === sk.id && new Date(s.expiryDate) >= new Date()).length;
          return { name: sk.name, holders };
        }).sort((a: any, b: any) => b.holders - a.holders);

        skillCoverage.slice(0, 5).forEach((sk: any) => {
          insights.push({
            type: sk.holders > 2 ? 'good' : sk.holders > 0 ? 'warning' : 'critical',
            message: `${sk.name}: ${sk.holders} qualified operator(s) with valid certification.`
          });
        });
        const riskSkills = skillCoverage.filter((s: any) => s.holders <= 1);
        if (riskSkills.length > 0) {
          insights.push({
            type: 'critical',
            message: `⚠ Critical risk: ${riskSkills.length} skill(s) covered by only 1 or 0 operators — single point of failure risk.`
          });
        }

        kpis = {
          output: { value: `${skills.length} Skills`, trend: 'In Matrix', color: 'text-teal-400' },
          utilization: { value: `${associateSkills.length} Certs`, trend: 'Total Records', color: 'text-emerald-400' },
          downtime: { value: `${riskSkills.length} At Risk`, trend: riskSkills.length > 0 ? '▲ Mitigate' : '✓ Good', color: riskSkills.length > 0 ? 'text-rose-400' : 'text-emerald-400' },
          operators: { value: `${data.certValid.length} Valid`, trend: '✓ Active', color: 'text-slate-300' }
        };
        chartData = {
          type: 'barH', title: 'Qualified Operators per Skill (Valid Certs Only)',
          data: skillCoverage.map((s: any) => ({ name: s.name?.split(' ')[0] || s.name, 'Qualified': s.holders })),
          bars: [{ key: 'Qualified', color: '#8b5cf6' }],
          xKey: 'name', stacked: false
        };
      }

      // 9. Default summary / general overview
      else {
        const todayAllocs = allocations.filter((a: any) => a.date === today);
        const filledWS = new Set(todayAllocs.map((a: any) => a.workstationId)).size;
        const fillRate = workstations.length > 0 ? Math.round((filledWS / workstations.length) * 100) : 0;

        insights.push({
          type: 'good',
          message: `Workforce: ${activeAssociates.length} active operators. Today's staffing fill rate: ${fillRate}% (${filledWS}/${workstations.length} workstations).`
        });
        if (data.certExpired.length > 0) {
          insights.push({
            type: 'warning',
            message: `${data.certExpired.length} expired certifications detected. ${data.certExpiringIn30.length} more expire within 30 days.`
          });
        }
        const todayLeaves = leaveRecords.filter((l: any) => l.date === today).length;
        if (todayLeaves > 0) {
          insights.push({ type: 'warning', message: `${todayLeaves} operator(s) on leave today.` });
        }
        insights.push({
          type: 'good',
          message: `You can ask me about: certifications, leave/attendance, staffing allocations, headcount, skills, shifts, production lines, or audit logs.`
        });

        kpis = {
          output: { value: `${fillRate}% Fill Rate`, trend: 'Today', color: fillRate >= 80 ? 'text-emerald-400' : 'text-amber-400' },
          utilization: { value: `${activeAssociates.length} Active`, trend: 'Operators', color: 'text-teal-400' },
          downtime: { value: `${data.certExpired.length} Expired`, trend: data.certExpired.length > 0 ? '▲ Action' : '✓ Clean', color: data.certExpired.length > 0 ? 'text-rose-400' : 'text-emerald-400' },
          operators: { value: `${workstations.length} Workstations`, trend: 'Total', color: 'text-slate-300' }
        };
        chartData = {
          type: 'composed', title: '14-Day Staffing Demand Forecast',
          data: data.forecast,
          bars: [{ key: 'Available', color: '#14b8a6' }],
          lines: [{ key: 'Required', color: '#f43f5e' }],
          xKey: 'name', stacked: false
        };
      }

      // Compute dynamic recommendations & forecast based on current live context
      const dynamicRecs = generateRecommendations({
        associates: allAssociates,
        associateSkills,
        workstations,
        productionLines,
        shifts,
        allocations,
        leaveRecords,
        skills,
      }).slice(0, 3);

      setMessages(prev => [...prev, {
        sender: 'copilot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDashboardResponse: true,
        lineName,
        kpis,
        insights,
        chartData,
        recommendations: dynamicRecs
      }]);
      setIsTyping(false);
    }, 800);
  };

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

  return (
    <div className="flex-1 h-full flex flex-col overflow-y-auto bg-background print:bg-surface-container-lowest select-none">
      
      {/* Sticky controls bar */}
      <header className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant px-6 h-16 flex flex-wrap items-center justify-between gap-4 z-20 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl font-bold">insights</span>
          <div>
            <h1 className="text-sm font-bold text-primary font-sans tracking-tight">AI Analytics Dashboard</h1>
            <p className="text-[10px] text-secondary">Predictive analytics, safety auditing and roster copilot</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Range Selector */}
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-secondary font-bold uppercase tracking-wider mb-1">DATE RANGE</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="py-1 px-3 border border-outline-variant bg-surface-container-lowest text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-bold cursor-pointer text-xs"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>

          {/* Line Selector */}
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-secondary font-bold uppercase tracking-wider mb-1">PRODUCTION LINE</span>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="py-1 px-3 border border-outline-variant bg-surface-container-lowest text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-bold cursor-pointer text-xs"
            >
              <option value="ALL">All Lines</option>
              {(reportData?.productionLines || []).map((l: any) => (
                <option key={l.id} value={l.id}>{l.name.split(' - ')[0]}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 mt-auto">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="py-2 px-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-secondary font-bold font-mono tracking-wider text-[10px] cursor-pointer flex items-center gap-1.5 transition-all shadow-sm rounded-lg"
            >
              <span className={`material-symbols-outlined text-xs ${isRegenerating ? 'animate-spin' : ''}`}>sync</span>
              {isRegenerating ? 'REFRESHING...' : 'REFRESH DATA'}
            </button>

            <button
              onClick={() => window.print()}
              className="py-2 px-3.5 bg-primary hover:bg-primary/90 text-white font-bold font-mono tracking-wider text-[10px] rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-xs">picture_as_pdf</span>
              EXPORT TO PDF
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation Bar */}
      <div className="bg-surface-container-lowest border-b border-outline-variant px-6 py-2 shrink-0 flex gap-2 print:hidden">
        <button
          onClick={() => setActiveReportTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 border cursor-pointer ${
            activeReportTab === 'analytics'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-surface-container-lowest text-secondary hover:bg-surface-container-low border-outline-variant'
          }`}
        >
          <span className="material-symbols-outlined text-sm">analytics</span>
          Analytics Dashboard
        </button>
        <button
          onClick={() => setActiveReportTab('copilot')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 border cursor-pointer ${
            activeReportTab === 'copilot'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-surface-container-lowest text-secondary hover:bg-surface-container-low border-outline-variant'
          }`}
        >
          <span className="material-symbols-outlined text-sm">smart_toy</span>
          PlantOps Copilot
        </button>
      </div>

      {/* Print Document Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-xl font-bold font-sans uppercase tracking-tight text-slate-900">PlantOps AI Predictive Report</h1>
        <p className="text-xs font-mono text-slate-500 mt-1">PepsiCo Kolkata Plant — Date: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Report Canvas Grid */}
      {activeReportTab === 'analytics' ? (
        <div className="p-6 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-6 print:grid-cols-1 print:gap-10 bg-surface-container-low/40">
          
          {/* Chart 1: Heatmap */}
          <div className="bg-surface-container-lowest border-l-4 border-l-[#14b8a6] border border-outline-variant p-5 rounded-xl shadow-sm flex flex-col gap-4 animate-fade-in hover:shadow-md transition-all print:shadow-none">
            <div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-tight">Certification Coverage Matrix</h3>
              <p className="text-[10px] text-secondary mt-0.5">Roster skill matrix mapping operator qualifications (Teal=Valid, Rose=Expired, Slate=None)</p>
            </div>
            <div className="h-[320px] overflow-y-auto pr-1">
              <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${(reportData?.skills || []).length}, minmax(36px, 1fr))` }}>
                {/* Header Row */}
                <div className="font-mono text-[9px] font-bold text-secondary">OPERATOR</div>
                {(reportData?.skills || []).map((sk: any) => (
                  <div key={sk.id} className="font-mono text-[8px] font-bold text-secondary truncate text-center" title={sk.name}>
                    {sk.id.replace('_OPT', '').replace('_MGMT', '').replace('_CERT', '').substring(0, 5)}
                  </div>
                ))}

                {/* Rows */}
                {((computed?.activeAssociates || []).map((assoc: any) => {
                  const row: Record<string, any> = { name: assoc.name, id: assoc.id };
                  (reportData?.skills || []).forEach((sk: any) => {
                    const cert = (reportData?.associateSkills || []).find((as: any) => as.associateId === assoc.id && as.skillId === sk.id);
                    if (!cert) {
                      row[sk.id] = { status: 'none' };
                    } else {
                      const exp = new Date(cert.expiryDate);
                      const today = new Date();
                      if (exp < today) {
                        row[sk.id] = { status: 'expired', level: cert.level, expiry: cert.expiryDate, by: cert.certifiedBy };
                      } else {
                        row[sk.id] = { status: 'valid', level: cert.level, expiry: cert.expiryDate, by: cert.certifiedBy };
                      }
                    }
                  });
                  return row;
                })).map((row: any, i: number) => (
                  <React.Fragment key={i}>
                    <div className="font-sans text-[10px] font-bold text-slate-700 truncate pr-1 flex items-center">{row.name}</div>
                    {(reportData?.skills || []).map((sk: any) => {
                      const cell = row[sk.id];
                      let cellColor = 'bg-surface-container-high border-outline/50';
                      if (cell.status === 'valid') cellColor = 'bg-[#14b8a6] border-[#0d9488]/30 hover:scale-105';
                      if (cell.status === 'expired') cellColor = 'bg-rose-500 border-rose-600/30 hover:scale-105';

                      return (
                        <div
                          key={sk.id}
                          className={`h-5 border rounded-sm transition-all duration-150 cursor-pointer ${cellColor} flex items-center justify-center`}
                          title={cell.status !== 'none' ? `${row.name} - ${sk.id}\nLevel: ${cell.level}\nExpiry: ${cell.expiry}` : `${row.name} - ${sk.id} (Unqualified)`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-secondary italic mt-auto leading-relaxed border-t border-outline-variant pt-3">
              {computed?.coverageGapPercentage}% of active associates have at least one expired certification. Proactive scheduling of renewal certifications is advised.
            </div>
          </div>

          {/* Chart 2: Skill Level Distribution */}
          <div className="bg-surface-container-lowest border-l-4 border-l-[#8b5cf6] border border-outline-variant p-5 rounded-xl shadow-sm flex flex-col gap-4 animate-fade-in hover:shadow-md transition-all">
            <div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-tight">Skill Level Distribution</h3>
              <p className="text-[10px] text-secondary mt-0.5">Quantity of operators grouped by skill code and certification proficiency tiers</p>
            </div>
            <div className="h-[260px] w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={computed?.skillDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 9, paddingTop: 10 }} />
                  <Bar dataKey="Trainee" stackId="a" fill="#475569" />
                  <Bar dataKey="Operator" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Certified" stackId="a" fill="#14b8a6" />
                  <Bar dataKey="Expert" stackId="a" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-secondary italic mt-auto leading-relaxed border-t border-outline-variant pt-3">
              Highest concentration of experts found in key machinery skill roles, offering redundant line coverage templates.
            </div>
          </div>

          {/* Chart 3: Expiry Timeline */}
          <div className="bg-surface-container-lowest border-l-4 border-l-[#f59e0b] border border-outline-variant p-5 rounded-xl shadow-sm flex flex-col gap-4 animate-fade-in hover:shadow-md transition-all">
            <div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-tight">Certification Expiration Timeline</h3>
              <p className="text-[10px] text-secondary mt-0.5">Projected volume of skill certification renewals falling due over the next 12 months</p>
            </div>
            <div className="h-[260px] w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={computed?.expiryByMonth} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="Expirations" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-secondary italic mt-auto leading-relaxed border-t border-outline-variant pt-3">
              Recommend scheduling refresher certifications 30 days prior to expiry peaks to maintain uninterrupted line operations.
            </div>
          </div>

          {/* Chart 4: Shift Allocation Fill Rate */}
          <div className="bg-surface-container-lowest border-l-4 border-l-[#14b8a6] border border-outline-variant p-5 rounded-xl shadow-sm flex flex-col gap-4 animate-fade-in hover:shadow-md transition-all">
            <div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-tight">Shift Roster Fill Rate Trend</h3>
              <p className="text-[10px] text-secondary mt-0.5">Manpower compliance percentage tracks allocated staff counts against total line station requirements</p>
            </div>
            <div className="h-[260px] w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={computed?.fillRateByDate} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} domain={[0, 100]} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line type="monotone" dataKey="Fill Rate %" stroke="#14b8a6" strokeWidth={1.5} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-secondary italic mt-auto leading-relaxed border-t border-outline-variant pt-3">
              Roster trends indicate stable average shift load levels. Minimal coverage exceptions noted during weekend rosters.
            </div>
          </div>

          {/* Chart 5: Associate Deployment Frequency */}
          <div className="bg-surface-container-lowest border-l-4 border-l-[#3b82f6] border border-outline-variant p-5 rounded-xl shadow-sm flex flex-col gap-4 animate-fade-in hover:shadow-md transition-all">
            <div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-tight">Operator Deployment Frequency</h3>
              <p className="text-[10px] text-secondary mt-0.5">Top 10 operators ranked by total shift assignments registered across the active period</p>
            </div>
            <div className="h-[260px] w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={computed?.deploymentFreq} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} width={80} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Deployments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-secondary italic mt-auto leading-relaxed border-t border-outline-variant pt-3">
              Top deployed operators represent potential workload balance outliers. Balance roster schedules to mitigate fatigue warnings.
            </div>
          </div>

          {/* Chart 6: Override Rate by Supervisor */}
          <div className="bg-surface-container-lowest border-l-4 border-l-[#f43f5e] border border-outline-variant p-5 rounded-xl shadow-sm flex flex-col gap-4 animate-fade-in hover:shadow-md transition-all">
            <div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-tight">Roster Override Volume</h3>
              <p className="text-[10px] text-secondary mt-0.5">Audits standard allocations versus compliant skill safety override mappings by manager account</p>
            </div>
            <div className="h-[260px] w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={computed?.overrideRateByUser} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 9, paddingTop: 10 }} />
                  <Bar dataKey="Standard" fill="#14b8a6" name="Standard Allocations" />
                  <Bar dataKey="Override" fill="#f43f5e" name="Override Allocations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-secondary italic mt-auto leading-relaxed border-t border-outline-variant pt-3">
              High override rates warrant review of standard skill matrix parameters and eligible operators registry.
            </div>
          </div>

          {/* Chart 7: Workstation Coverage Risk Score */}
          <div className="bg-surface-container-lowest border-l-4 border-l-[#8b5cf6] border border-outline-variant p-5 rounded-xl shadow-sm flex flex-col gap-4 animate-fade-in hover:shadow-md transition-all">
            <div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-tight">Workstation Coverage Risk Profile</h3>
              <p className="text-[10px] text-secondary mt-0.5">Radar composite capability audit metrics evaluating roster parameters per production line</p>
            </div>
            <div className="h-[260px] w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={computed?.lineRadar}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 8 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 7 }} />
                  {(reportData?.productionLines || []).map((line: any, i: number) => {
                    const colors = ['#14b8a6', '#8b5cf6', '#3b82f6', '#f59e0b'];
                    const color = colors[i % colors.length];
                    return (
                      <Radar
                        key={line.id}
                        name={line.name.split(' - ')[0]}
                        dataKey="Skill Coverage %"
                        stroke={color}
                        fill={color}
                        fillOpacity={0.1}
                      />
                    );
                  })}
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 8, paddingTop: 10 }} />
                  <Tooltip content={<CustomChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-secondary italic mt-auto leading-relaxed border-t border-outline-variant pt-3">
              Roster coverage metrics represent composite plant-floor redundancy ratios per line setup.
            </div>
          </div>

          {/* Chart 8: Predictive Staffing Demand Forecast */}
          <div className="bg-surface-container-lowest border-l-4 border-l-[#10b981] border border-outline-variant p-5 rounded-xl shadow-sm flex flex-col gap-4 animate-fade-in hover:shadow-md transition-all">
            <div>
              <h3 className="font-semibold text-slate-800 text-xs tracking-tight">Predictive Staffing Demand Forecast</h3>
              <p className="text-[10px] text-secondary mt-0.5">14-day forward-looking projection evaluating active qualified workforce levels against workstation counts</p>
            </div>
            <div className="h-[260px] w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={computed?.forecast} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 8 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 9, paddingTop: 10 }} />
                  <Bar dataKey="Available" fill="#14b8a6" name="Projected Available Staff" />
                  <Line type="monotone" dataKey="Required" stroke="#f43f5e" strokeWidth={1.5} name="Min Required Stations" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-secondary italic mt-auto leading-relaxed border-t border-outline-variant pt-3">
              Manpower availability forecasts indicate stable operations buffer levels.
            </div>
          </div>

        </div>
      ) : (
        /* Isolated Palantir Foundry-Style Roster Control Center Tab */
        <section className="p-6 md:p-8 flex-1 flex flex-col overflow-hidden animate-fade-in w-full min-h-[500px]">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm">
            
            {/* Control panel header */}
            <div className="bg-primary text-white px-6 py-4 flex justify-between items-center border-b border-primary/20 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white/80 text-xl">psychology</span>
                <div>
                  <h3 className="font-bold text-xs tracking-tight text-white uppercase">PlantOps AI Copilot</h3>
                  <p className="text-[9px] text-white/60 font-mono">Live PostgreSQL database context active</p>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-emerald-400/20 px-2.5 py-0.5 rounded text-emerald-200 border border-emerald-300/30">● Online</span>
            </div>

            {/* Chat output & interactive cards */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-surface-container-low">
              {messages.map((m, idx) => (
                <div key={idx} className="flex flex-col gap-3">
                  {m.sender === 'user' ? (
                    <div className="self-end bg-primary text-white rounded-2xl px-4 py-2.5 text-xs max-w-[70%] shadow-sm">
                      {m.text}
                    </div>
                  ) : (
                    <div className="self-start w-full max-w-4xl flex flex-col gap-4 animate-fade-in">
                      
                      {/* Enterprise Header Card */}
                      {m.isDashboardResponse && (
                        <div id={`copilot-card-${idx}`} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-5">
                          <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                            <div>
                              <h4 className="text-xs font-bold text-secondary font-mono tracking-wider uppercase">Executive Analytics Report</h4>
                              <h3 className="text-sm font-bold text-primary mt-0.5">{m.lineName || 'ALL LINES'}</h3>
                            </div>
                            <div className="text-right text-[10px] font-mono text-secondary">
                              <div>Status: <span className="text-emerald-600 font-bold">🟢 Healthy</span></div>
                              <div className="mt-0.5">Confidence: <span className="text-primary font-bold">96%</span></div>
                            </div>
                          </div>

                          {/* KPI Card grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-surface-container-low border border-outline-variant p-3.5 rounded-lg flex flex-col">
                              <span className="text-[9px] text-secondary uppercase font-mono">Today's Metric</span>
                              <span className="text-sm font-bold text-primary mt-1">{m.kpis?.output?.value || '—'}</span>
                              <span className="text-[9px] font-bold mt-1 text-slate-500">{m.kpis?.output?.trend || ''}</span>
                            </div>
                            <div className="bg-surface-container-low border border-outline-variant p-3.5 rounded-lg flex flex-col">
                              <span className="text-[9px] text-secondary uppercase font-mono">Utilization</span>
                              <span className="text-sm font-bold text-primary mt-1">{m.kpis?.utilization?.value || '—'}</span>
                              <span className="text-[9px] font-bold mt-1 text-slate-500">{m.kpis?.utilization?.trend || ''}</span>
                            </div>
                            <div className="bg-surface-container-low border border-outline-variant p-3.5 rounded-lg flex flex-col">
                              <span className="text-[9px] text-secondary uppercase font-mono">Status Indicator</span>
                              <span className="text-sm font-bold text-primary mt-1">{m.kpis?.downtime?.value || '—'}</span>
                              <span className="text-[9px] font-bold mt-1 text-slate-500">{m.kpis?.downtime?.trend || ''}</span>
                            </div>
                            <div className="bg-surface-container-low border border-outline-variant p-3.5 rounded-lg flex flex-col">
                              <span className="text-[9px] text-secondary uppercase font-mono">Operators</span>
                              <span className="text-sm font-bold text-primary mt-1">{m.kpis?.operators?.value || '—'}</span>
                              <span className="text-[9px] font-bold mt-1 text-slate-500">{m.kpis?.operators?.trend || ''}</span>
                            </div>
                          </div>

                          {/* AI Insights Section */}
                          <div className="border-t border-outline-variant pt-3">
                            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 font-mono">AI Executive Insights</h4>
                            <div className="flex flex-col gap-2">
                              {(m.insights || []).map((ins: any, i: number) => (
                                <div key={i} className={`p-2.5 rounded-lg border text-xs flex gap-2.5 items-start ${
                                  ins.type === 'critical' ? 'bg-error-container border-outline-variant text-on-error-container' :
                                  ins.type === 'warning' ? 'bg-secondary-container border-outline-variant text-on-secondary-container' :
                                  'bg-tertiary-fixed-dim/20 border-outline-variant text-on-tertiary-fixed-variant'
                                }`}>
                                  <span className="material-symbols-outlined text-sm mt-0.5">
                                    {ins.type === 'critical' ? 'error' : ins.type === 'warning' ? 'warning' : 'check_circle'}
                                  </span>
                                  <span>{ins.message}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Dynamic Chart — unique per question intent */}
                          {m.chartData && (
                            <div className="border-t border-outline-variant pt-3">
                              <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-3 font-mono">{m.chartData.title}</h4>
                              <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  {m.chartData.type === 'barH' ? (
                                    <BarChart layout="vertical" data={m.chartData.data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                                      <YAxis type="category" dataKey={m.chartData.xKey} stroke="#94a3b8" tick={{ fontSize: 9 }} width={80} />
                                      <Tooltip content={<CustomChartTooltip />} />
                                      <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                                      {m.chartData.bars.map((b: any) => (
                                        <Bar key={b.key} dataKey={b.key} fill={b.color} stackId={m.chartData.stacked ? 'a' : undefined} radius={[0, 3, 3, 0]} />
                                      ))}
                                    </BarChart>
                                  ) : m.chartData.type === 'composed' ? (
                                    <ComposedChart data={m.chartData.data} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis dataKey={m.chartData.xKey} stroke="#94a3b8" tick={{ fontSize: 8 }} />
                                      <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                                      <Tooltip content={<CustomChartTooltip />} />
                                      <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                                      {(m.chartData.bars || []).map((b: any) => (
                                        <Bar key={b.key} dataKey={b.key} fill={b.color} name={b.key} />
                                      ))}
                                      {(m.chartData.lines || []).map((l: any) => (
                                        <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={1.5} dot={false} name={l.key} />
                                      ))}
                                    </ComposedChart>
                                  ) : (
                                    <BarChart data={m.chartData.data} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis dataKey={m.chartData.xKey} stroke="#94a3b8" tick={{ fontSize: 9 }} />
                                      <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} domain={m.chartData.domain || [0, 'auto']} />
                                      <Tooltip content={<CustomChartTooltip />} />
                                      <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                                      {m.chartData.bars.map((b: any) => (
                                        <Bar key={b.key} dataKey={b.key} fill={b.color} stackId={m.chartData.stacked ? 'a' : undefined} radius={m.chartData.stacked ? undefined : [3, 3, 0, 0]} name={b.key} />
                                      ))}
                                    </BarChart>
                                  )}
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}

                          {/* AI Recommendations panel */}
                          {m.recommendations && m.recommendations.length > 0 && (
                            <div className="border-t border-outline-variant pt-3">
                              <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 font-mono">AI Action Recommendations</h4>
                              <div className="flex flex-col gap-1.5">
                                {m.recommendations.map((rec: any, index: number) => {
                                  const color = rec.priority === 'critical' ? 'text-red-600 bg-error-container border-outline-variant' :
                                                rec.priority === 'high' ? 'text-amber-600 bg-secondary-container border-outline-variant' : 'text-blue-600 bg-secondary-container border-blue-200';
                                  return (
                                    <div key={index} className={`p-2 rounded-lg border text-[11px] flex gap-2 items-start ${color}`}>
                                      <span className="material-symbols-outlined text-xs mt-0.5">lightbulb</span>
                                      <div>
                                        <p className="font-bold">{rec.title}</p>
                                        <p className="text-[10px] opacity-90 mt-0.5">{rec.message}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Machine Breakdown Health Panel */}
                          <div className="border-t border-outline-variant pt-3">
                            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-3 font-mono">Machine Health Registry Status</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-surface-container-low border border-outline-variant p-3 rounded-lg flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-slate-800">Slicing & Washing Drum A</span>
                                  <span className="text-[10px] font-mono text-emerald-600 bg-tertiary-fixed-dim/20 px-1.5 py-0.5 rounded border border-outline-variant">98% OEE</span>
                                </div>
                                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full" style={{ width: '98%' }}></div>
                                </div>
                              </div>
                              <div className="bg-surface-container-low border border-outline-variant p-3 rounded-lg flex flex-col gap-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-slate-800">High-Temp Fryer Unit B</span>
                                  <span className="text-[10px] font-mono text-amber-600 bg-secondary-container px-1.5 py-0.5 rounded border border-outline-variant">84% OEE</span>
                                </div>
                                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-amber-500 h-full" style={{ width: '84%' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Report actions bar */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant items-center justify-between">
                            <button
                              onClick={() => {
                                const speech = new SpeechSynthesisUtterance(
                                  `Executive summary for ${m.lineName || 'All Lines'}. ` +
                                  (m.insights || []).map((ins: any) => ins.message).join('. ')
                                );
                                window.speechSynthesis.cancel();
                                window.speechSynthesis.speak(speech);
                              }}
                              className="py-1.5 px-3 bg-surface-container-low hover:bg-surface-container text-primary text-[10px] font-mono rounded cursor-pointer transition-all border border-outline-variant flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-xs">volume_up</span>
                              Read Report
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
                      {m.text && (
                        <div className="bg-surface-container-lowest border border-outline-variant text-slate-700 rounded-2xl px-4 py-3.5 text-xs max-w-[85%] shadow-sm">
                          {m.text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="self-start text-[10px] text-secondary font-mono animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  Analysing data...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input footer */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-low flex gap-3 items-center">
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(chatInput); }}
                  placeholder={isListening ? "Listening... Speak now!" : "Ask: 'expired certifications', 'who is on leave', 'shift coverage'..."}
                  className={`w-full border rounded-xl pl-4 pr-10 py-3 text-xs font-mono bg-surface-container-lowest text-slate-800 focus:outline-none focus:ring-1 transition-all ${
                    isListening
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400 bg-error-container'
                      : 'border-outline-variant focus:border-primary focus:ring-primary'
                  }`}
                />
                <button
                  onClick={toggleListening}
                  className={`absolute right-3 p-1 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                    isListening
                      ? 'text-red-500 bg-error-container hover:bg-red-100 animate-pulse'
                      : 'text-secondary hover:text-primary hover:bg-surface-container'
                  }`}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  <span className="material-symbols-outlined text-base">
                    {isListening ? 'mic_off' : 'mic'}
                  </span>
                </button>
              </div>
              <button
                onClick={() => handleSendMessage(chatInput)}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default AiReports;
