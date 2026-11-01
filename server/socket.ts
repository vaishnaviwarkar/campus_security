import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO Server] Connected client: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO Server] Disconnected client: ${socket.id}`);
    });
  });
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function broadcastScan(scan: any) {
  if (ioInstance) {
    ioInstance.emit('rfid_scan', scan);
  }
}

export function broadcastAlert(alert: any) {
  if (ioInstance) {
    ioInstance.emit('security_alert', alert);
  }
}


export function broadcastAlarmReset(data: any) {
  if (ioInstance) {
    ioInstance.emit('alarm_reset', data);
  }
}

export function broadcastHeartbeat(device: any) {
  if (ioInstance) {
    ioInstance.emit('device_heartbeat', device);
  }
}

export function broadcastCameraEvent(event: any) {
  if (ioInstance) {
    ioInstance.emit('camera_evidence', event);
  }
}

