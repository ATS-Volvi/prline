import assert from 'assert';
import { ConveyorService } from './src/services/conveyorService';
import { MockScannerAdapter } from './src/services/scanner/mockScannerAdapter';
import { HttpScannerAdapter } from './src/services/scanner/httpScannerAdapter';
import { IScanEvent } from './src/types/scanEvent';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING PRLINE LIVE CONVEYOR AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✅ [PASS] ${name}`);
            passedTests++;
          })
          .catch((err) => {
            console.error(`  ❌ [FAIL] ${name}:`, err.message);
          });
      } else {
        console.log(`  ✅ [PASS] ${name}`);
        passedTests++;
      }
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // TEST 1: MockScannerAdapter Simulation Contract
  await test('MockScannerAdapter produces valid simulated scan events', async () => {
    const adapter = new MockScannerAdapter();
    let receivedEvent: IScanEvent | null = null;

    adapter.onEvent(async (evt) => {
      receivedEvent = evt;
    });

    await adapter.initialize();
    
    // Wait for at least one generated event
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await adapter.shutdown();

    assert(receivedEvent !== null, 'Mock adapter should emit an event');
    const evt: IScanEvent = receivedEvent as any;
    assert.strictEqual(evt.isSimulated, true, 'isSimulated MUST be true for mock');
    assert(evt.cartonId.length > 5, 'Carton ID must be non-empty');
    assert(['PASS', 'DEFECT_BARCODE', 'DEFECT_WEIGHT', 'DEFECT_SEAL', 'NO_READ'].includes(evt.scanResult), 'Valid scan result required');
    assert(evt.sourceTimestamp !== undefined, 'Source timestamp must be present');
    assert(evt.metadata?.productName !== undefined, 'Product metadata must be attached');
  });

  // TEST 2: HttpScannerAdapter Hardware Isolation Contract
  await test('HttpScannerAdapter enforces physical hardware safety (isSimulated === false)', async () => {
    const adapter = new HttpScannerAdapter();
    await adapter.initialize();

    const hwEvent = await adapter.receiveRawEvent({
      cartonId: '000890141122334455',
      lineId: 'LINE-01',
      scanResult: 'PASS',
      scannerId: 'COGNEX-DM474-01',
    });

    assert.strictEqual(hwEvent.isSimulated, false, 'Hardware adapter MUST set isSimulated to false');
    assert.strictEqual(hwEvent.scannerId, 'COGNEX-DM474-01');
    assert.strictEqual(hwEvent.status, 'PROCESSED');
    await adapter.shutdown();
  });

  // TEST 3: Transport Deduplication (Repeated delivery of same eventId)
  await test('ConveyorService rejects repeated delivery of identical eventId as DUPLICATE', async () => {
    const service = ConveyorService.getInstance();
    const testEventId = `TEST-EVT-${Date.now()}`;

    const originalEvent: IScanEvent = {
      eventId: testEventId,
      cartonId: '000890149999999001',
      lineId: 'LINE-01',
      sourceTimestamp: new Date().toISOString(),
      ingestedAt: new Date().toISOString(),
      scanResult: 'PASS',
      status: 'PROCESSED',
      isSimulated: true,
    };

    const firstResult = await service.handleIncomingEvent(originalEvent);
    assert.strictEqual(firstResult.status, 'PROCESSED', 'First delivery must be processed');

    // Duplicate delivery
    const duplicateDelivery: IScanEvent = {
      ...originalEvent,
      ingestedAt: new Date().toISOString(),
    };

    const secondResult = await service.handleIncomingEvent(duplicateDelivery);
    assert.strictEqual(secondResult.status, 'DUPLICATE', 'Repeated eventId MUST be flagged as DUPLICATE');
  });

  // TEST 4: Debounce Window for same cartonId
  await test('ConveyorService debounces rapid duplicate reads of the same cartonId (<3.0s)', async () => {
    const service = ConveyorService.getInstance();
    const testCartonId = `DEBOUNCE-CTN-${Date.now()}`;

    const scan1: IScanEvent = {
      eventId: `EVT-D1-${Date.now()}`,
      cartonId: testCartonId,
      lineId: 'LINE-02',
      sourceTimestamp: new Date().toISOString(),
      ingestedAt: new Date().toISOString(),
      scanResult: 'PASS',
      status: 'PROCESSED',
      isSimulated: true,
    };

    const res1 = await service.handleIncomingEvent(scan1);
    assert.strictEqual(res1.status, 'PROCESSED', 'First carton scan should process normally');

    // Rapid bounce scan 200ms later with different eventId
    const scan2: IScanEvent = {
      eventId: `EVT-D2-${Date.now() + 1}`,
      cartonId: testCartonId,
      lineId: 'LINE-02',
      sourceTimestamp: new Date().toISOString(),
      ingestedAt: new Date().toISOString(),
      scanResult: 'PASS',
      status: 'PROCESSED',
      isSimulated: true,
    };

    const res2 = await service.handleIncomingEvent(scan2);
    assert.strictEqual(res2.status, 'DUPLICATE', 'Rapid repeated carton read within debounce window MUST be DUPLICATE');
  });

  // TEST 5: Snapshot & Derived Metrics Integrity
  await test('ConveyorService generates accurate snapshot KPIs from backend events', async () => {
    const service = ConveyorService.getInstance();
    const snapshot = await service.getSnapshot('LINE-01', 'SHIFT-A');

    assert(snapshot !== null, 'Snapshot must not be null');
    assert.strictEqual(snapshot.lineId, 'LINE-01');
    assert(typeof snapshot.metrics.totalScannedShift === 'number', 'Total scanned must be a number');
    assert(typeof snapshot.metrics.passRatePercent === 'number', 'Pass rate must be a number');
    assert(snapshot.metrics.passRatePercent >= 0 && snapshot.metrics.passRatePercent <= 100, 'Pass rate between 0 and 100%');
    assert(snapshot.scannerStatus.deviceId !== undefined, 'Scanner device ID must be present');
    assert(Array.isArray(snapshot.recentEvents), 'recentEvents must be an array');
  });

  // TEST 6: Forced Defect Injection
  await test('MockScannerAdapter respects forced defect injection for automated testing', async () => {
    const adapter = new MockScannerAdapter();
    let forcedEvent: IScanEvent | null = null;

    adapter.onEvent(async (evt) => {
      forcedEvent = evt;
    });

    adapter.setSpeedCpm(60); // Fast for test
    adapter.injectDefect('DEFECT_WEIGHT');
    await adapter.initialize();

    await new Promise((resolve) => setTimeout(resolve, 1500));
    await adapter.shutdown();

    assert(forcedEvent !== null, 'Event should be generated');
    const fEvt: IScanEvent = forcedEvent as any;
    assert.strictEqual(fEvt.scanResult, 'DEFECT_WEIGHT', 'Injected defect must match DEFECT_WEIGHT');
  });

  console.log(`\n====================================================`);
  console.log(`🏁 TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log(`====================================================\n`);

  process.exit(passedTests === totalTests ? 0 : 1);
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
