import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Workstation } from '../types';

interface LineProcessLoopProps {
  selectedLineId?: string;
  setSelectedLineId?: (id: string) => void;
  setActiveTab?: (tab: string) => void;
}

// Brand metadata for lines
export const LINE_BRAND_CONFIG: Record<
  string,
  {
    brand: string;
    code: string;
    color: string;
    bgHex: string;
    accentHex: string;
    gradient: string;
    productName: string;
    tagline: string;
  }
> = {
  'LINE-01': {
    brand: "Lay's",
    code: 'LAY',
    color: '#EAB308',
    bgHex: '#FEF08A',
    accentHex: '#EAB308',
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
    productName: "Lay's Classic Salted Crisps (52g)",
    tagline: 'Centrifugal Slicing • Flash Hot Fry • Electrostatic Salt Dusting',
  },
  'LINE-02': {
    brand: 'Doritos',
    code: 'DOR',
    color: '#3B82F6',
    bgHex: '#DBEAFE',
    accentHex: '#2563EB',
    gradient: 'from-blue-500 via-indigo-600 to-blue-700',
    productName: 'Doritos Nacho Cheese Tortilla Chips (60g)',
    tagline: 'Corn Masa Triple Sheeter • Gas Toaster • Cheese Slurry Drum',
  },
  'LINE-03': {
    brand: 'Rold Gold',
    code: 'RLD',
    color: '#B45309',
    bgHex: '#FED7AA',
    accentHex: '#B45309',
    gradient: 'from-amber-600 via-orange-700 to-amber-900',
    productName: 'Rold Gold Classic Pretzel Twists (100g)',
    tagline: 'Dough Extrusion Die • Caustic Dip & Coarse Salt • Tunnel Baking',
  },
  'LINE-04': {
    brand: 'Cheetos / Kurkure',
    code: 'CHE',
    color: '#EA580C',
    bgHex: '#FED7AA',
    accentHex: '#EA580C',
    gradient: 'from-orange-500 via-red-600 to-orange-700',
    productName: 'Cheetos Crunchy Flamin Hot Puffs (50g)',
    tagline: 'Rotary Collet Extrusion • Continuous Convection Dryer • Hot Slurry Tumbler',
  },
  'LINE-05': {
    brand: "Lay's Sticks",
    code: 'STK',
    color: '#DC2626',
    bgHex: '#FECACA',
    accentHex: '#DC2626',
    gradient: 'from-red-500 via-rose-600 to-red-700',
    productName: "Lay's Tangy Tomato Potato Sticks (45g)",
    tagline: 'Julienne Matchstick Cut • Blancher Flume • Tomato Seasoning Applicator',
  },
};

// Fallback operational workstations if Station Master has not yet configured a line
const getDefaultWorkstationsForLine = (lineId: string): Workstation[] => {
  if (lineId === 'LINE-01') {
    return [
      { id: 'WS-101', name: 'Slicing & Washing', lineId: 'LINE-01', requiredSkillId: 'BLADE_OPT', minSkillLevel: 'Operator', maxStaffCount: 1 },
      { id: 'WS-102', name: 'High-Temp Frying', lineId: 'LINE-01', requiredSkillId: 'HEAT_SAFETY', minSkillLevel: 'Certified', maxStaffCount: 1 },
      { id: 'WS-103', name: 'Flavor Application', lineId: 'LINE-01', requiredSkillId: 'SPICE_MIX', minSkillLevel: 'Operator', maxStaffCount: 1 },
      { id: 'WS-104', name: 'Auto-Bagging', lineId: 'LINE-01', requiredSkillId: 'MECH_OP', minSkillLevel: 'Operator', maxStaffCount: 1 },
      { id: 'WS-105', name: 'Quality Lab Check', lineId: 'LINE-01', requiredSkillId: 'CHEM_CERT', minSkillLevel: 'Certified', maxStaffCount: 1 },
    ];
  }
  if (lineId === 'LINE-02') {
    return [
      { id: 'WS-201', name: 'Milling & Shearing', lineId: 'LINE-02', requiredSkillId: 'MECH_OP', minSkillLevel: 'Operator', maxStaffCount: 1 },
      { id: 'WS-202', name: 'Baking Oven Operator', lineId: 'LINE-02', requiredSkillId: 'HEAT_SAFETY', minSkillLevel: 'Operator', maxStaffCount: 1 },
      { id: 'WS-203', name: 'Seasoning Tumbler', lineId: 'LINE-02', requiredSkillId: 'SPICE_MIX', minSkillLevel: 'Trainee', maxStaffCount: 1 },
      { id: 'WS-204', name: 'Multi-Packer Unit', lineId: 'LINE-02', requiredSkillId: 'QA_L1', minSkillLevel: 'Operator', maxStaffCount: 1 },
    ];
  }
  if (lineId === 'LINE-03') {
    return [
      { id: 'WS-301', name: 'Dough Extrusion', lineId: 'LINE-03', requiredSkillId: 'MECH_OP', minSkillLevel: 'Operator', maxStaffCount: 1 },
      { id: 'WS-302', name: 'Caustic Dip & Salt', lineId: 'LINE-03', requiredSkillId: 'CHEM_CERT', minSkillLevel: 'Operator', maxStaffCount: 1 },
      { id: 'WS-303', name: 'Tunnel Oven Baking', lineId: 'LINE-03', requiredSkillId: 'HEAT_SAFETY', minSkillLevel: 'Certified', maxStaffCount: 1 },
      { id: 'WS-304', name: 'Pouch Bagging Unit', lineId: 'LINE-03', requiredSkillId: 'MECH_OP', minSkillLevel: 'Operator', maxStaffCount: 1 },
      { id: 'WS-305', name: 'Case QC & Palletizer', lineId: 'LINE-03', requiredSkillId: 'QA_L1', minSkillLevel: 'Operator', maxStaffCount: 1 },
    ];
  }
  if (lineId === 'LINE-04') {
    return [
      { id: 'WS-401', name: 'Corn Meal Hydration', lineId: 'LINE-04', requiredSkillId: 'HYGIENE_L2', minSkillLevel: 'Operator', maxStaffCount: 1 },
      { id: 'WS-402', name: 'Rotary Extrusion', lineId: 'LINE-04', requiredSkillId: 'MECH_OP', minSkillLevel: 'Certified', maxStaffCount: 1 },
      { id: 'WS-403', name: 'Continuous Oven Dryer', lineId: 'LINE-04', requiredSkillId: 'HEAT_SAFETY', minSkillLevel: 'Operator', maxStaffCount: 1 },
      { id: 'WS-404', name: 'Flavor Tumbler Drum', lineId: 'LINE-04', requiredSkillId: 'SPICE_MIX', minSkillLevel: 'Operator', maxStaffCount: 1 },
      { id: 'WS-405', name: 'Atlas VFFS Bagging', lineId: 'LINE-04', requiredSkillId: 'QA_L1', minSkillLevel: 'Operator', maxStaffCount: 1 },
    ];
  }
  return [
    { id: 'WS-501', name: 'High-Speed Potato Slicer', lineId: 'LINE-05', requiredSkillId: 'BLADE_OPT', minSkillLevel: 'Operator', maxStaffCount: 1 },
    { id: 'WS-502', name: 'Continuous Blancher & Dryer', lineId: 'LINE-05', requiredSkillId: 'HEAT_SAFETY', minSkillLevel: 'Operator', maxStaffCount: 1 },
    { id: 'WS-503', name: 'Deep Frying Bath', lineId: 'LINE-05', requiredSkillId: 'OIL_MGMT', minSkillLevel: 'Certified', maxStaffCount: 1 },
    { id: 'WS-504', name: 'Tomato Seasoning Applicator', lineId: 'LINE-05', requiredSkillId: 'SPICE_MIX', minSkillLevel: 'Operator', maxStaffCount: 1 },
    { id: 'WS-505', name: 'Pillow Pack Seal Unit', lineId: 'LINE-05', requiredSkillId: 'QA_L1', minSkillLevel: 'Operator', maxStaffCount: 1 },
  ];
};

// Rich Station Theming based on functional stage
interface StationTheme {
  primary: string;
  gradient: string;
  lightBg: string;
  borderAccent: string;
  iconBg: string;
  iconColor: string;
  textAccent: string;
  badgeBg: string;
}

const getStationTheme = (wsName: string): StationTheme => {
  const name = wsName.toLowerCase();
  if (name.includes('slic') || name.includes('cut') || name.includes('mill') || name.includes('blade') || name.includes('extru') || name.includes('hydrat')) {
    return {
      primary: '#0284C7',
      gradient: 'from-cyan-500 to-blue-600',
      lightBg: 'bg-cyan-50/60',
      borderAccent: 'border-t-cyan-500',
      iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-500/25',
      iconColor: 'text-cyan-600',
      textAccent: 'text-cyan-700',
      badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };
  }
  if (name.includes('fry') || name.includes('oven') || name.includes('bake') || name.includes('heat') || name.includes('dry') || name.includes('toast')) {
    return {
      primary: '#EA580C',
      gradient: 'from-amber-500 to-orange-600',
      lightBg: 'bg-amber-50/60',
      borderAccent: 'border-t-orange-500',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/25',
      iconColor: 'text-orange-600',
      textAccent: 'text-orange-700',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    };
  }
  if (name.includes('season') || name.includes('flavor') || name.includes('salt') || name.includes('dip') || name.includes('tumbl') || name.includes('spice')) {
    return {
      primary: '#9333EA',
      gradient: 'from-purple-500 to-pink-600',
      lightBg: 'bg-purple-50/60',
      borderAccent: 'border-t-purple-500',
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-purple-500/25',
      iconColor: 'text-purple-600',
      textAccent: 'text-purple-700',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    };
  }
  if (name.includes('bag') || name.includes('pack') || name.includes('weigh') || name.includes('vffs') || name.includes('seal')) {
    return {
      primary: '#059669',
      gradient: 'from-emerald-500 to-teal-600',
      lightBg: 'bg-emerald-50/60',
      borderAccent: 'border-t-emerald-500',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25',
      iconColor: 'text-emerald-600',
      textAccent: 'text-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }
  if (name.includes('lab') || name.includes('qc') || name.includes('check') || name.includes('scan') || name.includes('camera') || name.includes('vision')) {
    return {
      primary: '#4F46E5',
      gradient: 'from-indigo-600 to-blue-500',
      lightBg: 'bg-indigo-50/60',
      borderAccent: 'border-t-indigo-500',
      iconBg: 'bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-indigo-500/25',
      iconColor: 'text-indigo-600',
      textAccent: 'text-indigo-700',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
  }
  // Palletizer / Warehousing / Default
  return {
    primary: '#B45309',
    gradient: 'from-amber-600 to-yellow-600',
    lightBg: 'bg-amber-50/60',
    borderAccent: 'border-t-amber-600',
    iconBg: 'bg-gradient-to-br from-amber-600 to-yellow-600 text-white shadow-amber-600/25',
    iconColor: 'text-amber-700',
    textAccent: 'text-amber-800',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
  };
};

// Machine Condition & Detailed Telemetry Provider
interface MachineConditionInfo {
  icon: string;
  metric: string;
  label: string;
  speed: string;
  oem: string;
  healthPct: number;
  healthStatus: 'OPTIMAL' | 'RUNNING' | 'ATTENTION';
  oee: string;
  vibration: string;
  temperature: string;
  lubeStatus: string;
  nextPMDays: number;
}

const getMachineConditionInfo = (wsName: string, idx: number): MachineConditionInfo => {
  const name = wsName.toLowerCase();
  if (name.includes('slic') || name.includes('cut') || name.includes('mill') || name.includes('blade')) {
    return {
      icon: 'content_cut',
      metric: '1.15 mm',
      label: 'Caliper Cut',
      speed: '420 RPM',
      oem: 'Urschel Precision Cutter CC',
      healthPct: 99.4,
      healthStatus: 'OPTIMAL',
      oee: '98.2%',
      vibration: '0.6 mm/s',
      temperature: '38°C (Normal)',
      lubeStatus: 'Pressure 4.2 bar',
      nextPMDays: 14,
    };
  }
  if (name.includes('fry') || name.includes('oven') || name.includes('bake') || name.includes('heat') || name.includes('dry')) {
    return {
      icon: 'local_fire_department',
      metric: '182°C',
      label: 'Thermal Zone',
      speed: '1.4% moist',
      oem: 'Heat and Control MasterTherm',
      healthPct: 98.8,
      healthStatus: 'OPTIMAL',
      oee: '97.5%',
      vibration: '0.8 mm/s',
      temperature: '182°C (Set: 180°C)',
      lubeStatus: 'High-Temp Synthetic OK',
      nextPMDays: 8,
    };
  }
  if (name.includes('season') || name.includes('flavor') || name.includes('salt') || name.includes('dip') || name.includes('tumbl')) {
    return {
      icon: 'cyclone',
      metric: '2.8% salt',
      label: 'Dusting Rate',
      speed: '32 RPM',
      oem: 'TNA Intact Flavour Drum 300',
      healthPct: 99.2,
      healthStatus: 'OPTIMAL',
      oee: '98.7%',
      vibration: '0.5 mm/s',
      temperature: '24°C Ambient',
      lubeStatus: 'Dry-Lube Powder Free',
      nextPMDays: 22,
    };
  }
  if (name.includes('bag') || name.includes('pack') || name.includes('weigh') || name.includes('vffs') || name.includes('seal')) {
    return {
      icon: 'inventory_2',
      metric: '52g ± 1g',
      label: 'Target Fill',
      speed: '110 BPM',
      oem: 'Ishida Inspira Multi-Head Bagger',
      healthPct: 98.6,
      healthStatus: 'OPTIMAL',
      oee: '96.8%',
      vibration: '1.1 mm/s',
      temperature: '65°C Heat-Jaw',
      lubeStatus: 'Pneumatic 6.1 bar',
      nextPMDays: 11,
    };
  }
  if (name.includes('lab') || name.includes('qc') || name.includes('check') || name.includes('scan') || name.includes('camera')) {
    return {
      icon: 'qr_code_scanner',
      metric: '99.8%',
      label: 'Optical Read',
      speed: '42 CPM',
      oem: 'Cognex In-Sight 3800 Dual Vision',
      healthPct: 99.9,
      healthStatus: 'OPTIMAL',
      oee: '99.6%',
      vibration: '0.2 mm/s',
      temperature: '21°C Enclosure',
      lubeStatus: 'Clean-Room Sealed',
      nextPMDays: 45,
    };
  }
  if (name.includes('pallet') || name.includes('stack')) {
    return {
      icon: 'pallet',
      metric: '42 CPM',
      label: 'Cell Velocity',
      speed: 'Tier 5 Nominal',
      oem: 'Fanuc M-410iB Robotic Palletizer',
      healthPct: 98.9,
      healthStatus: 'OPTIMAL',
      oee: '98.1%',
      vibration: '0.9 mm/s',
      temperature: '48°C Servos',
      lubeStatus: 'Robotic Grease OK',
      nextPMDays: 19,
    };
  }
  return {
    icon: 'precision_manufacturing',
    metric: `Stage 0${idx + 1}`,
    label: 'Cadence Rate',
    speed: 'Synchronized',
    oem: 'PepsiCo Standard Processing Unit',
    healthPct: 98.5,
    healthStatus: 'OPTIMAL',
    oee: '97.0%',
    vibration: '0.7 mm/s',
    temperature: '35°C',
    lubeStatus: 'Normal',
    nextPMDays: 15,
  };
};

// Conveyor VFD Speed Modes
export type ConveyorSpeedMode = 'eco' | 'nominal' | 'turbo';

// Conveyor Belt Segment Diagnostic Structure
export interface ConveyorBeltSegment {
  id: string;
  name: string;
  code: string;
  driveMotor: string;
  nominalVfdHz: number;
  currentVfdHz: number;
  speedMps: number;
  cpm: number;
  tensionN: number;
  tensionOptimal: string;
  surfaceWearPct: number;
  bearingTempC: number;
  vibrationRms: number;
  alignmentMm: number;
  lubeStatus: string;
  nextPmDays: number;
  sensorHealth: string;
  zoneDescription: string;
}

// In-Transit Product Telemetry
export interface InTransitProduct {
  sku: string;
  brand: string;
  batchId: string;
  stageName: string;
  targetWeight: string;
  actualWeight: string;
  moisturePct: string;
  oilPct: string;
  sealScore: string;
  visionVerdict: 'PASS' | 'REJECT';
  opticalTimestamp: string;
  isDefective?: boolean;
}

// Web Audio synthesizer for tactile conveyor sound effects
const playConveyorAudio = (type: 'beep' | 'reject' | 'estop' | 'jog' | 'click') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'reject') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'estop') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'jog') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch {
    // Ignore audio failures if browser blocks autoplay
  }
};

const getBeltSegmentTelemetry = (segmentId: string, speedMode: ConveyorSpeedMode, lineId: string): ConveyorBeltSegment => {
  const vfdMultiplier = speedMode === 'turbo' ? 1.35 : speedMode === 'eco' ? 0.65 : 1.0;
  const baseCpm = speedMode === 'turbo' ? 54 : speedMode === 'eco' ? 22 : 38;
  const baseSpeed = speedMode === 'turbo' ? 1.25 : speedMode === 'eco' ? 0.52 : 0.85;
  const currentHz = +(50.0 * vfdMultiplier).toFixed(1);

  switch (segmentId) {
    case 'BELT-NORTH':
      return {
        id: 'BELT-NORTH',
        name: 'North Infeed Translation Runway',
        code: `CV-${lineId.replace('LINE-', '')}01-N`,
        driveMotor: 'SEW-Eurodrive MoviDrive 2.2 kW Helical-Bevel',
        nominalVfdHz: 50.0,
        currentVfdHz: currentHz,
        speedMps: baseSpeed,
        cpm: baseCpm,
        tensionN: 445,
        tensionOptimal: '420 - 480 N',
        surfaceWearPct: 8.4,
        bearingTempC: 38.2,
        vibrationRms: 0.72,
        alignmentMm: 0.35,
        lubeStatus: 'Automated Micro-Lube Pressure OK (4.2 Bar)',
        nextPmDays: 22,
        sensorHealth: 'Omron Laser Array: 99.9% Optical Beam Alignment',
        zoneDescription: 'High-speed intermediate product translation from slicing/extrusion to thermal preparation zone.',
      };
    case 'BELT-EAST':
      return {
        id: 'BELT-EAST',
        name: 'East Thermal Processing & Elevation Runway',
        code: `CV-${lineId.replace('LINE-', '')}02-E`,
        driveMotor: 'Nord Drivesystems 3.0 kW Severe-Duty Helical',
        nominalVfdHz: 50.0,
        currentVfdHz: currentHz,
        speedMps: baseSpeed,
        cpm: baseCpm,
        tensionN: 462,
        tensionOptimal: '430 - 490 N',
        surfaceWearPct: 11.2,
        bearingTempC: 46.5,
        vibrationRms: 0.88,
        alignmentMm: -0.42,
        lubeStatus: 'High-Temperature Food-Grade Synthetic Grease',
        nextPmDays: 14,
        sensorHealth: 'Infrared Temperature Pyrometer: Calibrated (±0.2°C)',
        zoneDescription: 'Elevated stainless-steel thermal transition deck feeding seasoned crisps into cooling conveyors.',
      };
    case 'BELT-SOUTH':
      return {
        id: 'BELT-SOUTH',
        name: 'South Packaging & Reject Diverter Runway',
        code: `CV-${lineId.replace('LINE-', '')}03-S`,
        driveMotor: 'Siemens Simogear 1.5 kW Compact Servo VFD',
        nominalVfdHz: 50.0,
        currentVfdHz: currentHz,
        speedMps: baseSpeed,
        cpm: baseCpm,
        tensionN: 430,
        tensionOptimal: '410 - 460 N',
        surfaceWearPct: 6.1,
        bearingTempC: 34.1,
        vibrationRms: 0.54,
        alignmentMm: 0.18,
        lubeStatus: 'Sealed-for-Life Cleanroom Bearings',
        nextPmDays: 48,
        sensorHealth: 'Cognex High-Speed Vision & Dual Pneumatic Diverters Active',
        zoneDescription: 'Precision pacing runway equipped with pneumatic high-speed reject gate and seal integrity vision verification.',
      };
    case 'BELT-WEST':
      return {
        id: 'BELT-WEST',
        name: 'West Continuous Closed-Loop Return Runway',
        code: `CV-${lineId.replace('LINE-', '')}04-W`,
        driveMotor: 'SEW-Eurodrive 1.5 kW Inline Helical Geared Motor',
        nominalVfdHz: 50.0,
        currentVfdHz: currentHz,
        speedMps: baseSpeed,
        cpm: baseCpm,
        tensionN: 438,
        tensionOptimal: '410 - 470 N',
        surfaceWearPct: 7.9,
        bearingTempC: 36.8,
        vibrationRms: 0.65,
        alignmentMm: 0.22,
        lubeStatus: 'Standard Central Lubrication Loop (3.8 Bar)',
        nextPmDays: 31,
        sensorHealth: 'Sick Optical Photoelectric Interlock: Active',
        zoneDescription: 'Closed-loop recirculation belt returning empty transport pucks and synchronizing infeed gantry flow.',
      };
    case 'HUB-1':
      return {
        id: 'HUB-1',
        name: 'Corner Transition Hub 1 (North to East Turn)',
        code: `HUB-${lineId.replace('LINE-', '')}01`,
        driveMotor: 'Direct Servo Turntable Hub 0.75 kW',
        nominalVfdHz: 50.0,
        currentVfdHz: currentHz,
        speedMps: baseSpeed,
        cpm: baseCpm,
        tensionN: 450,
        tensionOptimal: '440 - 470 N',
        surfaceWearPct: 5.8,
        bearingTempC: 39.0,
        vibrationRms: 0.61,
        alignmentMm: 0.1,
        lubeStatus: 'Precision Hub Bearing Oil Bath OK',
        nextPmDays: 60,
        sensorHealth: 'Encoder Resolution: 4096 pulses/rev (Zero Backlash)',
        zoneDescription: '90° radius continuous curve transition guide preventing product tipping or friction accumulation.',
      };
    case 'HUB-2':
      return {
        id: 'HUB-2',
        name: 'Corner Transition Hub 2 (East to South Turn)',
        code: `HUB-${lineId.replace('LINE-', '')}02`,
        driveMotor: 'Direct Servo Turntable Hub 0.75 kW',
        nominalVfdHz: 50.0,
        currentVfdHz: currentHz,
        speedMps: baseSpeed,
        cpm: baseCpm,
        tensionN: 452,
        tensionOptimal: '440 - 470 N',
        surfaceWearPct: 6.3,
        bearingTempC: 40.4,
        vibrationRms: 0.66,
        alignmentMm: 0.15,
        lubeStatus: 'Precision Hub Bearing Oil Bath OK',
        nextPmDays: 52,
        sensorHealth: 'Proximity Sensor: Verified',
        zoneDescription: 'Gravity-assisted radius transition hub orienting packaging in-line with multi-head bagging feeders.',
      };
    case 'HUB-3':
      return {
        id: 'HUB-3',
        name: 'Corner Transition Hub 3 (South to West Turn)',
        code: `HUB-${lineId.replace('LINE-', '')}03`,
        driveMotor: 'Direct Servo Turntable Hub 0.75 kW',
        nominalVfdHz: 50.0,
        currentVfdHz: currentHz,
        speedMps: baseSpeed,
        cpm: baseCpm,
        tensionN: 440,
        tensionOptimal: '430 - 460 N',
        surfaceWearPct: 4.9,
        bearingTempC: 35.8,
        vibrationRms: 0.58,
        alignmentMm: 0.08,
        lubeStatus: 'Precision Hub Bearing Oil Bath OK',
        nextPmDays: 75,
        sensorHealth: 'Pneumatic Buffer Pressure: 6.0 Bar',
        zoneDescription: 'Outfeed diverter corner junction directing sealed cartons toward automatic palletizer cell.',
      };
    default:
      return {
        id: 'HUB-4',
        name: 'Corner Transition Hub 4 (West to North Infeed Turn)',
        code: `HUB-${lineId.replace('LINE-', '')}04`,
        driveMotor: 'Direct Servo Turntable Hub 0.75 kW',
        nominalVfdHz: 50.0,
        currentVfdHz: currentHz,
        speedMps: baseSpeed,
        cpm: baseCpm,
        tensionN: 448,
        tensionOptimal: '430 - 470 N',
        surfaceWearPct: 5.2,
        bearingTempC: 37.2,
        vibrationRms: 0.62,
        alignmentMm: 0.12,
        lubeStatus: 'Precision Hub Bearing Oil Bath OK',
        nextPmDays: 68,
        sensorHealth: 'Infeed Gantry Gate Sync: 100%',
        zoneDescription: 'Pacing infeed transition hub regulating raw ingredient introduction into the processing line loop.',
      };
  }
};

const getInTransitProduct = (stageIdx: number, lineId: string, isDefective = false): InTransitProduct => {
  const brand = LINE_BRAND_CONFIG[lineId] || LINE_BRAND_CONFIG['LINE-01'];
  const stageNames = [
    'Raw Ingredient Infeed & Centrifugal Cut',
    'Flash Thermal Zone (Continuous Cooker)',
    'Electrostatic Flavour Drum & Seasoning',
    'High-Speed Multi-Head Bagging & Pouch Seal',
    'Case Packing & Optical Vision Validation',
  ];
  const stageName = stageNames[stageIdx] || 'Intermediate Transit';

  return {
    sku: brand.productName,
    brand: brand.brand,
    batchId: `#LOT-${lineId.replace('LINE-', 'L')}-20261029-${(100 + stageIdx * 15).toString()}`,
    stageName,
    targetWeight: lineId === 'LINE-01' ? '52.0 g' : lineId === 'LINE-03' ? '100.0 g' : '75.0 g',
    actualWeight: isDefective ? '46.1 g (Underfill Fault)' : lineId === 'LINE-01' ? '52.3 g (Pass)' : '100.4 g (Pass)',
    moisturePct: isDefective ? '2.8% (Out of Spec)' : '1.38% (Nominal <2.0%)',
    oilPct: '33.2% (Pass)',
    sealScore: isDefective ? '81.4% (Leak Detected)' : '99.8% (Hermetic Seal)',
    visionVerdict: isDefective ? 'REJECT' : 'PASS',
    opticalTimestamp: new Date().toLocaleTimeString(),
    isDefective,
  };
};

export const LineProcessLoop: React.FC<LineProcessLoopProps> = ({
  selectedLineId = 'LINE-01',
  setSelectedLineId,
  setActiveTab,
}) => {
  const { workstations, skills, associates, allocations, productionLines, shifts } = useApp();

  const [activeLine, setActiveLine] = useState<string>(selectedLineId);
  const [selectedShift, setSelectedShift] = useState<string>('SHIFT-A');
  const [selectedWs, setSelectedWs] = useState<Workstation | null>(null);
  const [isLoopPaused, setIsLoopPaused] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Advanced Conveyor Controls State
  const [speedMode, setSpeedMode] = useState<ConveyorSpeedMode>('nominal');
  const [isEstopActive, setIsEstopActive] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(false);
  const [isDiverterActuating, setIsDiverterActuating] = useState<boolean>(false);
  const [hasDefectInjected, setHasDefectInjected] = useState<boolean>(false);
  const [processedUnits, setProcessedUnits] = useState<number>(14892);
  const [rejectCount, setRejectCount] = useState<number>(18);
  const [jogCountdown, setJogCountdown] = useState<number>(0);
  const [selectedBeltSegment, setSelectedBeltSegment] = useState<ConveyorBeltSegment | null>(null);
  const [inspectedProduct, setInspectedProduct] = useState<InTransitProduct | null>(null);

  // Sync with prop changes
  useEffect(() => {
    if (selectedLineId && selectedLineId !== activeLine) {
      setActiveLine(selectedLineId);
    }
  }, [selectedLineId]);

  // Unit increment simulation
  useEffect(() => {
    if (isEstopActive || (isLoopPaused && jogCountdown === 0)) return;
    const intervalMs = speedMode === 'turbo' ? 700 : speedMode === 'eco' ? 2200 : 1300;
    const timer = setInterval(() => {
      setProcessedUnits((prev) => prev + 1);
      if (isSoundEnabled) {
        playConveyorAudio('beep');
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isEstopActive, isLoopPaused, speedMode, isSoundEnabled, jogCountdown]);

  // Jog countdown timer
  useEffect(() => {
    if (jogCountdown <= 0) return;
    const timer = setTimeout(() => {
      setJogCountdown((prev) => prev - 1);
      if (jogCountdown === 1) {
        setToastMessage('Manual jog completed. Conveyor returning to previous state.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [jogCountdown]);

  // Conveyor Action Handlers
  const handleTriggerRejectDiverter = () => {
    if (isEstopActive) {
      setToastMessage('Cannot actuate diverter while Emergency Stop is active.');
      return;
    }
    setHasDefectInjected(true);
    setIsDiverterActuating(true);
    setRejectCount((prev) => prev + 1);
    if (isSoundEnabled) {
      playConveyorAudio('reject');
    }
    setToastMessage('⚠️ [QC VISION REJECT] Seal fault detected on package! Pneumatic diverter arm actuated into reject chute.');
    setTimeout(() => {
      setIsDiverterActuating(false);
      setHasDefectInjected(false);
    }, 3200);
  };

  const handleEstopToggle = () => {
    if (!isEstopActive) {
      setIsEstopActive(true);
      if (isSoundEnabled) {
        playConveyorAudio('estop');
      }
      setToastMessage('🚨 EMERGENCY STOP ENGAGED! Conveyor interlocks tripped. All belt drive motors de-energized.');
    } else {
      setIsEstopActive(false);
      if (isSoundEnabled) {
        playConveyorAudio('click');
      }
      setToastMessage('Safety interlock circuit re-armed. Conveyor drive motors energized.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleStartJog = () => {
    if (isEstopActive) {
      setToastMessage('Clear Emergency Stop before jogging conveyor.');
      return;
    }
    setJogCountdown(5);
    if (isSoundEnabled) {
      playConveyorAudio('jog');
    }
    setToastMessage('⚡ Manual JOG active: Running conveyor drives at maintenance speed for 5 seconds.');
  };

  const handleSpeedChange = (mode: ConveyorSpeedMode) => {
    setSpeedMode(mode);
    if (isSoundEnabled) {
      playConveyorAudio('click');
    }
    const cpm = mode === 'turbo' ? 54 : mode === 'eco' ? 22 : 38;
    const hz = mode === 'turbo' ? '68.0 Hz' : mode === 'eco' ? '32.0 Hz' : '50.0 Hz';
    setToastMessage(`Conveyor VFD set to ${mode.toUpperCase()} mode: ${cpm} CPM (${hz}).`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLineSelect = (lineId: string) => {
    setActiveLine(lineId);
    if (setSelectedLineId) {
      setSelectedLineId(lineId);
    }
    setToastMessage(`Switched to ${lineId}. Loaded stations directly from Station Master.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. DYNAMICALLY LOAD STATIONS FROM STATION MASTER
  const lineWorkstations: Workstation[] = useMemo(() => {
    const fromMaster = workstations.filter((ws) => ws.lineId === activeLine);
    if (fromMaster.length > 0) {
      return fromMaster;
    }
    return getDefaultWorkstationsForLine(activeLine);
  }, [workstations, activeLine]);

  // Brand config
  const brandMeta = LINE_BRAND_CONFIG[activeLine] || LINE_BRAND_CONFIG['LINE-01'];
  const activeLineObj = productionLines.find((l) => l.id === activeLine);

  // 2. DYNAMICALLY DISTRIBUTE STATIONS AROUND BOX DONUT PERIMETER
  const perimeterDistribution = useMemo(() => {
    const count = lineWorkstations.length;
    if (count <= 4) {
      return {
        top: lineWorkstations.slice(0, 1),
        right: lineWorkstations.slice(1, 2),
        bottom: lineWorkstations.slice(2, 3),
        left: lineWorkstations.slice(3, 4),
      };
    }
    if (count === 5) {
      return {
        top: lineWorkstations.slice(0, 2),
        right: lineWorkstations.slice(2, 3),
        bottom: lineWorkstations.slice(3, 4),
        left: lineWorkstations.slice(4, 5),
      };
    }
    if (count === 6) {
      return {
        top: lineWorkstations.slice(0, 2),
        right: lineWorkstations.slice(2, 3),
        bottom: lineWorkstations.slice(3, 5),
        left: lineWorkstations.slice(5, 6),
      };
    }
    if (count === 7) {
      return {
        top: lineWorkstations.slice(0, 3),
        right: lineWorkstations.slice(3, 4),
        bottom: lineWorkstations.slice(4, 6),
        left: lineWorkstations.slice(6, 7),
      };
    }
    if (count === 8) {
      return {
        top: lineWorkstations.slice(0, 3),
        right: lineWorkstations.slice(3, 4),
        bottom: lineWorkstations.slice(4, 7),
        left: lineWorkstations.slice(7, 8),
      };
    }
    // Generic auto-distribution for 9+ stations
    const topCount = Math.ceil(count * 0.35);
    const rightCount = Math.max(1, Math.floor(count * 0.15));
    const bottomCount = Math.ceil(count * 0.35);

    return {
      top: lineWorkstations.slice(0, topCount),
      right: lineWorkstations.slice(topCount, topCount + rightCount),
      bottom: lineWorkstations.slice(topCount + rightCount, topCount + rightCount + bottomCount),
      left: lineWorkstations.slice(topCount + rightCount + bottomCount),
    };
  }, [lineWorkstations]);

  // Operator resolver for each workstation: resolves workers assigned to this station on selected shift
  interface StationWorker {
    id: string;
    name: string;
    category: 'Company' | 'Contract' | 'NTCI';
    badgeColor: string;
    isAllocated: boolean;
  }

  const getStationWorkers = (ws: Workstation): { workers: StationWorker[]; count: number; max: number; isCovered: boolean } => {
    const max = ws.maxStaffCount || 1;
    // Find all allocations for this workstation and shift
    const matchingAllocs = allocations.filter(
      (a) => a.workstationId === ws.id && (a.shiftId === selectedShift || !a.shiftId)
    );

    const resolved: StationWorker[] = [];

    matchingAllocs.forEach((al) => {
      const assoc = associates.find((ast) => ast.id === al.associateId);
      if (assoc) {
        resolved.push({
          id: assoc.id,
          name: assoc.name,
          category: assoc.category as any,
          badgeColor: assoc.category === 'Company' ? 'bg-emerald-500' : assoc.category === 'Contract' ? 'bg-amber-500' : 'bg-indigo-500',
          isAllocated: true,
        });
      }
    });

    // If none found in live allocations, provide plant default assigned specialists
    if (resolved.length === 0) {
      const defaults: Record<string, StationWorker[]> = {
        'WS-101': [{ id: 'EMP101', name: 'A. Chen', category: 'Contract', badgeColor: 'bg-amber-500', isAllocated: true }],
        'WS-102': [{ id: 'EMP102', name: 'S. Miller', category: 'Company', badgeColor: 'bg-emerald-500', isAllocated: true }],
        'WS-103': [{ id: 'EMP103', name: 'D. Petrova', category: 'NTCI', badgeColor: 'bg-indigo-500', isAllocated: true }],
        'WS-104': [{ id: 'EMP104', name: 'J. Doe', category: 'Contract', badgeColor: 'bg-amber-500', isAllocated: true }],
        'WS-105': [{ id: 'EMP105', name: 'M. Kumar', category: 'Contract', badgeColor: 'bg-amber-500', isAllocated: true }],
        'WS-201': [{ id: 'EMP106', name: 'R. Patel', category: 'Company', badgeColor: 'bg-emerald-500', isAllocated: true }],
        'WS-202': [{ id: 'EMP107', name: 'L. Wong', category: 'Contract', badgeColor: 'bg-amber-500', isAllocated: true }],
        'WS-203': [{ id: 'EMP109', name: 'B. Jackson', category: 'Contract', badgeColor: 'bg-amber-500', isAllocated: true }],
        'WS-204': [{ id: 'EMP110', name: 'N. Diaz', category: 'Company', badgeColor: 'bg-emerald-500', isAllocated: true }],
        'WS-301': [{ id: 'EMP111', name: 'T. Al-Farsi', category: 'NTCI', badgeColor: 'bg-indigo-500', isAllocated: true }],
        'WS-302': [{ id: 'EMP112', name: "S. O'Connor", category: 'Contract', badgeColor: 'bg-amber-500', isAllocated: true }],
        'WS-303': [{ id: 'EMP113', name: 'H. Tanaka', category: 'Company', badgeColor: 'bg-emerald-500', isAllocated: true }],
        'WS-304': [{ id: 'EMP114', name: 'A. Mbaye', category: 'Contract', badgeColor: 'bg-amber-500', isAllocated: true }],
        'WS-305': [{ id: 'EMP115', name: 'Rajesh Sen', category: 'Contract', badgeColor: 'bg-amber-500', isAllocated: true }],
        'WS-401': [{ id: 'EMP116', name: 'Priya Das', category: 'Company', badgeColor: 'bg-emerald-500', isAllocated: true }],
        'WS-402': [{ id: 'EMP117', name: 'S. Roy', category: 'Contract', badgeColor: 'bg-amber-500', isAllocated: true }],
        'WS-403': [{ id: 'EMP118', name: 'R. Chatterjee', category: 'Company', badgeColor: 'bg-emerald-500', isAllocated: true }],
        'WS-404': [{ id: 'EMP119', name: 'M. Das', category: 'Contract', badgeColor: 'bg-amber-500', isAllocated: true }],
        'WS-405': [{ id: 'EMP120', name: 'N. Paul', category: 'NTCI', badgeColor: 'bg-indigo-500', isAllocated: true }],
      };
      const def = defaults[ws.id] || [{ id: 'PENDING', name: 'Unassigned', category: 'Company', badgeColor: 'bg-slate-400', isAllocated: false }];
      resolved.push(...def);
    }

    const isCovered = resolved.filter((w) => w.isAllocated).length >= max;
    return { workers: resolved, count: resolved.filter((w) => w.isAllocated).length, max, isCovered };
  };

  // Overall staffing coverage
  const totalCovered = lineWorkstations.filter((ws) => getStationWorkers(ws).isCovered).length;
  const coveragePercent = lineWorkstations.length > 0 ? Math.round((totalCovered / lineWorkstations.length) * 100) : 100;

  // Render product item moving along the belt (Interactive & Clickable)
  const renderConveyorItem = (stageIdx: number) => {
    const isDefective = hasDefectInjected && stageIdx >= 3;
    const defectClasses = isDefective ? 'item-defective ring-2 ring-red-500' : '';

    const getItemElement = () => {
      if (activeLine === 'LINE-01') {
        if (stageIdx === 0) return <div className={`item-raw-slice shadow-xs ${defectClasses}`} title="Raw potato slices (Click to inspect)" />;
        if (stageIdx === 1) return <div className={`item-cooked-chip shadow-xs ${defectClasses}`} title="Golden fried chips (Click to inspect)" />;
        if (stageIdx === 2) return <div className={`item-seasoned-chip shadow-xs ${defectClasses}`} title="Seasoned crisps (Click to inspect)" />;
        if (stageIdx === 3) return <div className={`item-snack-pouch bg-amber-500 text-amber-950 shadow-xs font-black ${defectClasses}`}>LAY</div>;
        return (
          <div className={`w-[32px] h-[26px] carton-box bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 font-black text-[7px] flex items-center justify-center shadow-md border border-amber-300 ${defectClasses}`}>
            LAY
          </div>
        );
      }
      if (activeLine === 'LINE-02') {
        if (stageIdx === 0) return <div className={`item-raw-slice shadow-xs ${defectClasses}`} title="Masa dough cut (Click to inspect)" />;
        if (stageIdx === 1) return <div className={`item-tortilla-chip ${defectClasses}`} title="Tortilla triangular cut (Click to inspect)" />;
        if (stageIdx === 2) return <div className={`item-seasoned-chip shadow-xs ${defectClasses}`} title="Nacho seasoned (Click to inspect)" />;
        return <div className={`item-snack-pouch bg-blue-600 text-white shadow-xs font-black ${defectClasses}`}>DOR</div>;
      }
      if (activeLine === 'LINE-03') {
        if (stageIdx <= 1) return <div className={`item-pretzel-knot ${defectClasses}`} title="Pretzel twist knot (Click to inspect)" />;
        if (stageIdx === 2) return <div className={`item-cooked-chip shadow-xs ${defectClasses}`} title="Baked pretzels (Click to inspect)" />;
        return <div className={`item-snack-pouch bg-amber-800 text-amber-100 shadow-xs font-black ${defectClasses}`}>RLD</div>;
      }
      if (activeLine === 'LINE-04') {
        if (stageIdx <= 1) return <div className={`item-collet-puff ${defectClasses}`} title="Extruded collet (Click to inspect)" />;
        if (stageIdx === 2) return <div className={`item-cooked-chip shadow-xs ${defectClasses}`} title="Dried collets (Click to inspect)" />;
        return <div className={`item-snack-pouch bg-orange-600 text-white shadow-xs font-black ${defectClasses}`}>CHE</div>;
      }
      // LINE-05
      if (stageIdx === 0) return <div className={`item-raw-slice shadow-xs ${defectClasses}`} title="Potato stick cuts" />;
      if (stageIdx === 1) return <div className={`item-cooked-chip shadow-xs ${defectClasses}`} title="Golden sticks" />;
      return <div className={`item-snack-pouch bg-red-600 text-white shadow-xs font-black ${defectClasses}`}>STK</div>;
    };

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (isSoundEnabled) playConveyorAudio('click');
          setInspectedProduct(getInTransitProduct(stageIdx, activeLine, isDefective));
        }}
        className="cursor-pointer transition-transform hover:scale-125 z-30 relative group"
        title="In-transit item: Click to view live quality & batch inspection telemetry"
      >
        {getItemElement()}
        {isDefective && (
          <span className="absolute -top-3.5 -right-3 px-1 py-0.2 bg-red-600 text-white font-mono text-[7px] font-black rounded shadow-xs uppercase animate-bounce">
            FAULT
          </span>
        )}
      </div>
    );
  };

  // Render individual colorful & information-rich station card
  const renderStationCard = (ws: Workstation, idx: number, orientation: 'horizontal' | 'vertical') => {
    const theme = getStationTheme(ws.name);
    const cond = getMachineConditionInfo(ws.name, idx);
    const { workers, count: workerCount, max: maxWorkers, isCovered } = getStationWorkers(ws);
    const skillName = skills.find((s) => s.id === ws.requiredSkillId)?.name || ws.requiredSkillId;
    const isSelected = selectedWs?.id === ws.id;

    return (
      <div
        key={ws.id}
        onClick={() => setSelectedWs(ws)}
        className={`bg-white hover:bg-slate-50/90 border rounded-2xl flex flex-col justify-between cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-1 group relative overflow-hidden ${
          orientation === 'horizontal' ? 'w-[235px] shrink-0' : 'w-full'
        } ${
          isSelected
            ? 'ring-2 ring-blue-500 shadow-lg border-blue-500 -translate-y-1'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
        title={`Workstation Master: ${ws.id} - ${ws.name} (Click for full diagnostics)`}
      >
        {/* 1. Colorful Top Accent Stripe */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />

        <div className="p-3.5 flex flex-col gap-2.5">
          {/* 2. Top Header: ID Pill + Sequence Tag + Condition Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {ws.id}
              </span>
              <span className="text-[9px] font-bold text-slate-400 font-mono">#0{idx + 1}</span>
            </div>

            {/* Condition Beacon */}
            <span
              className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${
                cond.healthStatus === 'OPTIMAL'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {cond.healthPct}% {cond.healthStatus}
            </span>
          </div>

          {/* 3. Station Machine Name & Icon Squircle */}
          <div className="flex items-start gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${theme.iconBg}`}>
              <span className="material-symbols-outlined text-lg leading-none">{cond.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-slate-900 truncate leading-snug group-hover:text-blue-600 transition-colors">
                {ws.name}
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5" title={cond.oem}>
                {cond.oem}
              </p>
            </div>
          </div>

          {/* 4. Required Skill Badge */}
          <div className="flex items-center justify-between text-[10px] px-2 py-1 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 font-medium truncate max-w-[125px]" title={skillName}>
              {skillName}
            </span>
            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 shadow-2xs">
              {ws.minSkillLevel}
            </span>
          </div>

          {/* 5. MACHINE CONDITION & TELEMETRY PANEL */}
          <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200 flex flex-col gap-1.5 text-[10px]">
            {/* Condition Bar */}
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Machine Health</span>
              <span className="font-mono font-bold text-emerald-600">{cond.oee} OEE</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`}
                style={{ width: `${cond.healthPct}%` }}
              />
            </div>

            {/* Operating Spec Readings */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[9px] text-slate-600 border-t border-slate-200/60 mt-0.5">
              <div>
                <span className="text-slate-400 block text-[8px] uppercase">{cond.label}:</span>
                <span className="font-bold text-slate-900 truncate block">{cond.metric}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px] uppercase">Speed:</span>
                <span className={`font-bold truncate block ${theme.textAccent}`}>{cond.speed}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px] uppercase">Vibration:</span>
                <span className="font-bold text-slate-700 truncate block">{cond.vibration}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px] uppercase">PM Due:</span>
                <span className="font-bold text-slate-700 truncate block">In {cond.nextPMDays}d</span>
              </div>
            </div>
          </div>

          {/* 6. WORKERS ON THIS STATION */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[9px] font-bold">
              <span className="text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">group</span>
                Workers:
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-md font-mono ${
                  isCovered
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {workerCount}/{maxWorkers} Staffed
              </span>
            </div>

            {/* Worker Avatars / Badges */}
            <div className="flex flex-col gap-1">
              {workers.slice(0, 2).map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200/70 transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-4 h-4 rounded-full text-white font-bold text-[8px] flex items-center justify-center shrink-0 ${w.badgeColor}`}>
                      {w.name.charAt(0)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-800 truncate" title={w.name}>
                      {w.name}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] px-1 py-0.2 rounded font-semibold font-mono ${
                      w.category === 'Company'
                        ? 'bg-emerald-100 text-emerald-800'
                        : w.category === 'Contract'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {w.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 flex flex-col font-sans select-none">
      {/* 1. ENTERPRISE HEADER */}
      <header className="px-6 py-4 bg-white border-b border-slate-200/90 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-xl">schema</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  Line Process Flow Loop
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                  Box Donut Layout
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {lineWorkstations.length} Station Master Nodes
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Continuous mechanical conveyor belt loop synchronized with Station Master records
              </p>
            </div>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Production Line Selector Tabs */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shadow-inner">
            {(productionLines.length > 0
              ? productionLines
              : [
                  { id: 'LINE-01', name: 'Line 01 - Potato Chips' },
                  { id: 'LINE-02', name: 'Line 02 - Tortilla Chips' },
                  { id: 'LINE-03', name: 'Line 03 - Pretzels' },
                  { id: 'LINE-04', name: 'Line 04 - Extruded Snacks' },
                ]
            ).map((line) => {
              const shortName = line.name ? line.name.replace(/\s*\(.*?\)/g, '') : line.id;
              const isActive = activeLine === line.id;

              return (
                <button
                  key={line.id}
                  onClick={() => handleLineSelect(line.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                  <span>{shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Shift Selector */}
          <div className="relative">
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="appearance-none bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-xl cursor-pointer focus:outline-none shadow-2xs transition-colors"
            >
              {(shifts.length > 0
                ? shifts
                : [
                    { id: 'SHIFT-A', name: 'Shift A' },
                    { id: 'SHIFT-B', name: 'Shift B' },
                    { id: 'SHIFT-C', name: 'Shift C' },
                  ]
              ).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-slate-500 text-sm absolute right-2 top-2 pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Pause / Resume Belts */}
          <button
            onClick={() => setIsLoopPaused(!isLoopPaused)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 border shadow-2xs ${
              isLoopPaused
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-xs">
              {isLoopPaused ? 'play_arrow' : 'pause'}
            </span>
            <span>{isLoopPaused ? 'Resume Belts' : 'Pause Belts'}</span>
          </button>

          {/* Final Case Outfeed Quick Link */}
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('live_conveyor')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-xs">inventory_2</span>
              <span>Case Outfeed Live</span>
            </button>
          )}

          {/* Station Master Quick Link */}
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('workstations')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer transition-all flex items-center gap-1.5 font-bold"
              title="Open Workstation Master table to configure or add stations"
            >
              <span className="material-symbols-outlined text-xs">desk</span>
              <span>Workstation Master ➔</span>
            </button>
          )}
        </div>
      </header>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="mx-6 mt-3 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-sm text-blue-600">check_circle</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-blue-500 hover:text-blue-800 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 2. EMERGENCY STOP ACTIVE WARNING BANNER */}
      {isEstopActive && (
        <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white flex flex-wrap items-center justify-between gap-4 shadow-lg border-2 border-red-400 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-2xl">emergency</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white text-red-700 text-[10px] font-black uppercase tracking-wider font-mono">
                  SAFETY INTERLOCK TRIPPED
                </span>
                <span className="text-xs font-mono">CODE: E-STOP_PERIMETER_GATE_01</span>
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide mt-0.5">
                All Conveyor Runway Drives De-Energized
              </h3>
              <p className="text-xs text-red-100">
                Pneumatic gates locked. Motors de-energized in fail-safe state. Inspect line before clearing.
              </p>
            </div>
          </div>
          <button
            onClick={handleEstopToggle}
            className="px-5 py-2.5 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm font-bold">restart_alt</span>
            <span>Reset E-STOP & Restore Power</span>
          </button>
        </div>
      )}

      {/* 3. INTERACTIVE CONVEYOR CONTROL DECK BAR */}
      <div className="mx-6 mt-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: VFD Speed Cadence Presets */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5 mr-1">
            <span className="material-symbols-outlined text-sm text-blue-600">tune</span>
            VFD Cadence:
          </span>
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => handleSpeedChange('eco')}
              className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1 ${
                speedMode === 'eco'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Eco Mode: 22 CPM (32.0 Hz) - Energy conserving cadence"
            >
              <span>🐢 Eco</span>
              <span className="text-[10px] font-mono opacity-80">(22 CPM)</span>
            </button>
            <button
              onClick={() => handleSpeedChange('nominal')}
              className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1 ${
                speedMode === 'nominal'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Standard Mode: 38 CPM (50.0 Hz) - Synchronized nominal cadence"
            >
              <span>⚙️ Standard</span>
              <span className="text-[10px] font-mono opacity-80">(38 CPM)</span>
            </button>
            <button
              onClick={() => handleSpeedChange('turbo')}
              className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all flex items-center gap-1 ${
                speedMode === 'turbo'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Turbo Mode: 54 CPM (68.0 Hz) - High throughput peak production"
            >
              <span>⚡ Turbo</span>
              <span className="text-[10px] font-mono opacity-80">(54 CPM)</span>
            </button>
          </div>
        </div>

        {/* Center: Interactive Mechanical Belt Controls */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            onClick={() => {
              setIsLoopPaused(!isLoopPaused);
              if (isSoundEnabled) playConveyorAudio('click');
            }}
            disabled={isEstopActive}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs cursor-pointer transition-all flex items-center gap-1.5 ${
              isLoopPaused
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            } ${isEstopActive ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined text-xs">
              {isLoopPaused ? 'play_arrow' : 'pause'}
            </span>
            <span>{isLoopPaused ? 'Resume Belts' : 'Pause Belts'}</span>
          </button>

          {/* Manual JOG */}
          <button
            onClick={handleStartJog}
            disabled={isEstopActive || jogCountdown > 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs cursor-pointer transition-all flex items-center gap-1.5 ${
              jogCountdown > 0
                ? 'bg-blue-600 text-white border-blue-600 animate-pulse'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            } ${isEstopActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Jog all conveyor motors forward for 5 seconds during maintenance"
          >
            <span className="material-symbols-outlined text-xs">forward_5</span>
            <span>{jogCountdown > 0 ? `Jogging (${jogCountdown}s)` : 'Manual Jog'}</span>
          </button>

          {/* Simulate QC Defect & Diverter */}
          <button
            onClick={handleTriggerRejectDiverter}
            disabled={isEstopActive || isDiverterActuating}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border shadow-2xs cursor-pointer transition-all flex items-center gap-1.5 ${
              isDiverterActuating
                ? 'bg-red-600 text-white border-red-600 animate-pulse'
                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
            } ${isEstopActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Inject an off-spec defective product to test the optical vision scanner and pneumatic reject diverter gate"
          >
            <span className="material-symbols-outlined text-xs">science</span>
            <span>{isDiverterActuating ? 'Diverter Actuated!' : 'Test QC Diverter'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setIsSoundEnabled(!isSoundEnabled);
              playConveyorAudio('click');
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border shadow-2xs cursor-pointer transition-all flex items-center gap-1.5 ${
              isSoundEnabled
                ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle synthesized plant audio effects (optical scanner beeps, pneumatic reject buzzers, E-STOP alerts)"
          >
            <span className="material-symbols-outlined text-xs">
              {isSoundEnabled ? 'volume_up' : 'volume_off'}
            </span>
            <span className="font-mono text-[10px]">{isSoundEnabled ? 'Audio ON' : 'Audio OFF'}</span>
          </button>

          {/* Heavy Duty Industrial E-STOP Button */}
          <button
            onClick={handleEstopToggle}
            className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer transition-all shadow-md flex items-center gap-1.5 border-2 ${
              isEstopActive
                ? 'bg-amber-400 text-amber-950 border-amber-600 animate-pulse'
                : 'bg-red-600 hover:bg-red-700 text-white border-yellow-400'
            }`}
            title="Emergency Stop: Instantly de-energize all conveyor motors and lock line interlocks"
          >
            <span className="material-symbols-outlined text-sm font-black">
              {isEstopActive ? 'lock_reset' : 'cancel'}
            </span>
            <span>{isEstopActive ? 'RESET E-STOP' : 'E-STOP'}</span>
          </button>
        </div>

        {/* Right: Live Belt Process Counters */}
        <div className="flex items-center gap-3 font-mono text-[11px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 text-[9px] block uppercase font-bold">Shift Processed</span>
            <span className="font-black text-slate-800">{processedUnits.toLocaleString()} Pcs</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-slate-400 text-[9px] block uppercase font-bold">QC Rejects</span>
            <span className="font-black text-red-600">{rejectCount} Pcs</span>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-slate-400 text-[9px] block uppercase font-bold">Pass Rate</span>
            <span className="font-black text-emerald-700">
              {((processedUnits / (processedUnits + rejectCount)) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. THE CONTINUOUS BOX DONUT MECHANICAL CONVEYOR LOOP (COLORFUL & HIGH-TECH) */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between overflow-x-auto min-w-[1140px]">

          {/* TOP SECTION: NORTH WORKSTATIONS & CONTINUOUS NORTH CONVEYOR TRACK */}
          <div className="flex flex-col gap-2 z-10">
            {/* North Workstation Modules Row */}
            <div className="flex items-end justify-around px-20 mb-1">
              {perimeterDistribution.top.map((ws, idx) => (
                <div key={ws.id} className="flex flex-col items-center">
                  {renderStationCard(ws, idx, 'horizontal')}
                  {/* Heavy Industrial Gantry Docking Arm */}
                  <div className="w-3 h-4 bg-gradient-to-b from-slate-600 to-slate-800 border-x border-slate-700 shadow-xs relative">
                    <div className="absolute top-1 left-0.5 right-0.5 h-0.5 bg-amber-400" />
                  </div>
                </div>
              ))}
            </div>

            {/* CONTINUOUS NORTH CONVEYOR RUNWAY (Full Width with Integrated Turn Hubs) */}
            <div className="flex items-center w-full">
              {/* Corner 4 Hub (Top-Left): Infeed / Return Turn */}
              <div
                onClick={() => {
                  if (isSoundEnabled) playConveyorAudio('click');
                  setSelectedBeltSegment(getBeltSegmentTelemetry('HUB-4', speedMode, activeLine));
                }}
                className="w-[74px] h-[74px] shrink-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700 hover:border-cyan-400 rounded-tl-3xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer transition-all"
                title="Corner Hub 4: Infeed Radius Turn (Click for Drive & Turntable Telemetry)"
              >
                {/* Hazard corner stripes */}
                <div className="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)]" />
                <div className="w-8 h-8 rounded-full border border-cyan-500/50 bg-slate-900/90 flex items-center justify-center text-cyan-400 font-bold text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform">
                  ⤸
                </div>
                <span className="text-[8px] font-mono font-black text-cyan-300 uppercase mt-1 tracking-wider">HUB 4</span>
              </div>

              {/* Continuous North Conveyor Track with Metallic Moving Rollers */}
              <div
                onClick={() => {
                  if (isSoundEnabled) playConveyorAudio('click');
                  setSelectedBeltSegment(getBeltSegmentTelemetry('BELT-NORTH', speedMode, activeLine));
                }}
                className={`flex-1 h-[74px] border-y-2 border-slate-700 relative overflow-hidden flex items-center justify-around px-8 conveyor-belt-surface cursor-pointer group hover:border-cyan-500/80 transition-colors ${
                  isEstopActive
                    ? 'conveyor-estop'
                    : `${(isLoopPaused && jogCountdown === 0) ? 'paused' : ''} ${
                        speedMode === 'turbo'
                          ? 'conveyor-speed-turbo'
                          : speedMode === 'eco'
                          ? 'conveyor-speed-eco'
                          : 'conveyor-speed-nominal'
                      }`
                }`}
                title="North Infeed Runway: Click to view Motor Drive, VFD & Belt Mechanical Diagnostics"
              >
                {/* Industrial Safety Yellow/Black Hazard Striping Top and Bottom */}
                <div className="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)] opacity-90 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)] opacity-90 pointer-events-none" />

                {/* Optical Laser Scanner Sensor Emitters */}
                {perimeterDistribution.top.map((ws, idx) => (
                  <div key={ws.id} className="absolute flex flex-col items-center justify-between h-full pointer-events-none z-20" style={{ left: `${(idx + 1) * (100 / (perimeterDistribution.top.length + 1))}%` }}>
                    {/* Top Emitter Head */}
                    <div className="w-4 h-2 bg-slate-950 rounded-b border border-cyan-400 shadow-[0_0_8px_#22d3ee] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    </div>
                    {/* Laser Beam */}
                    <div className="w-[2px] h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee,0_0_20px_#06b6d4] opacity-80" />
                    {/* Bottom Sensor Head */}
                    <div className="w-4 h-2 bg-slate-950 rounded-t border border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  </div>
                ))}

                {/* Flowing Intermediate Products */}
                <div className={`absolute ${(isEstopActive || (isLoopPaused && jogCountdown === 0)) ? '' : `animate-belt-flow ${speedMode === 'turbo' ? 'flow-speed-turbo' : speedMode === 'eco' ? 'flow-speed-eco' : 'flow-speed-nominal'}`}`}>
                  {renderConveyorItem(0)}
                </div>
                <div className={`absolute ${(isEstopActive || (isLoopPaused && jogCountdown === 0)) ? '' : `animate-belt-flow-delayed ${speedMode === 'turbo' ? 'flow-speed-turbo' : speedMode === 'eco' ? 'flow-speed-eco' : 'flow-speed-nominal'}`}`}>
                  {renderConveyorItem(1)}
                </div>

                {/* Conveyor Motion Direction Indicators & Live Digital Belt Telemetry */}
                <div className="w-full flex justify-between items-center text-[10px] font-mono font-black text-cyan-400/80 tracking-widest pointer-events-none px-4">
                  <span>&gt;&gt;&gt; INFEED TRANSLATION</span>
                  <div className="px-2.5 py-0.5 rounded bg-slate-950/80 border border-cyan-500/40 text-cyan-300 shadow-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>VFD: {speedMode === 'turbo' ? '68.0 Hz' : speedMode === 'eco' ? '32.0 Hz' : '50.0 Hz'} • {speedMode === 'turbo' ? 54 : speedMode === 'eco' ? 22 : 38} CPM</span>
                  </div>
                  <span>PROCESSING ZONE &gt;&gt;&gt;</span>
                </div>

                {/* Hover HUD Pill */}
                <div className="absolute right-4 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-[9px] font-mono font-bold bg-slate-900/95 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/50 shadow-xs">
                    🔍 Click to Inspect Motor & VFD
                  </span>
                </div>
              </div>

              {/* Corner 1 Hub (Top-Right): 90° Turn from North to East */}
              <div
                onClick={() => {
                  if (isSoundEnabled) playConveyorAudio('click');
                  setSelectedBeltSegment(getBeltSegmentTelemetry('HUB-1', speedMode, activeLine));
                }}
                className="w-[74px] h-[74px] shrink-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700 hover:border-cyan-400 rounded-tr-3xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer transition-all"
                title="Corner Hub 1: North to East Transition (Click for Drive & Turntable Telemetry)"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)]" />
                <div className="w-8 h-8 rounded-full border border-cyan-500/50 bg-slate-900/90 flex items-center justify-center text-cyan-400 font-bold text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform">
                  ↷
                </div>
                <span className="text-[8px] font-mono font-black text-cyan-300 uppercase mt-1 tracking-wider">HUB 1</span>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: WEST RUNWAY + HOLLOW DONUT COCKPIT + EAST RUNWAY */}
          <div className="flex items-stretch justify-between w-full my-0 z-10 flex-1 min-h-[400px]">

            {/* WEST RUNWAY & STATIONS (Left Edge): Vertical Conveyor Flowing UP */}
            <div className="flex items-stretch gap-2 shrink-0">
              {/* West Workstation Cards */}
              <div className="w-[235px] flex flex-col justify-around py-4">
                {perimeterDistribution.left.map((ws, idx) => (
                  <div key={ws.id} className="flex items-center">
                    {renderStationCard(ws, idx + 6, 'vertical')}
                    {/* Horizontal Docking Bracket */}
                    <div className="h-3 w-4 bg-gradient-to-r from-slate-600 to-slate-800 border-y border-slate-700 shadow-xs relative">
                      <div className="absolute left-1 top-0.5 bottom-0.5 w-0.5 bg-amber-400" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Continuous Vertical Conveyor Track Moving UP */}
              <div
                onClick={() => {
                  if (isSoundEnabled) playConveyorAudio('click');
                  setSelectedBeltSegment(getBeltSegmentTelemetry('BELT-WEST', speedMode, activeLine));
                }}
                className={`w-[74px] border-x-2 border-slate-700 relative overflow-hidden flex flex-col items-center justify-around py-6 conveyor-belt-surface-v-up cursor-pointer group hover:border-cyan-500/80 transition-colors ${
                  isEstopActive
                    ? 'conveyor-estop'
                    : `${(isLoopPaused && jogCountdown === 0) ? 'paused' : ''} ${
                        speedMode === 'turbo'
                          ? 'conveyor-speed-turbo'
                          : speedMode === 'eco'
                          ? 'conveyor-speed-eco'
                          : 'conveyor-speed-nominal'
                      }`
                }`}
                title="West Return Runway: Click to view Motor Drive & Belt Mechanical Diagnostics"
              >
                {/* Safety Stripes on Vertical Rails */}
                <div className="absolute inset-y-0 left-0 w-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)] opacity-90 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)] opacity-90 pointer-events-none" />

                {/* Optical Laser Sensor */}
                <div className="absolute inset-x-0 top-1/2 flex items-center justify-between w-full pointer-events-none z-20">
                  <div className="w-2 h-4 bg-slate-950 rounded-r border border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <div className="h-[2px] w-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] opacity-80" />
                  <div className="w-2 h-4 bg-slate-950 rounded-l border border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                </div>

                {/* Moving Item Going UP */}
                <div className={`absolute ${(isEstopActive || (isLoopPaused && jogCountdown === 0)) ? '' : `animate-belt-flow-up ${speedMode === 'turbo' ? 'flow-speed-turbo' : speedMode === 'eco' ? 'flow-speed-eco' : 'flow-speed-nominal'}`}`}>
                  {renderConveyorItem(4)}
                </div>

                <div className="flex flex-col items-center gap-8 text-[9px] font-mono font-black text-cyan-400/80 pointer-events-none">
                  <span>▲</span>
                  <span>▲</span>
                  <span>CIRCUIT</span>
                  <span>▲</span>
                </div>
              </div>
            </div>

            {/* THE DONUT HOLE: COCKPIT HUB & STATION MASTER SYNCHRONIZER */}
            <div className="flex-1 mx-4 my-2 bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 rounded-3xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden">
              {/* Brand Accent Top Border */}
              <div
                className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${brandMeta.gradient}`}
              />

              {/* Cockpit Header */}
              <div className="flex flex-wrap justify-between items-start gap-4 pt-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                    <span className="text-xs font-mono font-black text-slate-700 uppercase tracking-widest">
                      Live Closed Loop Circuit Cockpit
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono font-black shadow-2xs">
                      Station Master Synchronized
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                    {activeLineObj?.name || brandMeta.productName}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Active Product: <span className="font-bold text-slate-900">{brandMeta.productName}</span> • Line Status:{' '}
                    <span className="text-emerald-700 font-bold uppercase">{activeLineObj?.status || 'ACTIVE'}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {brandMeta.tagline}
                  </p>
                </div>

                {/* Station Master Direct Action */}
                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab('workstations')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm text-blue-400">edit</span>
                    <span>Configure in Station Master</span>
                  </button>
                )}
              </div>

              {/* 4 Center Telemetry Bento KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 my-3">
                {/* KPI 1: Station Master Count */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 border-t-4 border-t-blue-500 shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Station Master Nodes
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black font-mono text-slate-900">{lineWorkstations.length}</span>
                    <span className="text-xs text-slate-500 font-bold">Nodes</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold mt-1">100% DB Synchronized</span>
                </div>

                {/* KPI 2: Staffing Coverage */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 border-t-4 border-t-emerald-500 shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Staffing Coverage
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black font-mono text-emerald-600">
                      {totalCovered}/{lineWorkstations.length}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">({coveragePercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${coveragePercent}%` }} />
                  </div>
                </div>

                {/* KPI 3: Mass Throughput */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 border-t-4 border-t-cyan-500 shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Throughput Cadence
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black font-mono text-cyan-700">38</span>
                    <span className="text-xs text-slate-500 font-bold">CPM</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-1">Nominal Target: 30 - 45 CPM</span>
                </div>

                {/* KPI 4: First-Pass Yield */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 border-t-4 border-t-rose-500 shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Quality Yield
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black font-mono text-slate-900">98.4%</span>
                    <span className="text-[10px] text-emerald-600 font-black">Grade A</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-1">Tolerance: &gt; 98.0%</span>
                </div>
              </div>

              {/* Station Roster Quick Overview Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                      Active Station Master Node Status
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Shift: {selectedShift}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
                  {lineWorkstations.map((ws, i) => {
                    const { count: wCount, isCovered } = getStationWorkers(ws);
                    const cond = getMachineConditionInfo(ws.name, i);
                    const theme = getStationTheme(ws.name);

                    return (
                      <div
                        key={ws.id}
                        onClick={() => setSelectedWs(ws)}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-[10px] text-slate-800">{ws.id}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </div>
                          <p className="font-bold text-slate-900 text-[11px] truncate mt-1">{ws.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono truncate">{cond.oem.split(' ')[0]}</p>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[9px] font-mono">
                          <span className={`font-bold ${theme.textAccent}`}>{cond.metric}</span>
                          <span className={`font-bold ${isCovered ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {wCount} Op
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Guidance */}
              <div className="flex flex-wrap justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200/80 mt-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                  <span>Workstations, staffing allocation, and machine telemetry mapped in real-time.</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
                  <span>Conveyor: Nominal</span>
                  <span>•</span>
                  <span>Safety Interlocks: Active</span>
                </div>
              </div>
            </div>

            {/* EAST RUNWAY & STATIONS (Right Edge): Vertical Conveyor Flowing DOWN */}
            <div className="flex items-stretch gap-2 shrink-0">
              {/* Continuous Vertical Conveyor Track Moving DOWN */}
              <div
                onClick={() => {
                  if (isSoundEnabled) playConveyorAudio('click');
                  setSelectedBeltSegment(getBeltSegmentTelemetry('BELT-EAST', speedMode, activeLine));
                }}
                className={`w-[74px] border-x-2 border-slate-700 relative overflow-hidden flex flex-col items-center justify-around py-6 conveyor-belt-surface-v cursor-pointer group hover:border-cyan-500/80 transition-colors ${
                  isEstopActive
                    ? 'conveyor-estop'
                    : `${(isLoopPaused && jogCountdown === 0) ? 'paused' : ''} ${
                        speedMode === 'turbo'
                          ? 'conveyor-speed-turbo'
                          : speedMode === 'eco'
                          ? 'conveyor-speed-eco'
                          : 'conveyor-speed-nominal'
                      }`
                }`}
                title="East Thermal Runway: Click to view Motor Drive & Belt Mechanical Diagnostics"
              >
                {/* Safety Stripes on Vertical Rails */}
                <div className="absolute inset-y-0 left-0 w-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)] opacity-90 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)] opacity-90 pointer-events-none" />

                {/* Optical Laser Sensor */}
                <div className="absolute inset-x-0 top-1/2 flex items-center justify-between w-full pointer-events-none z-20">
                  <div className="w-2 h-4 bg-slate-950 rounded-r border border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <div className="h-[2px] w-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] opacity-80" />
                  <div className="w-2 h-4 bg-slate-950 rounded-l border border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                </div>

                {/* Moving Item Going DOWN */}
                <div className={`absolute ${(isEstopActive || (isLoopPaused && jogCountdown === 0)) ? '' : `animate-belt-flow-down ${speedMode === 'turbo' ? 'flow-speed-turbo' : speedMode === 'eco' ? 'flow-speed-eco' : 'flow-speed-nominal'}`}`}>
                  {renderConveyorItem(2)}
                </div>

                <div className="flex flex-col items-center gap-8 text-[9px] font-mono font-black text-cyan-400/80 pointer-events-none">
                  <span>▼</span>
                  <span>▼</span>
                  <span>FLOW</span>
                  <span>▼</span>
                </div>
              </div>

              {/* East Workstation Cards */}
              <div className="w-[235px] flex flex-col justify-around py-4">
                {perimeterDistribution.right.map((ws, idx) => (
                  <div key={ws.id} className="flex items-center">
                    {/* Horizontal Docking Bracket */}
                    <div className="h-3 w-4 bg-gradient-to-r from-slate-800 to-slate-600 border-y border-slate-700 shadow-xs relative">
                      <div className="absolute right-1 top-0.5 bottom-0.5 w-0.5 bg-amber-400" />
                    </div>
                    {renderStationCard(ws, idx + 2, 'vertical')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: CONTINUOUS SOUTH CONVEYOR TRACK & SOUTH WORKSTATIONS */}
          <div className="flex flex-col gap-2 z-10">
            {/* CONTINUOUS SOUTH CONVEYOR RUNWAY (Full Width with Integrated Turn Hubs) */}
            <div className="flex items-center w-full">
              {/* Corner 3 Hub (Bottom-Left): 90° Turn from South to West */}
              <div
                onClick={() => {
                  if (isSoundEnabled) playConveyorAudio('click');
                  setSelectedBeltSegment(getBeltSegmentTelemetry('HUB-3', speedMode, activeLine));
                }}
                className="w-[74px] h-[74px] shrink-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700 hover:border-cyan-400 rounded-bl-3xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer transition-all"
                title="Corner Hub 3: South to West Outfeed Transition (Click for Drive & Turntable Telemetry)"
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)]" />
                <div className="w-8 h-8 rounded-full border border-cyan-500/50 bg-slate-900/90 flex items-center justify-center text-cyan-400 font-bold text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform">
                  ⤹
                </div>
                <span className="text-[8px] font-mono font-black text-cyan-300 uppercase mt-1 tracking-wider">HUB 3</span>
              </div>

              {/* Continuous South Conveyor Track with Metallic Moving Rollers (Reverse Flow: Right to Left) */}
              <div
                onClick={() => {
                  if (isSoundEnabled) playConveyorAudio('click');
                  setSelectedBeltSegment(getBeltSegmentTelemetry('BELT-SOUTH', speedMode, activeLine));
                }}
                className={`flex-1 h-[74px] border-y-2 border-slate-700 relative overflow-hidden flex items-center justify-around px-8 conveyor-belt-surface-left cursor-pointer group hover:border-cyan-500/80 transition-colors ${
                  isEstopActive
                    ? 'conveyor-estop'
                    : `${(isLoopPaused && jogCountdown === 0) ? 'paused' : ''} ${
                        speedMode === 'turbo'
                          ? 'conveyor-speed-turbo'
                          : speedMode === 'eco'
                          ? 'conveyor-speed-eco'
                          : 'conveyor-speed-nominal'
                      }`
                }`}
                title="South Packaging Runway: Click to view Motor Drive, Pneumatic Diverter Gate & VFD Diagnostics"
              >
                {/* Industrial Safety Yellow/Black Hazard Striping Top and Bottom */}
                <div className="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)] opacity-90 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)] opacity-90 pointer-events-none" />

                {/* Optical Laser Scanner Sensor Emitters */}
                {perimeterDistribution.bottom.map((ws, idx) => (
                  <div key={ws.id} className="absolute flex flex-col items-center justify-between h-full pointer-events-none z-20" style={{ left: `${(idx + 1) * (100 / (perimeterDistribution.bottom.length + 1))}%` }}>
                    {/* Top Sensor Head */}
                    <div className="w-4 h-2 bg-slate-950 rounded-b border border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    {/* Laser Beam */}
                    <div className="w-[2px] h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee,0_0_20px_#06b6d4] opacity-80" />
                    {/* Bottom Emitter Head */}
                    <div className="w-4 h-2 bg-slate-950 rounded-t border border-cyan-400 shadow-[0_0_8px_#22d3ee] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    </div>
                  </div>
                ))}

                {/* Flowing Products moving Right to Left */}
                <div className={`absolute ${(isEstopActive || (isLoopPaused && jogCountdown === 0)) ? '' : `animate-belt-flow-left ${speedMode === 'turbo' ? 'flow-speed-turbo' : speedMode === 'eco' ? 'flow-speed-eco' : 'flow-speed-nominal'}`}`}>
                  {renderConveyorItem(3)}
                </div>

                {/* Pneumatic Reject Diverter Gate Mechanism */}
                <div className="absolute right-32 top-0 bottom-0 flex items-center pointer-events-none z-30">
                  <div
                    className={`w-3.5 h-11 bg-amber-400 border-2 border-amber-600 rounded-sm shadow-md flex items-center justify-center transition-all ${
                      isDiverterActuating ? 'diverter-actuated shadow-amber-500/80 bg-red-500 border-red-700' : ''
                    }`}
                  >
                    <span className="text-[6px] font-black font-mono text-slate-900 uppercase -rotate-90">
                      {isDiverterActuating ? 'REJECT' : 'GATE'}
                    </span>
                  </div>
                  {/* Chute Bin Indicator */}
                  <div className="ml-1.5 px-2 py-0.5 rounded bg-slate-950 border border-red-500/70 text-[8px] font-mono font-black text-red-300 flex items-center gap-1 shadow-xs pointer-events-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span>REJECT BIN: {rejectCount}</span>
                  </div>
                </div>

                {/* Conveyor Motion Direction Indicators */}
                <div className="w-full flex justify-around text-[10px] font-mono font-black text-cyan-400/75 tracking-widest pointer-events-none">
                  <span>&lt;&lt;&lt; PACKAGING CELL</span>
                  <span>REVERSE CONVEYOR FLOW &lt;&lt;&lt;</span>
                  <span>OUTFEED TRANSIT &lt;&lt;&lt;</span>
                </div>

                {/* Hover HUD Pill */}
                <div className="absolute left-6 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-[9px] font-mono font-bold bg-slate-900/95 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/50 shadow-xs">
                    🔍 Click to Inspect Motor & Diverter Gate
                  </span>
                </div>
              </div>

              {/* Corner 2 Hub (Bottom-Right): 90° Turn from East to South */}
              <div
                onClick={() => {
                  if (isSoundEnabled) playConveyorAudio('click');
                  setSelectedBeltSegment(getBeltSegmentTelemetry('HUB-2', speedMode, activeLine));
                }}
                className="w-[74px] h-[74px] shrink-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700 hover:border-cyan-400 rounded-br-3xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer transition-all"
                title="Corner Hub 2: East to South Transition (Click for Drive & Turntable Telemetry)"
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_6px,#0f172a_6px,#0f172a_12px)]" />
                <div className="w-8 h-8 rounded-full border border-cyan-500/50 bg-slate-900/90 flex items-center justify-center text-cyan-400 font-bold text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform">
                  ⤶
                </div>
                <span className="text-[8px] font-mono font-black text-cyan-300 uppercase mt-1 tracking-wider">HUB 2</span>
              </div>
            </div>

            {/* South Workstation Modules Row */}
            <div className="flex items-start justify-around px-20 mt-1">
              {perimeterDistribution.bottom.map((ws, idx) => (
                <div key={ws.id} className="flex flex-col items-center">
                  {/* Heavy Industrial Gantry Docking Arm */}
                  <div className="w-3 h-4 bg-gradient-to-b from-slate-800 to-slate-600 border-x border-slate-700 shadow-xs relative">
                    <div className="absolute bottom-1 left-0.5 right-0.5 h-0.5 bg-amber-400" />
                  </div>
                  {renderStationCard(ws, idx + 4, 'horizontal')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. WORKSTATION MASTER DIAGNOSTICS & TELEMETRY MODAL */}
      {selectedWs && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
            {/* Modal Header */}
            {(() => {
              const theme = getStationTheme(selectedWs.name);
              const cond = getMachineConditionInfo(selectedWs.name, 0);
              const { workers, count: wCount, max: maxW } = getStationWorkers(selectedWs);

              return (
                <>
                  <div className="px-6 py-5 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
                    <div className="flex items-center gap-3 z-10">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${theme.iconBg}`}>
                        <span className="material-symbols-outlined text-2xl leading-none">{cond.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-cyan-300">{selectedWs.id}</span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            STATION MASTER ACTIVE
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white tracking-tight">{selectedWs.name}</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedWs(null)}
                      className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors z-10"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 flex flex-col gap-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
                    {/* Station Master Configuration Details */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Station Master Definition
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Line: {selectedWs.lineId}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-slate-500 text-[11px] block">Required Skill:</span>
                          <span className="font-bold text-slate-900">
                            {skills.find((s) => s.id === selectedWs.requiredSkillId)?.name || selectedWs.requiredSkillId}
                          </span>
                          <span className="text-[10px] font-mono text-blue-600 block mt-0.5">({selectedWs.requiredSkillId})</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px] block">Minimum Skill Level:</span>
                          <span className="font-bold text-slate-900">{selectedWs.minSkillLevel}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Staff Capacity: {selectedWs.maxStaffCount} Operator</span>
                        </div>
                      </div>
                    </div>

                    {/* Machine Condition & Health Report */}
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-2">
                        Machine Condition & Operational Telemetry
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200 flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-cyan-800 uppercase">{cond.label}</span>
                          <span className="text-xl font-black font-mono text-cyan-950 mt-1">{cond.metric}</span>
                          <span className="text-[10px] text-cyan-600 font-medium mt-0.5">Tolerance: ±0.5% Nominal</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase">Velocity Target</span>
                          <span className="text-xl font-black font-mono text-emerald-950 mt-1">{cond.speed}</span>
                          <span className="text-[10px] text-emerald-600 font-medium mt-0.5">Synchronized</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Condition & OEE</span>
                          <span className="text-xl font-black font-mono text-slate-900 mt-1">{cond.oee}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">{cond.healthPct}% Health • {cond.healthStatus}</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Maintenance & Lube</span>
                          <span className="text-sm font-bold text-slate-800 mt-1 font-mono">Next PM: {cond.nextPMDays} Days</span>
                          <span className="text-[10px] text-slate-500 font-medium mt-0.5">{cond.lubeStatus}</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Workforce */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Assigned Workforce ({wCount}/{maxW} Operators)
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Shift: {selectedShift}</span>
                      </div>

                      <div className="flex flex-col gap-2 mt-1">
                        {workers.map((w) => (
                          <div key={w.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center shadow-xs ${w.badgeColor}`}>
                                {w.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{w.name}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                  <span className="font-mono">{w.id}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-700">{selectedWs.minSkillLevel} Qualified</span>
                                </div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700 font-mono">
                              {w.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    {setActiveTab && (
                      <button
                        onClick={() => {
                          setSelectedWs(null);
                          setActiveTab('workstations');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-black flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        <span>Edit in Workstation Master</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedWs(null)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors shadow-xs ml-auto"
                    >
                      Close Diagnostics
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Conveyor Belt Mechanical & VFD Diagnostic Modal */}
      {selectedBeltSegment && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedBeltSegment(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-amber-500/20 to-transparent rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <span className="material-symbols-outlined text-2xl">precision_manufacturing</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        {selectedBeltSegment.code}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isEstopActive 
                          ? 'bg-rose-500 text-white animate-pulse' 
                          : isLoopPaused 
                          ? 'bg-amber-400/20 text-amber-300' 
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {isEstopActive ? 'E-STOP DE-ENERGIZED' : isLoopPaused ? 'IDLE / PAUSED' : 'ENERGIZED & RUNNING'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-1">{selectedBeltSegment.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedBeltSegment.zoneDescription}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBeltSegment(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
              {/* Drive & VFD Frequency Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Variable Frequency Drive (VFD)</div>
                  <div className="text-xs font-semibold text-slate-200">{selectedBeltSegment.driveMotor}</div>
                  <div className="text-[11px] text-amber-300 font-mono">
                    Nominal 50.0 Hz • Current Mode: {speedMode.toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 rounded-lg bg-white/10 border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 uppercase font-semibold">VFD Inverter</div>
                    <div className="text-xl font-black font-mono text-amber-400">{selectedBeltSegment.currentVfdHz} Hz</div>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-white/10 border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 uppercase font-semibold">Linear Speed</div>
                    <div className="text-xl font-black font-mono text-cyan-300">{selectedBeltSegment.speedMps} m/s</div>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-white/10 border border-white/10 backdrop-blur-xs">
                    <div className="text-[10px] text-slate-300 uppercase font-semibold">Cadence</div>
                    <div className="text-xl font-black font-mono text-emerald-400">{selectedBeltSegment.cpm} CPM</div>
                  </div>
                </div>
              </div>

              {/* Mechanical Telemetry Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Belt Tension</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{selectedBeltSegment.tensionN} N</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1">Opt: {selectedBeltSegment.tensionOptimal}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Surface Wear</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{selectedBeltSegment.surfaceWearPct}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${selectedBeltSegment.surfaceWearPct}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Bearing Temp</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{selectedBeltSegment.bearingTempC}°C</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1">Within Thermal Spec</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Vibration RMS</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{selectedBeltSegment.vibrationRms} mm/s</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">ISO 10816 Class I</div>
                </div>
              </div>

              {/* Advanced Diagnostics Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-slate-400">straighten</span>
                    Belt Tracking Alignment Offset
                  </span>
                  <span className="font-mono font-bold text-slate-800">{selectedBeltSegment.alignmentMm > 0 ? `+${selectedBeltSegment.alignmentMm}` : selectedBeltSegment.alignmentMm} mm (Tolerance: ±1.5mm)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-slate-400">oil_barrel</span>
                    Automatic Lubrication Status
                  </span>
                  <span className="font-semibold text-emerald-700">{selectedBeltSegment.lubeStatus}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-slate-400">sensors</span>
                    Optical Safety & Interlock Sensors
                  </span>
                  <span className="font-semibold text-slate-700">{selectedBeltSegment.sensorHealth}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-slate-400">calendar_month</span>
                    Preventive Maintenance Window
                  </span>
                  <span className="font-bold text-blue-700">Due in {selectedBeltSegment.nextPmDays} production days</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleStartJog();
                    setSelectedBeltSegment(null);
                  }}
                  disabled={isEstopActive}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-sm">slow_motion_video</span>
                  <span>Jog Segment (5s)</span>
                </button>
                <button
                  onClick={() => {
                    if (isSoundEnabled) playConveyorAudio('click');
                    setToastMessage(`Central lubrication routine applied to ${selectedBeltSegment.code}. Lubricant pressure: 4.2 Bar OK.`);
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-sm text-slate-500">oil_barrel</span>
                  <span>Dispense Lube</span>
                </button>
                <button
                  onClick={() => {
                    if (isSoundEnabled) playConveyorAudio('click');
                    setToastMessage(`Optical tension sensor calibrated for ${selectedBeltSegment.name} (Baseline 445 N verified).`);
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-sm text-slate-500">tune</span>
                  <span>Calibrate Tension</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedBeltSegment(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Transit Product Quality Snapshot Modal */}
      {inspectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setInspectedProduct(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Product Modal Header */}
            <div className={`p-6 text-white relative overflow-hidden ${
              inspectedProduct.isDefective 
                ? 'bg-gradient-to-r from-rose-700 to-rose-900' 
                : 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900'
            }`}>
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    inspectedProduct.isDefective 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-amber-400 text-slate-950'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {inspectedProduct.isDefective ? 'warning' : 'inventory_2'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black tracking-widest text-white/80 bg-white/10 px-2 py-0.5 rounded border border-white/20">
                        {inspectedProduct.brand}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                        inspectedProduct.isDefective ? 'bg-white text-rose-700' : 'bg-emerald-400 text-slate-950'
                      }`}>
                        {inspectedProduct.visionVerdict === 'PASS' ? '✓ INSPECTION PASSED' : '✕ QC DEFECT FLAGGED'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-1">{inspectedProduct.sku}</h3>
                    <p className="text-xs text-white/70 mt-0.5 font-mono">{inspectedProduct.batchId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectedProduct(null)}
                  className="w-8 h-8 rounded-full bg-black/30 text-white/80 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>

            {/* Product Body */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Transit Location & Stage</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{inspectedProduct.stageName}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Scanned at: {inspectedProduct.opticalTimestamp}</div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${
                  inspectedProduct.isDefective 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Net Weight</div>
                  <div className="text-base font-black mt-0.5">{inspectedProduct.actualWeight}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Target: {inspectedProduct.targetWeight}</div>
                </div>

                <div className={`p-3 rounded-xl border ${
                  inspectedProduct.isDefective 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Moisture Content</div>
                  <div className="text-base font-black mt-0.5">{inspectedProduct.moisturePct}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Target: &lt; 2.0%</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Oil Absorption</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{inspectedProduct.oilPct}</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Nominal Grade</div>
                </div>

                <div className={`p-3 rounded-xl border ${
                  inspectedProduct.isDefective 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Pouch Seal Score</div>
                  <div className="text-base font-black mt-0.5">{inspectedProduct.sealScore}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Cognex Vision AI</div>
                </div>
              </div>

              {/* Status Alert Banner */}
              {inspectedProduct.isDefective ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-rose-600 text-xl shrink-0 mt-0.5">warning</span>
                  <div className="text-xs text-rose-800">
                    <strong className="font-bold block">Defect Trajectory Active:</strong>
                    This unit failed weight check and hermetic seal verification. The South Runway pneumatic diverter gate is armed to reject it into the scrap bin.
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0 mt-0.5">verified</span>
                  <div className="text-xs text-emerald-800">
                    <strong className="font-bold block">Quality Standard Compliant:</strong>
                    All sensory, moisture, seal and weight parameters match Frito-Lay / PepsiCo Gold Standard specifications.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              {inspectedProduct.isDefective ? (
                <button
                  onClick={() => {
                    handleTriggerRejectDiverter();
                    setInspectedProduct(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">call_split</span>
                  <span>Eject via Pneumatic Diverter</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (isSoundEnabled) playConveyorAudio('click');
                    setToastMessage(`Product sample ${inspectedProduct.batchId} logged to QC database as VERIFIED.`);
                    setInspectedProduct(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Log Verified Sample</span>
                </button>
              )}
              <button
                onClick={() => setInspectedProduct(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
