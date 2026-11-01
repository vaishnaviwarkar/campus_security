import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { initSocketIO } from './server/socket';

// Route imports
import authRoutes from './server/routes/auth';
import assetRoutes from './server/routes/assets';
import rfidRoutes from './server/routes/rfid';
import issueReturnRoutes from './server/routes/issueReturn';
import maintenanceRoutes from './server/routes/maintenance';
import alertRoutes from './server/routes/alerts';
import movementRoutes from './server/routes/movements';
import iotRoutes from './server/routes/iot';
import cameraRoutes from './server/routes/camera';
import dashboardRoutes from './server/routes/dashboard';
import recoveryRoutes from './server/routes/recovery';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Initialize Socket.IO with CORS
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  initSocketIO(io);

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(express.raw({ type: ['image/jpeg', 'image/png', 'application/octet-stream'], limit: '10mb' }));

  // Static Uploads Directory for ESP32-CAM Evidence Images
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // ---------------------------------------------------------------------------
  // API Routes
  // ---------------------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      system: 'CampusAssetSecurity',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
      socket_clients: io.engine.clientsCount
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/assets', assetRoutes);
  app.use('/api/rfid', rfidRoutes);
  app.use('/api/issues', issueReturnRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/movements', movementRoutes);
  app.use('/api/iot', iotRoutes);
  app.use('/api/camera', cameraRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/recovery', recoveryRoutes);

  // ---------------------------------------------------------------------------
  // Vite Integration (SPA Middleware in Dev / Static dist in Prod)
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[CampusAssetSecurity] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[CampusAssetSecurity] Real-time Socket.IO initialized.`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
