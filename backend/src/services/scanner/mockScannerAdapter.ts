import { IScannerAdapter, IScannerStatus } from './IScannerAdapter';
import { IScanEvent, ScanResult } from '../../types/scanEvent';

interface ProductPreset {
  sku: string;
  brand: string;
  brandCode: string;
  name: string;
  shortTitle: string;
  brandColor: string;
  textColor: string;
  nominalWeightKg: number;
  weightToleranceKg: number;
}

const ALL_PRODUCTS: ProductPreset[] = [
  {
    sku: 'LAY-CLS-52G',
    brand: "Lay's",
    brandCode: 'LAY',
    name: "Lay's Classic Salted (52g x 24)",
    shortTitle: 'Classic',
    brandColor: '#EAB308',
    textColor: '#1E293B',
    nominalWeightKg: 1.55,
    weightToleranceKg: 0.08,
  },
  {
    sku: 'CHE-MAS-50G',
    brand: 'Cheetos',
    brandCode: 'CHE',
    name: "Cheetos Masala Mania (50g x 24)",
    shortTitle: 'Masala',
    brandColor: '#6D28D9',
    textColor: '#FFFFFF',
    nominalWeightKg: 1.40,
    weightToleranceKg: 0.08,
  },
  {
    sku: 'KUR-MSZ-55G',
    brand: 'Kurkure',
    brandCode: 'KUR',
    name: 'Kurkure Masala Munch (55g x 24)',
    shortTitle: 'Masala Munch',
    brandColor: '#DC2626',
    textColor: '#FFFFFF',
    nominalWeightKg: 1.50,
    weightToleranceKg: 0.08,
  },
  {
    sku: 'DOR-NCH-75G',
    brand: 'Doritos',
    brandCode: 'DOR',
    name: 'Doritos Nacho Cheese (75g x 20)',
    shortTitle: 'Nacho Cheese',
    brandColor: '#2563EB',
    textColor: '#FFFFFF',
    nominalWeightKg: 1.82,
    weightToleranceKg: 0.10,
  },
  {
    sku: 'RUF-ORG-60G',
    brand: 'Ruffles',
    brandCode: 'RUF',
    name: 'Ruffles Original Ridged (60g x 20)',
    shortTitle: 'Original',
    brandColor: '#0284C7',
    textColor: '#FFFFFF',
    nominalWeightKg: 1.65,
    weightToleranceKg: 0.09,
  },
  {
    sku: 'RLD-GLD-100G',
    brand: 'Rold Gold',
    brandCode: 'ROL',
    name: 'Rold Gold Pretzels (100g x 16)',
    shortTitle: 'Pretzel',
    brandColor: '#B45309',
    textColor: '#FFFFFF',
    nominalWeightKg: 1.95,
    weightToleranceKg: 0.10,
  },
];

const LINE_PRIMARY_PRODUCTS: Record<string, ProductPreset> = {
  'LINE-01': ALL_PRODUCTS[0], // Lay's (LAY)
  'LINE-02': ALL_PRODUCTS[2], // Kurkure (KUR)
  'LINE-03': ALL_PRODUCTS[3], // Doritos (DOR)
  'LINE-04': ALL_PRODUCTS[1], // Cheetos (CHE)
};


export class MockScannerAdapter implements IScannerAdapter {
  public readonly id = 'mock-sim-adapter';
  public readonly name = 'Industrial Mock Conveyor Scanner (Simulation)';
  public readonly isSimulation = true;

  private timer: NodeJS.Timeout | null = null;
  private eventHandlers: ((event: IScanEvent) => Promise<void>)[] = [];
  private isRunning: boolean = false;
  private currentCpm: number = 30; // 30 cartons/min = 1 carton every 2000ms
  private defectRatePercent: number = 6; // 6% anomaly baseline
  private cartonCounter: number = 1000;
  private activeLineId: string = 'LINE-01';
  private lastHeartbeat: Date = new Date();
  private pendingForcedDefect: ScanResult | null = null;

  constructor() {
    this.cartonCounter = Math.floor(100000 + Math.random() * 900000);
  }

  public async initialize(): Promise<void> {
    this.isRunning = true;
    this.scheduleNextScan();
    console.log(`[MockScannerAdapter] Initialized. Generating simulated scans at ${this.currentCpm} CPM for ${this.activeLineId}.`);
  }

  public async shutdown(): Promise<void> {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('[MockScannerAdapter] Shutdown.');
  }

  public onEvent(handler: (event: IScanEvent) => Promise<void>): void {
    this.eventHandlers.push(handler);
  }

  public getStatus(): IScannerStatus {
    return {
      connected: this.isRunning,
      lastHeartbeat: this.lastHeartbeat,
      deviceId: 'SIM-SCANNER-QC01',
      model: 'Cognex DataMan 474 Series (Emulated)',
      latencyMs: Math.floor(8 + Math.random() * 6),
    };
  }

  public setSpeedCpm(cpm: number): void {
    this.currentCpm = Math.max(5, Math.min(120, cpm));
    if (this.isRunning) {
      if (this.timer) clearTimeout(this.timer);
      this.scheduleNextScan();
    }
  }

  public setDefectRate(percent: number): void {
    this.defectRatePercent = Math.max(0, Math.min(100, percent));
  }

  public setActiveLine(lineId: string): void {
    this.activeLineId = lineId;
  }

  public setRunning(running: boolean): void {
    if (this.isRunning === running) return;
    this.isRunning = running;
    if (running) {
      this.scheduleNextScan();
    } else if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public injectDefect(type: ScanResult): void {
    this.pendingForcedDefect = type;
  }

  private scheduleNextScan(): void {
    if (!this.isRunning) return;

    // Interval derived from CPM with slight industrial jitter (+-15%)
    const baseIntervalMs = (60 / this.currentCpm) * 1000;
    const jitter = (Math.random() - 0.5) * 0.3 * baseIntervalMs;
    const interval = Math.max(400, Math.round(baseIntervalMs + jitter));

    this.timer = setTimeout(async () => {
      try {
        await this.generateAndEmitEvent();
      } catch (err) {
        console.error('[MockScannerAdapter] Scan generation error:', err);
      }
      this.scheduleNextScan();
    }, interval);
  }

  private async generateAndEmitEvent(): Promise<void> {
    this.cartonCounter++;
    this.lastHeartbeat = new Date();

    // Pick product: primary for line (75% probability) or brand mix variety (25% probability)
    const primary = LINE_PRIMARY_PRODUCTS[this.activeLineId] || ALL_PRODUCTS[0];
    const product = Math.random() < 0.75
      ? primary
      : ALL_PRODUCTS[Math.floor(Math.random() * ALL_PRODUCTS.length)];

    const now = new Date();
    
    // Determine scan result
    let scanResult: ScanResult = 'PASS';
    let defectDetail: string | null = null;
    let actualWeight = Number((product.nominalWeightKg + (Math.random() - 0.5) * product.weightToleranceKg * 0.8).toFixed(3));

    if (this.pendingForcedDefect) {
      scanResult = this.pendingForcedDefect;
      this.pendingForcedDefect = null;
    } else if (Math.random() * 100 < this.defectRatePercent) {
      // Pick random anomaly type
      const defectRoll = Math.random();
      if (defectRoll < 0.40) {
        scanResult = 'DEFECT_BARCODE';
        defectDetail = 'Barcode checksum verification failed / low contrast';
      } else if (defectRoll < 0.70) {
        scanResult = 'DEFECT_WEIGHT';
        // Over or underfill
        const isUnder = Math.random() > 0.5;
        actualWeight = isUnder
          ? Number((product.nominalWeightKg - product.weightToleranceKg * 2.2).toFixed(3))
          : Number((product.nominalWeightKg + product.weightToleranceKg * 2.5).toFixed(3));
        defectDetail = `Weight discrepancy: ${actualWeight} kg outside limits [${(product.nominalWeightKg - product.weightToleranceKg).toFixed(2)} - ${(product.nominalWeightKg + product.weightToleranceKg).toFixed(2)} kg]`;
      } else if (defectRoll < 0.90) {
        scanResult = 'DEFECT_SEAL';
        defectDetail = 'Top flap seal tape unaligned / vision defect';
      } else {
        scanResult = 'NO_READ';
        defectDetail = 'Optical trigger fired without valid symbology match';
      }
    }

    // Determine current shift based on local hour
    const hour = now.getHours();
    let shiftId = 'SHIFT-A';
    if (hour >= 14 && hour < 22) {
      shiftId = 'SHIFT-B';
    } else if (hour >= 22 || hour < 6) {
      shiftId = 'SHIFT-C';
    }

    const batchCode = `LOT-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-B${(now.getDate() % 5) + 1}`;
    const cartonId = scanResult === 'NO_READ' 
      ? `UNREAD-${this.cartonCounter}` 
      : `628100004${String(this.cartonCounter % 10000).padStart(4, '0')}`;

    const event: IScanEvent = {
      eventId: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      cartonId,
      lineId: this.activeLineId,
      shiftId,
      sourceTimestamp: now.toISOString(),
      ingestedAt: new Date().toISOString(),
      scanResult,
      status: 'PROCESSED',
      scannerId: 'SIM-SCANNER-QC01',
      stationId: 'WS-104',
      sku: product.sku,
      batchNumber: batchCode,
      positionMeters: 4.5,
      isSimulated: true, // EXPLICIT SIMULATION FLAG
      metadata: {
        brand: product.brand,
        brandCode: product.brandCode,
        textColor: product.textColor,
        shortTitle: product.shortTitle,
        brandColor: product.brandColor,
        productName: product.name,
        measuredWeightKg: actualWeight,
        nominalWeightKg: product.nominalWeightKg,
        defectReason: defectDetail,
        conveyorBeltSpeedMps: 0.65,
        opticalConfidenceScore: scanResult === 'PASS' ? 98.4 : scanResult === 'NO_READ' ? 12.0 : 45.2,
      },
    };


    // Emit to all registered handlers
    for (const handler of this.eventHandlers) {
      await handler(event);
    }
  }
}
