# CampusAssetSecurity: Smart Campus Asset Monitoring, Recovery and Anti-Theft System using IoT and RFID

An enterprise-grade, IoT-driven campus asset monitoring and loss-prevention platform integrating physical RFID reader checkpoints (MFRC522), automated visual evidence capture (ESP32-CAM), Node.js/Express REST APIs, real-time WebSocket broadcasting, and a modern React control center powered by MySQL.

---

## 🏗️ Architecture Overview

```
                      ADMIN / LAB_STAFF / STUDENT
                                  │
                                  ▼
                         React Web Application
                         (Vite + Tailwind CSS)
                                  │
                       HTTP REST  │  Socket.IO (Live Feed)
                                  ▼
                        Node.js + Express API
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
            MySQL 8.x Database            Local Uploads
          (Campus Asset Records)       (Camera Event JPEGs)
                    ▲
                    │ HTTP REST / Wi-Fi
                    │
         ┌──────────┴──────────┐
         │                     │
    ESP32 Node           ESP32-CAM Node
  (Checkpoint 1)        (Security Camera)
   ├── MFRC522 RFID      └── JPEG Capture on Trigger
   ├── Green/Red LEDs
   └── Active Buzzer
```

---

## 📦 Directory Structure

```
Asset_Security/
├── frontend/             # React + Vite frontend client
│   ├── src/
│   │   ├── components/   # Reusable UI widgets & modals
│   │   ├── pages/        # Route views (Dashboard, Assets, Live Monitoring, Alerts, etc.)
│   │   ├── layouts/      # Sidebar & header layouts
│   │   ├── services/     # Axios API client services
│   │   ├── hooks/        # Custom React hooks (e.g. useSocket, useAuth)
│   │   ├── context/      # AuthContext, NotificationContext
│   │   ├── utils/        # Formatters, date helpers, status badges
│   │   ├── App.jsx       # Root router & route guards
│   │   └── main.jsx      # Entry point
│   ├── public/           # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── backend/              # Node.js + Express backend server
│   ├── server.js         # Express + Socket.IO server entrypoint
│   ├── config/           # Database pool & environment configs
│   ├── controllers/      # Route handler logic
│   ├── routes/           # REST endpoints (/api/auth, /api/assets, /api/iot, etc.)
│   ├── middleware/       # JWT auth, role validation, multer upload
│   ├── models/           # MySQL query models & data access objects
│   ├── services/         # IoT event processor, risk calculation, notification service
│   ├── utils/            # Logger, response helpers
│   ├── uploads/          # Security event snapshot storage
│   ├── package.json
│   └── .env.example
│
├── database/             # Database initialization & seeds
│   ├── schema.sql        # MySQL DDL (16 normalized relational tables)
│   ├── seed.sql          # Test seed data (Users, Roles, Assets, RFID tags, Checkpoints)
│   └── queries.sql       # Common analysis & reporting queries
│
├── firmware/             # Arduino IDE compatible firmware
│   ├── checkpoint_1/     # ESP32 RFID Checkpoint node firmware
│   │   ├── checkpoint_1.ino
│   │   └── config.example.h
│   └── esp32_cam/        # ESP32-CAM Automated snapshot node firmware
│       ├── esp32_cam.ino
│       └── config.example.h
│
├── hardware/             # Circuit diagrams, bill of materials & pinouts
│   ├── BOM.md
│   ├── wiring.md
│   └── pinout.md
│
├── docs/                 # Detailed system documentation
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   ├── firmware.md
│   └── testing.md
│
├── README.md
├── DEVELOPMENT_PLAN.md
└── .gitignore
```

---

## ⚙️ Prerequisites

1. **Node.js**: v18.x or v20.x+
2. **MySQL Server**: 8.0+
3. **Arduino IDE**: 2.x+ (with ESP32 board package installed)

---

## 🚀 Installation & Running

### 1. Database Setup
```bash
mysql -u root -p -e "CREATE DATABASE campus_asset_security CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p campus_asset_security < database/schema.sql
mysql -u root -p campus_asset_security < database/seed.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` (or port 3000 in unified preview).

---

## 🔒 User Roles
- **ADMIN**: Complete system control, user management, audit logs, configuration.
- **LAB_STAFF**: Asset registration, RFID tagging, issue/return management, alert resolution.
- **STUDENT**: Asset availability lookup, maintenance condition query by RFID UID.
