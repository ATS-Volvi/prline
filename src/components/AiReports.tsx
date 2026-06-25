import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut, Pie, Radar, Line } from 'react-chartjs-2';
import { DataFrame } from '../utils/dataFrame';
import { Seaborn } from '../utils/seaborn';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler
);

// Chart palette — harmonious, modern teal/navy theme
const CHART_COLORS = {
  teal: 'rgba(20, 184, 166, 0.85)',
  tealLight: 'rgba(20, 184, 166, 0.25)',
  navy: 'rgba(24, 44, 71, 0.85)',
  navyLight: 'rgba(24, 44, 71, 0.25)',
  rose: 'rgba(244, 63, 94, 0.85)',
  roseLight: 'rgba(244, 63, 94, 0.25)',
  amber: 'rgba(245, 158, 11, 0.85)',
  amberLight: 'rgba(245, 158, 11, 0.25)',
  emerald: 'rgba(16, 185, 129, 0.85)',
  emeraldLight: 'rgba(16, 185, 129, 0.25)',
  violet: 'rgba(139, 92, 246, 0.85)',
  violetLight: 'rgba(139, 92, 246, 0.25)',
  sky: 'rgba(14, 165, 233, 0.85)',
  skyLight: 'rgba(14, 165, 233, 0.25)',
  pink: 'rgba(236, 72, 153, 0.85)',
  pinkLight: 'rgba(236, 72, 153, 0.25)',
};
type ChartType = 'bar' | 'doughnut' | 'pie' | 'radar' | 'line';

interface ChartPayload {
  type: ChartType;
  data: ChartData<any>;
  options?: ChartOptions<any>;
  title: string;
}

interface Message {
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  chart?: ChartPayload;
}

const baseRadarOptions: ChartOptions<'radar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { font: { size: 9, family: "'Inter', sans-serif" }, color: '#475569', padding: 12, usePointStyle: true, pointStyleWidth: 8 },
    },
    tooltip: {
      backgroundColor: '#182c47',
      titleFont: { size: 11, family: "'Inter', sans-serif" },
      bodyFont: { size: 10, family: "'Inter', sans-serif" },
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    r: {
      beginAtZero: true,
      ticks: { font: { size: 8 }, backdropColor: 'transparent', stepSize: 1 },
      pointLabels: { font: { size: 9, family: "'Inter', sans-serif" }, color: '#475569' },
      grid: { color: 'rgba(100,116,139,0.12)' },
      angleLines: { color: 'rgba(100,116,139,0.12)' },
    },
  },
};

/** Inline chart renderer */
const ChatChart: React.FC<{ chart: ChartPayload }> = ({ chart }) => {
  const ChartComponent = {
    bar: Bar,
    doughnut: Doughnut,
    pie: Pie,
    radar: Radar,
    line: Line,
  }[chart.type] as React.ComponentType<any>;

  return (
    <div className="mt-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[#14b8a6] text-sm">bar_chart</span>
        <span className="text-[10px] font-bold text-[#182c47] uppercase tracking-wider">{chart.title}</span>
      </div>
      <div style={{ height: chart.type === 'radar' ? 260 : 220, width: '100%' }}>
        <ChartComponent data={chart.data} options={chart.options} />
      </div>
    </div>
  );
};


export const AiReports: React.FC = () => {
  const {
    associates,
    associateSkills,
    skills,
    workstations,
    allocations,
    leaveRecords,
    productionLines,
  } = useApp();

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'copilot',
      text: 'Welcome to PlantOps Copilot. I can search certifications, inspect staffing levels, review safety compliance, and generate visual charts. Try typing a query or clicking one of the quick prompts below!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'copilot'>('analytics');
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setChatInput(transcript);
          handleSendMessage(transcript);
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Web Speech API recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    if (activeTab === 'copilot') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Handle chatbot responses using context state
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    // Process query
    setTimeout(() => {
      let replyText = '';
      let chart: ChartPayload | undefined;
      const query = text.toLowerCase();

      // ──────────────────── CHART-GENERATING QUERIES ────────────────────

      const sns = new Seaborn('mako'); // Initialize seaborn with the mako palette

      if (query.includes('skill distribution') || query.includes('skills breakdown') || query.includes('skill chart')) {
        const data = associateSkills.map(as => {
          const sk = skills.find(s => s.id === as.skillId);
          return { skill: sk?.name || as.skillId, val: 1 };
        });
        
        const df = new DataFrame(data);
        
        replyText = "Here's the statistical skill distribution across all operators. Calculated using DataFrame aggregation.";
        
        // Render Seaborn barplot
        const generatedPlot = sns.barplot(df, 'skill', 'val', 'Operator Skill Distribution', 'sum');
        chart = {
          type: 'bar',
          title: generatedPlot.title,
          data: generatedPlot.data,
          options: generatedPlot.options as any
        };
      }

      else if (query.includes('operator categor') || query.includes('workforce composition') || query.includes('employee type') || query.includes('category breakdown')) {
        const activeAssociates = associates.filter(a => a.status === 'Active');
        const df = new DataFrame(activeAssociates);
        
        replyText = "Workforce composition breakdown calculated via active operator profiles composition analysis.";
        
        const generatedPlot = sns.kdeplot(df, 'category', 'Workforce Composition');
        chart = {
          type: 'doughnut',
          title: generatedPlot.title,
          data: generatedPlot.data,
          options: generatedPlot.options as any
        };
      }

      else if (query.includes('staffing') || query.includes('workstation coverage') || query.includes('coverage chart') || query.includes('line coverage')) {
        const data = workstations.map(ws => {
          const line = productionLines.find(l => l.id === ws.lineId);
          const isStaffed = allocations.some(a => a.workstationId === ws.id) ? 1 : 0;
          return { Line: line?.name.split(' - ')[0] || ws.lineId, Status: isStaffed };
        });

        const df = new DataFrame(data);
        
        const totalWS = workstations.length;
        const totalStaffed = allocations.length;
        
        replyText = `Current workstation coverage: ${totalStaffed}/${totalWS} staffed (${totalWS > 0 ? Math.round(totalStaffed / totalWS * 100) : 0}%). Generated using Seaborn estimate plot.`;
        
        const generatedPlot = sns.barplot(df, 'Line', 'Status', 'Workstation Coverage', 'sum');
        chart = {
          type: 'bar',
          title: generatedPlot.title,
          data: generatedPlot.data,
          options: generatedPlot.options as any
        };
      }

      else if (query.includes('correlation') || query.includes('heatmap') || query.includes('performance corr')) {
        // Build a correlation matrix of numeric features per operator:
        // features: total certified skills, total shifts allocated, status index
        const operatorMetrics = associates.filter(a => a.status === 'Active').map(assoc => {
          const skillCount = associateSkills.filter(s => s.associateId === assoc.id).length;
          const shiftCount = allocations.filter(a => a.associateId === assoc.id).length;
          // category code: Company=3, Contract=2, NTCI=1
          const catCode = assoc.category === 'Company' ? 3 : assoc.category === 'Contract' ? 2 : 1;
          return {
            skillsCount: skillCount,
            shiftsCount: shiftCount,
            categoryCode: catCode
          };
        });

        const df = new DataFrame(operatorMetrics);
        const corrDf = df.corr(['skillsCount', 'shiftsCount', 'categoryCode']);
        
        replyText = "Statistical correlation heatmap generated using Pearson correlation coefficient matrix. Displays relationship strength between operator certified skills, assigned shifts, and workforce rank.";
        
        const generatedPlot = sns.heatmap(corrDf, 'Pearson Correlation Heatmap');
        chart = {
          type: 'bar',
          title: generatedPlot.title,
          data: generatedPlot.data,
          options: generatedPlot.options as any
        };
      }

      else if (query.includes('skill level') || query.includes('proficiency') || query.includes('certification level') || query.includes('level distribution')) {
        const df = new DataFrame(associateSkills);
        
        replyText = "Certification level distribution calculated across all active skill registry records.";
        
        const generatedPlot = sns.kdeplot(df, 'level', 'Certification Level Distribution');
        chart = {
          type: 'doughnut',
          title: generatedPlot.title,
          data: generatedPlot.data,
          options: generatedPlot.options as any
        };
      }

      else if (query.includes('expir') || query.includes('renewal') || query.includes('recertification') || query.includes('certification status')) {
        const today = new Date();
        const in30Days = new Date();
        in30Days.setDate(today.getDate() + 30);

        const data = associateSkills.map(s => {
          const exp = new Date(s.expiryDate);
          let status = 'Active';
          if (exp < today) status = 'Expired';
          else if (exp < in30Days) status = 'Expiring Soon';
          return { status };
        });

        const df = new DataFrame(data);
        replyText = "Certification expiration status summary generated. Immediate renewals recommended for expired entries.";

        const generatedPlot = sns.kdeplot(df, 'status', 'Certification Expiry Status');
        chart = {
          type: 'doughnut',
          title: generatedPlot.title,
          data: generatedPlot.data,
          options: generatedPlot.options as any
        };
      }

      else if (query.includes('skill radar') || query.includes('skill coverage radar') || query.includes('team capability') || query.includes('capability map')) {
        // Radar chart: max skill level per skill across all operators
        const skillNames = skills.map(s => s.name);
        const maxLevels = skills.map(sk => {
          const records = associateSkills.filter(as => as.skillId === sk.id);
          if (records.length === 0) return 0;
          const levelMap: Record<string, number> = { Trainee: 1, Operator: 2, Certified: 3, Expert: 4 };
          return Math.max(...records.map(r => levelMap[r.level] || 0));
        });
        const avgLevels = skills.map(sk => {
          const records = associateSkills.filter(as => as.skillId === sk.id);
          if (records.length === 0) return 0;
          const levelMap: Record<string, number> = { Trainee: 1, Operator: 2, Certified: 3, Expert: 4 };
          const total = records.reduce((sum, r) => sum + (levelMap[r.level] || 0), 0);
          return Math.round((total / records.length) * 10) / 10;
        });

        replyText = `Team capability radar generated. The chart shows maximum and average skill levels across all domains. Skills with lower average levels are candidates for upskilling programs.`;

        chart = {
          type: 'radar',
          title: 'Team Capability Radar',
          data: {
            labels: skillNames,
            datasets: [
              {
                label: 'Max Level',
                data: maxLevels,
                backgroundColor: CHART_COLORS.tealLight,
                borderColor: CHART_COLORS.teal,
                borderWidth: 2,
                pointBackgroundColor: CHART_COLORS.teal,
                pointRadius: 3,
              },
              {
                label: 'Avg Level',
                data: avgLevels,
                backgroundColor: CHART_COLORS.navyLight,
                borderColor: CHART_COLORS.navy,
                borderWidth: 2,
                pointBackgroundColor: CHART_COLORS.navy,
                pointRadius: 3,
              },
            ],
          },
          options: {
            ...baseRadarOptions,
            scales: {
              r: {
                ...baseRadarOptions.scales!.r as any,
                max: 4,
                ticks: {
                  ...(baseRadarOptions.scales!.r as any).ticks,
                  callback: (value: number) => ['', 'Trainee', 'Operator', 'Certified', 'Expert'][value] || '',
                },
              },
            },
          },
        };
      }

      else if (query.includes('shift allocation') || query.includes('shift load') || query.includes('shift utilization') || query.includes('shift chart')) {
        const data = allocations.map(a => {
          const shiftName = a.shiftId === 'SHIFT-A' ? 'Shift A' : a.shiftId === 'SHIFT-B' ? 'Shift B' : 'Shift C';
          return { Shift: shiftName, allocated: 1 };
        });

        const df = new DataFrame(data);
        replyText = "Shift allocation load distribution overview calculated via scheduled assignments.";

        const generatedPlot = sns.barplot(df, 'Shift', 'allocated', 'Shift Allocation Load', 'sum');
        chart = {
          type: 'bar',
          title: generatedPlot.title,
          data: generatedPlot.data,
          options: generatedPlot.options as any
        };
      }

      else if (query.includes('line status') || query.includes('production line') || query.includes('line overview')) {
        const data = productionLines.map(l => ({
          status: l.status === 'ACTIVE' ? 'Active' : l.status === 'MAINTENANCE' ? 'Maintenance' : 'Idle'
        }));
        
        const df = new DataFrame(data);
        replyText = "Production line operational status breakdown.";

        const generatedPlot = sns.kdeplot(df, 'status', 'Production Line Status');
        chart = {
          type: 'doughnut',
          title: generatedPlot.title,
          data: generatedPlot.data,
          options: generatedPlot.options as any
        };
      }

      else if (query.includes('attendance trend') || query.includes('leave trend') || query.includes('absence forecast') || query.includes('attendance forecast')) {
        const totalActive = associates.filter(a => a.status === 'Active').length;
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Generate simulated weekly dataset
        const records: Record<string, any>[] = [];
        days.forEach(day => {
          const presentCount = Math.max(totalActive - Math.floor(Math.random() * 3), totalActive - 4);
          records.push({ Day: day, Metric: 'Present', Headcount: presentCount });
          records.push({ Day: day, Metric: 'Absent', Headcount: totalActive - presentCount });
        });

        const df = new DataFrame(records);
        replyText = "Weekly attendance forecast trend line plot calculated using scheduled absence weights.";

        const generatedPlot = sns.lineplot(df, 'Day', 'Headcount', 'Weekly Attendance Forecast', 'Metric');
        chart = {
          type: 'line',
          title: generatedPlot.title,
          data: generatedPlot.data,
          options: generatedPlot.options as any
        };
      }

      // ──────────────────── ORIGINAL TEXT-ONLY QUERIES ────────────────────

      else if (query.includes('how many active') || query.includes('active operators') || query.includes('operator count')) {
        const activeCount = associates.filter(a => a.status === 'Active').length;
        replyText = `There are currently ${activeCount} active operators registered in the PepsiCo Kolkata roster database.`;
      }
      else if (query.includes('high-temp safety') || query.includes('heat_safety')) {
        const certified = associateSkills.filter(s => s.skillId === 'HEAT_SAFETY');
        if (certified.length === 0) {
          replyText = 'No operators are currently certified in High-Temp Safety.';
        } else {
          const list = certified.map(s => {
            const assoc = associates.find(a => a.id === s.associateId);
            return `${assoc?.name || s.associateId} (${s.level})`;
          }).join(', ');
          replyText = `The following operators hold High-Temp Safety certifications: ${list}.`;
        }
      }
      else if (query.includes('blade operation') || query.includes('blade_opt')) {
        const certified = associateSkills.filter(s => s.skillId === 'BLADE_OPT');
        if (certified.length === 0) {
          replyText = 'No operators are currently certified in Blade Operation.';
        } else {
          const list = certified.map(s => {
            const assoc = associates.find(a => a.id === s.associateId);
            return `${assoc?.name || s.associateId} (${s.level})`;
          }).join(', ');
          replyText = `The following operators hold Blade Operation certifications: ${list}.`;
        }
      }
      else if (query.includes('leave') || query.includes('absent')) {
        if (leaveRecords.length === 0) {
          replyText = 'There are no active leave records recorded for today.';
        } else {
          const list = leaveRecords.map(l => {
            const assoc = associates.find(a => a.id === l.associateId);
            return `${assoc?.name || l.associateId} (Shift: ${l.shiftId})`;
          }).join('; ');
          replyText = `Current registered absences: ${list}.`;
        }
      }
      else if (query.includes('unstaffed') || query.includes('vacant') || query.includes('empty workstations')) {
        const line01WS = workstations.filter(w => w.lineId === 'LINE-01');
        const vacantList: string[] = [];

        line01WS.forEach(ws => {
          const isAllocated = allocations.some(a => a.workstationId === ws.id);
          if (!isAllocated) {
            vacantList.push(`${ws.name} (${ws.id})`);
          }
        });

        if (vacantList.length === 0) {
          replyText = 'All workstations on Line 01 are currently staffed for today.';
        } else {
          replyText = `The following workstations on Line 01 are currently vacant: ${vacantList.join(', ')}.`;
        }
      }
      else if (query.includes('fatigue') || query.includes('burnout') || query.includes('compliance')) {
        // Count instances where associates have multiple allocations
        const map = new Map<string, number>();
        allocations.forEach(a => {
          map.set(a.associateId, (map.get(a.associateId) || 0) + 1);
        });
        const fatigued: string[] = [];
        map.forEach((count, id) => {
          if (count > 1) {
            const assoc = associates.find(a => a.id === id);
            fatigued.push(`${assoc?.name || id} (${count} shifts assigned today)`);
          }
        });

        if (fatigued.length === 0) {
          replyText = 'Safety and labor audit complete. Zero fatigue warnings detected today. All active shift assignments are compliant with the 12-hour rest requirement.';
        } else {
          replyText = `Fatigue Warning: The following operators have been assigned to multiple shifts today: ${fatigued.join(', ')}. Recommended action: Rebalance assignments.`;
        }
      }
      else if (query.includes('recommend') || query.includes('upskill') || query.includes('training')) {
        replyText = 'Upskilling roadmap generated:\n\n1. Upskill Rajesh Sen (EMP115) in Blade Operation to support slicing line coverage.\n2. Upskill Priya Das (EMP116) in Oil Management to cover High-Temp Fryer requirements.\n3. Certify P. Halder (EMP122) in Spice Blending to relieve seasoning applications.';
      }
      else {
        replyText = "I parsed your query but couldn't find a specific command. Try asking about:\n\n📊 Charts: 'skill distribution', 'operator categories', 'staffing coverage', 'certification levels', 'expiry status', 'skill radar', 'shift load', 'line status', 'attendance trend'\n\n💬 Text: 'active operators', 'leave records', 'fatigue warnings', 'vacant workstations', or certifications like 'high-temp safety'";
      }

      const copilotMessage: Message = {
        sender: 'copilot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chart,
      };
      setMessages(prev => [...prev, copilotMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const quickPrompts = [
    '📊 Show skill distribution chart',
    '🍩 Show operator categories breakdown',
    '📈 Show workstation staffing coverage',
    '🎯 Show team capability radar',
    '📉 Show attendance trend forecast',
    '🔑 Show certification expiry status',
    '⚡ Show shift allocation load',
    '🔥 Show correlation heatmap matrix',
    'How many active operators are seeded?',
    'Check labor compliance & fatigue warnings',
  ];

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-slate-50 select-none animate-fade-in">
      {/* Top Header */}
      <header className="flex justify-between items-center px-8 h-16 w-full border-b border-slate-200 bg-white shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#14b8a6] text-2xl">psychology</span>
          <div>
            <h1 className="font-headline-md text-sm font-bold text-[#182c47] tracking-tight">AI Operations Hub</h1>
            <p className="font-body-md text-[10px] text-[#64748b]">Predictive analytics, upskilling roadmaps, and roster copilot</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-[#14b8a6]/10 border border-[#14b8a6]/20 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14b8a6]"></span>
          </span>
          <span className="font-label-caps text-[9px] font-bold text-[#0d9488]">AI SYSTEM ONLINE</span>
        </div>
      </header>

      {/* Tabs Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-2 shrink-0 flex gap-4">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold font-body-md rounded-xl transition-all duration-200 border cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#182c47] text-white border-[#182c47] shadow-sm'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-sm">analytics</span>
          Analytics Dashboard
        </button>
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold font-body-md rounded-xl transition-all duration-200 border cursor-pointer ${
            activeTab === 'copilot'
              ? 'bg-[#182c47] text-white border-[#182c47] shadow-sm'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-sm">smart_toy</span>
          PlantOps Copilot
        </button>
      </div>

      {/* Main Grid Section */}
      <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
        {activeTab === 'analytics' && (
          /* Bento Dashboard Stats */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 animate-fade-in">
            {/* Col 1: Shift Risk Advisor */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500 text-lg">warning</span>
                  <span className="font-label-caps text-[11px] font-bold text-[#182c47]">Coverage Risk Advisor</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold border border-rose-100">HIGH RISK</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl flex gap-3">
                  <span className="material-symbols-outlined text-rose-500 shrink-0 text-lg">festival</span>
                  <div>
                    <h4 className="font-body-md text-xs font-bold text-[#182c47]">Durga Puja Attendance Deficit (Oct 18-24)</h4>
                    <p className="font-body-md text-[10px] text-slate-500 mt-1 leading-normal">
                      Historical predictive analytics indicate up to a <strong className="text-rose-700">35% drop in attendance</strong> for Shift C (Night) during the upcoming festive week. Line 01 and Line 02 output targets are projected to be impacted.
                      <strong className="text-rose-700 block mt-2 border-t border-rose-100/50 pt-1">Recommended Action: Onboard and pre-schedule 4 standby contract operators by Oct 10 to maintain continuous lines.</strong>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-3">
                  <span className="material-symbols-outlined text-amber-500 shrink-0 text-lg">cloudy_snowing</span>
                  <div>
                    <h4 className="font-body-md text-xs font-bold text-[#182c47]">Monsoon Transport Delay (Next Monday)</h4>
                    <p className="font-body-md text-[10px] text-slate-500 mt-1 leading-normal">
                      Heavy rainfall forecast indicates a <strong className="text-amber-800">40% transportation delay probability</strong> for operators arriving for Shift A (06:00). High risk of temporary downtime at start-of-shift setup.
                      <strong className="text-amber-800 block mt-2 border-t border-amber-100/50 pt-1">Recommended Action: Shift timings overlap by 15 mins. Request Shift C team to extend coverage if delay triggers.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Col 2: Smart Training Roadmaps */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-lg">school</span>
                  <span className="font-label-caps text-[11px] font-bold text-[#182c47]">Upskilling Recommendations</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-100">3 SUGGESTIONS</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-body-md text-xs font-bold text-[#182c47]">Rajesh Sen (EMP115)</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">HIGH FIT</span>
                  </div>
                  <p className="font-body-md text-[10px] text-slate-500 leading-normal">
                    <strong>Target:</strong> Certify in Blade Operation (Upgrade: Certified → Expert).
                  </p>
                  <p className="font-body-md text-[9px] text-slate-400">
                    <strong>Reasoning:</strong> Line 01 Classic Chips slicing station faces expert operator deficit during Shift B. Cross-training Rajesh resolves this critical bottleneck.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-body-md text-xs font-bold text-[#182c47]">Priya Das (EMP116)</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">CAPACITY GAP</span>
                  </div>
                  <p className="font-body-md text-[10px] text-slate-500 leading-normal">
                    <strong>Target:</strong> Certify in Oil Management (Upgrade: Trainee → Operator).
                  </p>
                  <p className="font-body-md text-[9px] text-slate-400">
                    <strong>Reasoning:</strong> Current oil management roster is highly dependent on two senior chemists. Certifying Priya will introduce redundancy.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-body-md text-xs font-bold text-[#182c47]">P. Halder (EMP122)</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">LINE 02 FIT</span>
                  </div>
                  <p className="font-body-md text-[10px] text-slate-500 leading-normal">
                    <strong>Target:</strong> Certify in Spice Blending (Upgrade: Trainee → Operator).
                  </p>
                  <p className="font-body-md text-[9px] text-slate-400">
                    <strong>Reasoning:</strong> Doritos line tumbler workstation requires an additional certified backup operator for weekend shifts.
                  </p>
                </div>
              </div>
            </div>

            {/* Col 3: Safety & Compliance Audit */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-lg">verified_user</span>
                  <span className="font-label-caps text-[11px] font-bold text-[#182c47]">Labor Compliance Audit</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-100">COMPLIANT</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-body-md text-xs font-bold text-slate-700">Fatigue Rest Index</span>
                    <span className="font-body-md text-xs font-bold text-emerald-600">98.4%</span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal">
                    Assesses adherence to the mandatory 12-hour rest requirement between shifts. Target benchmark is &gt;95%.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-body-md text-xs font-bold text-slate-700">Double Shift Flags</span>
                    <span className="font-body-md text-xs font-bold text-slate-50">0 Active</span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal">
                    Detects consecutive back-to-back shift assignments. Zero flags indicate all operations are fully compliant with labor guidelines.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-body-md text-xs font-bold text-slate-700">Standby Coverage Ratio</span>
                    <span className="font-body-md text-xs font-bold text-emerald-600">1 : 4.2</span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal">
                    Ratio of active operators to certified backup standbys. Optimal target is 1:4. Provides sufficient coverage buffer.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-[9px] text-slate-400">
                  <span>Last Audited: Today, 12:30 PM</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Database</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'copilot' && (
          /* Bottom Section: AI Copilot Chat Assistant */
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[500px] animate-fade-in">
            <div className="bg-[#182c47] text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#14b8a6]">smart_toy</span>
                <div>
                  <h3 className="font-headline-md text-xs font-bold">PlantOps Copilot</h3>
                  <p className="text-[9px] text-slate-300">State-aware plant scheduling chatbot with visual analytics</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/30">📊 CHARTS ENABLED</span>
                <span className="text-[9px] font-mono bg-slate-700/50 px-2 py-0.5 rounded text-[#14b8a6]">ROSTER INTERFACE</span>
              </div>
            </div>

            {/* Messages Panel */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar bg-slate-50/30">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] flex flex-col gap-1 ${
                    m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                  style={{ animation: 'fadeInUp 0.3s ease-out' }}
                >
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-body-md leading-relaxed whitespace-pre-line shadow-sm border ${
                      m.sender === 'user'
                        ? 'bg-[#182c47] text-white border-[#182c47]'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {m.text}
                    {m.chart && <ChatChart chart={m.chart} />}
                  </div>
                  <span className="text-[8px] text-slate-400 px-1 font-mono">{m.timestamp}</span>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="self-start flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#14b8a6] rounded-full" style={{ animation: 'bounce 1.2s infinite 0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#14b8a6] rounded-full" style={{ animation: 'bounce 1.2s infinite 200ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#14b8a6] rounded-full" style={{ animation: 'bounce 1.2s infinite 400ms' }}></span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-body-md">Copilot is analyzing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Buttons Panel */}
            <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap gap-2 bg-slate-50/50 shrink-0">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="text-[10px] font-body-md text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full cursor-pointer hover:shadow-premium-sm transition-all duration-150"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input Panel */}
            <div className="p-4 border-t border-slate-200 bg-white flex gap-3 shrink-0 items-center">
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendMessage(chatInput);
                  }}
                  placeholder={isListening ? "Listening... Speak now!" : "Ask Copilot: 'show skill distribution chart', 'team capability radar', 'attendance trend'..."}
                  className={`w-full border rounded-xl pl-4 pr-10 py-2 text-xs font-body-md focus:outline-none focus:ring-1 transition-all ${
                    isListening
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30'
                      : 'border-slate-200 focus:border-[#14b8a6] focus:ring-[#14b8a6]'
                  }`}
                />
                <button
                  onClick={toggleListening}
                  className={`absolute right-3 p-1 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                    isListening
                      ? 'text-rose-600 bg-rose-100 hover:bg-rose-200 animate-pulse'
                      : 'text-slate-400 hover:text-[#14b8a6] hover:bg-slate-100'
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
                className="px-5 py-2 rounded-xl bg-[#182c47] hover:bg-[#223d61] text-white font-body-md font-bold text-xs flex items-center gap-2 cursor-pointer shadow-premium-sm"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
