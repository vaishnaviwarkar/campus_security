import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/summary', (req, res) => {
  const totalAssets = db.assets.length;
  const availableAssets = db.assets.filter((a) => a.status === 'AVAILABLE').length;
  const issuedAssets = db.assets.filter((a) => a.status === 'ISSUED').length;
  const missingAssets = db.assets.filter((a) => a.status === 'MISSING').length;
  const underRepairAssets = db.assets.filter((a) => a.status === 'UNDER_REPAIR').length;
  const activeAlerts = db.alerts.filter((a) => a.status === 'OPEN').length;
  const activeLoans = db.issues.filter((i) => i.status === 'ISSUED').length;
  const onlineDevices = db.devices.filter((d) => d.status === 'ONLINE').length;

  const categoryDistribution = db.categories.map((cat) => ({
    name: cat.category_name,
    count: db.assets.filter((a) => a.category_id === cat.id).length
  }));

  const statusDistribution = [
    { name: 'Available', count: availableAssets, color: '#10b981' },
    { name: 'Issued', count: issuedAssets, color: '#3b82f6' },
    { name: 'Missing', count: missingAssets, color: '#ef4444' },
    { name: 'Under Repair', count: underRepairAssets, color: '#f59e0b' }
  ];

  const cp1Device = db.devices.find((d) => d.device_code === 'ESP32-CP01-GATE');
  const cp1Cam = db.devices.find((d) => d.device_code === 'ESP32-CAM-CP01');
  const cp2Device = db.devices.find((d) => d.device_code === 'ESP32-CP02-GATE');

  const cp1LastScan = db.recentScans.find((s) => s.checkpoint_id === 1);
  const cp2LastScan = db.recentScans.find((s) => s.checkpoint_id === 2);

  const checkpointBreakdown = {
    cp1: {
      id: 1,
      name: 'Checkpoint 1 – Main Entrance',
      device_code: 'ESP32-CP01-GATE',
      online: cp1Device?.status === 'ONLINE',
      ip_address: cp1Device?.ip_address || '192.168.1.101',
      last_rfid_scan: cp1LastScan?.rfid_uid || 'None',
      last_scan_result: cp1LastScan?.result || 'None',
      last_scan_time: cp1LastScan?.timestamp || null,
      camera_installed: true,
      camera_status: cp1Cam?.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
      rssi: cp1Device?.rssi || -58,
      last_heartbeat: cp1Device?.last_seen || new Date().toISOString()
    },
    cp2: {
      id: 2,
      name: 'Checkpoint 2 – Lab/Secondary Gate',
      device_code: 'ESP32-CP02-GATE',
      online: cp2Device?.status === 'ONLINE',
      ip_address: cp2Device?.ip_address || '192.168.1.105',
      last_rfid_scan: cp2LastScan?.rfid_uid || 'None',
      last_scan_result: cp2LastScan?.result || 'None',
      last_scan_time: cp2LastScan?.timestamp || null,
      camera_installed: false,
      camera_status: 'Not Installed',
      rssi: cp2Device?.rssi || -52,
      last_heartbeat: cp2Device?.last_seen || new Date().toISOString()
    }
  };

  res.json({
    success: true,
    stats: {
      total_assets: totalAssets,
      available_assets: availableAssets,
      issued_assets: issuedAssets,
      missing_assets: missingAssets,
      under_repair_assets: underRepairAssets,
      active_alerts: activeAlerts,
      active_loans: activeLoans,
      online_devices: onlineDevices,
      total_devices: db.devices.length,
      recent_scans_count: db.recentScans.length
    },
    checkpointBreakdown,
    categoryDistribution,
    statusDistribution,
    recentScans: db.recentScans.slice(0, 10).map((s: any) => {
      const validTime = s.timestamp || s.created_at || s.scanned_at || new Date().toISOString();
      return { ...s, timestamp: validTime, created_at: validTime };
    }),
    recentAlerts: db.alerts.slice(0, 5).map((a: any) => {
      const validTime = a.created_at || a.timestamp || new Date().toISOString();
      return { ...a, created_at: validTime, timestamp: validTime };
    }),
    recentMovements: db.movements.slice(0, 10).map((m: any) => {
      const validTime = m.timestamp || m.scanned_at || m.created_at || new Date().toISOString();
      return { ...m, timestamp: validTime, scanned_at: validTime, created_at: validTime };
    })
  });
});

export default router;
