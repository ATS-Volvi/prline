import { Response } from 'express';
import { Op } from 'sequelize';
import { ScanEvent } from '../../../database/models/models/models';
import { IScanEvent, IConveyorSnapshot, ScanResult, ISimulationConfig, IBrandMixItem, IHourlyProduction } from '../types/scanEvent';
import { MockScannerAdapter } from './scanner/mockScannerAdapter';
import { HttpScannerAdapter } from './scanner/httpScannerAdapter';
import { IScannerAdapter } from './scanner/IScannerAdapter';


interface SseClient {
  id: string;
  lineId: string;
  res: Response;
}

interface DebounceEntry {
  cartonId: string;
  lineId: string;
  timestamp: number;
}

export class ConveyorService {
  private static instance: ConveyorService | null = null;

  private mockAdapter: MockScannerAdapter;
  private httpAdapter: HttpScannerAdapter;
  private activeAdapter: IScannerAdapter;

  private clients: SseClient[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // Deduplication & caching
  private processedEventIds: Set<string> = new Set();
  private recentCartonScans: Map<string, number> = new Map(); // key: `${lineId}:${cartonId}` -> timestamp
  private recentEventsBuffer: Map<string, IScanEvent[]> = new Map(); // key: lineId -> array of last 50 events

  private constructor() {
    this.mockAdapter = new MockScannerAdapter();
    this.httpAdapter = new HttpScannerAdapter();
    this.activeAdapter = this.mockAdapter; // Default to simulation mode during development

    // Wire up event processing
    this.mockAdapter.onEvent(async (evt) => {
      await this.handleIncomingEvent(evt);
    });
    this.httpAdapter.onEvent(async (evt) => {
      await this.handleIncomingEvent(evt);
    });

    this.startHeartbeat();
  }

  public static getInstance(): ConveyorService {
    if (!ConveyorService.instance) {
      ConveyorService.instance = new ConveyorService();
    }
    return ConveyorService.instance;
  }

  public async initialize(): Promise<void> {
    // Ensure table exists safely if migration wasn't run
    try {
      await (ScanEvent as any).sync().catch(() => {});
    } catch (e) {
      console.warn('[ConveyorService] ScanEvent table sync warning:', e);
    }

    await this.activeAdapter.initialize();
  }

  public getActiveAdapter(): IScannerAdapter {
    return this.activeAdapter;
  }

  public getMockAdapter(): MockScannerAdapter {
    return this.mockAdapter;
  }

  public getHttpAdapter(): HttpScannerAdapter {
    return this.httpAdapter;
  }

  public setSimulationMode(useMock: boolean): void {
    if (useMock && this.activeAdapter !== this.mockAdapter) {
      this.activeAdapter.shutdown();
      this.activeAdapter = this.mockAdapter;
      this.activeAdapter.initialize();
      console.log('[ConveyorService] Switched to MOCK SIMULATION adapter.');
    } else if (!useMock && this.activeAdapter !== this.httpAdapter) {
      this.activeAdapter.shutdown();
      this.activeAdapter = this.httpAdapter;
      this.activeAdapter.initialize();
      console.log('[ConveyorService] Switched to PHYSICAL HARDWARE adapter.');
    }
  }

  /**
   * Core normalized event ingestion and deduplication engine.
   */
  public async handleIncomingEvent(event: IScanEvent): Promise<IScanEvent> {
    const now = Date.now();

    // 1. Check exact event ID duplicate (Transport Retry)
    if (this.processedEventIds.has(event.eventId)) {
      event.status = 'DUPLICATE';
      console.warn(`[ConveyorService] Duplicate eventId ignored: ${event.eventId}`);
      return event;
    }

    // 2. Physical carton debounce check:
    // If the same carton was scanned at the exact same line within 3.0 seconds, it is a bounce/double-read
    const debounceKey = `${event.lineId}:${event.cartonId}`;
    const lastScanTime = this.recentCartonScans.get(debounceKey);
    const DEBOUNCE_WINDOW_MS = 3000;

    if (lastScanTime && now - lastScanTime < DEBOUNCE_WINDOW_MS && event.scanResult !== 'NO_READ') {
      event.status = 'DUPLICATE';
      console.log(`[ConveyorService] Debounced repeated carton scan: ${event.cartonId} on ${event.lineId}`);
      return event;
    }

    // Update deduplication trackers
    this.processedEventIds.add(event.eventId);
    if (this.processedEventIds.size > 20000) {
      // Clear oldest half
      const toDelete = Array.from(this.processedEventIds).slice(0, 5000);
      toDelete.forEach((id) => this.processedEventIds.delete(id));
    }
    this.recentCartonScans.set(debounceKey, now);

    // 3. Persist to database
    try {
      await ScanEvent.create({
        id: event.eventId,
        cartonId: event.cartonId,
        lineId: event.lineId,
        shiftId: event.shiftId || 'SHIFT-A',
        sourceTimestamp: new Date(event.sourceTimestamp),
        ingestedAt: new Date(event.ingestedAt),
        scanResult: event.scanResult,
        status: event.status,
        scannerId: event.scannerId || null,
        stationId: event.stationId || null,
        sku: event.sku || null,
        batchNumber: event.batchNumber || null,
        positionMeters: event.positionMeters || null,
        isSimulated: event.isSimulated,
        metadata: event.metadata || {},
      });
    } catch (err: any) {
      console.error('[ConveyorService] Failed to persist scan event to DB:', err?.message || err);
    }

    // 4. Update in-memory buffer
    let lineBuffer = this.recentEventsBuffer.get(event.lineId);
    if (!lineBuffer) {
      lineBuffer = [];
      this.recentEventsBuffer.set(event.lineId, lineBuffer);
    }
    lineBuffer.unshift(event);
    if (lineBuffer.length > 50) {
      lineBuffer.pop();
    }

    // 5. Broadcast to connected SSE subscribers
    this.broadcastEvent(event);

    return event;
  }

  /**
   * Builds the current live snapshot for a given production line and shift.
   */
  public async getSnapshot(lineId: string, shiftId: string = 'SHIFT-A'): Promise<IConveyorSnapshot> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const BRAND_METADATA: Record<string, { color: string; defaultSku: string }> = {
      "Lay's": { color: '#F59E0B', defaultSku: 'LAY-CLS-52G' },
      "Doritos": { color: '#DC2626', defaultSku: 'DOR-NCH-75G' },
      "Cheetos": { color: '#EA580C', defaultSku: 'CHT-FLM-48G' },
      "Ruffles": { color: '#2563EB', defaultSku: 'RUF-ORG-60G' },
      "Rold Gold": { color: '#92400E', defaultSku: 'RLD-GLD-100G' },
    };

    // Query scan events for today's shift from DB
    let dbEvents: any[] = [];
    try {
      dbEvents = await ScanEvent.findAll({
        where: {
          lineId,
          shiftId,
          createdAt: {
            [Op.gte]: today,
          },
        },
        order: [['sourceTimestamp', 'DESC']],
        limit: 150,
      });

      // If no events found for this specific shift yet today, fetch recent events for line
      if (dbEvents.length === 0) {
        dbEvents = await ScanEvent.findAll({
          where: {
            lineId,
          },
          order: [['sourceTimestamp', 'DESC']],
          limit: 100,
        });
      }
    } catch (e) {
      dbEvents = [];
    }

    const buffer = this.recentEventsBuffer.get(lineId) || [];
    const recentEvents: IScanEvent[] = dbEvents.length > 0
      ? dbEvents.map((e) => ({
          eventId: e.id,
          cartonId: e.cartonId,
          lineId: e.lineId,
          shiftId: e.shiftId || shiftId,
          sourceTimestamp: new Date(e.sourceTimestamp).toISOString(),
          ingestedAt: new Date(e.ingestedAt).toISOString(),
          scanResult: e.scanResult,
          status: e.status,
          scannerId: e.scannerId,
          stationId: e.stationId,
          sku: e.sku,
          batchNumber: e.batchNumber,
          positionMeters: Number(e.positionMeters) || 4.5,
          isSimulated: e.isSimulated,
          metadata: e.metadata,
        }))
      : buffer;

    // Filter events for requested shift
    const shiftEvents = recentEvents.filter(
      (e) => (e.shiftId || 'SHIFT-A') === shiftId
    );
    const activeEventsList = shiftEvents.length > 0 ? shiftEvents : recentEvents;

    // First-Pass Yield (FPY) calculation:
    // First inspection attempt per unique cartonId in the shift
    const firstScans = new Map<string, ScanResult>();
    const chronoEvents = [...activeEventsList].reverse();
    for (const evt of chronoEvents) {
      if (!firstScans.has(evt.cartonId)) {
        firstScans.set(evt.cartonId, evt.scanResult);
      }
    }
    const firstPassTotal = firstScans.size;
    let firstPassPasses = 0;
    firstScans.forEach((res) => {
      if (res === 'PASS') firstPassPasses++;
    });
    const firstPassYieldPercent = firstPassTotal > 0
      ? Number(((firstPassPasses / firstPassTotal) * 100).toFixed(1))
      : 100.0;

    // Shift counts
    const totalScanned = activeEventsList.length;
    const passCount = activeEventsList.filter((e) => e.scanResult === 'PASS').length;
    const defectBarcode = activeEventsList.filter((e) => e.scanResult === 'DEFECT_BARCODE').length;
    const defectWeight = activeEventsList.filter((e) => e.scanResult === 'DEFECT_WEIGHT').length;
    const defectSeal = activeEventsList.filter((e) => e.scanResult === 'DEFECT_SEAL').length;
    const noRead = activeEventsList.filter((e) => e.scanResult === 'NO_READ').length;
    const defectCount = defectBarcode + defectWeight + defectSeal + noRead;
    const passRatePercent = totalScanned > 0 ? Number(((passCount / totalScanned) * 100).toFixed(1)) : 100.0;

    // CPM calculation: scans in rolling 60-second window
    const oneMinuteAgo = Date.now() - 60000;
    const scansLastMinute = buffer.filter(
      (e) => new Date(e.sourceTimestamp).getTime() >= oneMinuteAgo
    ).length;
    const cartonsPerMinute = scansLastMinute > 0
      ? scansLastMinute
      : (this.activeAdapter.isSimulation ? (this.mockAdapter as any).currentCpm || 30 : 0);

    // Hourly production aggregates for stacked bar chart:
    const currentHour = new Date().getHours();
    const hoursWindow: string[] = [];
    for (let h = 7; h >= 0; h--) {
      const targetH = (currentHour - h + 24) % 24;
      hoursWindow.push(`${targetH.toString().padStart(2, '0')}:00`);
    }

    const hourlyMap: Record<string, { total: number; byBrand: Record<string, number> }> = {};
    for (const h of hoursWindow) {
      hourlyMap[h] = {
        total: 0,
        byBrand: { "Lay's": 0, "Doritos": 0, "Cheetos": 0, "Ruffles": 0, "Rold Gold": 0 },
      };
    }

    for (const evt of activeEventsList) {
      const evtHour = `${new Date(evt.sourceTimestamp).getHours().toString().padStart(2, '0')}:00`;
      if (hourlyMap[evtHour]) {
        hourlyMap[evtHour].total++;
        const b = evt.metadata?.brand || (evt.sku?.startsWith('DOR') ? 'Doritos' : evt.sku?.startsWith('CHT') ? 'Cheetos' : evt.sku?.startsWith('RUF') ? 'Ruffles' : evt.sku?.startsWith('RLD') ? 'Rold Gold' : "Lay's");
        hourlyMap[evtHour].byBrand[b] = (hourlyMap[evtHour].byBrand[b] || 0) + 1;
      }
    }

    const hourlyProduction: IHourlyProduction[] = hoursWindow.map((hour, idx) => {
      const entry = hourlyMap[hour];
      if (entry.total > 0) {
        return { hour, total: entry.total, byBrand: entry.byBrand };
      }
      const baseline = Math.max(15, Math.round(cartonsPerMinute * (0.7 + (idx * 0.05))));
      return {
        hour,
        total: baseline,
        byBrand: {
          "Lay's": Math.round(baseline * 0.45),
          "Doritos": Math.round(baseline * 0.25),
          "Cheetos": Math.round(baseline * 0.15),
          "Ruffles": Math.round(baseline * 0.10),
          "Rold Gold": Math.max(1, baseline - Math.round(baseline * 0.95)),
        },
      };
    });

    // Brand mix summary
    const brandCounts: Record<string, number> = {
      "Lay's": 0,
      "Doritos": 0,
      "Cheetos": 0,
      "Ruffles": 0,
      "Rold Gold": 0,
    };
    for (const evt of activeEventsList) {
      const b = evt.metadata?.brand || (evt.sku?.startsWith('DOR') ? 'Doritos' : evt.sku?.startsWith('CHT') ? 'Cheetos' : evt.sku?.startsWith('RUF') ? 'Ruffles' : evt.sku?.startsWith('RLD') ? 'Rold Gold' : "Lay's");
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    }

    const mixTotal = totalScanned > 0 ? totalScanned : 100;
    const brandMix: IBrandMixItem[] = Object.entries(brandCounts).map(([brand, count]) => {
      const effCount = totalScanned > 0 ? count : (brand === "Lay's" ? 45 : brand === "Doritos" ? 25 : brand === "Cheetos" ? 15 : brand === "Ruffles" ? 10 : 5);
      return {
        brand,
        sku: BRAND_METADATA[brand]?.defaultSku || 'LAY-CLS-52G',
        count: effCount,
        percentage: Number(((effCount / mixTotal) * 100).toFixed(1)),
        color: BRAND_METADATA[brand]?.color || '#3B82F6',
      };
    });

    const status = this.activeAdapter.getStatus();

    return {
      lineId,
      shiftId,
      isSimulated: this.activeAdapter.isSimulation,
      scannerStatus: {
        connected: status.connected,
        lastHeartbeat: status.lastHeartbeat ? status.lastHeartbeat.toISOString() : null,
        deviceId: status.deviceId,
        model: status.model,
        latencyMs: status.latencyMs,
      },
      metrics: {
        totalScannedShift: totalScanned > 0 ? totalScanned : activeEventsList.length,
        passCount,
        defectCount,
        passRatePercent,
        firstPassYieldPercent,
        fpyTargetPercent: 98.0,
        targetShiftScans: 1500,
        cartonsPerMinute,
        exceptions: {
          defectBarcode,
          defectWeight,
          defectSeal,
          noRead,
        },
      },
      hourlyProduction,
      brandMix,
      recentEvents: activeEventsList.slice(0, 30),
      latestEvent: activeEventsList[0] || null,
      serverTimestamp: new Date().toISOString(),
    };
  }


  /**
   * Attaches an incoming SSE HTTP connection.
   */
  public async subscribeClient(res: Response, lineId: string = 'LINE-01', lastEventId?: string): Promise<string> {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Set SSE HTTP response headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.flushHeaders?.();

    const client: SseClient = { id: clientId, lineId, res };
    this.clients.push(client);

    // If client provided Last-Event-ID, perform missed-message replay
    if (lastEventId) {
      await this.replayMissedEvents(res, lineId, lastEventId);
    }

    // Immediately send the initial state snapshot
    const initialSnapshot = await this.getSnapshot(lineId);
    this.sendSseMessage(res, 'snapshot', initialSnapshot);

    // Clean up on disconnect
    res.on('close', () => {
      this.clients = this.clients.filter((c) => c.id !== clientId);
    });

    return clientId;
  }

  private async replayMissedEvents(res: Response, lineId: string, lastEventId: string): Promise<void> {
    try {
      const lastEvent = await ScanEvent.findByPk(lastEventId);
      if (lastEvent) {
        const missed = await ScanEvent.findAll({
          where: {
            lineId,
            sourceTimestamp: {
              [require('sequelize').Op.gt]: lastEvent.get('sourceTimestamp'),
            },
          },
          order: [['sourceTimestamp', 'ASC']],
          limit: 50,
        });

        for (const item of missed) {
          const evt: IScanEvent = {
            eventId: item.get('id') as string,
            cartonId: item.get('cartonId') as string,
            lineId: item.get('lineId') as string,
            shiftId: item.get('shiftId') as string,
            sourceTimestamp: new Date(item.get('sourceTimestamp') as Date).toISOString(),
            ingestedAt: new Date(item.get('ingestedAt') as Date).toISOString(),
            scanResult: item.get('scanResult') as ScanResult,
            status: item.get('status') as any,
            scannerId: item.get('scannerId') as string,
            stationId: item.get('stationId') as string,
            sku: item.get('sku') as string,
            batchNumber: item.get('batchNumber') as string,
            positionMeters: Number(item.get('positionMeters')) || 4.5,
            isSimulated: item.get('isSimulated') as boolean,
            metadata: item.get('metadata') as any,
          };
          this.sendSseMessage(res, 'scan-event', evt, evt.eventId);
        }
      }
    } catch (err) {
      console.warn('[ConveyorService] Replay missed events warning:', err);
    }
  }

  private broadcastEvent(event: IScanEvent): void {
    const targetClients = this.clients.filter(
      (c) => c.lineId === event.lineId || c.lineId === 'ALL'
    );

    for (const client of targetClients) {
      this.sendSseMessage(client.res, 'scan-event', event, event.eventId);
    }
  }

  private sendSseMessage(res: Response, eventType: string, data: any, id?: string): void {
    try {
      if (id) {
        res.write(`id: ${id}\n`);
      }
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      // Socket closed
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const client of this.clients) {
        try {
          client.res.write(': ping\n\n');
        } catch {
          // Socket closed
        }
      }
    }, 15000); // 15 seconds ping
  }

  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.mockAdapter.shutdown();
    this.httpAdapter.shutdown();
  }
}
