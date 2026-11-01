import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { broadcastCameraEvent } from '../socket';

const router = Router();
const uploadsDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// GET /api/camera/events - Retrieve historical evidence events
// ---------------------------------------------------------------------------
router.get('/events', (req, res) => {
  const { checkpoint_id } = req.query;
  if (checkpoint_id && String(checkpoint_id) === '2') {
    return res.json({
      success: true,
      count: 0,
      events: [],
      camera_installed: false,
      message: 'Camera: Not Installed at Checkpoint 2 (Secondary/Lab Gate)'
    });
  }

  let events = db.cameraEvents.map((e: any) => {
    const validTime = e.captured_at || e.timestamp || e.created_at || new Date().toISOString();
    return {
      ...e,
      captured_at: validTime,
      timestamp: validTime,
      created_at: validTime,
      file_size_bytes: e.file_size_bytes || 45600
    };
  });

  if (checkpoint_id && String(checkpoint_id) === '1') {
    events = events.filter((e) => e.checkpoint_id === 1);
  }

  res.json({
    success: true,
    count: events.length,
    camera_installed: true,
    events
  });
});

// ---------------------------------------------------------------------------
// POST /api/camera/event - Direct upload from ESP32-CAM or frontend
// Supports:
// 1. Raw binary JPEG POST (from Arduino HTTPClient http.POST(fb->buf, fb->len))
// 2. JSON payload with Base64 image
// 3. Fallback / simulated snapshot
// ---------------------------------------------------------------------------
router.post('/event', async (req, res) => {
  try {
    let imagePath = '';
    let triggerType = 'MANUAL_TRIGGER';
    let rfidUid = req.headers['x-rfid-uid'] as string || undefined;
    let deviceCode = (req.headers['x-device-code'] as string) || 'ESP32-CAM-CP01';
    let checkpointId = Number(req.headers['x-checkpoint-id']) || 1;
    let fileSizeBytes = 45000;

    // Check if body is raw binary Buffer (JPEG from ESP32-CAM)
    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      triggerType = (req.headers['x-trigger-type'] as string) || 'UNAUTHORIZED_SCAN';
      fileSizeBytes = req.body.length;
      const filename = `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
      const fullPath = path.join(uploadsDir, filename);
      fs.writeFileSync(fullPath, req.body);
      imagePath = `/uploads/${filename}`;
    } else if (req.body && typeof req.body === 'object') {
      const {
        device_code,
        checkpoint_id,
        trigger_type,
        event_type,
        image_base64,
        rfid_uid
      } = req.body;

      if (device_code) deviceCode = device_code;
      if (checkpoint_id) checkpointId = Number(checkpoint_id);
      if (trigger_type || event_type) triggerType = trigger_type || event_type;
      if (rfid_uid) rfidUid = rfid_uid;

      if (image_base64 && typeof image_base64 === 'string') {
        const matches = image_base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          fileSizeBytes = buffer.length;
          const filename = `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
          fs.writeFileSync(path.join(uploadsDir, filename), buffer);
          imagePath = `/uploads/${filename}`;
        } else {
          imagePath = image_base64;
        }
      }
    }

    // Default sample image if no buffer/base64 was provided
    if (!imagePath) {
      imagePath = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80';
    }

    // Resolve associated asset if rfid_uid is present
    let assetName: string | undefined;
    let assetCode: string | undefined;
    if (rfidUid) {
      const tag = db.rfidTags.find((t) => t.uid === rfidUid);
      if (tag && tag.asset_id) {
        const asset = db.assets.find((a) => a.id === tag.asset_id);
        if (asset) {
          assetName = asset.asset_name;
          assetCode = asset.asset_code;
        }
      }
    }

    const newEvent = {
      id: db.cameraEvents.length + 1,
      event_code: `CAM-EVT-${Math.floor(1000 + Math.random() * 9000)}`,
      checkpoint_id: checkpointId,
      checkpointId,
      checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
      device_code: deviceCode,
      event_type: triggerType,
      trigger_type: triggerType,
      image_path: imagePath,
      file_size_bytes: fileSizeBytes,
      asset_name: assetName,
      asset_code: assetCode,
      rfid_uid: rfidUid,
      alert_id: null,
      captured_at: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    db.cameraEvents.unshift(newEvent);
    broadcastCameraEvent(newEvent);

    return res.status(201).json({
      success: true,
      message: 'Optical evidence frame registered successfully',
      event: newEvent
    });
  } catch (error: any) {
    console.error('Failed to process camera event:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/camera/proxy-frame - Proxy live JPEG from ESP32-CAM (Avoids CORS)
// ---------------------------------------------------------------------------
router.get('/proxy-frame', async (req, res) => {
  const ip = (req.query.ip as string) || '';
  if (!ip) {
    return res.status(400).send('Missing camera IP query parameter');
  }

  const cleanIp = ip.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const targetUrl = `http://${cleanIp}/capture`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).send('Camera error');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    });

    res.send(buffer);
  } catch (err: any) {
    res.status(502).json({
      error: 'Cannot reach ESP32-CAM',
      message: err.message,
      target: targetUrl
    });
  }
});

let activeCameraIp = '192.168.43.100';

export function setActiveCameraIp(ip: string) {
  if (ip) {
    activeCameraIp = ip.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

export function getActiveCameraIp(): string {
  return activeCameraIp;
}

export async function captureCameraSnapshot(
  triggerType: string,
  rfidUid?: string,
  assetName?: string
): Promise<string | null> {
  const list = await captureCameraBurst(triggerType, rfidUid, assetName, 1);
  return list.length > 0 ? list[0].url : null;
}

// ---------------------------------------------------------------------------
export interface CapturedBurstFrame {
  url: string;
  isRealHardware: boolean;
}

export async function captureCameraBurst(
  triggerType: string,
  rfidUid?: string,
  assetName?: string,
  count: number = 3
): Promise<CapturedBurstFrame[]> {
  const burstResults: CapturedBurstFrame[] = [];

  for (let i = 1; i <= count; i++) {
    let imagePath = '';
    let isRealHardware = false;

    if (activeCameraIp) {
      try {
        console.log(`[Camera Burst] Frame ${i}/${count}: Attempting snapshot from ESP32-CAM at http://${activeCameraIp}/capture (Trigger: ${triggerType}, Tag: ${rfidUid || 'N/A'})`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);

        const camResponse = await fetch(`http://${activeCameraIp}/capture`, { signal: controller.signal });
        clearTimeout(timeout);

        if (camResponse.ok) {
          const arrayBuffer = await camResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const filename = `evt_${Date.now()}_frame${i}_${Math.floor(Math.random() * 1000)}.jpg`;
          const fullPath = path.join(uploadsDir, filename);
          fs.writeFileSync(fullPath, buffer);
          imagePath = `/uploads/${filename}`;
          isRealHardware = true;
          console.log(`[Camera Burst] Frame ${i}/${count}: Successfully saved live image (${buffer.length} bytes) to ${imagePath}`);
        } else {
          console.warn(`[Camera Burst] Frame ${i}/${count}: ESP32-CAM returned HTTP ${camResponse.status}`);
        }
      } catch (err: any) {
        console.warn(`[Camera Burst] Frame ${i}/${count}: Could not reach ESP32-CAM at http://${activeCameraIp}/capture (${err.message}). Using security incident fallback frame.`);
      }
    } else {
      console.log(`[Camera Burst] Frame ${i}/${count}: No activeCameraIp configured. Using security incident fallback frame.`);
    }

    if (!imagePath) {
      // 3 realistic surveillance incident fallback angles
      const incidentAngles = [
        'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
      ];
      imagePath = incidentAngles[(i - 1) % incidentAngles.length];
      isRealHardware = false;
    }

    burstResults.push({ url: imagePath, isRealHardware });

    // Short spacing between frames (300ms) for high-speed security capture
    if (i < count) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return burstResults;
}

// ---------------------------------------------------------------------------
// POST /api/camera/trigger-snapshot - Fetch 2-3 snapshots from live ESP32-CAM IP & save
// ---------------------------------------------------------------------------
router.post('/trigger-snapshot', async (req, res) => {
  const { camera_ip, trigger_type, rfid_uid, burst_count } = req.body;
  const targetIp = camera_ip || activeCameraIp;
  if (!targetIp) {
    return res.status(400).json({ success: false, message: 'camera_ip is required' });
  }

  const cleanIp = String(targetIp).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  setActiveCameraIp(cleanIp);

  const numPhotos = Number(burst_count) || 3;
  const burstGroupId = `BURST-${Date.now()}`;
  const capturedEvents = [];

  try {
    const photoUrls = await captureCameraBurst(
      trigger_type || 'MANUAL_DASHBOARD_SNAPSHOT',
      rfid_uid,
      undefined,
      numPhotos
    );

    for (let idx = 0; idx < photoUrls.length; idx++) {
      const frame = photoUrls[idx];
      const newEvent = {
        id: db.cameraEvents.length + 1,
        event_code: `CAM-EVT-${Math.floor(1000 + Math.random() * 9000)}-F${idx + 1}`,
        checkpoint_id: 1,
        checkpointId: 1,
        checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
        device_code: 'ESP32-CAM-HW381-OV3660',
        event_type: trigger_type || 'MANUAL_DASHBOARD_SNAPSHOT',
        trigger_type: trigger_type || 'MANUAL_DASHBOARD_SNAPSHOT',
        image_path: frame.url,
        is_real_hardware: frame.isRealHardware,
        capture_source: frame.isRealHardware ? 'LIVE_ESP32_CAM' : 'SIMULATION_FALLBACK',
        file_size_bytes: frame.isRealHardware ? 54000 : 46000 + idx * 240,
        rfid_uid: rfid_uid || undefined,
        alert_id: null,
        burst_group_id: burstGroupId,
        frame_index: idx + 1,
        total_frames: photoUrls.length,
        captured_at: new Date(Date.now() + idx * 350).toISOString(),
        timestamp: new Date().toISOString()
      };

      db.cameraEvents.unshift(newEvent);
      broadcastCameraEvent(newEvent);
      capturedEvents.push(newEvent);
    }

    res.json({
      success: true,
      message: `${capturedEvents.length} security burst frames captured and stored into evidence log`,
      burst_group_id: burstGroupId,
      events: capturedEvents,
      event: capturedEvents[0]
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to capture burst sequence: ${err.message}`
    });
  }
});

router.get('/status', (req, res) => {
  return res.json({
    success: true,
    active_ip: activeCameraIp,
    configured: !!activeCameraIp && activeCameraIp !== '192.168.43.100',
    total_events: db.cameraEvents.length,
    real_hardware_events: db.cameraEvents.filter(e => e.is_real_hardware || e.image_path.startsWith('/uploads')).length
  });
});

router.post('/register-ip', (req, res) => {
  const { ip } = req.body;
  if (ip) {
    setActiveCameraIp(ip);
    console.log(`[Camera API] Active ESP32-CAM IP registered: ${activeCameraIp}`);
    return res.json({ success: true, active_ip: activeCameraIp });
  }
  return res.status(400).json({ success: false, message: 'Missing IP' });
});

router.delete('/events', (req, res) => {
  db.cameraEvents = [];
  return res.json({ success: true, message: 'All demo and cached evidence logs cleared.' });
});

export default router;
