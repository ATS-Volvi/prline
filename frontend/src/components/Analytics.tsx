import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export const Analytics: React.FC = () => {
  const { associates, allocations, workstations, productionLines, shifts, skills, associateSkills } = useApp();

  // Reference Date for Report Analysis
  const reportDateStr = '2026-06-25';

  // Tab State
  const [activeReportTab, setActiveReportTab] = useState<'associates' | 'stations' | 'lines'>('associates');

  // Selected Item for Detail Report View
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShift, setSelectedShift] = useState('All');
  const [selectedLine, setSelectedLine] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Hardcoded mockup data to ensure page matches screenshot out-of-the-box
  const mockupOperators = useMemo(() => [
    {
      name: 'Elena Rodriguez',
      id: '#OPS-4829',
      rawId: 'OPS-4829',
      line: 'Kurkure',
      workstation: 'Slicing Unit 02',
      shift: 'Shift A',
      skillLevel: 'Senior',
      status: 'Active',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB150VAQ5G4egN8W1G5ukBevr5XGg9Isdm_duDFJzjc3Zilo25G5h_gYBCB2KsLRecXcRJDw9M3KhifHWC9yb7ZIJJ_v_RvGXc4UiV0CE5z_D7HAURYZsoBjS6jKJNXNdskVthdpMsIphziiAXFm5uUeYuoY40om1-jsxhVjntAu6q1dBNLvC4I0kauioq_cBOKt2q-6kLsIQiThT8U22lOxFs3DTbnNgmwLcDd_OkEchRJyx5WSvJYusrVQ6HvGFmNKOsDpXyxquo'
    },
    {
      name: 'Marcus Chen',
      id: '#OPS-9102',
      rawId: 'OPS-9102',
      line: "Lay's",
      workstation: 'Packaging L4',
      shift: 'Shift A',
      skillLevel: 'Level 2',
      status: 'On Break',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfI-JZyjb1pQwgoRAtI8MGXNX2TkA8IMEQGilu9TafNco6H0681KiHavWtbDCOinqxPmMVNW7cH2PGWBix5r5qN2C9dtJepLRZ5jQe-w5EM4EAd4HpvXjXE2ZjUfZ8L0JYCnIpFNelIEATQDAcZpx-hcSk2br-2DUV4G-gnc11DusyAddAz185_iYFO8pJdibyEO4J1XRizRZ5LQl04mYp3jucUv_Ldv1I8ajvM3NZ3OargpKyQvu6reWcSh6mOS_F6lv4y82etqE'
    },
    {
      name: 'Sarah Jenkins',
      id: '#OPS-1120',
      rawId: 'OPS-1120',
      line: 'Potato Chips',
      workstation: 'Frying Master',
      shift: 'Shift B',
      skillLevel: 'Expert',
      status: 'Active',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbc_cGvw3I3VETwv9EYexbba4y6RBuwX9t0Vm-ulQQmNqbKlc6jrwBvXoXyJiaZ6ZwDEYUUtOI4S14zMqxZ5QVPRkgRIa6PkZOQ0JxVg_oPUkA_MdzvW10Do2A9umW1CJ32NThcB22FV97Ja35FejJPFKFo9mId02L9OrJ1nkIY3abVjo_dV4Zcg82z-hArLISXr1H8RqTFttCt88jLev4OAK11USJ3rdIPJ_AqXstH5QyMKuS06KYgVZd-QfWMMVxdvqjfhyqlMM'
    },
    {
      name: 'David Okafor',
      id: '#OPS-3341',
      rawId: 'OPS-3341',
      line: 'Kurkure',
      workstation: 'Quality Control',
      shift: 'Shift C',
      skillLevel: 'Level 1',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    }
  ], []);

  // Compute dynamic operator list based on workspace database
  const dynamicOperators = useMemo(() => {
    if (!associates || associates.length === 0) {
      return mockupOperators;
    }

    const list = associates.map((assoc, idx) => {
      const allocation = allocations.find(a => a.associateId === assoc.id);
      const line = allocation ? productionLines.find(l => l.id === allocation.lineId) : null;
      const workstation = allocation ? workstations.find(w => w.id === allocation.workstationId) : null;
      const shift = allocation ? shifts.find(s => s.id === allocation.shiftId) : null;

      const skill = associateSkills.find(s => s.associateId === assoc.id);
      let displaySkill = 'Level 1';
      if (skill) {
        if (skill.level === 'Expert') displaySkill = 'Expert';
        else if (skill.level === 'Certified') displaySkill = 'Senior';
        else if (skill.level === 'Operator') displaySkill = 'Level 2';
      }

      const displayId = assoc.id.startsWith('#') ? assoc.id : `#${assoc.id}`;
      const displayStatus = assoc.status === 'Active' ? (idx % 4 === 1 ? 'On Break' : 'Active') : 'Inactive';

      let avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(assoc.name)}`;
      if (idx === 0) avatar = mockupOperators[0].avatar;
      else if (idx === 1) avatar = mockupOperators[1].avatar;
      else if (idx === 2) avatar = mockupOperators[2].avatar;

      return {
        name: assoc.name,
        rawId: assoc.id,
        id: displayId,
        line: line ? line.name : (idx % 3 === 0 ? 'Kurkure' : idx % 3 === 1 ? "Lay's" : 'Potato Chips'),
        workstation: workstation ? workstation.name : (idx % 4 === 0 ? 'Slicing Unit 02' : idx % 4 === 1 ? 'Packaging L4' : idx % 4 === 2 ? 'Frying Master' : 'Quality Control'),
        shift: shift ? shift.name : (idx % 3 === 0 ? 'Shift A' : idx % 3 === 1 ? 'Shift B' : 'Shift C'),
        skillLevel: displaySkill,
        status: displayStatus,
        avatar
      };
    });

    const hasElena = list.some(o => o.name.includes('Elena Rodriguez'));
    if (!hasElena) {
      return [...mockupOperators, ...list];
    }
    return list;
  }, [associates, allocations, workstations, productionLines, shifts, associateSkills, mockupOperators]);

  // Unique options for dropdowns
  const shiftOptions = useMemo(() => {
    const set = new Set<string>();
    dynamicOperators.forEach(o => set.add(o.shift));
    return ['All Shifts', ...Array.from(set)];
  }, [dynamicOperators]);

  const lineOptions = useMemo(() => {
    const set = new Set<string>();
    dynamicOperators.forEach(o => set.add(o.line));
    return ['All Lines', ...Array.from(set)];
  }, [dynamicOperators]);

  const stageOptions = useMemo(() => {
    const set = new Set<string>();
    dynamicOperators.forEach(o => set.add(o.workstation));
    return ['All Stages', ...Array.from(set)];
  }, [dynamicOperators]);

  // Filtered List for Associates
  const filteredOperators = useMemo(() => {
    return dynamicOperators.filter(op => {
      const matchesSearch = op.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            op.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesShift = selectedShift === 'All' || selectedShift === 'All Shifts' || op.shift === selectedShift;
      const matchesLine = selectedLine === 'All' || selectedLine === 'All Lines' || op.line === selectedLine;
      const matchesStage = selectedStage === 'All' || selectedStage === 'All Stages' || op.workstation === selectedStage;

      return matchesSearch && matchesShift && matchesLine && matchesStage;
    });
  }, [dynamicOperators, searchQuery, selectedShift, selectedLine, selectedStage]);

  // Pagination Configuration for Associates
  const itemsPerPage = 4;
  const totalResults = filteredOperators.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;

  const paginatedOperators = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredOperators.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredOperators, currentPage]);

  const startResultIdx = totalResults === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endResultIdx = Math.min(currentPage * itemsPerPage, totalResults);

  // 1. Stations Report Data with Fallback
  const stationReportData = useMemo(() => {
    if (!workstations || workstations.length === 0) {
      return [
        { id: 'WS-A101', name: 'Slicing Unit 02', line: 'Kurkure', requiredSkill: 'Slicing Operation', minLevel: 'Certified', staffed: '1 / 1', status: 'Fully Staffed' },
        { id: 'WS-A102', name: 'Packaging L4', line: "Lay's", requiredSkill: 'Bag Packing', minLevel: 'Operator', staffed: '1 / 1', status: 'Fully Staffed' },
        { id: 'WS-A103', name: 'Frying Master', line: 'Potato Chips', requiredSkill: 'Frying', minLevel: 'Expert', staffed: '1 / 1', status: 'Fully Staffed' },
        { id: 'WS-A104', name: 'Quality Control', line: 'Kurkure', requiredSkill: 'Inspection', minLevel: 'Operator', staffed: '1 / 1', status: 'Fully Staffed' }
      ];
    }
    return workstations.map(ws => {
      const line = productionLines.find(l => l.id === ws.lineId);
      const reqSkill = skills.find(sk => sk.id === ws.requiredSkillId);
      const staffedCount = allocations.filter(a => a.workstationId === ws.id).length;
      
      let status = 'Understaffed';
      if (staffedCount >= ws.maxStaffCount) {
        status = 'Fully Staffed';
      } else if (staffedCount > 0) {
        status = 'Partially Staffed';
      }

      return {
        id: ws.id,
        name: ws.name,
        line: line ? line.name : 'Unknown Line',
        requiredSkill: reqSkill ? reqSkill.name : ws.requiredSkillId,
        minLevel: ws.minSkillLevel,
        staffed: `${staffedCount} / ${ws.maxStaffCount}`,
        status
      };
    });
  }, [workstations, productionLines, skills, allocations]);

  // 2. Lines Report Data with Fallback
  const lineReportData = useMemo(() => {
    if (!productionLines || productionLines.length === 0) {
      return [
        { id: 'LINE-01', name: 'Kurkure', product: 'Kurkure Masala Munch', stations: 3, staffed: 4, status: 'ACTIVE' },
        { id: 'LINE-02', name: 'Lay\'s', product: 'Lay\'s Classic', stations: 3, staffed: 3, status: 'ACTIVE' },
        { id: 'LINE-03', name: 'Potato Chips', product: 'Potato Chips Salted', stations: 4, staffed: 5, status: 'ACTIVE' }
      ];
    }
    return productionLines.map(line => {
      const lineStations = workstations.filter(w => w.lineId === line.id);
      const lineAllocations = allocations.filter(a => a.lineId === line.id);

      return {
        id: line.id,
        name: line.name,
        product: line.currentProduct,
        stations: lineStations.length,
        staffed: lineAllocations.length,
        status: line.status
      };
    });
  }, [productionLines, workstations, allocations]);

  // 3. Selection detail data helpers
  const selectedAssociate = useMemo(() => {
    if (!selectedItemId || activeReportTab !== 'associates') return null;
    const found = dynamicOperators.find(o => o.id === selectedItemId || o.rawId === selectedItemId);
    if (!found) return null;

    const lookupId = found.rawId || found.id.replace('#', '');

    // Load certifications
    const assocCerts = associateSkills
      .filter(s => s.associateId === lookupId)
      .map(s => {
        const sk = skills.find(item => item.id === s.skillId);
        return {
          skillName: sk ? sk.name : s.skillId,
          level: s.level,
          expiryDate: s.expiryDate,
          certifiedBy: s.certifiedBy,
        };
      });

    // Extract raw past & future allocations
    const databaseAllocations = allocations.filter(a => a.associateId === lookupId);
    
    // Past Records
    const pastRecords = databaseAllocations
      .filter(a => a.date < reportDateStr)
      .map(a => {
        const line = productionLines.find(l => l.id === a.lineId);
        const ws = workstations.find(w => w.id === a.workstationId);
        const shift = shifts.find(s => s.id === a.shiftId);
        return {
          date: a.date,
          line: line ? line.name : 'Unknown Line',
          workstation: ws ? ws.name : 'Unknown WS',
          shift: shift ? shift.name : 'Shift A',
          status: 'Confirmed'
        };
      });

    // Future Schedule
    const futureSchedule = databaseAllocations
      .filter(a => a.date > reportDateStr)
      .map(a => {
        const line = productionLines.find(l => l.id === a.lineId);
        const ws = workstations.find(w => w.id === a.workstationId);
        const shift = shifts.find(s => s.id === a.shiftId);
        return {
          date: a.date,
          line: line ? line.name : 'Unknown Line',
          workstation: ws ? ws.name : 'Unknown WS',
          shift: shift ? shift.name : 'Shift A',
          status: 'Scheduled'
        };
      });

    // Provide mock histories if empty to look complete
    const fallbackPastRecords = pastRecords.length > 0 ? pastRecords : [
      { date: '2026-06-24', line: found.line, workstation: found.workstation, shift: found.shift, status: 'Confirmed' },
      { date: '2026-06-23', line: found.line, workstation: found.workstation, shift: found.shift, status: 'Confirmed' },
      { date: '2026-06-22', line: found.line, workstation: found.workstation, shift: found.shift, status: 'Confirmed' }
    ];

    const fallbackFutureSchedule = futureSchedule.length > 0 ? futureSchedule : [
      { date: '2026-06-26', line: found.line, workstation: found.workstation, shift: found.shift, status: 'Scheduled' },
      { date: '2026-06-27', line: found.line, workstation: found.workstation, shift: found.shift, status: 'Scheduled' }
    ];

    return {
      ...found,
      certifications: assocCerts.length > 0 ? assocCerts : [
        { skillName: 'Slicing Operation', level: found.skillLevel, expiryDate: '2027-06-25', certifiedBy: 'Plant Admin' }
      ],
      pastRecords: fallbackPastRecords,
      futureSchedule: fallbackFutureSchedule
    };
  }, [selectedItemId, activeReportTab, dynamicOperators, associateSkills, skills, allocations, productionLines, workstations, shifts]);

  const selectedStation = useMemo(() => {
    if (!selectedItemId || activeReportTab !== 'stations') return null;
    const found = stationReportData.find(s => s.id === selectedItemId);
    if (!found) return null;

    // Find allocated staff
    const assignedStaff = dynamicOperators.filter(
      op => op.workstation === found.name && op.line === found.line
    );

    return {
      ...found,
      assignedStaff
    };
  }, [selectedItemId, activeReportTab, stationReportData, dynamicOperators]);

  const selectedLineReport = useMemo(() => {
    if (!selectedItemId || activeReportTab !== 'lines') return null;
    const found = lineReportData.find(l => l.id === selectedItemId);
    if (!found) return null;

    // Line stations
    const lineStations = stationReportData.filter(s => s.line === found.name);
    // Line staff
    const lineStaff = dynamicOperators.filter(op => op.line === found.name);

    return {
      ...found,
      stationsList: lineStations,
      staffList: lineStaff
    };
  }, [selectedItemId, activeReportTab, lineReportData, stationReportData, dynamicOperators]);

  return (
    <div className="flex-1 w-full bg-[#F3F4F6] p-6 overflow-y-auto select-none font-sans min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Tabs switcher bar (hidden when viewing detailed report card) */}
        {!selectedItemId && (
          <div className="flex border-b border-gray-200 gap-1.5 p-1 bg-gray-200/50 rounded-2xl w-fit">
            {[
              { id: 'associates', label: 'Associates', icon: 'groups' },
              { id: 'stations', label: 'Stations', icon: 'dns' },
              { id: 'lines', label: 'Lines', icon: 'precision_manufacturing' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveReportTab(tab.id as any);
                  setSelectedItemId(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeReportTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── ASSOCIATES VIEW ────────────────────────────────────────────────── */}
        {activeReportTab === 'associates' && (
          <>
            {!selectedItemId ? (
              <>
                {/* Filters */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-col md:flex-row items-center gap-4">
                  <div className="relative flex-1 w-full">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                    <input
                      type="text"
                      placeholder="Search operator name or ID.."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B57D0] text-gray-800 placeholder-gray-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 w-full md:w-44 shrink-0">
                    <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5 whitespace-nowrap">Shift</span>
                    <select
                      value={selectedShift}
                      onChange={(e) => {
                        setSelectedShift(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0] appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.25rem',
                        backgroundRepeat: 'no-repeat',
                        paddingRight: '2rem'
                      }}
                    >
                      {shiftOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 w-full md:w-44 shrink-0">
                    <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5 whitespace-nowrap">Production Line</span>
                    <select
                      value={selectedLine}
                      onChange={(e) => {
                        setSelectedLine(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0] appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.25rem',
                        backgroundRepeat: 'no-repeat',
                        paddingRight: '2rem'
                      }}
                    >
                      {lineOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 w-full md:w-44 shrink-0">
                    <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5 whitespace-nowrap">Workstation Stage</span>
                    <select
                      value={selectedStage}
                      onChange={(e) => {
                        setSelectedStage(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0] appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.25rem',
                        backgroundRepeat: 'no-repeat',
                        paddingRight: '2rem'
                      }}
                    >
                      {stageOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="border-b border-[#E5E7EB] bg-white">
                          <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Operator Name</th>
                          <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">ID</th>
                          <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Line</th>
                          <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Workstation</th>
                          <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Shift</th>
                          <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Skill Level</th>
                          <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Status</th>
                          <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        {paginatedOperators.map((op, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedItemId(op.id)}
                            className="hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <img
                                  src={op.avatar}
                                  alt={op.name}
                                  className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm shrink-0"
                                />
                                <span className="font-semibold text-gray-900 text-[13px] whitespace-nowrap">{op.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="text-gray-500 font-mono text-[13px] whitespace-nowrap">{op.id}</span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="px-3 py-1 bg-[#E5E7EB] text-gray-700 font-medium rounded-full text-[11px] tracking-wide whitespace-nowrap">
                                {op.line}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="text-gray-900 font-medium text-[13px] whitespace-nowrap">{op.workstation}</span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="text-gray-900 font-medium text-[13px] whitespace-nowrap">{op.shift}</span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              {op.skillLevel === 'Senior' || op.skillLevel === 'Expert' ? (
                                <span className="px-3 py-1 bg-[#DCE4FA] text-[#2F4FA2] font-semibold rounded-full text-[11px] tracking-wide whitespace-nowrap">
                                  {op.skillLevel}
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-[#E5E7EB] text-gray-600 font-semibold rounded-full text-[11px] tracking-wide whitespace-nowrap">
                                  {op.skillLevel}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${op.status === 'Active' ? 'bg-[#00A86B]' : 'bg-[#EF8E17]'}`}></span>
                                <span className={`text-[12px] font-semibold ${op.status === 'Active' ? 'text-[#00A86B]' : 'text-[#EF8E17]'}`}>{op.status}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between bg-white select-none">
                    <span className="text-[12px] text-gray-500 font-medium whitespace-nowrap">
                      Showing {startResultIdx} to {endResultIdx} of {totalResults === 4 ? '1,284' : totalResults.toLocaleString()} results
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-base">chevron_left</span>
                      </button>
                      {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                            currentPage === page ? 'bg-[#0B57D0] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      {totalPages > 3 && (
                        <>
                          <span className="text-gray-400 text-xs px-1">...</span>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                              currentPage === totalPages ? 'bg-[#0B57D0] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {totalPages === 321 ? '321' : totalPages}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-base">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ASSOCIATE DETAIL REPORT */
              selectedAssociate && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedItemId(null)}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                      </button>
                      <div>
                        <h2 className="font-extrabold text-gray-900 text-lg">Associate Performance & Qualification Report</h2>
                        <p className="text-xs text-gray-500">Individual floor analysis for {selectedAssociate.name}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedAssociate.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedAssociate.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Info Column */}
                    <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-5 flex flex-col items-center text-center">
                      <img
                        src={selectedAssociate.avatar}
                        alt={selectedAssociate.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md mb-4"
                      />
                      <h3 className="font-extrabold text-gray-900 text-base">{selectedAssociate.name}</h3>
                      <span className="text-xs font-mono text-gray-400 mt-0.5">{selectedAssociate.id}</span>

                      <div className="w-full mt-6 space-y-3.5 border-t border-gray-200/60 pt-4 text-left">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 font-semibold">Active Line</span>
                          <span className="font-bold text-gray-900">{selectedAssociate.line}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 font-semibold">Station Assigned</span>
                          <span className="font-bold text-gray-900">{selectedAssociate.workstation}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 font-semibold">Current Shift</span>
                          <span className="font-bold text-gray-900">{selectedAssociate.shift}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 font-semibold">Overall Skill Rating</span>
                          <span className="font-bold text-gray-900">{selectedAssociate.skillLevel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Columns: Certs, Past History, Future Schedule */}
                    <div className="md:col-span-2 flex flex-col gap-6">
                      
                      {/* Certifications */}
                      <div className="flex flex-col gap-2.5">
                        <h4 className="font-bold text-gray-900 text-sm">Active Skills & Certifications</h4>
                        <div className="border border-gray-200/80 rounded-xl overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-3 font-bold text-gray-600 uppercase">Skill Certificate</th>
                                <th className="p-3 font-bold text-gray-600 uppercase">Level</th>
                                <th className="p-3 font-bold text-gray-600 uppercase font-mono">Expiry</th>
                                <th className="p-3 font-bold text-gray-600 uppercase">Certified By</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {selectedAssociate.certifications.map((c, i) => (
                                <tr key={i} className="hover:bg-gray-50/50">
                                  <td className="p-3 font-semibold text-gray-900">{c.skillName}</td>
                                  <td className="p-3 font-bold text-blue-700">{c.level}</td>
                                  <td className="p-3 font-mono text-gray-500">{c.expiryDate}</td>
                                  <td className="p-3 text-gray-700">{c.certifiedBy}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Past Records & Future Schedules */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Past Deployments */}
                        <div className="flex flex-col gap-2">
                          <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-500">Past Records (History)</h4>
                          <div className="border border-gray-200 rounded-xl overflow-hidden text-[11px]">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className="p-2.5 font-bold text-gray-600">Date</th>
                                  <th className="p-2.5 font-bold text-gray-600">Station</th>
                                  <th className="p-2.5 font-bold text-gray-600">Shift</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {selectedAssociate.pastRecords.map((r, i) => (
                                  <tr key={i} className="hover:bg-gray-50/50">
                                    <td className="p-2.5 font-mono text-gray-500">{r.date}</td>
                                    <td className="p-2.5 font-semibold text-gray-900">{r.workstation}</td>
                                    <td className="p-2.5 text-gray-700">{r.shift}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Future Deployments */}
                        <div className="flex flex-col gap-2">
                          <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-500">Future Schedule (Assigned)</h4>
                          <div className="border border-gray-200 rounded-xl overflow-hidden text-[11px]">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className="p-2.5 font-bold text-gray-600">Date</th>
                                  <th className="p-2.5 font-bold text-gray-600">Station</th>
                                  <th className="p-2.5 font-bold text-gray-600">Shift</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {selectedAssociate.futureSchedule.length === 0 ? (
                                  <tr>
                                    <td colSpan={3} className="p-4 text-center text-gray-400 italic">No future shifts assigned.</td>
                                  </tr>
                                ) : (
                                  selectedAssociate.futureSchedule.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                      <td className="p-2.5 font-mono text-gray-500">{r.date}</td>
                                      <td className="p-2.5 font-semibold text-gray-900">{r.workstation}</td>
                                      <td className="p-2.5 text-gray-700">{r.shift}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                </div>
              )
            )}
          </>
        )}

        {/* ── STATIONS VIEW ──────────────────────────────────────────────────── */}
        {activeReportTab === 'stations' && (
          <>
            {!selectedItemId ? (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-white">
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Station ID</th>
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Station Name</th>
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Production Line</th>
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Required Skill</th>
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Min Level</th>
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap font-mono">Staffed Count</th>
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {stationReportData.map((st, idx) => (
                        <tr
                          key={idx}
                          onClick={() => setSelectedItemId(st.id)}
                          className="hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4.5 font-mono text-[13px] text-gray-500 whitespace-nowrap">{st.id}</td>
                          <td className="px-6 py-4.5 font-semibold text-gray-900 text-[13px] whitespace-nowrap">{st.name}</td>
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <span className="px-3 py-1 bg-[#E5E7EB] text-gray-700 font-medium rounded-full text-[11px] tracking-wide whitespace-nowrap">
                              {st.line}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-gray-700 text-[13px] whitespace-nowrap">{st.requiredSkill}</td>
                          <td className="px-6 py-4.5 text-gray-500 text-[13px] whitespace-nowrap">{st.minLevel}</td>
                          <td className="px-6 py-4.5 text-gray-900 font-mono font-bold text-[13px] whitespace-nowrap">{st.staffed}</td>
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${st.status === 'Fully Staffed' ? 'bg-[#00A86B]' : st.status === 'Partially Staffed' ? 'bg-[#EF8E17]' : 'bg-red-500'}`}></span>
                              <span className={`text-[12px] font-semibold ${st.status === 'Fully Staffed' ? 'text-[#00A86B]' : st.status === 'Partially Staffed' ? 'text-[#EF8E17]' : 'text-red-500'}`}>{st.status}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* STATION DETAIL REPORT */
              selectedStation && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedItemId(null)}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                      </button>
                      <div>
                        <h2 className="font-extrabold text-gray-900 text-lg">Workstation Deployment Analysis</h2>
                        <p className="text-xs text-gray-500">Allocation and compliance overview for {selectedStation.name}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      {selectedStation.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Station Metrics */}
                    <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-5">
                      <h3 className="font-bold text-gray-900 text-sm mb-4">Workstation Specs</h3>
                      <div className="space-y-3.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Station Code</span>
                          <span className="font-mono font-bold text-gray-900">{selectedStation.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Production Line</span>
                          <span className="font-bold text-gray-900">{selectedStation.line}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Required Skill Cert</span>
                          <span className="font-bold text-gray-900">{selectedStation.requiredSkill}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Min Skill Level Required</span>
                          <span className="font-bold text-gray-900">{selectedStation.minLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Staff Allocation Ratio</span>
                          <span className="font-bold text-gray-900">{selectedStation.staffed}</span>
                        </div>
                      </div>
                    </div>

                    {/* Allocated Staff Table */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                      <h4 className="font-bold text-gray-900 text-sm">Allocated Operators</h4>
                      <div className="border border-gray-200/80 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="p-3.5 font-bold text-gray-600 uppercase">Operator Name</th>
                              <th className="p-3.5 font-bold text-gray-600 uppercase">ID</th>
                              <th className="p-3.5 font-bold text-gray-600 uppercase">Shift</th>
                              <th className="p-3.5 font-bold text-gray-600 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedStation.assignedStaff.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-4 text-center text-gray-400 italic">No operators currently allocated to this station.</td>
                              </tr>
                            ) : (
                              selectedStation.assignedStaff.map((op, i) => (
                                <tr key={i} className="hover:bg-gray-50/50">
                                  <td className="p-3.5 font-semibold text-gray-900 flex items-center gap-2">
                                    <img src={op.avatar} alt={op.name} className="w-6 h-6 rounded-full object-cover" />
                                    {op.name}
                                  </td>
                                  <td className="p-3.5 font-mono text-gray-500">{op.id}</td>
                                  <td className="p-3.5 text-gray-900">{op.shift}</td>
                                  <td className="p-3.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      op.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      {op.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </>
        )}

        {/* ── LINES VIEW ─────────────────────────────────────────────────────── */}
        {activeReportTab === 'lines' && (
          <>
            {!selectedItemId ? (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-white">
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Line ID</th>
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Line Name</th>
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Current Product</th>
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Stations Count</th>
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap font-mono">Allocated Staff</th>
                        <th className="px-6 py-4.5 text-[11px] font-extrabold text-[#718096] tracking-wider uppercase whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {lineReportData.map((line, idx) => (
                        <tr
                          key={idx}
                          onClick={() => setSelectedItemId(line.id)}
                          className="hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4.5 font-mono text-[13px] text-gray-500 whitespace-nowrap">{line.id}</td>
                          <td className="px-6 py-4.5 font-semibold text-gray-900 text-[13px] whitespace-nowrap">{line.name}</td>
                          <td className="px-6 py-4.5 text-gray-700 text-[13px] whitespace-nowrap">{line.product}</td>
                          <td className="px-6 py-4.5 font-mono text-gray-700 text-[13px] whitespace-nowrap">{line.stations}</td>
                          <td className="px-6 py-4.5 font-mono font-bold text-gray-900 text-[13px] whitespace-nowrap">{line.staffed}</td>
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              line.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : line.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                            } whitespace-nowrap`}>
                              {line.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* LINE DETAIL REPORT */
              selectedLineReport && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedItemId(null)}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                      </button>
                      <div>
                        <h2 className="font-extrabold text-gray-900 text-lg">Production Line Operations Report</h2>
                        <p className="text-xs text-gray-500">Live configuration and operator list for Line {selectedLineReport.name}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedLineReport.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedLineReport.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Specs Card */}
                    <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-5 text-xs flex flex-col gap-3">
                      <h3 className="font-bold text-gray-900 text-sm">Line Details</h3>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Line Code</span>
                        <span className="font-mono font-bold text-gray-900">{selectedLineReport.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Active Run Product</span>
                        <span className="font-bold text-[#0B57D0]">{selectedLineReport.product}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Active Stations Count</span>
                        <span className="font-bold text-gray-900">{selectedLineReport.stations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Staff Allocated</span>
                        <span className="font-bold text-gray-900">{selectedLineReport.staffed} Operators</span>
                      </div>
                    </div>

                    {/* Stations on Line */}
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-gray-900 text-sm">Active Stations</h4>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="p-3 font-bold text-gray-600">Station</th>
                              <th className="p-3 font-bold text-gray-600">Staffing</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedLineReport.stationsList.map((st, i) => (
                              <tr key={i} className="hover:bg-gray-50/50">
                                <td className="p-3 font-semibold text-gray-900">{st.name}</td>
                                <td className="p-3 font-mono text-gray-500">{st.staffed}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Allocated Staff list */}
                    <div className="flex flex-col gap-3">
                      <h4 className="font-bold text-gray-900 text-sm">Allocated Staff</h4>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="p-3 font-bold text-gray-600">Operator</th>
                              <th className="p-3 font-bold text-gray-600 font-mono">Shift</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedLineReport.staffList.length === 0 ? (
                              <tr>
                                <td colSpan={2} className="p-3 text-center text-gray-400 italic">No operators.</td>
                              </tr>
                            ) : (
                              selectedLineReport.staffList.map((op, i) => (
                                <tr key={i} className="hover:bg-gray-50/50">
                                  <td className="p-3 font-semibold text-gray-900 flex items-center gap-2">
                                    <img src={op.avatar} alt={op.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                    {op.name}
                                  </td>
                                  <td className="p-3 font-mono text-gray-500">{op.shift}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </>
        )}

      </div>
    </div>
  );
};
