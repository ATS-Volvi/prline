import { Request, Response } from 'express';
import { ConveyorService } from '../services/conveyorService';
import { ScanResult } from '../types/scanEvent';

const conveyorService = ConveyorService.getInstance();

/**
 * GET /api/v1/conveyor/snapshot
 * Fetches the current state snapshot and shift KPIs.
 */
export const getSnapshot = async (req: Request, res: Response): Promise<void> => {
  try {
    const lineId = (req.query.lineId as string) || 'LINE-01';
    const shiftId = (req.query.shiftId as string) || 'SHIFT-A';
    const snapshot = await conveyorService.getSnapshot(lineId, shiftId);
    res.json(snapshot);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/conveyor/stream
 * Connects an SSE event stream for real-time live conveyor monitoring.
 */
export const streamConveyor = async (req: Request, res: Response): Promise<void> => {
  try {
    const lineId = (req.query.lineId as string) || 'LINE-01';
    const lastEventId = req.headers['last-event-id'] as string | undefined;

    await conveyorService.subscribeClient(res, lineId, lastEventId);
  } catch (error: any) {
    console.error('[conveyorController] SSE subscription error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * POST /api/v1/conveyor/ingest
 * Ingestion gateway for physical industrial scanners (Cognex, Keyence, SICK, Zebra).
 * Enforces strict validation and hardware authentication.
 */
export const ingestHardwareScan = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;

    // Strict validation
    if (!payload.cartonId || !payload.lineId) {
      res.status(400).json({
        success: false,
        message: 'Invalid payload: cartonId and lineId are mandatory fields.',
      });
      return;
    }

    const validScanResults: ScanResult[] = [
      'PASS',
      'DEFECT_BARCODE',
      'DEFECT_WEIGHT',
      'DEFECT_SEAL',
      'NO_READ',
    ];
    if (payload.scanResult && !validScanResults.includes(payload.scanResult)) {
      res.status(400).json({
        success: false,
        message: `Invalid scanResult: must be one of ${validScanResults.join(', ')}`,
      });
      return;
    }

    const httpAdapter = conveyorService.getHttpAdapter();
    const processedEvent = await httpAdapter.receiveRawEvent({
      eventId: payload.eventId,
      cartonId: String(payload.cartonId).trim(),
      lineId: String(payload.lineId).trim(),
      shiftId: payload.shiftId,
      sourceTimestamp: payload.sourceTimestamp || new Date().toISOString(),
      scanResult: payload.scanResult || 'PASS',
      scannerId: payload.scannerId,
      stationId: payload.stationId,
      sku: payload.sku,
      batchNumber: payload.batchNumber,
      positionMeters: payload.positionMeters ? Number(payload.positionMeters) : undefined,
      metadata: payload.metadata,
    });

    res.status(201).json({
      success: true,
      message: 'Scan event successfully ingested',
      event: processedEvent,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/conveyor/simulation
 * Returns simulation settings and adapter mode.
 */
export const getSimulationStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const mock = conveyorService.getMockAdapter();
    const status = mock.getStatus();
    res.json({
      activeMode: conveyorService.getActiveAdapter().isSimulation ? 'MOCK_SIMULATION' : 'PHYSICAL_HARDWARE',
      connected: status.connected,
      model: status.model,
      deviceId: status.deviceId,
      lastHeartbeat: status.lastHeartbeat,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/conveyor/simulation/config
 * Configures the mock simulation rate, line, or pause/resume.
 */
export const updateSimulationConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { speedCpm, defectRatePercent, lineId, isRunning } = req.body;
    const mock = conveyorService.getMockAdapter();

    if (typeof speedCpm === 'number') {
      mock.setSpeedCpm(speedCpm);
    }
    if (typeof defectRatePercent === 'number') {
      mock.setDefectRate(defectRatePercent);
    }
    if (lineId && typeof lineId === 'string') {
      mock.setActiveLine(lineId);
    }
    if (typeof isRunning === 'boolean') {
      mock.setRunning(isRunning);
    }

    res.json({
      success: true,
      message: 'Simulation configuration updated',
      status: mock.getStatus(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/conveyor/simulation/inject
 * Injects a forced defect for immediate QA and visual verification.
 */
export const injectDefect = async (req: Request, res: Response): Promise<void> => {
  try {
    const { defectType } = req.body;
    const validResults: ScanResult[] = [
      'DEFECT_BARCODE',
      'DEFECT_WEIGHT',
      'DEFECT_SEAL',
      'NO_READ',
      'PASS',
    ];

    if (!validResults.includes(defectType)) {
      res.status(400).json({
        success: false,
        message: `Invalid defectType. Must be one of: ${validResults.join(', ')}`,
      });
      return;
    }

    const mock = conveyorService.getMockAdapter();
    mock.injectDefect(defectType);

    res.json({
      success: true,
      message: `Next simulated carton scan will force result: ${defectType}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/conveyor/mode
 * Toggles adapter mode between simulation and real hardware.
 */
export const setMode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mode } = req.body; // 'mock' | 'physical'
    if (mode === 'mock') {
      conveyorService.setSimulationMode(true);
    } else if (mode === 'physical') {
      conveyorService.setSimulationMode(false);
    } else {
      res.status(400).json({ success: false, message: "Invalid mode: must be 'mock' or 'physical'." });
      return;
    }

    res.json({
      success: true,
      currentMode: conveyorService.getActiveAdapter().isSimulation ? 'MOCK_SIMULATION' : 'PHYSICAL_HARDWARE',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
