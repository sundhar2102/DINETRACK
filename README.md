# SmartTable AI Platform 🚀
### Real-Time Restaurant Discovery, Live Table Availability, AI Wait-Time Estimation, Table Booking & Food Pre-Ordering

SmartTable AI is an end-to-end production-style platform that connects diners directly with restaurants to eliminate travel uncertainty, eliminate dining wait times, and streamline restaurant kitchen operations.

---

## 🌟 Key Features

1. **Live Geolocation & Discovery**:
   - Browser & GPS geolocation detection
   - Haversine distance calculation and radius filtering
   - Interactive OpenStreetMap & Leaflet integration with color-coded wait-time markers

2. **AI Algorithmic Wait-Time Engine**:
   - Dynamic wait time calculation taking into account:
     - Total vs. available tables matching party capacity
     - Remaining dining duration on occupied tables
     - Active waitlist queue length
     - Near-window upcoming reservations

3. **Live Table Floor Plan & Sync**:
   - Status indicators: `AVAILABLE`, `RESERVED`, `OCCUPIED`, `CLEANING`, `OUT_OF_SERVICE`
   - Instant zero-refresh Socket.IO synchronization across customer web, mobile, and owner dashboard
   - Double-booking conflict prevention with transactional validation

4. **Food Pre-Ordering & Intelligent Prep Timing**:
   - Pre-order gourmet dishes while booking or waiting
   - Kitchen Prep Timing algorithm coordinates dish preparation with customer travel ETA so food is served freshly prepared on arrival
   - Live multi-step order tracking (`CONFIRMED` -> `PREPARING` -> `READY` -> `SERVED`)

5. **Restaurant Owner & Staff Console**:
   - Interactive Live Floor Plan table editor & status toggler
   - Kitchen Display System (KDS) with audio bell notifications & ticket queue
   - Reservations queue manager (Seat, Complete, Cancel)
   - Walk-in waitlist queue manager
   - Menu item catalog manager (stock toggle, price, prep duration)
   - Real-time revenue & table turnover analytics

6. **Capacitor Mobile Ready**:
   - Unified cross-platform architecture connecting web and Android apps to the same backend API and Socket.IO server.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Leaflet & React-Leaflet, Lucide Icons, Canvas Confetti, Web Audio Synthesizer
- **Mobile**: Capacitor 6 (Geolocation, Push Notifications, Haptics)
- **Backend**: Node.js, Express.js, Socket.IO, Helmet, Morgan, Rate Limiting, JWT Auth, Role-Based Access Control
- **Database**: Relational Architecture (MySQL 8+ compatible with embedded relational SQLite engine)

---

## 🚀 Quick Start Guide

### 1. Start the Backend API & Sockets Server

```bash
cd backend
npm install
npm run seed     # Seeds realistic restaurants, menus, tables, and test accounts
npm start        # Starts server on http://localhost:5000
```

### 2. Start the Frontend React Web App

```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

---

## 🔑 Demo User Credentials

| Role | Email | Password | Access Details |
|------|-------|----------|----------------|
| **Customer (Alex)** | `alex@smarttable.com` | `Password123!` | Discovery, Table Booking, Food Pre-Order, Live Tracking |
| **Customer (Priya)** | `priya@smarttable.com` | `Password123!` | Walk-in Queue, Waitlist Tracker |
| **Restaurant Owner** | `owner@sangeetha.com` | `Password123!` | Floor Plan, KDS, Reservations, Analytics, Menu |
| **Kitchen Chef** | `chef@sangeetha.com` | `Password123!` | Kitchen Display System (KDS) & Order Status |
| **Floor Waiter** | `waiter@sangeetha.com` | `Password123!` | Table Seating & Status Transitions |

*Note: You can also use the **Role Switcher** in the top navigation bar to switch between personas with 1-click!*

---

## 📱 Android App (Capacitor)

To build and run on Android Studio:

```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

---

## 🧪 Automated Testing

To run the backend integration test suite verifying 11 real-time scenarios (auth, geo discovery, wait calculation, double-booking prevention, KDS flow):

```bash
cd backend
npm test
```
