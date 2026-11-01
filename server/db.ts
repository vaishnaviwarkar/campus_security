// In-memory data store replicating MySQL relational model for CampusAssetSecurity
export interface DbUser {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role_code: 'ADMIN' | 'LAB_STAFF' | 'SECURITY';
  department: string;
  phone?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  created_at: string;
}

export interface DbAsset {
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

export interface DbRfidTag {
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

class MemoryDatabase {
  users: DbUser[] = [
    {
      id: 1,
      name: 'Dr. Robert Vance',
      email: 'admin@campus.edu',
      role_id: 1,
      role_code: 'ADMIN',
      department: 'Information Technology',
      phone: '+1 (555) 019-2831',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Sarah Jenkins',
      email: 'staff@campus.edu',
      role_id: 2,
      role_code: 'LAB_STAFF',
      department: 'Computer Science Lab',
      phone: '+1 (555) 014-9922',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Officer Marcus Kane',
      email: 'security@campus.edu',
      role_id: 3,
      role_code: 'SECURITY',
      department: 'Campus Police & Safety',
      phone: '+1 (555) 011-8844',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    }
  ];

  categories = [
    { id: 1, category_code: 'COMP', category_name: 'Computing & Laptops', description: 'Workstations, MacBooks, Servers' },
    { id: 2, category_code: 'LAB', category_name: 'Lab Instruments', description: 'Oscilloscopes, Spectrum Analyzers' },
    { id: 3, category_code: 'AV', category_name: 'Audio/Visual Equipment', description: 'Projectors, Cinema Cameras' },
    { id: 4, category_code: 'NET', category_name: 'Networking Hardware', description: 'Switches, Routers, Edge Nodes' }
  ];

  locations = [
    { id: 1, location_code: 'LAB-CS-101', name: 'Computer Science Lab A', building: 'Turing Hall', floor: '1st Floor' },
    { id: 2, location_code: 'LAB-EE-204', name: 'Electrical Engineering Lab', building: 'Tesla Building', floor: '2nd Floor' },
    { id: 3, location_code: 'AUD-300', name: 'Main Auditorium AV Room', building: 'Media Center', floor: '3rd Floor' },
    { id: 4, location_code: 'GATE-CP01', name: 'Main Campus Exit Checkpoint', building: 'Perimeter Gate 1', floor: 'Ground' }
  ];

  checkpoints = [
    { id: 1, checkpoint_code: 'CP01-MAIN', name: 'Checkpoint 1 (Main Entrance Gate)', location_id: 4, location_name: 'Perimeter Gate 1', direction: 'BIDIRECTIONAL', status: 'ACTIVE' },
    { id: 2, checkpoint_code: 'CP02-GATE', name: 'Checkpoint 2 (Secondary/Lab Gate)', location_id: 1, location_name: 'Turing Hall CS Lab', direction: 'BIDIRECTIONAL', status: 'ACTIVE' }
  ];

  assets: DbAsset[] = [
    {
      id: 1,
      asset_code: 'AST-2024-001',
      asset_name: 'Dell Precision 7780 Workstation',
      category_id: 1,
      category_name: 'Computing & Laptops',
      description: 'High-performance AI workstation with RTX 4090 GPU',
      department: 'Computer Science',
      location_id: 1,
      location_name: 'Computer Science Lab A',
      status: 'AVAILABLE',
      maintenance_status: 'WORKING',
      condition_rating: 'EXCELLENT',
      risk_score: 92,
      risk_level: 'HIGH',
      assigned_to: null,
      rfid_uid: 'E2806894000040',
      purchase_date: '2024-01-15',
      warranty_expiry: '2027-01-15',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      asset_code: 'AST-2024-002',
      asset_name: 'Tektronix MSO46 4-Channel Oscilloscope',
      category_id: 2,
      category_name: 'Lab Instruments',
      description: '1.5 GHz Mixed Signal Digital Oscilloscope',
      department: 'Electrical Engineering',
      location_id: 2,
      location_name: 'Electrical Engineering Lab',
      status: 'ISSUED',
      maintenance_status: 'WORKING',
      condition_rating: 'GOOD',
      risk_score: 85,
      risk_level: 'HIGH',
      assigned_to: 'Alex Mercer (Student ID: CS-9921)',
      rfid_uid: 'E2801120000018',
      purchase_date: '2023-11-20',
      warranty_expiry: '2026-11-20',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      asset_code: 'AST-2024-003',
      asset_name: 'Sony FX6 Cinema 4K Camera Rig',
      category_id: 3,
      category_name: 'Audio/Visual Equipment',
      description: 'Full-frame cinema camera with 24-70mm G-Master Lens',
      department: 'Media Arts',
      location_id: 3,
      location_name: 'Main Auditorium AV Room',
      status: 'MISSING',
      maintenance_status: 'WORKING',
      condition_rating: 'EXCELLENT',
      risk_score: 96,
      risk_level: 'HIGH',
      assigned_to: null,
      rfid_uid: 'E2809930000099',
      purchase_date: '2024-02-01',
      warranty_expiry: '2026-02-01',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      asset_code: 'AST-2024-004',
      asset_name: 'Cisco Catalyst 9300 48-Port Switch',
      category_id: 4,
      category_name: 'Networking Hardware',
      description: 'Enterprise gigabit PoE managed network switch',
      department: 'Information Technology',
      location_id: 1,
      location_name: 'Computer Science Lab A',
      status: 'AVAILABLE',
      maintenance_status: 'WORKING',
      condition_rating: 'GOOD',
      risk_score: 65,
      risk_level: 'MEDIUM',
      assigned_to: null,
      rfid_uid: 'E2804450000044',
      purchase_date: '2023-08-10',
      warranty_expiry: '2028-08-10',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      asset_code: 'AST-2024-005',
      asset_name: 'Apple MacBook Pro 16" M3 Max',
      category_id: 1,
      category_name: 'Computing & Laptops',
      description: 'Faculty research laptop with 64GB RAM 2TB SSD',
      department: 'Computer Science',
      location_id: 1,
      location_name: 'Computer Science Lab A',
      status: 'UNDER_REPAIR',
      maintenance_status: 'UNDER_REPAIR',
      condition_rating: 'FAIR',
      risk_score: 78,
      risk_level: 'MEDIUM',
      assigned_to: null,
      rfid_uid: 'E2807710000077',
      purchase_date: '2024-03-01',
      warranty_expiry: '2027-03-01',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  rfidTags: DbRfidTag[] = [
    {
      id: 1,
      uid: 'E2806894000040',
      asset_id: 1,
      asset_name: 'Dell Precision 7780 Workstation',
      asset_code: 'AST-2024-001',
      tag_type: 'GEN2_UHF',
      status: 'ASSIGNED',
      authorization_status: 'UNAUTHORIZED',
      checkout_authorized: false,
      assigned_to: null,
      is_active: true,
      assigned_at: '2024-01-16T10:00:00Z',
      created_at: '2024-01-16T10:00:00Z'
    },
    {
      id: 2,
      uid: 'E2801120000018',
      asset_id: 2,
      asset_name: 'Tektronix MSO46 Oscilloscope',
      asset_code: 'AST-2024-002',
      tag_type: 'MFRC522_HF',
      status: 'ASSIGNED',
      authorization_status: 'AUTHORIZED',
      checkout_authorized: true,
      assigned_to: 'Alex Mercer (Student ID: CS-9921)',
      is_active: true,
      assigned_at: '2024-01-20T11:30:00Z',
      created_at: '2024-01-20T11:30:00Z'
    },
    {
      id: 3,
      uid: 'E2809930000099',
      asset_id: 3,
      asset_name: 'Sony FX6 Cinema Camera',
      asset_code: 'AST-2024-003',
      tag_type: 'MFRC522_HF',
      status: 'ASSIGNED',
      authorization_status: 'UNAUTHORIZED',
      checkout_authorized: false,
      assigned_to: null,
      is_active: true,
      assigned_at: '2024-02-02T14:15:00Z',
      created_at: '2024-02-02T14:15:00Z'
    },
    {
      id: 4,
      uid: 'E2804450000044',
      asset_id: 4,
      asset_name: 'Cisco Catalyst Switch',
      asset_code: 'AST-2024-004',
      tag_type: 'MFRC522_HF',
      status: 'ASSIGNED',
      authorization_status: 'UNAUTHORIZED',
      checkout_authorized: false,
      assigned_to: null,
      is_active: true,
      assigned_at: '2024-02-10T09:00:00Z',
      created_at: '2024-02-10T09:00:00Z'
    },
    {
      id: 5,
      uid: 'E2807710000077',
      asset_id: 5,
      asset_name: 'MacBook Pro 16" M3 Max',
      asset_code: 'AST-2024-005',
      tag_type: 'MFRC522_HF',
      status: 'ASSIGNED',
      authorization_status: 'UNAUTHORIZED',
      checkout_authorized: false,
      assigned_to: null,
      is_active: true,
      assigned_at: '2024-03-02T16:20:00Z',
      created_at: '2024-03-02T16:20:00Z'
    },
    {
      id: 6,
      uid: 'E2800000999999',
      asset_id: null,
      asset_name: undefined,
      asset_code: undefined,
      tag_type: 'MFRC522_HF',
      status: 'UNASSIGNED',
      authorization_status: 'UNAUTHORIZED',
      checkout_authorized: false,
      assigned_to: null,
      is_active: true,
      assigned_at: null,
      created_at: '2024-03-10T12:00:00Z'
    }
  ];

  issues = [
    {
      id: 1,
      asset_id: 2,
      asset_name: 'Tektronix MSO46 4-Channel Oscilloscope',
      asset_code: 'AST-2024-002',
      issued_to_name: 'Alex Mercer',
      issued_to_id: 'CS-9921',
      issued_by_id: 2,
      issued_by_name: 'Sarah Jenkins',
      issued_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      expected_return: new Date(Date.now() + 4 * 86400000).toISOString(),
      actual_return: null,
      purpose: 'Senior Capstone Signal Analysis Project',
      status: 'ISSUED'
    }
  ];

  maintenance = [
    {
      id: 1,
      asset_id: 5,
      asset_name: 'Apple MacBook Pro 16" M3 Max',
      asset_code: 'AST-2024-005',
      issue_description: 'Thermal throttling and intermittent display flicker',
      reported_by: 'Dr. Robert Vance',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      technician_notes: 'Heatsink repasting and display ribbon cable diagnostics in progress',
      cost: 140.00,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      resolved_at: null
    }
  ];

  alerts = [
    {
      id: 1,
      alert_code: 'ALT-9081',
      asset_id: 3,
      asset_name: 'Sony FX6 Cinema 4K Camera Rig',
      asset_code: 'AST-2024-003',
      rfid_uid: 'E2809930000099',
      checkpoint_id: 1,
      checkpointId: 1,
      checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
      device_code: 'ESP32-CP01-GATE',
      device_id: 'ESP32-CP01-GATE',
      alert_type: 'MISSING_ASSET_DETECTED',
      severity: 'CRITICAL',
      message: '🚨 CRITICAL: Unauthorized RFID detected at Checkpoint 1 - Missing asset Sony FX6 Cinema exit breach!',
      camera_event_id: 1,
      camera_image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
      status: 'RESOLVED',
      acknowledged_by: 'Campus Security Lead',
      acknowledged_at: new Date(Date.now() - 9 * 60000).toISOString(),
      resolved_by: 'Officer Marcus Vance',
      resolved_at: new Date(Date.now() - 5 * 60000).toISOString(),
      resolution_notes: 'Initial startup baseline test cleared.',
      created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      timestamp: new Date(Date.now() - 10 * 60000).toISOString()
    },
    {
      id: 2,
      alert_code: 'ALT-9082',
      asset_id: null,
      asset_name: 'Unknown Tag',
      asset_code: 'UNKNOWN',
      rfid_uid: '99AA0011',
      checkpoint_id: 2,
      checkpointId: 2,
      checkpoint_name: 'Checkpoint 2 (Secondary/Lab Gate)',
      device_code: 'ESP32-CP02-GATE',
      device_id: 'ESP32-CP02-GATE',
      alert_type: 'UNKNOWN_TAG_DETECTED',
      severity: 'WARNING',
      message: '⚠️ WARNING: Unknown RFID tag detected at Checkpoint 2 (Secondary/Lab Gate)',
      camera_event_id: null,
      camera_image_url: null,
      status: 'RESOLVED',
      acknowledged_by: 'Staff',
      acknowledged_at: new Date(Date.now() - 20 * 60000).toISOString(),
      resolved_by: 'Staff',
      resolved_at: new Date(Date.now() - 15 * 60000).toISOString(),
      resolution_notes: 'Visitor tag verified.',
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      timestamp: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      id: 3,
      alert_code: 'ALT-9083',
      asset_id: 1,
      asset_name: 'Dell Precision 7780 Workstation',
      asset_code: 'AST-2024-001',
      rfid_uid: 'E2806894000040',
      checkpoint_id: 1,
      checkpointId: 1,
      checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
      device_code: 'ESP32-CP01-GATE',
      device_id: 'ESP32-CP01-GATE',
      alert_type: 'UNAUTHORIZED_EXIT',
      severity: 'CRITICAL',
      message: '🚨 CRITICAL: Unauthorized checkout detected at Checkpoint 1 (Main Entrance Gate) - Dell Precision 7780 Workstation has not been checked out',
      camera_event_id: 1,
      camera_image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
      status: 'RESOLVED',
      acknowledged_by: 'Lab Technician',
      acknowledged_at: new Date(Date.now() - 50 * 60000).toISOString(),
      resolved_by: 'Lab Technician',
      resolved_at: new Date(Date.now() - 45 * 60000).toISOString(),
      resolution_notes: 'Enclosure inspected and cleared.',
      created_at: new Date(Date.now() - 55 * 60000).toISOString(),
      timestamp: new Date(Date.now() - 55 * 60000).toISOString()
    }
  ];

  movements = [
    {
      id: 1,
      asset_id: 1,
      asset_name: 'Dell Precision 7780 Workstation',
      asset_code: 'AST-2024-001',
      rfid_uid: 'E2806894000040',
      checkpoint_id: 2,
      checkpointId: 2,
      checkpoint_name: 'Checkpoint 2 (Secondary/Lab Gate)',
      device_code: 'ESP32-CP02-GATE',
      device_id: 'ESP32-CP02-GATE',
      direction: 'ENTRY',
      authorization_status: 'AUTHORIZED',
      event_type: 'AUTHORIZED_PASS',
      reason: 'Routine check-in',
      scanned_at: new Date(Date.now() - 15 * 60000).toISOString(),
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      previous_checkpoint_id: 1,
      previous_checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
      status_transition: 'Asset leaves through CP1 → OUT, appears at CP2 → DETECTED AT CP2'
    },
    {
      id: 2,
      asset_id: 1,
      asset_name: 'Dell Precision 7780 Workstation',
      asset_code: 'AST-2024-001',
      rfid_uid: 'E2806894000040',
      checkpoint_id: 1,
      checkpointId: 1,
      checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
      device_code: 'ESP32-CP01-GATE',
      device_id: 'ESP32-CP01-GATE',
      direction: 'EXIT',
      authorization_status: 'AUTHORIZED',
      event_type: 'AUTHORIZED_PASS',
      reason: 'Authorized loan transit',
      scanned_at: new Date(Date.now() - 40 * 60000).toISOString(),
      timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
      created_at: new Date(Date.now() - 40 * 60000).toISOString(),
      previous_checkpoint_id: null,
      previous_checkpoint_name: undefined,
      status_transition: 'Asset leaves through CP1 → OUT'
    },
    {
      id: 3,
      asset_id: 3,
      asset_name: 'Sony FX6 Cinema 4K Camera Rig',
      asset_code: 'AST-2024-003',
      rfid_uid: 'E2809930000099',
      checkpoint_id: 1,
      checkpointId: 1,
      checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
      device_code: 'ESP32-CP01-GATE',
      device_id: 'ESP32-CP01-GATE',
      direction: 'EXIT',
      authorization_status: 'UNAUTHORIZED',
      event_type: 'UNAUTHORIZED_PASS_ATTEMPT',
      reason: 'Flagged missing asset exit breach',
      scanned_at: new Date(Date.now() - 10 * 60000).toISOString(),
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      previous_checkpoint_id: null,
      previous_checkpoint_name: undefined,
      status_transition: 'Unauthorized Exit Attempt at CP1'
    },
    {
      id: 4,
      asset_id: 4,
      asset_name: 'Fluke 87V Industrial Multimeter Kit',
      asset_code: 'AST-2024-004',
      rfid_uid: 'E2805541000021',
      checkpoint_id: 2,
      checkpointId: 2,
      checkpoint_name: 'Checkpoint 2 (Secondary/Lab Gate)',
      device_code: 'ESP32-CP02-GATE',
      device_id: 'ESP32-CP02-GATE',
      direction: 'ENTRY',
      authorization_status: 'AUTHORIZED',
      event_type: 'AUTHORIZED_PASS',
      reason: 'Routine check-in',
      scanned_at: new Date(Date.now() - 65 * 60000).toISOString(),
      timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
      created_at: new Date(Date.now() - 65 * 60000).toISOString(),
      previous_checkpoint_id: null,
      previous_checkpoint_name: undefined,
      status_transition: 'Authorized Check-in at CP2'
    }
  ];

  recentScans = [
    {
      id: 1,
      rfid_uid: 'E2809930000099',
      asset_id: 3,
      asset_name: 'Sony FX6 Cinema 4K Camera Rig',
      asset_code: 'AST-2024-003',
      checkpoint_id: 1,
      checkpointId: 1,
      checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
      device_code: 'ESP32-CP01-GATE',
      device_id: 'ESP32-CP01-GATE',
      result: 'MISSING_ASSET',
      action_taken: 'RED_LED_BUZZER_ALARM',
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      scanned_at: new Date(Date.now() - 10 * 60000).toISOString()
    },
    {
      id: 2,
      rfid_uid: 'E2806894000040',
      asset_id: 1,
      asset_name: 'Dell Precision 7780 Workstation',
      asset_code: 'AST-2024-001',
      checkpoint_id: 2,
      checkpointId: 2,
      checkpoint_name: 'Checkpoint 2 (Secondary/Lab Gate)',
      device_code: 'ESP32-CP02-GATE',
      device_id: 'ESP32-CP02-GATE',
      result: 'AUTHORIZED',
      action_taken: 'GREEN_LED_PULSE_2S',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      scanned_at: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
      id: 3,
      rfid_uid: '99AA0011',
      asset_id: null,
      asset_name: undefined,
      asset_code: undefined,
      checkpoint_id: 2,
      checkpointId: 2,
      checkpoint_name: 'Checkpoint 2 (Secondary/Lab Gate)',
      device_code: 'ESP32-CP02-GATE',
      device_id: 'ESP32-CP02-GATE',
      result: 'UNKNOWN_TAG',
      action_taken: 'RED_LED_BUZZER_ALARM',
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      scanned_at: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      id: 4,
      rfid_uid: 'E2801120000018',
      asset_id: 2,
      asset_name: 'Apple MacBook Pro 16" M3 Max',
      asset_code: 'AST-2024-002',
      checkpoint_id: 1,
      checkpointId: 1,
      checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
      device_code: 'ESP32-CP01-GATE',
      device_id: 'ESP32-CP01-GATE',
      result: 'AUTHORIZED',
      action_taken: 'GREEN_LED_PULSE_2S',
      timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
      created_at: new Date(Date.now() - 50 * 60000).toISOString(),
      scanned_at: new Date(Date.now() - 50 * 60000).toISOString()
    }
  ];

  devices = [
    {
      id: 1,
      device_code: 'ESP32-CP01-GATE',
      name: 'Main Gate Checkpoint Controller (CP1)',
      device_type: 'ESP32_RFID_NODE',
      checkpoint_id: 1,
      checkpointId: 1,
      checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
      location_id: 4,
      location_name: 'Perimeter Gate 1',
      ip_address: '192.168.1.101',
      mac_address: '24:6F:28:B1:01:A4',
      firmware_version: 'v2.4.1',
      status: 'ONLINE',
      rssi: -58,
      camera_installed: true,
      rfid_status: 'Active',
      camera_status: 'Available',
      last_seen: new Date().toISOString()
    },
    {
      id: 2,
      device_code: 'ESP32-CAM-CP01',
      name: 'Main Gate AI Optical Camera Node (CP1)',
      device_type: 'ESP32_CAM',
      checkpoint_id: 1,
      checkpointId: 1,
      checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
      location_id: 4,
      location_name: 'Perimeter Gate 1',
      ip_address: '192.168.1.102',
      mac_address: '24:6F:28:B1:01:B8',
      firmware_version: 'v1.8.0',
      status: 'ONLINE',
      rssi: -62,
      camera_installed: true,
      rfid_status: 'N/A',
      camera_status: 'Available',
      last_seen: new Date().toISOString()
    },
    {
      id: 3,
      device_code: 'ESP32-CP02-GATE',
      name: 'Secondary/Lab Gate Controller (CP2)',
      device_type: 'ESP32_RFID_NODE',
      checkpoint_id: 2,
      checkpointId: 2,
      checkpoint_name: 'Checkpoint 2 (Secondary/Lab Gate)',
      location_id: 1,
      location_name: 'Turing Hall CS Lab',
      ip_address: '192.168.1.105',
      mac_address: '24:6F:28:B1:02:C0',
      firmware_version: 'v2.4.1',
      status: 'ONLINE',
      rssi: -52,
      camera_installed: false,
      rfid_status: 'Active',
      camera_status: 'Not Installed',
      last_seen: new Date().toISOString()
    }
  ];

  cameraEvents: any[] = [
    {
      id: 1,
      event_code: 'CAM-EVT-4091',
      checkpoint_id: 1,
      checkpointId: 1,
      checkpoint_name: 'Checkpoint 1 (Main Entrance Gate)',
      device_code: 'ESP32-CAM-CP01',
      trigger_type: 'UNAUTHORIZED_SCAN',
      event_type: 'UNAUTHORIZED_SCAN',
      image_path: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
      asset_name: 'Sony FX6 Cinema 4K Camera Rig',
      asset_code: 'AST-2024-003',
      rfid_uid: 'E2809930000099',
      alert_id: 1,
      file_size_bytes: 46200,
      captured_at: new Date(Date.now() - 10 * 60000).toISOString(),
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      created_at: new Date(Date.now() - 10 * 60000).toISOString()
    }
  ];
}

export const db = new MemoryDatabase();
