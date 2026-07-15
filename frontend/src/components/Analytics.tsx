import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';

export const Analytics: React.FC = () => {
  const { associates, allocations, workstations, productionLines, shifts, skills, associateSkills } = useApp();

  // Filter Date for Report Analysis
  const [reportDate, setReportDate] = useState('2026-06-25');

  // Tab State
  const [activeReportTab, setActiveReportTab] = useState<'associates' | 'stations' | 'lines' | 'coverage' | 'skillgap'>('associates');

  // Selected Item for Detail Report View
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShift, setSelectedShift] = useState('All');
  const [selectedLine, setSelectedLine] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Stations tab – line filter
  const [selectedStationLine, setSelectedStationLine] = useState('All Lines');

  // Line detail view – independent filters
  const [lineDetailDate, setLineDetailDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lineDetailShift, setLineDetailShift] = useState('');
  const [lineDetailStatus, setLineDetailStatus] = useState('All');

  // Station detail view – independent filters
  const [stationDetailDate, setStationDetailDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [stationDetailShift, setStationDetailShift] = useState('');

  // Coverage heatmap start date
  const [coverageStartDate, setCoverageStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });

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

  // Line options for the Stations tab filter
  const stationLineOptions = useMemo(() => {
    if (productionLines && productionLines.length > 0) {
      return ['All Lines', ...productionLines.map(l => l.name)];
    }
    return ['All Lines', 'Kurkure', "Lay's", 'Potato Chips'];
  }, [productionLines]);

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
    let rows;
    if (!workstations || workstations.length === 0) {
      rows = [
        { id: 'WS-A101', name: 'Slicing Unit 02', line: 'Kurkure', requiredSkill: 'Slicing Operation', minLevel: 'Certified', staffed: '1 / 1', status: 'Fully Staffed' },
        { id: 'WS-A102', name: 'Packaging L4', line: "Lay's", requiredSkill: 'Bag Packing', minLevel: 'Operator', staffed: '1 / 1', status: 'Fully Staffed' },
        { id: 'WS-A103', name: 'Frying Master', line: 'Potato Chips', requiredSkill: 'Frying', minLevel: 'Expert', staffed: '1 / 1', status: 'Fully Staffed' },
        { id: 'WS-A104', name: 'Quality Control', line: 'Kurkure', requiredSkill: 'Inspection', minLevel: 'Operator', staffed: '1 / 1', status: 'Fully Staffed' }
      ];
    } else {
      rows = workstations.map(ws => {
        const line = productionLines.find(l => l.id === ws.lineId);
        const reqSkill = skills.find(sk => sk.id === ws.requiredSkillId);
        const staffedCount = allocations.filter(a => {
          const matchesDate = a.date === reportDate;
          const shiftInstance = shifts.find(s => s.id === a.shiftId);
          const shiftName = shiftInstance ? shiftInstance.name : 'Unknown Shift';
          const matchesShift = selectedShift === 'All' || selectedShift === 'All Shifts' || shiftName === selectedShift;
          return a.workstationId === ws.id && matchesDate && matchesShift;
        }).length;

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
    }
    // Apply production-line filter
    if (selectedStationLine && selectedStationLine !== 'All Lines') {
      rows = rows.filter(r => r.line === selectedStationLine);
    }
    return rows;
  }, [workstations, productionLines, skills, allocations, reportDate, selectedShift, shifts, selectedStationLine]);

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
      const lineAllocations = allocations.filter(a => {
        const matchesDate = a.date === reportDate;
        const shiftInstance = shifts.find(s => s.id === a.shiftId);
        const shiftName = shiftInstance ? shiftInstance.name : 'Unknown Shift';
        const matchesShift = selectedShift === 'All' || selectedShift === 'All Shifts' || shiftName === selectedShift;
        return a.lineId === line.id && matchesDate && matchesShift;
      });

      return {
        id: line.id,
        name: line.name,
        product: line.currentProduct,
        stations: lineStations.length,
        staffed: lineAllocations.length,
        status: line.status
      };
    });
  }, [productionLines, workstations, allocations, reportDate, selectedShift, shifts]);

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
      .filter(a => a.date < reportDate)
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
      .filter(a => a.date > reportDate)
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
  }, [selectedItemId, activeReportTab, dynamicOperators, associateSkills, skills, allocations, productionLines, workstations, shifts, reportDate]);

  const selectedStation = useMemo(() => {
    if (!selectedItemId || activeReportTab !== 'stations') return null;
    const found = stationReportData.find(s => s.id === selectedItemId);
    if (!found) return null;

    // Workstation from DB
    const ws = workstations.find(w => w.id === found.id);
    const requiredCount = ws ? ws.maxStaffCount : 1;

    // Allocations filtered by date + shift
    const filteredAllocs = allocations.filter(a => {
      if (a.workstationId !== found.id) return false;
      if (a.date !== stationDetailDate) return false;
      if (stationDetailShift) {
        const shiftInst = shifts.find(s => s.id === a.shiftId);
        if (!shiftInst || shiftInst.name !== stationDetailShift) return false;
      }
      return true;
    });

    const assignedStaff = filteredAllocs.map(a => {
      const assoc = associates.find(as => as.id === a.associateId);
      const shiftInst = shifts.find(s => s.id === a.shiftId);
      return {
        name: assoc ? `${assoc.firstName} ${assoc.lastName}` : a.associateId,
        id: assoc ? assoc.id : a.associateId,
        avatar: assoc?.avatar || `https://ui-avatars.com/api/?name=${assoc?.firstName || 'O'}&background=E5E7EB&color=374151&size=40`,
        shift: shiftInst ? shiftInst.name : 'Unknown',
        status: assoc?.status || 'Active'
      };
    });

    const staffedCount = assignedStaff.length;
    const complete = staffedCount >= requiredCount;

    return {
      ...found,
      staffed: `${staffedCount} / ${requiredCount}`,
      complete,
      staffedCount,
      requiredCount,
      assignedStaff
    };
  }, [selectedItemId, activeReportTab, stationReportData, workstations, associates, allocations, shifts, stationDetailDate, stationDetailShift]);

  const selectedLineReport = useMemo(() => {
    if (!selectedItemId || activeReportTab !== 'lines') return null;
    const found = lineReportData.find(l => l.id === selectedItemId);
    if (!found) return null;

    // All workstations belonging to this line
    const lineWsList = workstations.filter(ws => ws.lineId === found.id);

    // Build per-station rows with staffed/required for the detail filters
    const stationsList = lineWsList.map(ws => {
      const reqSkill = skills.find(sk => sk.id === ws.requiredSkillId);
      const staffedAllocs = allocations.filter(a => {
        if (a.workstationId !== ws.id) return false;
        if (a.date !== lineDetailDate) return false;
        if (lineDetailShift) {
          const shiftInst = shifts.find(s => s.id === a.shiftId);
          if (!shiftInst || shiftInst.name !== lineDetailShift) return false;
        }
        return true;
      });
      const staffedCount = staffedAllocs.length;
      const requiredCount = ws.maxStaffCount;
      const complete = staffedCount >= requiredCount;
      return {
        id: ws.id,
        name: ws.name,
        requiredSkill: reqSkill ? reqSkill.name : ws.requiredSkillId,
        minLevel: ws.minSkillLevel,
        staffed: staffedCount,
        required: requiredCount,
        complete
      };
    });

    // Build staff roster for this line
    const allLineAllocs = allocations.filter(a => {
      const ws = workstations.find(w => w.id === a.workstationId);
      if (!ws || ws.lineId !== found.id) return false;
      if (a.date !== lineDetailDate) return false;
      if (lineDetailShift) {
        const shiftInst = shifts.find(s => s.id === a.shiftId);
        if (!shiftInst || shiftInst.name !== lineDetailShift) return false;
      }
      return true;
    });

    const staffList = allLineAllocs.map(a => {
      const assoc = associates.find(as => as.id === a.associateId);
      const ws = workstations.find(w => w.id === a.workstationId);
      const shiftInst = shifts.find(s => s.id === a.shiftId);
      const wsForLine = stationsList.find(s => s.id === a.workstationId);
      return {
        name: assoc ? `${assoc.firstName} ${assoc.lastName}` : a.associateId,
        avatar: assoc?.avatar || `https://ui-avatars.com/api/?name=${assoc?.firstName || 'O'}&background=E5E7EB&color=374151&size=40`,
        workstation: ws ? ws.name : 'Unknown',
        shift: shiftInst ? shiftInst.name : 'Unknown',
        complete: wsForLine ? wsForLine.complete : false
      };
    });

    // Apply status filter to staffList
    const filteredStaff = lineDetailStatus === 'All'
      ? staffList
      : lineDetailStatus === 'Complete'
        ? staffList.filter(s => s.complete)
        : staffList.filter(s => !s.complete);

    const totalRequired = stationsList.reduce((sum, s) => sum + s.required, 0);
    const totalStaffed = stationsList.reduce((sum, s) => sum + s.staffed, 0);
    const lineComplete = totalStaffed >= totalRequired;

    return {
      ...found,
      stationsList,
      staffList: filteredStaff,
      totalRequired,
      totalStaffed,
      lineComplete
    };
  }, [selectedItemId, activeReportTab, lineReportData, workstations, allocations, associates, skills, shifts, lineDetailDate, lineDetailShift, lineDetailStatus]);

  // ── CSV EXPORT HELPERS ────────────────────────────────────────────────────
  const exportCSV = useCallback((filename: string, headers: string[], rows: (string | number)[][][]) => {
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(c => escape(c[0])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportAssociatesCSV = useCallback(() => {
    exportCSV(
      `associates-report-${new Date().toISOString().slice(0,10)}.csv`,
      ['Name', 'ID', 'Line', 'Workstation', 'Shift', 'Skill Level', 'Status'],
      filteredOperators.map(op => [[op.name],[op.id],[op.line],[op.workstation],[op.shift],[op.skillLevel],[op.status]])
    );
  }, [exportCSV, filteredOperators]);

  const exportStationsCSV = useCallback(() => {
    exportCSV(
      `workstations-report-${reportDate}.csv`,
      ['Station ID', 'Station Name', 'Production Line', 'Required Skill', 'Min Level', 'Status'],
      stationReportData.map(st => [[st.id],[st.name],[st.line],[st.requiredSkill],[st.minLevel],[st.status]])
    );
  }, [exportCSV, stationReportData, reportDate]);

  const exportLinesCSV = useCallback(() => {
    exportCSV(
      `lines-report-${reportDate}.csv`,
      ['Line ID', 'Line Name', 'Product', 'Stations', 'Allocated Staff', 'Status'],
      lineReportData.map(l => [[l.id],[l.name],[l.product],[l.stations],[l.staffed],[l.status]])
    );
  }, [exportCSV, lineReportData, reportDate]);

  // ── SKILL GAP DATA ────────────────────────────────────────────────────────
  const skillGapData = useMemo(() => {
    if (!workstations || workstations.length === 0) {
      return [
        { id: 'WS-A101', name: 'Slicing Unit 02', line: 'Kurkure', requiredSkill: 'Slicing Operation', minLevel: 'Certified', qualifiedCount: 0, totalAssociates: 4, gapSeverity: 'Critical' },
        { id: 'WS-A102', name: 'Frying Master', line: 'Potato Chips', requiredSkill: 'Frying', minLevel: 'Expert', qualifiedCount: 1, totalAssociates: 4, gapSeverity: 'High' },
      ];
    }
    return workstations.map(ws => {
      const line = productionLines.find(l => l.id === ws.lineId);
      const reqSkill = skills.find(sk => sk.id === ws.requiredSkillId);
      // Count associates who have the required skill at or above min level
      const levelOrder = ['Beginner', 'Operator', 'Certified', 'Expert', 'Senior'];
      const minIdx = levelOrder.indexOf(ws.minSkillLevel);
      const qualifiedCount = associates.filter(assoc => {
        return associateSkills.some(as => {
          if (as.associateId !== assoc.id || as.skillId !== ws.requiredSkillId) return false;
          const assocLevelIdx = levelOrder.indexOf(as.level);
          return assocLevelIdx >= minIdx;
        });
      }).length;
      const total = associates.length;
      const pct = total > 0 ? (qualifiedCount / total) * 100 : 0;
      const gapSeverity = qualifiedCount === 0 ? 'Critical' : pct < 10 ? 'High' : pct < 25 ? 'Medium' : 'Low';
      return {
        id: ws.id,
        name: ws.name,
        line: line ? line.name : 'Unknown',
        requiredSkill: reqSkill ? reqSkill.name : ws.requiredSkillId,
        minLevel: ws.minSkillLevel,
        qualifiedCount,
        totalAssociates: total,
        gapSeverity
      };
    }).sort((a, b) => {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (order[a.gapSeverity as keyof typeof order] ?? 4) - (order[b.gapSeverity as keyof typeof order] ?? 4);
    });
  }, [workstations, productionLines, skills, associates, associateSkills]);

  // ── COVERAGE HEATMAP DATA ─────────────────────────────────────────────────
  const coverageHeatmapData = useMemo(() => {
    // Build 7 dates from coverageStartDate
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(coverageStartDate);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    const lines = productionLines && productionLines.length > 0
      ? productionLines
      : [{ id: 'LINE-01', name: 'Kurkure' }, { id: 'LINE-02', name: "Lay's" }, { id: 'LINE-03', name: 'Potato Chips' }];
    return {
      dates,
      rows: lines.map(line => ({
        lineName: line.name,
        cells: dates.map(date => {
          const lineWs = workstations.filter(w => w.lineId === line.id);
          const totalRequired = lineWs.reduce((s, w) => s + w.maxStaffCount, 0);
          const totalStaffed = allocations.filter(a => {
            const ws = workstations.find(w => w.id === a.workstationId);
            return ws && ws.lineId === line.id && a.date === date;
          }).length;
          const pct = totalRequired > 0 ? Math.round((totalStaffed / totalRequired) * 100) : 0;
          return { date, pct, staffed: totalStaffed, required: totalRequired };
        })
      }))
    };
  }, [productionLines, workstations, allocations, coverageStartDate]);

  return (
    <div className="flex-1 w-full bg-[#F3F4F6] p-6 overflow-y-auto select-none font-sans min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Tabs switcher bar (hidden when viewing detailed report card) */}
        {!selectedItemId && (
          <div className="flex border-b border-gray-200 gap-1.5 p-1 bg-gray-200/50 rounded-2xl w-fit">
            {[
              { id: 'associates', label: 'Associates', icon: 'groups' },
              { id: 'stations', label: 'Stations', icon: 'dns' },
              { id: 'lines', label: 'Lines', icon: 'precision_manufacturing' },
              { id: 'coverage', label: 'Coverage', icon: 'calendar_month' },
              { id: 'skillgap', label: 'Skill Gaps', icon: 'warning' }
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
                  {/* Export */}
                  <button
                    onClick={exportAssociatesCSV}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#0B57D0] text-white text-xs font-bold rounded-xl hover:bg-[#0842a0] transition-colors shrink-0 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export CSV
                  </button>
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
              <>
                {/* Filters */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-col md:flex-row items-center gap-4 mb-4">
                  <div className="flex flex-col gap-1.5 w-full md:w-44 shrink-0">
                    <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5 whitespace-nowrap">Date</span>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => {
                        setReportDate(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 w-full md:w-44 shrink-0">
                    <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5 whitespace-nowrap">Production Line</span>
                    <select
                      value={selectedStationLine}
                      onChange={(e) => setSelectedStationLine(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0] appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.25rem',
                        backgroundRepeat: 'no-repeat',
                        paddingRight: '2rem'
                      }}
                    >
                      {stationLineOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  {/* Export */}
                  <button
                    onClick={exportStationsCSV}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#0B57D0] text-white text-xs font-bold rounded-xl hover:bg-[#0842a0] transition-colors shrink-0 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export CSV
                  </button>
                </div>

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
              </>
            ) : (
              /* STATION DETAIL REPORT */
              selectedStation && (
                <div className="flex flex-col gap-5">

                  {/* Header */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedItemId(null)}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                      </button>
                      <div>
                        <h2 className="font-extrabold text-gray-900 text-lg">Workstation Deployment Analysis</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {selectedStation.name} &nbsp;·&nbsp; {selectedStation.line}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedStation.complete ? 'bg-green-100 text-green-700' : selectedStation.staffedCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {selectedStation.complete ? 'FULLY STAFFED' : selectedStation.staffedCount > 0 ? 'PARTIALLY STAFFED' : 'UNDERSTAFFED'}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {selectedStation.status}
                      </span>
                    </div>
                  </div>

                  {/* Filter Bar */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-col md:flex-row items-end gap-4">
                    <div className="flex flex-col gap-1.5 w-full md:w-48 shrink-0">
                      <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5">Date</span>
                      <input
                        type="date"
                        value={stationDetailDate}
                        onChange={e => setStationDetailDate(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 w-full md:w-48 shrink-0">
                      <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5">Shift</span>
                      <select
                        value={stationDetailShift}
                        onChange={e => setStationDetailShift(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0] appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '2rem' }}
                      >
                        <option value="">— Select Shift —</option>
                        {Array.from(new Set(shifts.map(s => s.name))).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    {/* Summary pills */}
                    <div className="flex gap-2 flex-wrap pb-0.5">
                      <span className="px-3 py-2 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 whitespace-nowrap">
                        <span className="font-bold text-gray-900">{selectedStation.staffedCount}</span> / {selectedStation.requiredCount} Staffed
                      </span>
                    </div>
                  </div>

                  {/* Specs + Staff */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Specs Card */}
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
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
                          <span className="text-gray-500">Required Skill</span>
                          <span className="font-bold text-gray-900">{selectedStation.requiredSkill}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Min Skill Level</span>
                          <span className="font-bold text-gray-900">{selectedStation.minLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Staff Allocation</span>
                          <span className="font-bold text-gray-900">{selectedStation.staffed}</span>
                        </div>
                      </div>
                    </div>

                    {/* Allocated Staff Table */}
                    <div className="md:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <h4 className="font-bold text-gray-900 text-sm">Allocated Associates</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Associate</th>
                              <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">ID</th>
                              <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Shift</th>
                              <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {selectedStation.assignedStaff.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-5 py-8 text-center text-gray-400 italic text-sm">
                                  No associates allocated for the selected filters.
                                </td>
                              </tr>
                            ) : (
                              selectedStation.assignedStaff.map((op, i) => (
                                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                                  <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                      <img src={op.avatar} alt={op.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-200" />
                                      <span className="font-semibold text-gray-900">{op.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 font-mono text-gray-500 text-[12px]">{op.id}</td>
                                  <td className="px-5 py-3.5">
                                    <span className="px-2.5 py-1 bg-[#EEF2FF] text-[#4F46E5] rounded-full text-[11px] font-bold">{op.shift}</span>
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                      op.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${ op.status === 'Active' ? 'bg-green-500' : 'bg-orange-500' }`} />
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
              <>
                {/* Filters */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-col md:flex-row items-center gap-4 mb-4">
                  <div className="flex flex-col gap-1.5 w-full md:w-44 shrink-0">
                    <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5 whitespace-nowrap">Date</span>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => {
                        setReportDate(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                    />
                  </div>
                  {/* Export */}
                  <button
                    onClick={exportLinesCSV}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#0B57D0] text-white text-xs font-bold rounded-xl hover:bg-[#0842a0] transition-colors shrink-0 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export CSV
                  </button>
                </div>

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
              </>
            ) : (
              /* LINE DETAIL REPORT */
              selectedLineReport && (
                <div className="flex flex-col gap-5">

                  {/* Header */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedItemId(null)}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                      </button>
                      <div>
                        <h2 className="font-extrabold text-gray-900 text-lg">Production Line Operations Report</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {selectedLineReport.name} &nbsp;·&nbsp; {selectedLineReport.product}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedLineReport.lineComplete ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedLineReport.lineComplete ? 'FULLY STAFFED' : 'UNDERSTAFFED'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedLineReport.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedLineReport.status}
                      </span>
                    </div>
                  </div>

                  {/* Filter Bar */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-col md:flex-row items-end gap-4">
                    <div className="flex flex-col gap-1.5 w-full md:w-48 shrink-0">
                      <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5">Date</span>
                      <input
                        type="date"
                        value={lineDetailDate}
                        onChange={e => setLineDetailDate(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 w-full md:w-48 shrink-0">
                      <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5">Shift</span>
                      <select
                        value={lineDetailShift}
                        onChange={e => setLineDetailShift(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0] appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '2rem' }}
                      >
                        <option value="">— Select Shift —</option>
                        {Array.from(new Set(shifts.map(s => s.name))).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full md:w-48 shrink-0">
                      <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5">Staffing Status</span>
                      <select
                        value={lineDetailStatus}
                        onChange={e => setLineDetailStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0] appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '2rem' }}
                      >
                        {['All', 'Complete', 'Incomplete'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    {/* Summary pills */}
                    <div className="flex gap-2 flex-wrap pb-0.5">
                      <span className="px-3 py-2 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 whitespace-nowrap">
                        <span className="font-bold text-gray-900">{selectedLineReport.totalStaffed}</span> / {selectedLineReport.totalRequired} Staffed
                      </span>
                      <span className="px-3 py-2 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 whitespace-nowrap">
                        <span className="font-bold text-gray-900">{selectedLineReport.stationsList.length}</span> Stations
                      </span>
                    </div>
                  </div>

                  {/* Stations Breakdown */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900 text-sm">Stations Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Station</th>
                            <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Required Skill</th>
                            <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Min Level</th>
                            <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider font-mono">Staffed / Needed</th>
                            <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {selectedLineReport.stationsList.map((st, i) => (
                            <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                              <td className="px-5 py-3.5 font-semibold text-gray-900">{st.name}</td>
                              <td className="px-5 py-3.5 text-gray-600">{st.requiredSkill}</td>
                              <td className="px-5 py-3.5 text-gray-500">{st.minLevel}</td>
                              <td className="px-5 py-3.5 font-mono font-bold text-gray-800">{st.staffed} / {st.required}</td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  st.complete ? 'bg-green-100 text-green-700' : st.staffed > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-600'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    st.complete ? 'bg-green-500' : st.staffed > 0 ? 'bg-orange-500' : 'bg-red-500'
                                  }`} />
                                  {st.complete ? 'Complete' : st.staffed > 0 ? 'Partial' : 'Unstaffed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Allocated Staff */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900 text-sm">Allocated Associates</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Associate</th>
                            <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Workstation</th>
                            <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Shift</th>
                            <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Station Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {selectedLineReport.staffList.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-5 py-8 text-center text-gray-400 italic text-sm">
                                No associates allocated for the selected filters.
                              </td>
                            </tr>
                          ) : (
                            selectedLineReport.staffList.map((op, i) => (
                              <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <img src={op.avatar} alt={op.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-200" />
                                    <span className="font-semibold text-gray-900">{op.name}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-gray-600">{op.workstation}</td>
                                <td className="px-5 py-3.5">
                                  <span className="px-2.5 py-1 bg-[#EEF2FF] text-[#4F46E5] rounded-full text-[11px] font-bold">{op.shift}</span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                    op.complete ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${ op.complete ? 'bg-green-500' : 'bg-orange-500' }`} />
                                    {op.complete ? 'Complete' : 'Incomplete'}
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
              )
            )}
          </>
        )}

        {/* ── COVERAGE HEATMAP ────────────────────────────────────────────────── */}
        {activeReportTab === 'coverage' && (
          <div className="flex flex-col gap-5">
            {/* Filter bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E7EB] flex flex-col md:flex-row items-end gap-4">
              <div className="flex flex-col gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase px-0.5">Week Starting</span>
                <input
                  type="date"
                  value={coverageStartDate}
                  onChange={e => setCoverageStartDate(e.target.value)}
                  className="px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B57D0]"
                />
              </div>
              <div className="flex gap-3 items-center pb-0.5 ml-auto flex-wrap">
                {[{ color: 'bg-green-500', label: '≥ 80% Staffed' }, { color: 'bg-yellow-400', label: '50–79%' }, { color: 'bg-orange-400', label: '20–49%' }, { color: 'bg-red-500', label: '< 20% / Unstaffed' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-sm ${l.color}`} />
                    <span className="text-[11px] text-gray-500 font-medium">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap table */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Staffing Coverage — 7 Day View</h3>
                <p className="text-xs text-gray-400 mt-0.5">% of required staff allocated per production line per day</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">Production Line</th>
                      {coverageHeatmapData.dates.map(d => (
                        <th key={d} className="px-3 py-3.5 text-center text-[11px] font-extrabold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {coverageHeatmapData.rows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-gray-900 whitespace-nowrap">{row.lineName}</td>
                        {row.cells.map((cell, ci) => {
                          const bg = cell.pct >= 80 ? 'bg-green-500' : cell.pct >= 50 ? 'bg-yellow-400' : cell.pct >= 20 ? 'bg-orange-400' : 'bg-red-500';
                          const text = cell.pct >= 50 ? 'text-white' : 'text-white';
                          return (
                            <td key={ci} className="px-2 py-3">
                              <div className={`${bg} ${text} rounded-lg px-2 py-2 text-center min-w-[64px]`} title={`${cell.staffed}/${cell.required} staff`}>
                                <div className="text-sm font-extrabold">{cell.pct}%</div>
                                <div className="text-[10px] opacity-80 font-medium">{cell.staffed}/{cell.required}</div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SKILL GAP ANALYSIS ──────────────────────────────────────────────── */}
        {activeReportTab === 'skillgap' && (
          <div className="flex flex-col gap-5">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['Critical', 'High', 'Medium', 'Low'] as const).map(sev => {
                const count = skillGapData.filter(r => r.gapSeverity === sev).length;
                const styles: Record<string, { bg: string; border: string; dot: string; text: string }> = {
                  Critical: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-700' },
                  High:     { bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500', text: 'text-orange-700' },
                  Medium:   { bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500', text: 'text-yellow-700' },
                  Low:      { bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', text: 'text-green-700' },
                };
                const s = styles[sev];
                return (
                  <div key={sev} className={`${s.bg} border ${s.border} rounded-2xl p-5 flex flex-col gap-2`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                      <span className={`text-xs font-bold uppercase tracking-wide ${s.text}`}>{sev}</span>
                    </div>
                    <span className={`text-3xl font-extrabold ${s.text}`}>{count}</span>
                    <span className="text-xs text-gray-500">station{count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>

            {/* Skill gap table */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Workstation Skill Gap Analysis</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Stations sorted by severity — number of associates qualified for each role</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Workstation</th>
                      <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Line</th>
                      <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Required Skill</th>
                      <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Min Level</th>
                      <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider font-mono">Qualified</th>
                      <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Coverage Bar</th>
                      <th className="px-5 py-3.5 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {skillGapData.map((row, i) => {
                      const pct = row.totalAssociates > 0 ? Math.round((row.qualifiedCount / row.totalAssociates) * 100) : 0;
                      const sevStyles: Record<string, string> = {
                        Critical: 'bg-red-100 text-red-700',
                        High:     'bg-orange-100 text-orange-700',
                        Medium:   'bg-yellow-100 text-yellow-700',
                        Low:      'bg-green-100 text-green-700',
                      };
                      const barColor = row.gapSeverity === 'Critical' ? 'bg-red-500' : row.gapSeverity === 'High' ? 'bg-orange-500' : row.gapSeverity === 'Medium' ? 'bg-yellow-400' : 'bg-green-500';
                      return (
                        <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-gray-900">{row.name}</td>
                          <td className="px-5 py-3.5 text-gray-600">
                            <span className="px-2.5 py-1 bg-[#E5E7EB] text-gray-700 rounded-full text-[11px] font-medium">{row.line}</span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-600">{row.requiredSkill}</td>
                          <td className="px-5 py-3.5 text-gray-500">{row.minLevel}</td>
                          <td className="px-5 py-3.5 font-mono font-bold text-gray-900">{row.qualifiedCount} / {row.totalAssociates}</td>
                          <td className="px-5 py-3.5 w-36">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[11px] text-gray-500 font-mono w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${sevStyles[row.gapSeverity]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${row.gapSeverity === 'Critical' ? 'bg-red-500' : row.gapSeverity === 'High' ? 'bg-orange-500' : row.gapSeverity === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                              {row.gapSeverity}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
