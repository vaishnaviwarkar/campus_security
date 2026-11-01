export type UserRole = 'ADMIN' | 'LAB_STAFF' | 'SECURITY';

export interface User {
  id: number;
  name: string;
  email: string;
  role_id?: number;
  role_code: UserRole;
  department: string;
  phone?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  created_at: string;
}

export interface Asset {
  id: number;
  asset_code: string;
  asset_name: string;
  category_id: number;
  category_name?: string;
  description: string;
  department: string;
  location_id: number;
  location_name?: string;
  status: 'AVAILABLE' | 'ISSUED' | 'MISSING' | 'RECOVERED' | 'UNDER_REPAIR' | 'OUT_OF_SERVICE';
  maintenance_status: 'WORKING' | 'NOT_WORKING' | 'UNDER_REPAIR' | 'OUT_OF_SERVICE';
  condition_rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  assigned_to?: string | null;
  rfid_uid?: string | null;
  purchase_date: string;
  warranty_expiry: string;
  image_path?: string;
  created_at: string;
  updated_at: string;
}

export interface RFIDTag {
  id: number;
  uid: string;
  asset_id: number | null;
  asset_name?: string;
  asset_code?: string;
  tag_type: string;
  status: 'ASSIGNED' | 'UNASSIGNED';
  authorization_status: 'AUTHORIZED' | 'UNAUTHORIZED';
  checkout_authorized: boolean;
  assigned_to?: string | null;
  is_active: boolean;
  assigned_at: string | null;
  created_at: string;
}

export interface Checkpoint {
  id: number;
  checkpoint_code: string;
  name: string;
  location_id: number;
  location_name?: string;
  direction: 'ENTRY' | 'EXIT' | 'BIDIRECTIONAL';
  status: string;
  camera_installed?: boolean;
}

export interface Location {
  id: number;
  location_code: string;
  name: string;
  building: string;
  floor: string;
  description: string;
}

export interface SecurityAlert {
  id: number;
  alert_code?: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  asset_id: number | null;
  asset_name?: string;
  asset_code?: string;
  checkpoint_id: number | null;
  checkpointId?: number | null;
  checkpoint_name?: string;
  device_code: string;
  device_id?: string;
  rfid_uid?: string | null;
  message: string;
  camera_event_id?: number | null;
  camera_image_url?: string | null;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  created_at: string;
  resolved_at?: string | null;
  resolved_by_name?: string | null;
  resolution_notes?: string | null;
}

export interface RFIDScan {
  id: number;
  rfid_uid: string;
  asset_id?: number | null;
  asset_name?: string;
  asset_code?: string;
  checkpoint_id?: number | null;
  checkpointId?: number | null;
  checkpoint_name?: string;
  device_code: string;
  device_id?: string;
  result: 'AUTHORIZED' | 'UNAUTHORIZED' | 'MISSING_ASSET' | 'UNKNOWN_TAG';
  action_taken?: string;
  timestamp?: string;
  created_at?: string;
}

export interface AssetMovement {
  id: number;
  asset_id: number | null;
  asset_name?: string;
  asset_code?: string;
  rfid_uid: string;
  checkpoint_id: number;
  checkpointId?: number;
  checkpoint_name?: string;
  device_code: string;
  device_id?: string;
  event_type?: string;
  direction?: 'ENTRY' | 'EXIT' | 'BIDIRECTIONAL';
  authorization_status: 'AUTHORIZED' | 'UNAUTHORIZED';
  reason?: string;
  timestamp?: string;
  scanned_at?: string;
  previous_checkpoint_id?: number | null;
  previous_checkpoint_name?: string;
  status_transition?: string;
}

export interface AssetIssue {
  id: number;
  asset_id: number;
  asset_name?: string;
  asset_code?: string;
  issued_to_name: string;
  issued_to_id: string;
  issued_to_email?: string;
  issued_by: number;
  issued_by_name?: string;
  purpose: string;
  issue_date: string;
  expected_return_date: string;
  actual_return_date?: string | null;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  remarks?: string;
}

export interface MaintenanceRecord {
  id: number;
  asset_id: number;
  asset_name?: string;
  asset_code?: string;
  issue_description: string;
  maintenance_type: string;
  status: 'LOGGED' | 'UNDER_INSPECTION' | 'IN_PROGRESS' | 'COMPLETED' | 'SCRAPPED';
  reported_by: number;
  reported_by_name?: string;
  technician_name?: string;
  resolution_notes?: string;
  cost: number;
  start_date: string;
  completed_date?: string | null;
}

export interface IoTDevice {
  id: number;
  device_code: string;
  name?: string;
  device_type: string;
  checkpoint_id: number | null;
  checkpointId?: number | null;
  checkpoint_name?: string;
  ip_address: string;
  mac_address: string;
  firmware_version: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  alarm_active?: boolean;
  last_seen: string;
  rssi?: number;
  camera_installed?: boolean;
  rfid_status?: string;
  camera_status?: string;
}

export interface CameraEvent {
  id: number;
  device_code: string;
  checkpoint_id: number | null;
  checkpoint_name?: string;
  event_type: string;
  alert_id?: number | null;
  asset_id?: number | null;
  asset_name?: string;
  rfid_uid?: string | null;
  image_path: string;
  file_size_bytes: number;
  captured_at: string;
  burst_group_id?: string;
  frame_index?: number;
  total_frames?: number;
  is_real_hardware?: boolean;
  capture_source?: 'LIVE_ESP32_CAM' | 'SIMULATION_FALLBACK';
}

