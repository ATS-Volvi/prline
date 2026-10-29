export type ScanResult = 
  | 'PASS'
  | 'DEFECT_BARCODE'
  | 'DEFECT_WEIGHT'
  | 'DEFECT_SEAL'
  | 'NO_READ';

export type EventProcessingStatus = 
  | 'PROCESSED'
  | 'DUPLICATE'
  | 'REJECTED'
  | 'OUT_OF_SEQUENCE';

export interface IScanEvent {
  eventId: string;
  cartonId: string;
  lineId: string;
  shiftId?: string;
  sourceTimestamp: string;
  ingestedAt: string;
  scanResult: ScanResult;
  status: EventProcessingStatus;
  scannerId?: string;
  stationId?: string;
  sku?: string;
  batchNumber?: string;
  positionMeters?: number;
  isSimulated: boolean;
  metadata?: Record<string, any>;
}

export interface IBrandMixItem {
  brand: string;
  sku: string;
  count: number;
  percentage: number;
  color: string;
}

export interface IHourlyProduction {
  hour: string;
  total: number;
  byBrand: Record<string, number>;
}

export interface IConveyorSnapshot {
  lineId: string;
  shiftId: string;
  isSimulated: boolean;
  scannerStatus: {
    connected: boolean;
    lastHeartbeat: string | null;
    deviceId: string;
    model: string;
    latencyMs: number;
  };
  metrics: {
    totalScannedShift: number;
    passCount: number;
    defectCount: number;
    passRatePercent: number;
    firstPassYieldPercent: number;
    fpyTargetPercent: number;
    targetShiftScans: number;
    cartonsPerMinute: number;
    exceptions: {
      defectBarcode: number;
      defectWeight: number;
      defectSeal: number;
      noRead: number;
    };
  };
  hourlyProduction: IHourlyProduction[];
  brandMix: IBrandMixItem[];
  recentEvents: IScanEvent[];
  latestEvent: IScanEvent | null;
  serverTimestamp: string;
}

export interface ISimulationConfig {
  enabled: boolean;
  speedCpm: number;
  defectRatePercent: number;
  lineId: string;
}

