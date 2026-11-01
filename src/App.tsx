import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavView } from './components/Sidebar';
import { IoTTestBenchModal } from './components/IoTTestBenchModal';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { AssetsView } from './views/AssetsView';
import { AssetDetailModal } from './views/AssetDetailModal';
import { RFIDManagementView } from './views/RFIDManagementView';
import { LiveMonitoringView } from './views/LiveMonitoringView';
import { IssueReturnView } from './views/IssueReturnView';
import { MaintenanceView } from './views/MaintenanceView';
import { AlertsView } from './views/AlertsView';
import { MissingAssetsView } from './views/MissingAssetsView';
import { RecoveryView } from './views/RecoveryView';
import { DeviceHealthView } from './views/DeviceHealthView';
import { CameraEvidenceView } from './views/CameraEvidenceView';
import { MovementLogsView } from './views/MovementLogsView';
import { ReportsView } from './views/ReportsView';
import { UserManagementView } from './views/UserManagementView';
import { RoadmapView } from './views/RoadmapView';

import { User, Asset, RFIDScan, SecurityAlert, IoTDevice } from './types';
import { api } from './services/api';
import { socketService } from './services/socket';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cas_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation State
  const [currentView, setCurrentView] = useState<NavView>('dashboard');

  // Core Data State
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [scans, setScans] = useState<RFIDScan[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [activeAlarm, setActiveAlarm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connectedClients, setConnectedClients] = useState(1);

  // Modals
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [isTestBenchOpen, setIsTestBenchOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'alert' } | null>(null);

  // Web Audio Context for Alarm Siren
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  // Play / Stop Security Siren
  const playSiren = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      if (!oscRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, audioCtxRef.current.currentTime + 0.3);

        gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        oscRef.current = osc;
      }
    } catch (e) {
      console.warn('Audio playback restricted:', e);
    }
  };

  const stopSiren = () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch (e) {}
      oscRef.current = null;
    }
  };

  // Toast Trigger Helper
  const showToast = (message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Refresh All Data
  const loadData = async () => {
    try {
      const [statsData, assetsData, scansData, alertsData, devicesData] = await Promise.allSettled([
        api.getDashboardStats(),
        api.getAssets(),
        api.getRecentScans(),
        api.getAlerts(),
        api.getDevices()
      ]);

      if (statsData.status === 'fulfilled') setDashboardStats(statsData.value);
      if (assetsData.status === 'fulfilled') setAssets(assetsData.value.assets || []);
      if (scansData.status === 'fulfilled') setScans(scansData.value || []);
      if (alertsData.status === 'fulfilled') {
        const alertList = alertsData.value.alerts || [];
        setAlerts(alertList);
        // Only engage activeAlarm if a fresh critical breach happened in the last 60 seconds
        const recentCritical = alertList.some((a: any) =>
          a.status === 'OPEN' &&
          a.severity === 'CRITICAL' &&
          (Date.now() - new Date(a.created_at || a.timestamp || 0).getTime() < 60000)
        );
        if (recentCritical) {
          setActiveAlarm(true);
        }
      }
      if (devicesData.status === 'fulfilled') setDevices(devicesData.value.devices || []);
    } catch (err) {
      console.error('Error fetching system data:', err);
    }
  };

  // Reset / Silence Alarm
  const handleResetAlarm = async () => {
    try {
      await api.sendActuatorCommand('ESP32-CP01-GATE', 'RESET_ALARM');
    } catch {}
    setActiveAlarm(false);
    stopSiren();
    showToast('✓ Security alarm silenced and disengaged.', 'info');
  };

  // Init Data and Socket
  useEffect(() => {
    loadData();

    // Connect Socket.IO
    socketService.connect();

    // Register real-time listeners: Engage alarm strictly on unauthorized transit or unregistered card
    socketService.onScan((scan: RFIDScan) => {
      setScans((prev) => [scan, ...prev.slice(0, 49)]);
      if (
        scan.result === 'UNAUTHORIZED' ||
        scan.result === 'UNKNOWN_TAG' ||
        scan.result === 'MISSING_ASSET'
      ) {
        setActiveAlarm(true);
        playSiren();
        showToast(`🚨 SECURITY ALARM: ${scan.result} on tag ${scan.rfid_uid}`, 'alert');
      } else if (scan.result === 'AUTHORIZED') {
        showToast(`✓ Authorized Transit: ${scan.asset_name || scan.rfid_uid}`, 'success');
      }
      loadData();
    });

    socketService.onAlert((alert: SecurityAlert) => {
      setAlerts((prev) => [alert, ...prev]);
      if (alert.severity === 'CRITICAL') {
        setActiveAlarm(true);
        playSiren();
        showToast(`🚨 CRITICAL: ${alert.message}`, 'alert');
      } else {
        showToast(`⚠️ Alert: ${alert.message}`, 'info');
      }
      loadData();
    });

    socketService.onAlarmReset(() => {
      setActiveAlarm(false);
      stopSiren();
      showToast('✓ Alarm silenced and actuators reset.', 'info');
      loadData();
    });

    socketService.onHeartbeat((device: IoTDevice) => {
      setDevices((prev) =>
        prev.map((d) => (d.device_code === device.device_code ? { ...d, ...device, last_seen: new Date().toISOString() } : d))
      );
    });

    return () => {
      socketService.disconnect();
      stopSiren();
    };
  }, []);

  // Handle Login
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('cas_user', JSON.stringify(user));
    showToast(`Welcome back, ${user.name}`, 'success');
  };

  // Handle Logout
  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    localStorage.removeItem('cas_user');
    showToast('Signed out securely.', 'info');
  };



  // If not logged in, render authentication page
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onBypass={() =>
          setCurrentUser({
            id: 1,
            name: 'Dr. Robert Vance',
            email: 'admin@campus.edu',
            role_code: 'ADMIN',
            department: 'Information Technology',
            phone: '+1 (555) 019-2831',
            status: 'ACTIVE',
            created_at: new Date().toISOString()
          })
        }
      />
    );
  }

  // Count active stats for sidebar badges
  const openAlertsCount = alerts.filter((a) => a.status === 'OPEN').length;
  const missingAssetsCount = assets.filter((a) => a.status === 'MISSING').length;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans antialiased selection:bg-blue-500/30">
      {/* Global Top Navbar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenTestBench={() => setIsTestBenchOpen(true)}
        activeAlarm={activeAlarm}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        connectedClients={connectedClients}
        onResetAlarm={handleResetAlarm}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          userRole={currentUser.role_code}
          alertCount={openAlertsCount}
          missingCount={missingAssetsCount}
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#09090b]">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentView === 'dashboard' && (
              <DashboardView
                stats={dashboardStats}
                recentScans={scans.slice(0, 6)}
                recentAlerts={alerts.slice(0, 4)}
                onOpenTestBench={() => setIsTestBenchOpen(true)}
                onNavigate={setCurrentView}
                onSelectAsset={(id) => setSelectedAssetId(id)}
              />
            )}

            {currentView === 'live-monitoring' && (
              <LiveMonitoringView
                scans={scans}
                alerts={alerts}
                devices={devices}
                activeAlarm={activeAlarm}
                onOpenTestBench={() => setIsTestBenchOpen(true)}
                onResetAlarm={handleResetAlarm}
              />
            )}

            {currentView === 'assets' && (
              <AssetsView
                assets={assets}
                onSelectAsset={(id) => setSelectedAssetId(id)}
                onRefresh={loadData}
              />
            )}

            {currentView === 'rfid-management' && (
              <RFIDManagementView
                onOpenTestBench={() => setIsTestBenchOpen(true)}
                onRefresh={loadData}
              />
            )}

            {currentView === 'issue-return' && (
              <IssueReturnView
                currentUser={currentUser}
                onRefresh={loadData}
              />
            )}

            {currentView === 'maintenance' && (
              <MaintenanceView
                currentUser={currentUser}
                onRefresh={loadData}
              />
            )}

            {currentView === 'alerts' && (
              <AlertsView
                alerts={alerts}
                onRefresh={loadData}
                onResetAlarm={handleResetAlarm}
              />
            )}

            {currentView === 'missing-assets' && (
              <MissingAssetsView
                missingAssets={assets.filter((a) => a.status === 'MISSING')}
                onRefresh={loadData}
                onOpenTestBench={() => setIsTestBenchOpen(true)}
              />
            )}

            {currentView === 'recovery' && (
              <RecoveryView
                onRefresh={loadData}
                onSelectAsset={(id) => setSelectedAssetId(id)}
              />
            )}

            {currentView === 'device-health' && (
              <DeviceHealthView
                devices={devices}
                onRefresh={loadData}
                onOpenTestBench={() => setIsTestBenchOpen(true)}
              />
            )}

            {currentView === 'camera-evidence' && (
              <CameraEvidenceView
                onOpenTestBench={() => setIsTestBenchOpen(true)}
              />
            )}

            {currentView === 'movement-history' && (
              <MovementLogsView />
            )}

            {currentView === 'reports' && (
              <ReportsView
                assets={assets}
                alerts={alerts}
              />
            )}

            {currentView === 'user-management' && (
              <UserManagementView />
            )}

            {(currentView === 'hardware-bench' || currentView === ('roadmap' as any)) && (
              <RoadmapView
                onOpenTestBench={() => setIsTestBenchOpen(true)}
                onNavigate={setCurrentView}
              />
            )}
          </div>
        </main>
      </div>

      {/* Asset Inspector Modal */}
      <AssetDetailModal
        assetId={selectedAssetId}
        onClose={() => setSelectedAssetId(null)}
        onRefresh={loadData}
      />

      {/* Hardware Simulator / IoT Test Bench Modal */}
      <IoTTestBenchModal
        isOpen={isTestBenchOpen}
        onClose={() => setIsTestBenchOpen(false)}
        onRefreshData={loadData}
      />

      {/* Real-time Toast Notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center space-x-2.5 ${
              toast.type === 'alert'
                ? 'bg-red-950/90 border-red-500/50 text-red-200'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
