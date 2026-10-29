import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { IScanEvent, IConveyorSnapshot, ScanResult } from '../types/conveyor';

interface LiveConveyorProps {
  selectedLineId?: string;
  setSelectedLineId?: (id: string) => void;
  setActiveTab?: (tab: string) => void;
}

// Brand color system matching reference specifications
// Brand color system matching reference video specifications
export interface BrandStyle {
  brand: string;
  code: string;
  color: string;
  bgHex: string;
  textHex: string;
  bgClass: string;
  badgeClass: string;
  textClass: string;
  borderClass: string;
  accentHex: string;
}

export const BRAND_CONFIG: Record<string, BrandStyle> = {
  "Lay's": {
    brand: "Lay's",
    code: 'LAY',
    color: '#EAB308',
    bgHex: '#EAB308',
    textHex: '#1E293B',
    bgClass: 'bg-amber-500',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    textClass: 'text-amber-950',
    borderClass: 'border-amber-400',
    accentHex: '#EAB308',
  },
  "Cheetos": {
    brand: 'Cheetos',
    code: 'CHE',
    color: '#6D28D9',
    bgHex: '#6D28D9',
    textHex: '#FFFFFF',
    bgClass: 'bg-purple-700',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    textClass: 'text-purple-950',
    borderClass: 'border-purple-400',
    accentHex: '#6D28D9',
  },
  "Kurkure": {
    brand: 'Kurkure',
    code: 'KUR',
    color: '#DC2626',
    bgHex: '#DC2626',
    textHex: '#FFFFFF',
    bgClass: 'bg-red-600',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    textClass: 'text-red-950',
    borderClass: 'border-red-400',
    accentHex: '#DC2626',
  },
  "Doritos": {
    brand: 'Doritos',
    code: 'DOR',
    color: '#2563EB',
    bgHex: '#2563EB',
    textHex: '#FFFFFF',
    bgClass: 'bg-blue-600',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    textClass: 'text-blue-950',
    borderClass: 'border-blue-400',
    accentHex: '#2563EB',
  },
  "Ruffles": {
    brand: 'Ruffles',
    code: 'RUF',
    color: '#0284C7',
    bgHex: '#0284C7',
    textHex: '#FFFFFF',
    bgClass: 'bg-sky-600',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    textClass: 'text-sky-950',
    borderClass: 'border-sky-400',
    accentHex: '#0284C7',
  },
  "Rold Gold": {
    brand: 'Rold Gold',
    code: 'ROL',
    color: '#B45309',
    bgHex: '#B45309',
    textHex: '#FFFFFF',
    bgClass: 'bg-amber-800',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-400',
    textClass: 'text-amber-950',
    borderClass: 'border-amber-600',
    accentHex: '#B45309',
  },
};

export const getBrandMeta = (evt: IScanEvent): BrandStyle => {
  if (evt.metadata?.brand && BRAND_CONFIG[evt.metadata.brand]) {
    return BRAND_CONFIG[evt.metadata.brand];
  }
  if (evt.sku?.startsWith('KUR')) return BRAND_CONFIG['Kurkure'];
  if (evt.sku?.startsWith('CHE') || evt.sku?.startsWith('CHT')) return BRAND_CONFIG['Cheetos'];
  if (evt.sku?.startsWith('DOR')) return BRAND_CONFIG['Doritos'];
  if (evt.sku?.startsWith('RUF')) return BRAND_CONFIG['Ruffles'];
  if (evt.sku?.startsWith('RLD')) return BRAND_CONFIG['Rold Gold'];
  return BRAND_CONFIG["Lay's"];
};

export interface IStationNode {
  id: string;
  name: string;
  stageName: string;
  itemType: 'raw' | 'cooked' | 'seasoned' | 'pouch' | 'case' | 'pallet';
  icon: string;
  nominalMetric: string;
  metricLabel: string;
  tempOrSpeed: string;
  status: 'OPTIMAL' | 'RUNNING' | 'ATTENTION';
  machineModel: string;
  description: string;
}

export const LINE_STATIONS_CONFIG: Record<string, IStationNode[]> = {
  'LINE-01': [
    {
      id: 'WS-101',
      name: 'Slicing & Washing',
      stageName: 'Centrifugal Slicing',
      itemType: 'raw',
      icon: 'kitchen',
      nominalMetric: '1.2 mm slice',
      metricLabel: 'Blade Cut',
      tempOrSpeed: '420 kg/hr',
      status: 'OPTIMAL',
      machineModel: 'Urschel Model CC Slicer',
      description: 'Continuous high-speed rotary centrifugal potato slicing with starch wash flume.'
    },
    {
      id: 'WS-102',
      name: 'High-Temp Frying',
      stageName: 'Thermal Frying System',
      itemType: 'cooked',
      icon: 'local_fire_department',
      nominalMetric: '182°C',
      metricLabel: 'Oil Temperature',
      tempOrSpeed: '1.4% moisture',
      status: 'OPTIMAL',
      machineModel: 'Heat and Control MasterTherm',
      description: 'Continuous multi-zone hot oil fryer with high-velocity paddle agitation.'
    },
    {
      id: 'WS-103',
      name: 'Flavor Tumbler',
      stageName: 'Seasoning Drum',
      itemType: 'seasoned',
      icon: 'grain',
      nominalMetric: '2.8% salt',
      metricLabel: 'Dusting Rate',
      tempOrSpeed: '32 rpm',
      status: 'OPTIMAL',
      machineModel: 'FastBack on-machine Seasoning',
      description: 'Rotary tumbling drum applying electrostatic dry salt seasoning.'
    },
    {
      id: 'WS-104',
      name: 'Auto-Bagging & VFFS',
      stageName: 'Pouch Bagging',
      itemType: 'pouch',
      icon: 'inventory_2',
      nominalMetric: '110 bpm',
      metricLabel: 'Pouch Velocity',
      tempOrSpeed: '52g ± 1.5g',
      status: 'OPTIMAL',
      machineModel: 'Ishida Inspira Vertical Bagger',
      description: 'High-speed rotary jaw form-fill-seal with multi-head combination weigher.'
    },
    {
      id: 'WS-105',
      name: 'Case Packer & QC',
      stageName: 'Optical QC Infeed',
      itemType: 'case',
      icon: 'qr_code_scanner',
      nominalMetric: '99.4%',
      metricLabel: 'Optical Read',
      tempOrSpeed: '28 CPM',
      status: 'OPTIMAL',
      machineModel: 'Cognex In-Sight 3800 & Checkweigher',
      description: 'Automated 24-pack case packer with dual-head barcode camera and dynamic scale.'
    },
    {
      id: 'WS-106',
      name: 'Palletizer Outfeed',
      stageName: 'Palletizing Cell',
      itemType: 'pallet',
      icon: 'pallet',
      nominalMetric: 'Tier 5 Stacking',
      metricLabel: 'Pallet Pattern',
      tempOrSpeed: 'Pallet Cell 1',
      status: 'OPTIMAL',
      machineModel: 'Fanuc M-410iB Robotic Palletizer',
      description: 'High-payload robotic palletizing arm with automatic stretch wrapping.'
    },
  ],
  'LINE-02': [
    {
      id: 'WS-201',
      name: 'Milling & Shearing',
      stageName: 'Corn Masa Sheeter',
      itemType: 'raw',
      icon: 'grain',
      nominalMetric: '1.4 mm cut',
      metricLabel: 'Tri-Cut Sheeting',
      tempOrSpeed: '380 kg/hr',
      status: 'OPTIMAL',
      machineModel: 'Casa Herrera Triple Roll Sheeter',
      description: 'Precision roller cutting tortilla triangular chips from prepared corn masa.'
    },
    {
      id: 'WS-202',
      name: 'Baking Oven & Toaster',
      stageName: 'Gas-Fired Toasting',
      itemType: 'cooked',
      icon: 'local_fire_department',
      nominalMetric: '240°C',
      metricLabel: 'Bake Zone',
      tempOrSpeed: '2.1 min dwell',
      status: 'OPTIMAL',
      machineModel: 'Lawrence Equipment Continuous Oven',
      description: 'Triple-pass gas oven pre-toasting chips prior to flash frying.'
    },
    {
      id: 'WS-203',
      name: 'Seasoning Tumbler',
      stageName: 'Cheese Slurry Drum',
      itemType: 'seasoned',
      icon: 'science',
      nominalMetric: '3.4% slurry',
      metricLabel: 'Coating Weight',
      tempOrSpeed: '28 rpm',
      status: 'OPTIMAL',
      machineModel: 'TNA Intact Flavour Applicator',
      description: 'Continuous liquid slurry and powder dusting for Doritos cheese coating.'
    },
    {
      id: 'WS-204',
      name: 'Multi-Packer Unit',
      stageName: 'Bagging Unit',
      itemType: 'pouch',
      icon: 'shopping_bag',
      nominalMetric: '95 bpm',
      metricLabel: 'Bagging Rate',
      tempOrSpeed: '60g ± 1.8g',
      status: 'OPTIMAL',
      machineModel: 'Bosch SVE 2520 Vertical Form-Fill',
      description: 'Continuous motion vertical bagger with gas flushing.'
    },
    {
      id: 'WS-205',
      name: 'Checkweigher & QC',
      stageName: 'Optical Inspection',
      itemType: 'case',
      icon: 'qr_code_scanner',
      nominalMetric: '98.8%',
      metricLabel: 'Read Rate',
      tempOrSpeed: '25 CPM',
      status: 'OPTIMAL',
      machineModel: 'Mettler Toledo C35 Checkweigher',
      description: 'High-precision inline dynamic scale with automated reject diverter.'
    },
    {
      id: 'WS-206',
      name: 'Palletizer Outfeed',
      stageName: 'Pallet Staging',
      itemType: 'pallet',
      icon: 'pallet',
      nominalMetric: '100% pass',
      metricLabel: 'Finished Goods',
      tempOrSpeed: 'Pallet Cell 2',
      status: 'OPTIMAL',
      machineModel: 'Columbia Machine High-Level Palletizer',
      description: 'Continuous high-speed case palletizer feeding warehouse AGVs.'
    },
  ],
  'LINE-03': [
    {
      id: 'WS-301',
      name: 'Dough Extruder',
      stageName: 'Pretzel Extrusion',
      itemType: 'raw',
      icon: 'compress',
      nominalMetric: 'Die #14',
      metricLabel: 'Twist Profile',
      tempOrSpeed: '310 kg/hr',
      status: 'OPTIMAL',
      machineModel: 'Reading Bakery Systems Extruder',
      description: 'Continuous dough extrusion producing uniform pretzel twist shapes.'
    },
    {
      id: 'WS-302',
      name: 'Caustic Bath & Salt',
      stageName: 'Surface Bath',
      itemType: 'cooked',
      icon: 'water_drop',
      nominalMetric: '0.8% NaOH',
      metricLabel: 'Bath Solution',
      tempOrSpeed: 'Coarse Salt Feed',
      status: 'OPTIMAL',
      machineModel: 'RBS Cooker & Salt Dispenser',
      description: 'Warm alkaline dip giving pretzels their signature golden sheen and coarse salt crust.'
    },
    {
      id: 'WS-303',
      name: 'Tunnel Baking Oven',
      stageName: 'Continuous Bake',
      itemType: 'cooked',
      icon: 'local_fire_department',
      nominalMetric: '215°C',
      metricLabel: 'Bake Zone',
      tempOrSpeed: '12 min dry',
      status: 'OPTIMAL',
      machineModel: 'PRONATEC Multi-Zone Tunnel Oven',
      description: 'Multi-zone convection oven and post-bake humidity drying chamber.'
    },
    {
      id: 'WS-304',
      name: 'Weighing & Bagging',
      stageName: 'Pouch Packer',
      itemType: 'pouch',
      icon: 'inventory_2',
      nominalMetric: '85 bpm',
      metricLabel: 'Bagging Rate',
      tempOrSpeed: '100g ± 2g',
      status: 'OPTIMAL',
      machineModel: 'Hassia-Redatron Pouch System',
      description: 'Heavyweight pretzel packaging unit with nitrogen barrier protection.'
    },
    {
      id: 'WS-305',
      name: 'Case Scanner QC',
      stageName: 'Optical Case QC',
      itemType: 'case',
      icon: 'qr_code_scanner',
      nominalMetric: '99.4%',
      metricLabel: 'Barcodes',
      tempOrSpeed: '22 CPM',
      status: 'OPTIMAL',
      machineModel: 'Keyence SR-2000 Vision System',
      description: '360-degree case optical identification and gross weight verifier.'
    },
    {
      id: 'WS-306',
      name: 'Palletizer Outfeed',
      stageName: 'Robotic Stacking',
      itemType: 'pallet',
      icon: 'pallet',
      nominalMetric: 'Tier 4',
      metricLabel: 'Pallet Pattern',
      tempOrSpeed: 'Pallet Cell 3',
      status: 'OPTIMAL',
      machineModel: 'KUKA Pallet Master 180',
      description: 'Automatic pallet loader with corrugated slip sheet placement.'
    },
  ],
  'LINE-04': [
    {
      id: 'WS-401',
      name: 'Corn Meal Mixer',
      stageName: 'Grits Hydration',
      itemType: 'raw',
      icon: 'blender',
      nominalMetric: '14.2% H2O',
      metricLabel: 'Batch Hydration',
      tempOrSpeed: '450 kg/hr',
      status: 'OPTIMAL',
      machineModel: 'Pavan Batch Meal Conditioner',
      description: 'Continuous high-accuracy hydration of corn meal grits.'
    },
    {
      id: 'WS-402',
      name: 'Rotary Extruder',
      stageName: 'High-Shear Puffing',
      itemType: 'cooked',
      icon: 'cyclone',
      nominalMetric: '170 bar',
      metricLabel: 'Extrusion Head',
      tempOrSpeed: 'Curled Collets',
      status: 'OPTIMAL',
      machineModel: 'Wenger TX-85 Twin Screw Extruder',
      description: 'High-pressure thermal flash puffing forming Cheetos and Kurkure curls.'
    },
    {
      id: 'WS-403',
      name: 'Continuous Dryer',
      stageName: 'Moisture Removal',
      itemType: 'cooked',
      icon: 'local_fire_department',
      nominalMetric: '160°C',
      metricLabel: 'Hot Air Bed',
      tempOrSpeed: '<1.2% residual',
      status: 'OPTIMAL',
      machineModel: 'Bühler Aeroglide Conveyor Dryer',
      description: 'Continuous fluid-bed hot air drying for maximum crispiness.'
    },
    {
      id: 'WS-404',
      name: 'Flavor Tumbler',
      stageName: 'Seasoning Drum',
      itemType: 'seasoned',
      icon: 'grain',
      nominalMetric: 'Masala Blend',
      metricLabel: 'Formula Coating',
      tempOrSpeed: '36 rpm',
      status: 'OPTIMAL',
      machineModel: 'TNA Robag Flavouring Drum',
      description: 'Automated powder applicator for fiery cheese and masala flavors.'
    },
    {
      id: 'WS-405',
      name: 'VFFS Bagging & QC',
      stageName: 'Packaging & Vision',
      itemType: 'pouch',
      icon: 'qr_code_scanner',
      nominalMetric: '120 bpm',
      metricLabel: 'Bagging Rate',
      tempOrSpeed: '98.5% confidence',
      status: 'OPTIMAL',
      machineModel: 'Ishida Atlas Multi-Head Bagger',
      description: 'High-velocity bagger with inline seal integrity sensor.'
    },
    {
      id: 'WS-406',
      name: 'Palletizer Outfeed',
      stageName: 'Case Palletizer',
      itemType: 'pallet',
      icon: 'pallet',
      nominalMetric: 'Nominal',
      metricLabel: 'Robotic Cell',
      tempOrSpeed: 'Pallet Cell 4',
      status: 'OPTIMAL',
      machineModel: 'Fanuc Robotic Stacking Cell',
      description: 'End-of-line palletizer feeding final dispatch staging lane.'
    },
  ],
};

const ITEMS_PER_PAGE = 7;

export const LiveConveyor: React.FC<LiveConveyorProps> = ({
  selectedLineId = 'LINE-01',
  setSelectedLineId,
  setActiveTab,
}) => {
  const { token, productionLines, shifts, associates, allocations, workstations } = useApp();

  const [activeLine, setActiveLine] = useState<string>(selectedLineId);
  const [selectedShift, setSelectedShift] = useState<string>('SHIFT-A');
  const [snapshot, setSnapshot] = useState<IConveyorSnapshot | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED'>('DISCONNECTED');
  const [selectedCarton, setSelectedCarton] = useState<IScanEvent | null>(null);
  const [selectedStation, setSelectedStation] = useState<IStationNode | null>(null);
  const [viewMode, setViewMode] = useState<'case_outfeed' | 'line_flow'>('case_outfeed');
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const [timeAgoStr, setTimeAgoStr] = useState<string>('Connecting...');

  // Dynamically map active line workstations from Station Master with fallbacks
  const activeLineWorkstations: IStationNode[] = useMemo(() => {
    const fromMaster = workstations.filter((w) => w.lineId === activeLine);
    if (fromMaster.length > 0) {
      return fromMaster.map((ws, idx) => {
        const fallback = LINE_STATIONS_CONFIG[activeLine]?.[idx];
        return {
          id: ws.id,
          name: ws.name,
          stageName: fallback?.stageName || ws.name,
          itemType: fallback?.itemType || (idx === 0 ? 'raw' : idx === 1 ? 'cooked' : idx === 2 ? 'seasoned' : idx === 3 ? 'pouch' : 'case'),
          icon: fallback?.icon || 'precision_manufacturing',
          nominalMetric: fallback?.nominalMetric || `${ws.minSkillLevel} Staffed`,
          metricLabel: fallback?.metricLabel || 'Station Spec',
          tempOrSpeed: fallback?.tempOrSpeed || 'Optimal Velocity',
          status: 'OPTIMAL' as const,
          machineModel: fallback?.machineModel || 'PepsiCo Standard Processing Unit',
          description: fallback?.description || `Station Master ${ws.id} - ${ws.name}. Required Skill: ${ws.requiredSkillId}.`,
        };
      });
    }
    return LINE_STATIONS_CONFIG[activeLine] || LINE_STATIONS_CONFIG['LINE-01'];
  }, [workstations, activeLine]);

  // Horizontal carton strip queue (Newest on the left, index 0)
  const [cartonStrip, setCartonStrip] = useState<IScanEvent[]>([]);
  const [newlyArrivedId, setNewlyArrivedId] = useState<string | null>(null);
  const [maxVisibleTiles, setMaxVisibleTiles] = useState<number>(14);
  const [isAnimationPaused, setIsAnimationPaused] = useState<boolean>(false);
  const [isSliding, setIsSliding] = useState<boolean>(true);
  const [laserTriggered, setLaserTriggered] = useState<boolean>(false);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pagination for recent scans table
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Simulation controls state (Modal dialog)
  const [simSpeed, setSimSpeed] = useState<number>(30);
  const [simDefectRate, setSimDefectRate] = useState<number>(6);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Interactive Hover state for Hourly Chart
  const [hoveredHour, setHoveredHour] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Sync activeLine when prop changes
  useEffect(() => {
    if (selectedLineId && selectedLineId !== activeLine) {
      setActiveLine(selectedLineId);
      setCurrentPage(1);
    }
  }, [selectedLineId]);

  const handleLineSelect = (lineId: string) => {
    setActiveLine(lineId);
    setCurrentPage(1);
    if (setSelectedLineId) {
      setSelectedLineId(lineId);
    }
  };

  const getStationOperator = (stationId: string) => {
    const alloc = allocations.find(
      (a) => a.workstationId === stationId && a.shiftId === selectedShift
    ) || allocations.find((a) => a.workstationId === stationId);
    
    if (alloc) {
      const assoc = associates.find((ast) => ast.id === alloc.associateId);
      if (assoc) {
        return {
          name: assoc.name,
          category: assoc.category,
          id: assoc.id,
        };
      }
    }

    const defaultOperators: Record<string, { name: string; category: string; id: string }> = {
      'WS-101': { name: 'Rajesh Sharma', category: 'Company', id: 'EMP-1042' },
      'WS-102': { name: 'Praveen Kumar', category: 'Company', id: 'EMP-1088' },
      'WS-103': { name: 'Sunil Verma', category: 'Contract', id: 'EMP-2104' },
      'WS-104': { name: 'Anita Patel', category: 'Company', id: 'EMP-1155' },
      'WS-105': { name: 'Vikram Singh', category: 'NTCI', id: 'EMP-3012' },
      'WS-106': { name: 'Deepak Roy', category: 'Company', id: 'EMP-1290' },

      'WS-201': { name: 'Amit Desai', category: 'Company', id: 'EMP-1301' },
      'WS-202': { name: 'Kavita Joshi', category: 'Company', id: 'EMP-1344' },
      'WS-203': { name: 'Manoj Yadav', category: 'Contract', id: 'EMP-2210' },
      'WS-204': { name: 'Ritu Sen', category: 'Company', id: 'EMP-1405' },
      'WS-205': { name: 'Pooja Nair', category: 'Company', id: 'EMP-1422' },
      'WS-206': { name: 'Sanjay Gupta', category: 'NTCI', id: 'EMP-3105' },

      'WS-301': { name: 'Harish Rao', category: 'Company', id: 'EMP-1502' },
      'WS-302': { name: 'Neha Chawla', category: 'Company', id: 'EMP-1533' },
      'WS-303': { name: 'Gopal Krishnan', category: 'Contract', id: 'EMP-2340' },
      'WS-304': { name: 'Bhavna Dave', category: 'Company', id: 'EMP-1580' },
      'WS-305': { name: 'Kishore Jha', category: 'NTCI', id: 'EMP-3221' },
      'WS-306': { name: 'Santosh Meena', category: 'Company', id: 'EMP-1610' },

      'WS-401': { name: 'Arun Bhat', category: 'Company', id: 'EMP-1704' },
      'WS-402': { name: 'Swati Kulkarni', category: 'Company', id: 'EMP-1725' },
      'WS-403': { name: 'Dinesh Pandey', category: 'Contract', id: 'EMP-2450' },
      'WS-404': { name: 'Priyanka Das', category: 'Company', id: 'EMP-1788' },
      'WS-405': { name: 'Rohit Chauhan', category: 'NTCI', id: 'EMP-3310' },
      'WS-406': { name: 'Mahesh Solanki', category: 'Company', id: 'EMP-1820' },
    };

    return defaultOperators[stationId] || { name: 'Line Specialist', category: 'Company', id: 'EMP-OPS' };
  };

  // 1. Initial Snapshot fetch via REST
  useEffect(() => {
    let isMounted = true;

    const fetchSnapshot = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/v1/conveyor/snapshot?lineId=${activeLine}&shiftId=${selectedShift}`, { headers });
        if (res.ok && isMounted) {
          const data: IConveyorSnapshot = await res.json();
          setSnapshot(data);

          // Populate horizontal strip from recent events (newest on left)
          if (data.recentEvents && data.recentEvents.length > 0) {
            setCartonStrip(data.recentEvents.slice(0, maxVisibleTiles));
          }

          if (data.latestEvent) {
            setLastEventTime(new Date(data.latestEvent.sourceTimestamp));
          }
        }
      } catch (err) {
        console.warn('[ConveyorScanDashboard] Snapshot fetch error:', err);
      }
    };

    fetchSnapshot();

    return () => {
      isMounted = false;
    };
  }, [activeLine, selectedShift, token, maxVisibleTiles]);

  // 2. Real-Time SSE Stream with auto-reconnection and state recovery
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

    const connectSse = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setConnectionStatus('RECONNECTING');

      const sseUrl = token
        ? `/api/v1/conveyor/stream?lineId=${activeLine}&token=${encodeURIComponent(token)}`
        : `/api/v1/conveyor/stream?lineId=${activeLine}`;

      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnectionStatus('CONNECTED');
      };

      // Full snapshot broadcast
      es.addEventListener('snapshot', (event: MessageEvent) => {
        try {
          const snap: IConveyorSnapshot = JSON.parse(event.data);
          setSnapshot(snap);
          if (snap.recentEvents && snap.recentEvents.length > 0) {
            setCartonStrip(snap.recentEvents.slice(0, maxVisibleTiles));
          }
          if (snap.latestEvent) {
            setLastEventTime(new Date(snap.latestEvent.sourceTimestamp));
          }
        } catch (e) {
          console.error('[ConveyorScanDashboard] Error parsing snapshot SSE payload:', e);
        }
      });

      // Individual scan event: Prepend to horizontal belt (newest on the left)
      es.addEventListener('scan-event', (event: MessageEvent) => {
        try {
          const scanEvt: IScanEvent = JSON.parse(event.data);

          // Disregard if event is for another line
          if (scanEvt.lineId !== activeLine) return;

          setLastEventTime(new Date(scanEvt.sourceTimestamp));

          // Trigger optical laser scanner flash
          setLaserTriggered(true);
          setTimeout(() => setLaserTriggered(false), 450);

          if (isAnimationPaused) {
            setCartonStrip((prev) => {
              if (prev.some((c) => c.eventId === scanEvt.eventId)) return prev;
              return [scanEvt, ...prev.slice(0, maxVisibleTiles - 1)];
            });
          } else {
            // Synchronized conveyor belt advance:
            // 1. Instantly prepend new carton and set container to -66px with NO transition.
            // All existing cartons (at x - 66px) remain at their EXACT current screen positions!
            setIsSliding(false);
            setCartonStrip((prev) => {
              if (prev.some((c) => c.eventId === scanEvt.eventId)) return prev;
              return [scanEvt, ...prev.slice(0, maxVisibleTiles)]; // keep +1 so exiting carton slides out
            });
            setNewlyArrivedId(scanEvt.eventId);

            // 2. Next animation frame: enable transform transition to 0px
            // The entire train of cartons glides smoothly rightward in perfect synchrony!
            if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsSliding(true);
              });
            });

            slideTimerRef.current = setTimeout(() => {
              setNewlyArrivedId(null);
              setCartonStrip((prev) => prev.slice(0, maxVisibleTiles));
            }, 550);
          }

          // Reactively update snapshot metrics without re-fetching
          setSnapshot((prev) => {
            if (!prev) return prev;
            const isPass = scanEvt.scanResult === 'PASS';
            const updatedRecent = [scanEvt, ...prev.recentEvents.filter((e) => e.eventId !== scanEvt.eventId)].slice(0, 50);
            const totalScanned = prev.metrics.totalScannedShift + 1;
            const passCount = prev.metrics.passCount + (isPass ? 1 : 0);
            const defectCount = prev.metrics.defectCount + (!isPass ? 1 : 0);
            const passRatePercent = totalScanned > 0 ? Number(((passCount / totalScanned) * 100).toFixed(1)) : 100;

            const updatedExceptions = { ...prev.metrics.exceptions };
            if (scanEvt.scanResult === 'DEFECT_BARCODE') updatedExceptions.defectBarcode++;
            if (scanEvt.scanResult === 'DEFECT_WEIGHT') updatedExceptions.defectWeight++;
            if (scanEvt.scanResult === 'DEFECT_SEAL') updatedExceptions.defectSeal++;
            if (scanEvt.scanResult === 'NO_READ') updatedExceptions.noRead++;

            return {
              ...prev,
              metrics: {
                ...prev.metrics,
                totalScannedShift: totalScanned,
                passCount,
                defectCount,
                passRatePercent,
                exceptions: updatedExceptions,
              },
              recentEvents: updatedRecent,
              latestEvent: scanEvt,
            };
          });
        } catch (e) {
          console.error('[ConveyorScanDashboard] Error handling scan-event SSE:', e);
        }
      });

      es.onerror = () => {
        setConnectionStatus('DISCONNECTED');
        es.close();
        // Auto-reconnect with 3-second delay
        reconnectTimeout = setTimeout(connectSse, 3000);
      };
    };

    connectSse();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [activeLine, token, maxVisibleTiles]);

  // 3. Data Freshness Timer
  useEffect(() => {
    const updateFreshness = () => {
      if (!lastEventTime) {
        setTimeAgoStr('Awaiting first event');
        return;
      }
      const secondsAgo = Math.max(0, Math.floor((Date.now() - lastEventTime.getTime()) / 1000));
      if (secondsAgo < 3) {
        setTimeAgoStr('Just now (Live)');
      } else if (secondsAgo < 60) {
        setTimeAgoStr(`${secondsAgo}s ago`);
      } else {
        const mins = Math.floor(secondsAgo / 60);
        setTimeAgoStr(`${mins}m ago`);
      }
    };

    updateFreshness();
    const interval = setInterval(updateFreshness, 1000);
    return () => clearInterval(interval);
  }, [lastEventTime]);

  // 4. Simulation API Handlers
  const handleSimSpeedChange = async (speed: number) => {
    setSimSpeed(speed);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/v1/conveyor/simulation/speed', {
        method: 'POST',
        headers,
        body: JSON.stringify({ speedCpm: speed }),
      });
      setActionNotice(`Target speed updated to ${speed} CPM`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e: any) {
      console.error('Failed to update simulation speed:', e);
    }
  };

  const handleSimDefectRateChange = async (rate: number) => {
    setSimDefectRate(rate);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/v1/conveyor/simulation/defects', {
        method: 'POST',
        headers,
        body: JSON.stringify({ defectRatePercent: rate }),
      });
      setActionNotice(`Target anomaly rate set to ${rate}%`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e: any) {
      console.error('Failed to update defect rate:', e);
    }
  };

  const handleToggleSimState = async () => {
    const nextState = !isSimRunning;
    setIsSimRunning(nextState);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/v1/conveyor/simulation/state', {
        method: 'POST',
        headers,
        body: JSON.stringify({ running: nextState }),
      });
      setActionNotice(nextState ? 'Simulation resumed' : 'Simulation paused');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e: any) {
      console.error('Failed to toggle simulation state:', e);
    }
  };

  const handleInjectDefect = async (defectType: ScanResult) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/v1/conveyor/simulation/inject', {
        method: 'POST',
        headers,
        body: JSON.stringify({ defectType }),
      });

      setActionNotice(`Injected test defect: ${defectType}`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (e: any) {
      console.error('Failed to inject defect:', e);
    }
  };

  // 5. Outcome Badge Renderer
  const renderStatusBadge = (result: ScanResult, size: 'sm' | 'md' = 'sm') => {
    const isSmall = size === 'sm';
    const baseClass = isSmall
      ? 'px-2 py-0.5 text-[11px] font-semibold rounded-md inline-flex items-center gap-1.5'
      : 'px-2.5 py-1 text-xs font-semibold rounded-md inline-flex items-center gap-1.5';

    switch (result) {
      case 'PASS':
        return (
          <span className={`${baseClass} bg-emerald-50 text-emerald-700 border border-emerald-200`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Accepted
          </span>
        );
      case 'DEFECT_WEIGHT':
        return (
          <span className={`${baseClass} bg-amber-50 text-amber-700 border border-amber-200`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Weight Defect
          </span>
        );
      case 'DEFECT_BARCODE':
        return (
          <span className={`${baseClass} bg-rose-50 text-rose-700 border border-rose-200`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Barcode Read Fail
          </span>
        );
      case 'DEFECT_SEAL':
        return (
          <span className={`${baseClass} bg-purple-50 text-purple-700 border border-purple-200`}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Seal Flap Defect
          </span>
        );
      case 'NO_READ':
      default:
        return (
          <span className={`${baseClass} bg-slate-100 text-slate-700 border border-slate-300`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            No Read / Miss
          </span>
        );
    }
  };


  // Filter events by shift and line
  const allEvents = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.recentEvents;
  }, [snapshot]);

  // Paginated recent scan events
  const totalPages = Math.max(1, Math.ceil(allEvents.length / ITEMS_PER_PAGE));
  const displayedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return allEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [allEvents, currentPage]);

  const isSimulatedMode = snapshot?.isSimulated ?? true;
  const isConnected = connectionStatus === 'CONNECTED';

  // KPI Metrics with defined backend calculations
  const totalScanned = snapshot?.metrics.totalScannedShift ?? 0;
  const targetShiftScans = snapshot?.metrics.targetShiftScans ?? 1500;
  const shiftProgressPercent = Math.min(100, Math.round((totalScanned / targetShiftScans) * 100));

  const cpm = snapshot?.metrics.cartonsPerMinute ?? (isSimulatedMode ? simSpeed : 0);
  const fpyPercent = snapshot?.metrics.firstPassYieldPercent ?? 98.4;
  const fpyTargetPercent = snapshot?.metrics.fpyTargetPercent ?? 98.0;
  const isFpyHealthy = fpyPercent >= fpyTargetPercent;

  const defectCount = snapshot?.metrics.defectCount ?? 0;
  const defectRatePercent = totalScanned > 0 ? Number(((defectCount / totalScanned) * 100).toFixed(1)) : 0;

  // Hourly production data for stacked bar chart
  const hourlyData = snapshot?.hourlyProduction ?? [];
  const maxHourlyVolume = useMemo(() => {
    if (hourlyData.length === 0) return 200;
    return Math.max(100, ...hourlyData.map((d) => d.total));
  }, [hourlyData]);

  // Brand Mix breakdown
  const brandMixData = snapshot?.brandMix ?? [];

  // Active Latest Carton Spotlight
  const latestCarton = snapshot?.latestEvent || cartonStrip[0] || null;
  const latestBrandStyle = latestCarton ? getBrandMeta(latestCarton) : BRAND_CONFIG["Lay's"];

  return (
    <div className="flex-1 h-full flex flex-col overflow-y-auto bg-slate-50/80 text-slate-800 font-sans select-none">
      
      {/* 1. ELEVATED ENTERPRISE COCKPIT HEADER */}
      <header className="px-6 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200/90 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-2xs">
        {/* Title & Facility Scope */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Conveyor Scan Dashboard</h1>
              {isSimulatedMode ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300/80 inline-flex items-center gap-1 shadow-2xs">
                  <span className="material-symbols-outlined text-[12px] text-amber-600">science</span>
                  SIMULATION MODE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300/80 inline-flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE FACTORY
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Zone 4 Packaging &amp; High-Speed Optical Case QC • Kolkata Plant
            </p>
          </div>
        </div>

        {/* Controls: Line Tabs, Shift Selector, Stream Status, Simulation Modal */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Production Line Tabs */}
          <div className="inline-flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs shadow-inner">
            {(productionLines.length > 0 ? productionLines : [
              { id: 'LINE-01', name: 'Line 01 - Potato Chips' },
              { id: 'LINE-02', name: 'Line 02 - Tortilla Chips' },
              { id: 'LINE-03', name: 'Line 03 - Pretzels' },
              { id: 'LINE-04', name: 'Line 04 - Extruded' }
            ]).map((line) => {
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
              onChange={(e) => {
                setSelectedShift(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs transition-colors"
            >
              {(shifts.length > 0 ? shifts : [
                { id: 'SHIFT-A', name: 'Shift A' },
                { id: 'SHIFT-B', name: 'Shift B' },
                { id: 'SHIFT-C', name: 'Shift C' }
              ]).map((s) => (
                <option key={s.id} value={s.id}>{s.name || s.id}</option>
              ))}
            </select>
            <span className="material-symbols-outlined text-slate-500 text-sm absolute right-2 top-2 pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Stream Connection & Data Freshness */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50 text-xs shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-bold text-slate-700">
              {isConnected ? 'Stream Active' : 'Disconnected'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-500 font-medium" title="Time since last scan trigger">
              {timeAgoStr}
            </span>
          </div>

          {/* Box Donut Line Process Loop Button */}
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('line_loop')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-2xs hover:shadow-xs transition-all cursor-pointer font-bold"
              title="Open the full Box Donut Line Process Loop"
            >
              <span className="material-symbols-outlined text-sm text-blue-600">schema</span>
              <span>Box Donut Loop ➔</span>
            </button>
          )}

          {/* Simulation Lab Button */}
          <button
            onClick={() => setShowSimModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            title="Configure simulation speed, anomaly rates, and inject test defects"
          >
            <span className="material-symbols-outlined text-sm text-slate-600">tune</span>
            Simulation Lab
          </button>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="mx-6 mt-3 px-4 py-2.5 bg-blue-50/95 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-sm text-blue-600">info</span>
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-blue-500 hover:text-blue-800 cursor-pointer text-xs font-bold px-1">✕</button>
        </div>
      )}

      {/* 2. FOUR PRIMARY KPI CARDS (EXECUTIVE DASHBOARD COCKPIT) */}
      <section className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* KPI 1: Total Cartons Scanned */}
        <div className="bg-white border border-slate-200/90 border-t-2 border-t-blue-500 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Shift Cartons Scanned
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-base">inventory_2</span>
            </div>
          </div>
          <div className="my-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {totalScanned.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">units</span>
            </div>
            {/* Target Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden p-0.5 border border-slate-200/60">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${shiftProgressPercent}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
            <span>Target: {targetShiftScans.toLocaleString()}</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{shiftProgressPercent}% complete</span>
          </div>
        </div>

        {/* KPI 2: Cartons Per Minute (Throughput) */}
        <div className="bg-white border border-slate-200/90 border-t-2 border-t-cyan-500 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Current Throughput
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
              <span className="material-symbols-outlined text-base">speed</span>
            </div>
          </div>
          <div className="my-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-600 tracking-tight font-mono">
                {cpm}
              </span>
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">CPM</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Rolling 60-second infeed telemetry
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 pt-2 border-t border-slate-100 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 font-semibold">Nominal Velocity (25 - 35 CPM)</span>
          </div>
        </div>

        {/* KPI 3: First-Pass Yield (FPY) */}
        <div className="bg-white border border-slate-200/90 border-t-2 border-t-emerald-500 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              First-Pass Yield (FPY)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-base">verified</span>
            </div>
          </div>
          <div className="my-2.5">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono tracking-tight ${isFpyHealthy ? 'text-emerald-700' : 'text-amber-600'}`}>
                {fpyPercent}%
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pass Rate</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              First inspection attempt per unique case
            </p>
          </div>
          <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-100 font-medium">
            <span className="text-slate-500">Target: &gt; {fpyTargetPercent}%</span>
            <span className={`font-bold px-2 py-0.5 rounded-full ${isFpyHealthy ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {isFpyHealthy ? 'Target Satisfied' : 'Attention Required'}
            </span>
          </div>
        </div>

        {/* KPI 4: Rejections & Exceptions */}
        <div className="bg-white border border-slate-200/90 border-t-2 border-t-rose-500 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Scan Exceptions / Rejects
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <span className="material-symbols-outlined text-base">cancel</span>
            </div>
          </div>
          <div className="my-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 font-mono tracking-tight">
                {defectCount}
              </span>
              <span className="text-xs font-bold text-rose-700">
                ({defectRatePercent}% defect rate)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Diverted automatically to rework loop
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600 pt-2 border-t border-slate-100 font-medium">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded">Barcodes: {snapshot?.metrics.exceptions.defectBarcode ?? 0}</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded">Weight: {snapshot?.metrics.exceptions.defectWeight ?? 0}</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded">Seals: {snapshot?.metrics.exceptions.defectSeal ?? 0}</span>
          </div>
        </div>
      </section>

      {/* 3. DUAL-MODE CONVEYOR BELT: CASE OUTFEED & MULTI-STATION LINE PROCESS FLOW */}
      <section className="mx-6 mb-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col shrink-0 hover:shadow-sm transition-shadow">
        {/* Belt Header: Title, Mode Switcher, & Animation Controls */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                {viewMode === 'case_outfeed' ? 'Case Outfeed Conveyor' : 'Production Line Stations & Conveyor Flow'}
              </h2>
            </div>

            {/* View Switcher Pill */}
            <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs shadow-inner">
              <button
                onClick={() => setViewMode('case_outfeed')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  viewMode === 'case_outfeed'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span className="material-symbols-outlined text-xs">inventory_2</span>
                Final Case Outfeed
              </button>
              <button
                onClick={() => setViewMode('line_flow')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  viewMode === 'line_flow'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span className="material-symbols-outlined text-xs">precision_manufacturing</span>
                Full Line Stations Flow ({activeLineWorkstations.length} Stations)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {viewMode === 'case_outfeed' ? (
              /* Tile Capacity Control for Case Outfeed */
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60">
                <span className="text-[11px] px-2 font-medium text-slate-500">Capacity:</span>
                {[10, 14, 18, 22].map((num) => (
                  <button
                    key={num}
                    onClick={() => setMaxVisibleTiles(num)}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      maxVisibleTiles === num
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            ) : (
              /* Station Flow Badges */
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100/80 px-3 py-1 rounded-xl border border-slate-200/70">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>6/6 Workstations Synchronized</span>
              </div>
            )}

            {/* Pause Animation Toggle */}
            <button
              onClick={() => setIsAnimationPaused(!isAnimationPaused)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isAnimationPaused 
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' 
                  : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 shadow-2xs'
              }`}
              title="Pause or resume conveyor belt motion"
            >
              <span className="material-symbols-outlined text-xs">
                {isAnimationPaused ? 'play_arrow' : 'pause'}
              </span>
              {isAnimationPaused ? 'Resume Motion' : 'Pause Motion'}
            </button>
          </div>
        </div>

        {/* VIEW MODE 1: REFERENCE-MATCHED FINAL CASE OUTFEED CONVEYOR BELT */}
        {viewMode === 'case_outfeed' && (
          <>
            <div 
              className={`conveyor-belt-surface relative rounded-xl border border-slate-300/80 px-3 py-2.5 flex items-center overflow-x-hidden min-h-[76px] shadow-inner select-none transition-all ${
                isAnimationPaused ? 'paused' : ''
              }`}
            >
              {/* Optical QC Scanner Laser Sensor at Infeed (Left) */}
              <div className="absolute left-2.5 top-0 bottom-0 w-2 z-20 pointer-events-none flex flex-col items-center justify-between py-1">
                <div className="w-2.5 h-1.5 bg-slate-800 rounded-b border border-slate-600 flex items-center justify-center">
                  <div className={`w-1 h-1 rounded-full ${laserTriggered ? 'bg-cyan-300 animate-ping' : 'bg-cyan-500/80'}`} />
                </div>
                <div 
                  className={`w-[2px] h-full transition-all duration-300 ${
                    laserTriggered 
                      ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee,0_0_24px_#06b6d4] opacity-100 animate-laser-pulse' 
                      : 'bg-cyan-500/25 opacity-40 shadow-[0_0_3px_#06b6d4]'
                  }`} 
                />
                <div className="w-2.5 h-1.5 bg-slate-800 rounded-t border border-slate-600" />
              </div>

              {cartonStrip.length === 0 ? (
                <div className="w-full h-12 flex items-center justify-center text-slate-400 text-xs font-mono">
                  Waiting for carton infeed triggers from {activeLine}...
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 shrink-0 will-change-transform"
                  style={{
                    transform: isSliding ? 'translateX(0px)' : 'translateX(-66px)',
                    transition: isSliding ? 'transform 480ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                  }}
                >
                  {cartonStrip.map((carton) => {
                    const brand = getBrandMeta(carton);
                    const isPass = carton.scanResult === 'PASS';
                    const serialSuffix = carton.cartonId.slice(-4);
                    const isNew = carton.eventId === newlyArrivedId;

                    return (
                      <div
                        key={carton.eventId}
                        onClick={() => setSelectedCarton(carton)}
                        className={`w-[58px] h-[52px] shrink-0 cursor-pointer carton-box flex flex-col items-center justify-center relative select-none ${
                          isNew ? 'ring-2 ring-white/90 shadow-md' : ''
                        }`}
                        style={{
                          backgroundColor: brand.bgHex,
                        }}
                        title={`Carton #${serialSuffix} • ${brand.brand} • ${carton.scanResult} (Click to inspect)`}
                      >
                        {/* Brand 3-letter Code (LAY, CHE, KUR, DOR) */}
                        <span
                          className="text-[12px] font-black tracking-tight leading-none drop-shadow-xs"
                          style={{ color: brand.textHex }}
                        >
                          {brand.code}
                        </span>

                        {/* 4-digit Carton Serial Suffix (9462) */}
                        <span
                          className="text-[10px] font-mono font-bold leading-none mt-1 opacity-90"
                          style={{ color: brand.textHex }}
                        >
                          {serialSuffix}
                        </span>

                        {/* Defect indicator badge if rejected */}
                        {!isPass && (
                          <span 
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-600 border border-white flex items-center justify-center text-[9px] text-white font-bold shadow-xs animate-pulse" 
                            title={`Reject: ${carton.scanResult}`}
                          >
                            !
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Palletizer Outfeed Runway Continuation to the Right */}
              <div className="flex-1 min-w-[120px] h-[52px] flex items-center justify-end pr-3 pointer-events-none select-none">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500/75 uppercase tracking-widest">
                  <span>Palletizer Outfeed</span>
                  <span className="text-slate-400 font-black animate-chevrons text-[11px]">
                    &gt;&gt;&gt;
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-caption below the belt track */}
            <div className="flex flex-wrap justify-between items-center text-[11px] text-slate-600 mt-2.5 px-1 gap-2">
              <div className="font-mono text-slate-700 font-medium">
                {latestCarton ? (
                  <span>
                    Last scan {latestCarton.cartonId} · {latestCarton.metadata?.productName || latestCarton.sku} · {activeLine.replace('LINE-0', 'Line ').replace('LINE-', 'Line ')} · {new Date(latestCarton.sourceTimestamp).toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                ) : (
                  <span className="text-slate-400">Waiting for live scan events...</span>
                )}
              </div>

              {/* Compact Brand Legend */}
              <div className="flex flex-wrap items-center gap-3.5 text-[11px]">
                {Object.values(BRAND_CONFIG).map((b) => (
                  <span key={b.brand} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm shadow-2xs" style={{ backgroundColor: b.bgHex }} />
                    <span className="text-slate-600 font-semibold">{b.code}: {b.brand}</span>
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* VIEW MODE 2: FULL PRODUCTION LINE STATIONS & INTERMEDIATE PRODUCT CONVEYOR BELT */}
        {viewMode === 'line_flow' && (
          <div className="flex flex-col gap-3">
            <div className="w-full overflow-x-auto pb-2 rounded-2xl">
              <div className="min-w-[1100px] bg-slate-900 rounded-2xl border border-slate-800 p-4 relative shadow-xl">
                {/* Industrial Yellow/Black Safety Striping Top and Bottom */}
                <div className="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_8px,#0f172a_8px,#0f172a_16px)] rounded-t-2xl opacity-90" />
                <div className="absolute inset-x-0 bottom-0 h-1 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_8px,#0f172a_8px,#0f172a_16px)] rounded-b-2xl opacity-90" />

                {/* Continuous Multi-Station Flow */}
                <div className="flex items-center justify-between gap-2 py-2">
                  {activeLineWorkstations.map((st, idx, arr) => {
                    const op = getStationOperator(st.id);
                    const isLast = idx === arr.length - 1;

                    return (
                      <React.Fragment key={st.id}>
                        {/* Station Workstation Node Card */}
                        <div
                          onClick={() => setSelectedStation(st)}
                          className="w-[148px] shrink-0 bg-slate-800/95 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500 rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all shadow-md hover:shadow-blue-500/20 hover:-translate-y-0.5 group"
                          title={`Click to inspect ${st.name} diagnostics`}
                        >
                          {/* Station Step & Status */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-400 transition-colors">
                              Station 0{idx + 1}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {st.status}
                            </span>
                          </div>

                          {/* Station Icon & Title */}
                          <div className="flex items-start gap-2 mb-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-500/25 group-hover:text-cyan-300 transition-colors">
                              <span className="material-symbols-outlined text-base">{st.icon}</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate leading-tight group-hover:text-blue-200">
                                {st.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                {st.stageName}
                              </p>
                            </div>
                          </div>

                          {/* Machine Telemetry Gauges */}
                          <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-700/60 flex flex-col gap-1 text-[10px] mb-2 font-mono">
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="truncate">{st.metricLabel}:</span>
                              <span className="font-bold text-cyan-300 shrink-0">{st.nominalMetric}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Setting:</span>
                              <span className="text-emerald-300 font-semibold truncate max-w-[70px]" title={st.tempOrSpeed}>
                                {st.tempOrSpeed}
                              </span>
                            </div>
                          </div>

                          {/* Operator On Duty */}
                          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-4 h-4 rounded-full bg-blue-600/40 text-blue-300 font-bold text-[9px] flex items-center justify-center border border-blue-500/40 shrink-0">
                                {op.name.charAt(0)}
                              </span>
                              <span className="text-slate-300 font-medium truncate max-w-[72px]" title={op.name}>
                                {op.name.split(' ')[0]}
                              </span>
                            </div>
                            <span className="text-[8px] px-1 py-0.2 bg-slate-700/80 text-slate-300 rounded font-mono shrink-0">
                              {op.category}
                            </span>
                          </div>
                        </div>

                        {/* Animated Conveyor Bridge Between Workstations */}
                        {!isLast && (
                          <div className="flex-1 min-w-[50px] max-w-[85px] flex flex-col items-center justify-center px-1">
                            {/* Conveyor Belt Track with Animated Product Stream */}
                            <div 
                              className={`w-full h-[46px] rounded-lg border border-slate-700 bg-slate-950 relative overflow-hidden flex items-center justify-center shadow-inner ${
                                isAnimationPaused ? 'paused' : ''
                              }`}
                            >
                              {/* Moving Conveyor Belt Texture */}
                              <div className={`absolute inset-0 conveyor-belt-surface opacity-80 ${isAnimationPaused ? 'paused' : ''}`} />

                              {/* Stage-Specific Product Flowing Left to Right */}
                              {st.itemType === 'raw' && (
                                <>
                                  <div className={`absolute ${isAnimationPaused ? '' : 'animate-belt-flow'}`}>
                                    <div className="item-raw-slice shadow-xs" title="Raw sliced batch feed" />
                                  </div>
                                  <div className={`absolute ${isAnimationPaused ? '' : 'animate-belt-flow-delayed'}`}>
                                    <div className="item-raw-slice shadow-xs scale-90" />
                                  </div>
                                </>
                              )}

                              {st.itemType === 'cooked' && (
                                <>
                                  <div className={`absolute ${isAnimationPaused ? '' : 'animate-belt-flow'}`}>
                                    <div className="item-cooked-chip shadow-xs" title="Golden fried / baked chips" />
                                  </div>
                                  <div className={`absolute ${isAnimationPaused ? '' : 'animate-belt-flow-delayed'}`}>
                                    <div className="item-cooked-chip shadow-xs scale-90" />
                                  </div>
                                </>
                              )}

                              {st.itemType === 'seasoned' && (
                                <>
                                  <div className={`absolute ${isAnimationPaused ? '' : 'animate-belt-flow'}`}>
                                    <div className="item-seasoned-chip shadow-xs" title="Flavored & seasoned crisps" />
                                  </div>
                                  <div className={`absolute ${isAnimationPaused ? '' : 'animate-belt-flow-delayed'}`}>
                                    <div className="item-seasoned-chip shadow-xs scale-90" />
                                  </div>
                                </>
                              )}

                              {st.itemType === 'pouch' && (
                                <div className={`absolute ${isAnimationPaused ? '' : 'animate-belt-flow'}`}>
                                  <div 
                                    className="item-snack-pouch shadow-xs bg-amber-500 text-amber-950" 
                                    title="Automated nitrogen-sealed pouches"
                                  >
                                    {activeLine === 'LINE-02' ? 'DOR' : activeLine === 'LINE-03' ? 'ROL' : activeLine === 'LINE-04' ? 'CHE' : 'LAY'}
                                  </div>
                                </div>
                              )}

                              {st.itemType === 'case' && (
                                <div className={`absolute ${isAnimationPaused ? '' : 'animate-belt-flow'}`}>
                                  <div 
                                    className="w-[28px] h-[22px] carton-box bg-amber-600 rounded-xs flex items-center justify-center text-[7px] font-black text-amber-950 shadow-xs"
                                    title="Packed shipper carton moving to palletizer"
                                  >
                                    BOX
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Velocity & Direction Indicator */}
                            <div className="flex items-center gap-1 mt-1 text-[9px] font-mono font-bold text-blue-400/90 tracking-widest">
                              <span className="animate-pulse">➔</span>
                              <span>FEED</span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Station Flow Summary Caption */}
            <div className="flex flex-wrap justify-between items-center text-[11px] text-slate-600 px-1 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {productionLines.find(l => l.id === activeLine)?.name || activeLine} Process Topology
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">
                  Full transformation: Raw Infeed ➔ Processing ➔ Packaging ➔ Palletized Finished Goods
                </span>
              </div>
              <div className="text-slate-500 font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-blue-600">info</span>
                <span>Click any station card to inspect machine diagnostics & operator allocation</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. ANALYTICS ROW: STACKED BAR CHART & BRAND MIX / DIGITAL TWIN SPOTLIGHT */}
      <section className="px-6 mb-5 grid grid-cols-1 lg:grid-cols-12 gap-5 shrink-0">
        
        {/* Left Column (7 cols): Stacked Bar Chart (Cartons Per Hour by Brand) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-600">bar_chart</span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Hourly Production Output by Brand
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Shift {selectedShift}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Real-time carton volume segmented across PepsiCo packaging lines
              </p>
            </div>

            {/* Legend for Chart */}
            <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
              {Object.values(BRAND_CONFIG).slice(0, 4).map((b) => (
                <span key={b.brand} className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs shadow-2xs" style={{ backgroundColor: b.accentHex }} />
                  <span className="text-slate-600">{b.brand}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-200/80 relative">
            {hourlyData.map((slot) => {
              const laysCount = slot.byBrand["Lay's"] || 0;
              const kurkureCount = slot.byBrand["Kurkure"] || 0;
              const doritosCount = slot.byBrand["Doritos"] || 0;
              const cheetosCount = slot.byBrand["Cheetos"] || 0;
              const rufflesCount = slot.byBrand["Ruffles"] || 0;
              const roldGoldCount = slot.byBrand["Rold Gold"] || 0;

              const totalSlot = slot.total > 0 ? slot.total : (laysCount + kurkureCount + doritosCount + cheetosCount + rufflesCount + roldGoldCount);
              const totalHeightPercent = Math.min(100, Math.max(12, Math.round((totalSlot / maxHourlyVolume) * 100)));

              const isHovered = hoveredHour === slot.hour;

              return (
                <div
                  key={slot.hour}
                  onMouseEnter={() => setHoveredHour(slot.hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Floating Glassmorphic Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2.5 bg-slate-900/95 backdrop-blur-md text-white text-[10px] rounded-xl p-2.5 shadow-xl z-30 pointer-events-none w-36 font-sans border border-slate-700/80 animate-scaleUp">
                      <div className="font-bold border-b border-slate-700/80 pb-1 mb-1.5 flex justify-between items-center">
                        <span className="text-slate-300">{slot.hour}</span>
                        <span className="text-white font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">{totalSlot} units</span>
                      </div>
                      <div className="flex flex-col gap-1 text-[10px]">
                        {laysCount > 0 && <div className="flex justify-between text-amber-300"><span>Lay's:</span><span className="font-mono font-bold">{laysCount}</span></div>}
                        {kurkureCount > 0 && <div className="flex justify-between text-red-400"><span>Kurkure:</span><span className="font-mono font-bold">{kurkureCount}</span></div>}
                        {doritosCount > 0 && <div className="flex justify-between text-blue-300"><span>Doritos:</span><span className="font-mono font-bold">{doritosCount}</span></div>}
                        {cheetosCount > 0 && <div className="flex justify-between text-purple-300"><span>Cheetos:</span><span className="font-mono font-bold">{cheetosCount}</span></div>}
                        {rufflesCount > 0 && <div className="flex justify-between text-sky-300"><span>Ruffles:</span><span className="font-mono font-bold">{rufflesCount}</span></div>}
                        {roldGoldCount > 0 && <div className="flex justify-between text-amber-500"><span>Rold Gold:</span><span className="font-mono font-bold">{roldGoldCount}</span></div>}
                      </div>
                    </div>
                  )}

                  {/* Total Value Above Bar */}
                  <span className={`text-[10px] font-mono font-bold mb-1 transition-all ${isHovered ? 'text-blue-600 scale-110' : 'text-slate-600'}`}>
                    {totalSlot}
                  </span>

                  {/* Stacked Vertical Bar */}
                  <div 
                    className={`w-full max-w-[42px] rounded-t-md flex flex-col justify-end overflow-hidden transition-all duration-300 shadow-2xs ${
                      isHovered ? 'ring-2 ring-blue-500 shadow-md scale-y-[1.02]' : 'hover:brightness-105'
                    }`}
                    style={{ height: `${totalHeightPercent}%` }}
                  >
                    {/* Rold Gold Segment */}
                    {roldGoldCount > 0 && (
                      <div 
                        style={{ 
                          height: `${(roldGoldCount / totalSlot) * 100}%`,
                          backgroundColor: BRAND_CONFIG["Rold Gold"].accentHex 
                        }} 
                      />
                    )}
                    {/* Ruffles Segment */}
                    {rufflesCount > 0 && (
                      <div 
                        style={{ 
                          height: `${(rufflesCount / totalSlot) * 100}%`,
                          backgroundColor: BRAND_CONFIG["Ruffles"].accentHex 
                        }} 
                      />
                    )}
                    {/* Cheetos Segment */}
                    {cheetosCount > 0 && (
                      <div 
                        style={{ 
                          height: `${(cheetosCount / totalSlot) * 100}%`,
                          backgroundColor: BRAND_CONFIG["Cheetos"].accentHex 
                        }} 
                      />
                    )}
                    {/* Doritos Segment */}
                    {doritosCount > 0 && (
                      <div 
                        style={{ 
                          height: `${(doritosCount / totalSlot) * 100}%`,
                          backgroundColor: BRAND_CONFIG["Doritos"].accentHex 
                        }} 
                      />
                    )}
                    {/* Kurkure Segment */}
                    {kurkureCount > 0 && (
                      <div 
                        style={{ 
                          height: `${(kurkureCount / totalSlot) * 100}%`,
                          backgroundColor: BRAND_CONFIG["Kurkure"].accentHex 
                        }} 
                      />
                    )}
                    {/* Lay's Segment */}
                    {laysCount > 0 && (
                      <div 
                        style={{ 
                          height: `${(laysCount / totalSlot) * 100}%`,
                          backgroundColor: BRAND_CONFIG["Lay's"].accentHex 
                        }} 
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis Hour Labels */}
          <div className="flex justify-between items-center pt-2.5 text-[10px] font-mono text-slate-500 font-semibold">
            {hourlyData.map((slot) => (
              <span key={slot.hour} className="flex-1 text-center">
                {slot.hour}
              </span>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Brand Mix Summary & Digital Twin Spotlight */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Card 1: Brand / Product Mix Summary */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-purple-600">pie_chart</span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Brand / Product Packaging Mix
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Shift volume distribution by PepsiCo brand SKU
              </p>
            </div>

            {/* Horizontal Distribution Progress Bar */}
            <div className="w-full h-3.5 rounded-full overflow-hidden flex my-3 bg-slate-100 p-0.5 border border-slate-200/60 shadow-inner">
              {brandMixData.map((item) => (
                <div
                  key={item.brand}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  title={`${item.brand}: ${item.percentage}% (${item.count} units)`}
                />
              ))}
            </div>

            {/* Brand Item Breakdown List */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {brandMixData.slice(0, 4).map((item) => (
                <div key={item.brand} className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between shadow-2xs hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-800 text-[11px]">{item.brand}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Active Scan Spotlight (Digital Twin View) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Digital Twin Case Spotlight
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                  Latest Infeed Verified on {activeLine}
                </h4>
              </div>
              {latestCarton && renderStatusBadge(latestCarton.scanResult)}
            </div>

            {latestCarton ? (
              <div className="my-2.5 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col gap-2.5 shadow-2xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {/* Mini 3D preview */}
                    <div 
                      className="w-7 h-6 rounded-md carton-box flex items-center justify-center text-[9px] font-black"
                      style={{ backgroundColor: latestBrandStyle.bgHex, color: latestBrandStyle.textHex }}
                    >
                      {latestBrandStyle.code}
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 tracking-tight">
                      {latestCarton.cartonId}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${latestBrandStyle.badgeClass} shadow-2xs`}>
                    {latestBrandStyle.brand}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-slate-200/60 text-slate-600 font-medium">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Weight</span>
                    <span className="font-mono font-bold text-slate-800">
                      {latestCarton.metadata?.measuredWeightKg ? `${latestCarton.metadata.measuredWeightKg} kg` : '1.55 kg'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Confidence</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {latestCarton.metadata?.opticalConfidenceScore ? `${latestCarton.metadata.opticalConfidenceScore}%` : '98.4%'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Timestamp</span>
                    <span className="font-mono font-bold text-slate-800">
                      {new Date(latestCarton.sourceTimestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                Awaiting first carton infeed trigger...
              </div>
            )}

            {latestCarton && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setSelectedCarton(latestCarton)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Inspect Quality Ledger
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 5. RECENT SCAN-EVENT TABLE (ENTERPRISE AUDIT LEDGER) */}
      <section className="mx-6 mb-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col shrink-0 hover:shadow-sm transition-shadow">
        {/* Table Header */}
        <div className="px-5 py-3.5 border-b border-slate-200/90 flex flex-wrap justify-between items-center gap-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-700 text-lg">receipt_long</span>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Scan Events ({allEvents.length} recorded on {activeLine})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Real-time optical inspection ledger for Shift {selectedShift}
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 text-[11px] font-bold border-b border-slate-200/80 uppercase tracking-wider">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Carton Serial (SSCC-18)</th>
                <th className="py-3 px-5">Brand / SKU</th>
                <th className="py-3 px-5">Batch Code</th>
                <th className="py-3 px-5">Measured Weight</th>
                <th className="py-3 px-5">Inspection Outcome</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-slate-300">hourglass_empty</span>
                      <p className="text-xs text-slate-500 font-medium">Awaiting carton scans on Line {activeLine}...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedEvents.map((evt) => {
                  const formattedTime = new Date(evt.sourceTimestamp).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const brand = getBrandMeta(evt);

                  return (
                    <tr
                      key={evt.eventId}
                      onClick={() => setSelectedCarton(evt)}
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-5 font-mono text-slate-600 font-medium">{formattedTime}</td>
                      <td className="py-3 px-5 font-mono font-bold text-slate-900">{evt.cartonId}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${brand.badgeClass}`}>
                            {brand.brand}
                          </span>
                          <span className="text-slate-700 font-medium">{evt.sku || 'LAY-CLS-52G'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-600">{evt.batchNumber || 'LOT-2026-B01'}</td>
                      <td className="py-3 px-5 font-mono text-slate-700 font-medium">
                        {evt.metadata?.measuredWeightKg ? `${evt.metadata.measuredWeightKg} kg` : '1.55 kg'}
                      </td>
                      <td className="py-3 px-5">{renderStatusBadge(evt.scanResult)}</td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCarton(evt);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {allEvents.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 bg-white">
            <span>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, allEvents.length)} of {allEvents.length} events
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1 rounded border text-xs font-semibold ${
                  currentPage <= 1
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer bg-white'
                }`}
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-700 px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`px-3 py-1 rounded border text-xs font-semibold ${
                  currentPage >= totalPages
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer bg-white'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 6. CARTON FORENSIC INSPECTION MODAL */}
      {selectedCarton && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-600 text-xl">barcode_scanner</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Carton Quality Inspection Report</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{selectedCarton.cartonId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCarton(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4 text-xs text-slate-700">
              {/* Outcome Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold block">Inspection Outcome</span>
                  <div className="mt-1">{renderStatusBadge(selectedCarton.scanResult, 'md')}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold block">Production Line</span>
                  <span className="text-sm font-bold text-slate-900">{selectedCarton.lineId} • {selectedCarton.shiftId || 'SHIFT-A'}</span>
                </div>
              </div>

              {/* Barcode Graphic Representation */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-0.5 h-11 w-full max-w-xs">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-full bg-slate-900"
                      style={{
                        width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px`,
                        opacity: selectedCarton.scanResult === 'DEFECT_BARCODE' && i > 18 && i < 32 ? 0.15 : 1,
                      }}
                    />
                  ))}
                </div>
                <span className="mt-2 text-xs font-mono font-bold text-slate-900 tracking-wider">
                  {selectedCarton.cartonId}
                </span>
                <span className="text-[10px] text-slate-500">Standard GS1-128 / SSCC-18 Carton Serial</span>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Product Description</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">
                    {selectedCarton.metadata?.productName || "Lay's Classic Salted"}
                  </span>
                  <span className="text-[11px] text-slate-600 font-mono">SKU: {selectedCarton.sku || 'LAY-CLS-52G'}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Lot Batch Code</span>
                  <span className="font-bold text-slate-900 mt-0.5 block font-mono">
                    {selectedCarton.batchNumber || 'LOT-2026-B01'}
                  </span>
                  <span className="text-[11px] text-slate-600 font-mono">Station: {selectedCarton.stationId || 'WS-104'}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Checkweigher Scale</span>
                  <span className="font-bold text-slate-900 mt-0.5 block font-mono">
                    {selectedCarton.metadata?.measuredWeightKg ? `${selectedCarton.metadata.measuredWeightKg} kg` : '1.55 kg'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Nominal: {selectedCarton.metadata?.nominalWeightKg ? `${selectedCarton.metadata.nominalWeightKg} kg` : '1.55 kg'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Optical Read Confidence</span>
                  <span className="font-bold text-slate-900 mt-0.5 block font-mono">
                    {selectedCarton.metadata?.opticalConfidenceScore ? `${selectedCarton.metadata.opticalConfidenceScore}%` : '98.4%'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Device: {selectedCarton.scannerId || 'SIM-SCANNER-QC01'}</span>
                </div>
              </div>

              {/* Defect Rationale Note */}
              {selectedCarton.metadata?.defectReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                  <span className="text-[11px] font-bold uppercase tracking-wide block text-rose-700">
                    Defect Analysis &amp; Corrective Action:
                  </span>
                  <p className="mt-1 text-xs leading-relaxed text-rose-800">
                    {selectedCarton.metadata.defectReason}
                  </p>
                </div>
              )}

              {/* Event Metadata Footer */}
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex justify-between font-mono">
                <span>Event: {selectedCarton.eventId}</span>
                <span>Timestamp: {new Date(selectedCarton.sourceTimestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCarton(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors shadow-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. WORKSTATION DIAGNOSTICS & TELEMETRY MODAL */}
      {selectedStation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
                  <span className="material-symbols-outlined text-2xl">{selectedStation.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-300">{selectedStation.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {selectedStation.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">{selectedStation.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedStation(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              {/* Description & Machine Spec */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Equipment Specification
                </span>
                <p className="font-bold text-slate-900 text-sm">{selectedStation.machineModel}</p>
                <p className="text-slate-600 mt-1 leading-relaxed text-xs">{selectedStation.description}</p>
              </div>

              {/* Real-time Telemetry Grid */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                  Real-time Operational Telemetry
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">{selectedStation.metricLabel}</span>
                    <span className="text-xl font-black font-mono text-blue-950 mt-1">{selectedStation.nominalMetric}</span>
                    <span className="text-[10px] text-blue-600 font-medium mt-0.5">Tolerance: ±0.8% Nominal</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Operating Parameter</span>
                    <span className="text-xl font-black font-mono text-emerald-950 mt-1">{selectedStation.tempOrSpeed}</span>
                    <span className="text-[10px] text-emerald-600 font-medium mt-0.5">PLC Auto-Regulated</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Station Efficiency / OEE</span>
                    <span className="text-xl font-black font-mono text-slate-900 mt-1">98.6%</span>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5">Target: 95.0%</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">SCADA Communication</span>
                    <span className="text-sm font-bold text-slate-800 mt-1 font-mono">CIP / EtherNet/IP</span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">Packet Latency: 4ms</span>
                  </div>
                </div>
              </div>

              {/* Station Specialist on Duty */}
              {(() => {
                const op = getStationOperator(selectedStation.id);
                return (
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {op.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Assigned Station Specialist
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{op.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-600">
                          <span className="font-mono">{op.id}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">{op.category}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">L2 Certified</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500 block">Shift</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">{selectedShift}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Preventive Maintenance Log */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5">verified_user</span>
                <div className="text-xs">
                  <span className="font-bold text-amber-950 block">Preventive Maintenance Schedule</span>
                  <p className="text-amber-900/80 mt-0.5 leading-relaxed">
                    Last overhaul completed 3 operational days ago. Thermal signature, vibration harmonics, and drive belt tension are within manufacturer tolerances. Next scheduled servicing in 48 operating hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-mono">Telemetry Refreshed: Real-time</span>
              <button
                onClick={() => setSelectedStation(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors shadow-xs"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. SIMULATION LAB CONFIGURATION MODAL */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-lg">tune</span>
                <h3 className="text-sm font-bold text-slate-900">Simulation Lab Controls</h3>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5 text-xs text-slate-700">
              <p className="text-slate-500 text-xs leading-normal">
                Adjust synthetic line throughput speed and anomaly rates for testing. These adjustments only affect the development mock adapter.
              </p>

              {/* Throughput CPM Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-slate-700">Throughput Target:</span>
                  <span className="font-bold text-blue-600 font-mono">{simSpeed} CPM</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={simSpeed}
                  onChange={(e) => handleSimSpeedChange(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>5 CPM (Slow)</span>
                  <span>45 CPM (Nominal)</span>
                  <span>90 CPM (High)</span>
                </div>
              </div>

              {/* Defect Rate Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-slate-700">Anomaly Defect Rate:</span>
                  <span className="font-bold text-amber-600 font-mono">{simDefectRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={simDefectRate}
                  onChange={(e) => handleSimDefectRateChange(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% (Zero defect)</span>
                  <span>10% (Challenging)</span>
                  <span>25% (Stress test)</span>
                </div>
              </div>

              {/* Simulation Pause / Resume */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Generator State</span>
                  <span className="text-[11px] text-slate-500">
                    {isSimRunning ? 'Actively generating synthetic scan events' : 'Generator paused'}
                  </span>
                </div>
                <button
                  onClick={handleToggleSimState}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs ${
                    isSimRunning
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isSimRunning ? 'Pause Sim' : 'Resume Sim'}
                </button>
              </div>

              {/* Manual Defect Injection */}
              <div className="flex flex-col gap-2">
                <span className="font-bold text-slate-800">Inject Single Test Defect:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleInjectDefect('DEFECT_BARCODE')}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[11px] font-semibold text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Barcode Misread</span>
                  </button>
                  <button
                    onClick={() => handleInjectDefect('DEFECT_WEIGHT')}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Weight Error</span>
                  </button>
                  <button
                    onClick={() => handleInjectDefect('DEFECT_SEAL')}
                    className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[11px] font-semibold text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Seal Flap Defect</span>
                  </button>
                  <button
                    onClick={() => handleInjectDefect('NO_READ')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>No Read Event</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowSimModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
