import { IScanEvent } from '../../types/scanEvent';

export interface IScannerStatus {
  connected: boolean;
  lastHeartbeat: Date | null;
  deviceId: string;
  model: string;
  latencyMs: number;
}

export interface IScannerAdapter {
  readonly id: string;
  readonly name: string;
  readonly isSimulation: boolean;

  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  onEvent(handler: (event: IScanEvent) => Promise<void>): void;
  getStatus(): IScannerStatus;
}
