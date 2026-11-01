import { io, Socket } from 'socket.io-client';
import { RFIDScan, SecurityAlert, IoTDevice } from '../types';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Socket Client] Connected to real-time server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket Client] Disconnected from real-time server');
    });
  }
  return socket;
}

export const socketService = {
  connect: () => {
    return getSocket();
  },
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
  onScan: (callback: (scan: RFIDScan) => void) => {
    const s = getSocket();
    s.on('rfid_scan', callback);
    return () => s.off('rfid_scan', callback);
  },
  onAlert: (callback: (alert: SecurityAlert) => void) => {
    const s = getSocket();
    s.on('security_alert', callback);
    return () => s.off('security_alert', callback);
  },
  onAlarmReset: (callback: (data: any) => void) => {
    const s = getSocket();
    s.on('alarm_reset', callback);
    return () => s.off('alarm_reset', callback);
  },
  onHeartbeat: (callback: (device: IoTDevice) => void) => {
    const s = getSocket();
    s.on('device_heartbeat', callback);
    return () => s.off('device_heartbeat', callback);
  },
  onCameraEvidence: (callback: (event: any) => void) => {
    const s = getSocket();
    s.on('camera_evidence', callback);
    return () => s.off('camera_evidence', callback);
  }
};
