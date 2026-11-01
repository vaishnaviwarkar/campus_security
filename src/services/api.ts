import { Asset, RFIDTag, Checkpoint, Location, SecurityAlert, RFIDScan, AssetMovement, AssetIssue, MaintenanceRecord, IoTDevice, CameraEvent, User } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('cas_auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('cas_auth_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('cas_auth_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API error ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const res = await request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },
  logout: () => {
    clearAuthToken();
  },
  getMe: () => request<{ success: boolean; user: any }>('/auth/me'),
  getUsers: () => request<{ success: boolean; users: any[]; roles: any[] }>('/auth/users'),
  createUser: (userData: any) =>
    request<{ success: boolean; user: any }>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  updateUser: (id: number, userData: any) =>
    request<{ success: boolean; user: any }>(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),
  deleteUser: (id: number) =>
    request<{ success: boolean }>(`/auth/users/${id}`, {
      method: 'DELETE'
    }),

  // Dashboard
  getDashboardStats: async () => {
    const res = await request<{
      success: boolean;
      stats: any;
      checkpointBreakdown?: any;
      categoryDistribution: any[];
      statusDistribution: any[];
      recentScans: any[];
      recentAlerts: any[];
      recentMovements: any[];
    }>('/dashboard/summary');
    return { ...res.stats, checkpointBreakdown: res.checkpointBreakdown };
  },
  getDashboardSummary: () =>
    request<{
      success: boolean;
      stats: any;
      checkpointBreakdown?: any;
      categoryDistribution: any[];
      statusDistribution: any[];
      recentScans: any[];
      recentAlerts: any[];
      recentMovements: any[];
    }>('/dashboard/summary'),

  // Assets
  getAssets: (params?: Record<string, string | number | undefined>) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<{ success: boolean; count: number; assets: Asset[] }>(`/assets${query}`);
  },
  getAssetById: (id: number) => request<{ success: boolean; asset: Asset }>(`/assets/${id}`),
  createAsset: (assetData: any) =>
    request<{ success: boolean; asset: Asset }>('/assets', {
      method: 'POST',
      body: JSON.stringify(assetData)
    }),
  updateAsset: (id: number, assetData: any) =>
    request<{ success: boolean; asset: Asset }>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assetData)
    }),
  deleteAsset: (id: number) =>
    request<{ success: boolean }>(`/assets/${id}`, {
      method: 'DELETE'
    }),
  getCategories: () => request<{ success: boolean; categories: any[] }>('/assets/categories'),
  getLocations: () => request<{ success: boolean; locations: Location[] }>('/assets/locations'),
  getCheckpoints: () => request<{ success: boolean; checkpoints: Checkpoint[] }>('/assets/checkpoints'),

  // RFID
  getRFIDTags: () => request<{ success: boolean; count: number; tags: RFIDTag[] }>('/rfid'),
  registerRFIDTag: (data: any) =>
    request<{ success: boolean; tag: any }>('/rfid', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  assignRFIDTag: (data: { uid: string; asset_id?: number | null; new_asset_name?: string; department?: string; category_name?: string }) =>
    request<{ success: boolean; tag: any; asset?: any }>('/rfid/assign', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteRFIDTag: (id: number) =>
    request<{ success: boolean }>(`/rfid/${id}`, {
      method: 'DELETE'
    }),
  lookupRFID: (uid: string) => request<{ success: boolean; registered: boolean; tag?: any; asset?: any }>(`/rfid/lookup/${uid}`),

  // Issues & Returns
  getIssues: (params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; issues: AssetIssue[] }>(`/issues${query}`);
  },
  issueAsset: (data: any) =>
    request<{ success: boolean; issue: any; asset: any }>('/issues/issue', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  returnAsset: (data: any) =>
    request<{ success: boolean; asset: any }>('/issues/return', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Maintenance
  getMaintenance: (params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; records: MaintenanceRecord[] }>(`/maintenance${query}`);
  },
  createMaintenanceTicket: (data: any) =>
    request<{ success: boolean; record: any; asset: any }>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateMaintenanceTicket: (id: number, data: any) =>
    request<{ success: boolean; record: any; asset: any }>(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Alerts
  getAlerts: (params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; alerts: SecurityAlert[] }>(`/alerts${query}`);
  },
  acknowledgeAlert: (id: number) =>
    request<{ success: boolean; alert: any }>(`/alerts/${id}/acknowledge`, {
      method: 'POST'
    }),
  resolveAlert: (id: number, resolution_notes?: string) =>
    request<{ success: boolean; alert: any }>(`/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_notes })
    }),
  createManualAlert: (data: any) =>
    request<{ success: boolean; alert: any }>('/alerts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Movements & Scans
  getMovements: (params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; movements: AssetMovement[] }>(`/movements${query}`);
  },
  getRecentScans: async (): Promise<RFIDScan[]> => {
    const summary = await request<{ success: boolean; recentScans: RFIDScan[] }>('/dashboard/summary');
    return summary.recentScans || [];
  },

  // IoT & Devices
  getIoTDevices: () => request<{ success: boolean; count: number; devices: IoTDevice[] }>('/iot/devices'),
  getDevices: () => request<{ success: boolean; count: number; devices: IoTDevice[] }>('/iot/devices'),
  sendActuatorCommand: (device_code: string, command: string) =>
    request<{ success: boolean; message: string }>('/iot/actuator', {
      method: 'POST',
      body: JSON.stringify({ device_code, command })
    }),
  sendSimulatedScan: (payload: { rfid_uid: string; device_code?: string; checkpoint_id?: number }) =>
    request<any>('/iot/rfid-scan', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  sendSimulatedHeartbeat: (payload: { device_code: string; ip_address?: string; rssi?: number }) =>
    request<any>('/iot/heartbeat', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Camera Evidence
  getCameraEvents: (params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; count: number; events: CameraEvent[] }>(`/camera/events${query}`);
  },
  registerCameraIp: (ip: string) =>
    request<{ success: boolean; active_ip: string }>('/camera/register-ip', {
      method: 'POST',
      body: JSON.stringify({ ip })
    }),
  triggerCameraSnapshot: (data: { camera_ip?: string; trigger_type?: string; rfid_uid?: string; burst_count?: number }) =>
    request<{ success: boolean; message: string; burst_group_id?: string; events?: any[]; event?: any }>('/camera/trigger-snapshot', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Missing & Recovery
  getMissingAssets: () => request<{ success: boolean; count: number; missingAssets: Asset[] }>('/recovery/missing'),
  flagMissingAsset: (data: { asset_id: number; reason?: string }) =>
    request<{ success: boolean; message: string; asset: any }>('/recovery/flag-missing', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  confirmRecoveredAsset: (data: { asset_id: number; condition_rating?: string; notes?: string }) =>
    request<{ success: boolean; message: string; asset: any }>('/recovery/confirm-recovered', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};
