import React, { useState } from 'react';
import { useApp } from '../context/AppContext';


interface Message {
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
}

export const AiReports: React.FC = () => {
  const {
    associates,
    associateSkills,
    workstations,
    allocations,
    leaveRecords
  } = useApp();

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'copilot',
      text: 'Welcome to PlantOps Copilot. I can search certifications, inspect staffing levels, and review safety compliance. Try typing a query or clicking one of the quick prompts below!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Handle chatbot responses using context state
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Process query
    setTimeout(() => {
      let replyText = '';
      const query = text.toLowerCase();

      if (query.includes('how many active') || query.includes('active operators') || query.includes('operator count')) {
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
        replyText = "I parsed your query but couldn't find a specific command. Try asking about 'active operators', 'leave records', 'fatigue warnings', 'vacant workstations', or certifications like 'high-temp safety' or 'blade operation'.";
      }

      const copilotMessage: Message = {
        sender: 'copilot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, copilotMessage]);
    }, 800);
  };

  const quickPrompts = [
    'How many active operators are seeded?',
    'Who is certified in High-Temp Safety?',
    'Show leave records for today',
    'Find vacant workstations',
    'Check labor compliance & fatigue warnings'
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

      {/* Main Grid Section */}
      <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
        {/* Bento Dashboard Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
          
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
                  <h4 className="font-body-md text-xs font-bold text-[#182c47]">Upcoming Durga Puja Attendance Deficit</h4>
                  <p className="font-body-md text-[10px] text-slate-500 mt-1 leading-normal">
                    Historical analytics predict up to a 35% attendance deficit in Shift C during the upcoming festival week. 
                    <strong className="text-rose-700 block mt-1">Recommendation: Pre-schedule standby contract operators.</strong>
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex gap-3">
                <span className="material-symbols-outlined text-[#14b8a6] shrink-0 text-lg">cloudy_snowing</span>
                <div>
                  <h4 className="font-body-md text-xs font-bold text-[#182c47]">Monsoon Logistics Delay Probability</h4>
                  <p className="font-body-md text-[10px] text-slate-500 mt-1 leading-normal">
                    High monsoon forecast for next Monday indicates a 40% transport delay risk for operators arriving for Shift A.
                    <strong className="text-[#0d9488] block mt-1">Recommendation: Shift timings overlap by 15 mins.</strong>
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
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-body-md text-xs font-bold text-[#182c47]">Rajesh Sen</h4>
                  <p className="font-body-md text-[9px] text-slate-500 mt-0.5">Certify: Blade Operation (Certified → Expert)</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">HIGH FIT</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-body-md text-xs font-bold text-[#182c47]">Priya Das</h4>
                  <p className="font-body-md text-[9px] text-slate-500 mt-0.5">Certify: Oil Management (Trainee → Operator)</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">CAPACITY GAP</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-body-md text-xs font-bold text-[#182c47]">P. Halder</h4>
                  <p className="font-body-md text-[9px] text-slate-500 mt-0.5">Certify: Spice Blending (Trainee → Operator)</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">LINE 02 FIT</span>
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
              <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-body-md text-xs text-slate-600">Fatigue Index (12-hour Rest Compliance)</span>
                <span className="font-body-md text-xs font-bold text-emerald-600">98%</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-body-md text-xs text-slate-600">Consecutive Double Shifts Flagged</span>
                <span className="font-body-md text-xs font-bold text-slate-700">0</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-body-md text-xs text-slate-600">Standby Backup Coverage Ratio</span>
                <span className="font-body-md text-xs font-bold text-emerald-600">1:4.2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: AI Copilot Chat Assistant */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
          <div className="bg-[#182c47] text-white px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#14b8a6]">smart_toy</span>
              <div>
                <h3 className="font-headline-md text-xs font-bold">PlantOps Copilot</h3>
                <p className="text-[9px] text-slate-300">State-aware plant scheduling chatbot</p>
              </div>
            </div>
            <span className="text-[9px] font-mono bg-slate-700/50 px-2 py-0.5 rounded text-[#14b8a6]">ROSTER INTERFACE</span>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar bg-slate-50/30">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] flex flex-col gap-1 ${
                  m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`p-3.5 rounded-2xl text-xs font-body-md leading-relaxed whitespace-pre-line shadow-sm border ${
                    m.sender === 'user'
                      ? 'bg-[#182c47] text-white border-[#182c47]'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[8px] text-slate-400 px-1 font-mono">{m.timestamp}</span>
              </div>
            ))}
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
          <div className="p-4 border-t border-slate-200 bg-white flex gap-3 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSendMessage(chatInput);
              }}
              placeholder="Ask Copilot: 'who is certified in high-temp safety?', 'show leave records'..."
              className="flex-1 border border-slate-200 rounded-xl px-4 text-xs font-body-md focus:outline-none focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]"
            />
            <button
              onClick={() => handleSendMessage(chatInput)}
              className="px-5 py-2 rounded-xl bg-[#182c47] hover:bg-[#223d61] text-white font-body-md font-bold text-xs flex items-center gap-2 cursor-pointer shadow-premium-sm"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
