import { Router } from 'express';
import { db } from '../db';
import { broadcastScan, broadcastAlert, broadcastAlarmReset, broadcastHeartbeat, broadcastCameraEvent } from '../socket';
import { captureCameraSnapshot, captureCameraBurst } from './camera';

const router = Router();

router.get('/devices', (req, res) => {
  res.json({
    success: true,
    count: db.devices.length,
    devices: db.devices
  });
});

// Primary Checkpoint Ingestion: ESP32 MFRC522 RFID Scan Payload
router.post('/rfid-scan', async (req, res) => {
  const { rfid_uid, device_code, checkpoint_id } = req.body;

  let cpId = Number(checkpoint_id);
  if (!cpId) {
    if (device_code === 'ESP32-CP02-GATE' || device_code === 'ESP32-CP02-LAB') {
      cpId = 2;
    } else {
      cpId = 1;
    }
  }

  const checkpoint = db.checkpoints.find((c) => c.id === cpId) || db.checkpoints[0];
  const resolvedDeviceCode = device_code || (checkpoint.id === 2 ? 'ESP32-CP02-GATE' : 'ESP32-CP01-GATE');

  const tag = db.rfidTags.find((t) => t.uid === rfid_uid);
  const asset = tag && tag.asset_id ? db.assets.find((a) => a.id === tag.asset_id) : null;

  let result: 'AUTHORIZED' | 'UNAUTHORIZED' | 'MISSING_ASSET' | 'UNKNOWN_TAG' = 'UNKNOWN_TAG';
  let shouldTriggerAlarm = false;

  if (!tag) {
    result = 'UNKNOWN_TAG';
    shouldTriggerAlarm = true;
  } else if (tag.status === 'UNASSIGNED' || !tag.asset_id || !asset) {
    // Unassigned RFID card in initial state without user assignment or checkout authorization
    result = 'UNAUTHORIZED';
    shouldTriggerAlarm = true;
  } else if (asset.status === 'MISSING') {
    result = 'MISSING_ASSET';
    shouldTriggerAlarm = true;
  } else if (asset.status === 'ISSUED' && tag.checkout_authorized === true) {
    result = 'AUTHORIZED';
  } else {
    // Asset is in inventory or available on stand, but not issued/authorized for checkout
    result = 'UNAUTHORIZED';
    shouldTriggerAlarm = true;
  }

  const currentIsoTime = new Date().toISOString();
  const scanRecord = {
      id: db.recentScans.length + 1,
      rfid_uid,
      checkpoint_id: checkpoint.id,
      checkpointId: checkpoint.id,
      checkpoint_name: checkpoint.name,
      device_code: resolvedDeviceCode,
      device_id: resolvedDeviceCode,
      asset_id: asset ? asset.id : null,
      asset_name: asset ? asset.asset_name : undefined,
      asset_code: asset ? asset.asset_code : undefined,
      result,
      action_taken: result === 'AUTHORIZED' ? 'GREEN_LED_PULSE_2S' : 'RED_LED_BUZZER_ALARM',
      timestamp: currentIsoTime,
      created_at: currentIsoTime,
      scanned_at: currentIsoTime
    };

    db.recentScans.unshift(scanRecord);
    broadcastScan(scanRecord);

    // Movement Tracking between Checkpoints
    const prevMovement = asset ? db.movements.find((m) => m.asset_id === asset.id) : null;
    const direction = checkpoint.id === 2 ? 'ENTRY' : 'EXIT';
    let statusTransition = `${result} at ${checkpoint.name}`;
    if (asset && prevMovement) {
      if (prevMovement.checkpoint_id === 1 && checkpoint.id === 2) {
        statusTransition = 'Asset leaves through CP1 → OUT, appears at CP2 → DETECTED AT CP2';
      } else if (prevMovement.checkpoint_id === 2 && checkpoint.id === 1) {
        statusTransition = 'Asset departs CP2, reaches CP1 Main Entrance Gate';
      }
    }

    const movementRecord = {
      id: db.movements.length + 1,
      asset_id: asset ? asset.id : null,
      asset_name: asset ? asset.asset_name : undefined,
      asset_code: asset ? asset.asset_code : undefined,
      rfid_uid,
      checkpoint_id: checkpoint.id,
      checkpointId: checkpoint.id,
      checkpoint_name: checkpoint.name,
      device_code: resolvedDeviceCode,
      device_id: resolvedDeviceCode,
      event_type: result === 'AUTHORIZED' ? 'AUTHORIZED_PASS' : 'UNAUTHORIZED_PASS_ATTEMPT',
      direction: (direction as 'ENTRY' | 'EXIT') || 'ENTRY',
      authorization_status: result === 'AUTHORIZED' ? ('AUTHORIZED' as const) : ('UNAUTHORIZED' as const),
      reason: result === 'AUTHORIZED' ? 'Authorized gate transit' : 'Unauthorized checkout transit alert',
      scanned_at: currentIsoTime,
      timestamp: currentIsoTime,
      created_at: currentIsoTime,
      previous_checkpoint_id: prevMovement ? prevMovement.checkpoint_id : null,
      previous_checkpoint_name: prevMovement ? prevMovement.checkpoint_name : undefined,
      status_transition: statusTransition
    };
    db.movements.unshift(movementRecord);

    // If security alarm required, spawn Alert
    // Camera evidence captured ONLY at Checkpoint 1 (CP2 has NO camera)
    if (shouldTriggerAlarm) {
      let cameraEventId: number | null = null;
      let cameraImageUrl: string | null = null;

      if (checkpoint.id === 1) {
        const burstPhotos = await captureCameraBurst(result, rfid_uid, asset?.asset_name, 3);
        const burstGroupId = `BURST-${Date.now()}`;
        const alertId = db.alerts.length + 1;

        burstPhotos.forEach((frame, idx) => {
          const frameTimeIso = new Date(Date.now() + idx * 350).toISOString();
          const cameraEvent = {
            id: db.cameraEvents.length + 1,
            event_code: `CAM-EVT-${Math.floor(1000 + Math.random() * 9000)}-F${idx + 1}`,
            checkpoint_id: 1,
            checkpointId: 1,
            checkpoint_name: checkpoint.name,
            device_code: 'ESP32-CAM-HW381-OV3660',
            trigger_type: result as any,
            event_type: result,
            image_path: frame.url,
            is_real_hardware: frame.isRealHardware,
            capture_source: frame.isRealHardware ? 'LIVE_ESP32_CAM' : 'SIMULATION_FALLBACK',
            file_size_bytes: frame.isRealHardware ? 54000 : 48500 + idx * 320,
            asset_name: asset ? asset.asset_name : undefined,
            asset_code: asset ? asset.asset_code : undefined,
            rfid_uid,
            alert_id: alertId,
            burst_group_id: burstGroupId,
            frame_index: idx + 1,
            total_frames: 3,
            captured_at: frameTimeIso,
            timestamp: frameTimeIso,
            created_at: frameTimeIso
          };
          db.cameraEvents.unshift(cameraEvent);
          broadcastCameraEvent(cameraEvent);
          if (idx === 0) {
            cameraEventId = cameraEvent.id;
            cameraImageUrl = cameraEvent.image_path;
          }
        });
      }

      const alertRecord = {
        id: db.alerts.length + 1,
        alert_code: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
        asset_id: asset ? asset.id : null,
        asset_name: asset ? asset.asset_name : undefined,
        asset_code: asset ? asset.asset_code : undefined,
        rfid_uid,
        checkpoint_id: checkpoint.id,
        checkpointId: checkpoint.id,
        checkpoint_name: checkpoint.name,
        device_code: resolvedDeviceCode,
        device_id: resolvedDeviceCode,
        alert_type: result === 'MISSING_ASSET' ? 'MISSING_ASSET_DETECTED' : result === 'UNKNOWN_TAG' ? 'UNKNOWN_TAG_DETECTED' : 'UNAUTHORIZED_EXIT',
        severity: (result === 'UNKNOWN_TAG' ? 'WARNING' : 'CRITICAL') as 'WARNING' | 'CRITICAL',
        message: result === 'UNKNOWN_TAG'
          ? `⚠️ WARNING: Unknown RFID tag detected at Checkpoint ${checkpoint.id} (${checkpoint.name})`
          : result === 'MISSING_ASSET'
            ? `🚨 CRITICAL: Missing asset [${asset?.asset_name || rfid_uid}] detected at Checkpoint ${checkpoint.id} (${checkpoint.name})!`
            : tag && (tag.status === 'UNASSIGNED' || !tag.asset_id)
              ? `🚨 CRITICAL: Unauthorized RFID detected at Checkpoint ${checkpoint.id} (${checkpoint.name}) - Card [${rfid_uid}] is Unassigned with no checkout authorization`
              : `🚨 CRITICAL: Unauthorized checkout detected at Checkpoint ${checkpoint.id} (${checkpoint.name}) - [${asset?.asset_name || rfid_uid}] has not been checked out`,
        camera_event_id: cameraEventId,
        camera_image_url: cameraImageUrl,
        status: 'OPEN' as const,
        acknowledged_by: null,
        acknowledged_at: null,
        resolved_by: null,
        resolved_at: null,
        resolution_notes: null,
        created_at: currentIsoTime,
        timestamp: currentIsoTime
      };

    db.alerts.unshift(alertRecord);
    broadcastAlert(alertRecord);
  }

  res.json({
    success: true,
    result,
    authorized: result === 'AUTHORIZED',
    checkpointId: checkpoint.id,
    checkpoint_id: checkpoint.id,
    checkpoint_name: checkpoint.name,
    scan: scanRecord,
    asset
  });
});

// Heartbeat Ingestion
router.post('/heartbeat', (req, res) => {
  const { device_code, ip_address, rssi } = req.body;
  const dev = db.devices.find((d) => d.device_code === device_code);
  if (dev) {
    dev.last_seen = new Date().toISOString();
    dev.status = 'ONLINE';
    if (ip_address) dev.ip_address = ip_address;
    if (rssi !== undefined) dev.rssi = rssi;
    broadcastHeartbeat({ ...dev, checkpointId: dev.checkpoint_id, checkpoint_id: dev.checkpoint_id });
  }
  res.json({ success: true, status: 'acknowledged' });
});

// Remote Actuator Commands (Buzzer Silence, Relay Gate Lock)
router.post('/actuator', (req, res) => {
  const { device_code, command } = req.body;

  if (command === 'RESET_ALARM') {
    if (!device_code || device_code === 'ALL') {
      broadcastAlarmReset({ device_code: 'ALL', checkpointId: null });
    } else {
      const dev = db.devices.find((d) => d.device_code === device_code);
      if (dev) {
        broadcastAlarmReset({ device_code, checkpointId: dev.checkpoint_id, checkpoint_id: dev.checkpoint_id });
      }
    }
  }

  res.json({ success: true, message: `Actuator command [${command}] executed on ${device_code || 'all'}` });
});

// Periodic IoT Heartbeat Background Telemetry Simulation
setInterval(() => {
  const nodes = db.devices.filter((d) => d.device_type === 'ESP32_RFID_NODE' || d.device_type === 'ESP32_CAM');
  nodes.forEach((node) => {
    // Realistic signal jitter
    const baseRssi = node.device_code === 'ESP32-CP01-GATE' ? -58 : node.device_code === 'ESP32-CP02-GATE' ? -52 : -62;
    const jitter = Math.floor(Math.random() * 5) - 2;
    node.rssi = Math.min(-42, Math.max(-78, baseRssi + jitter));
    node.last_seen = new Date().toISOString();
    node.status = 'ONLINE';
    broadcastHeartbeat({
      ...node,
      checkpointId: node.checkpoint_id,
      checkpoint_id: node.checkpoint_id
    });
  });
}, 10000);

export default router;
