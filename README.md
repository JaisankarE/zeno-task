# Zeno Swap — EV Battery Swap Network (assessment demo)

React 19 + TypeScript + Vite + Tailwind v4 + Zustand. All data is mock data (`src/data/mock.ts`), persisted to `localStorage` so a swap done on the kiosk shows up in the admin console and rider portal.

```bash
npm install
npm run dev
```

## Apps

| Route | What | Login |
| --- | --- | --- |
| `#/` | Landing — pick a portal | — |
| `#/admin/login` | Admin console: overview, swap records, failures, stations, customers, batteries | `admin` / `zeno@123` |
| `#/rider/login` | Rider portal: battery %, swap history, failed attempts, pay bills | RFID (e.g. `RF-7A3F21C9`) → OTP (shown in an on-screen SMS toast) |
| `#/kiosk/ZS-BLR-01` | Interactive 10-box swap station | — |

## Swap flow (from the whiteboard)

- Customer → RFID card → vehicle → **2 batteries** (each with a battery ID)
- **Swap ID** = C.Bat1 ID + C.Bat2 ID (+ timestamp)
- **Collect** → machine opens an empty box ← customer inserts C.Bat1, closes door
- **Exchange** → opens box with charged S.Bat1 → customer takes S.Bat1, inserts C.Bat2, closes door
- **Dispense** → opens box with S.Bat2 → customer takes it, closes door
- Bill (kWh delivered × tariff + service fee) is posted to the rider app as *pending*

## Failure cases recorded

Unregistered RFID · Account blocked (overdue dues) · No charged battery / no empty box · Battery ID mismatch · Door not closed (timeout) · Slot lock jam · Battery overheat · Connection lost · Cancelled by customer.
Every failure in the kiosk can be injected from the *Failure scenario* panel; each one is stored with the step, box, battery, message and resolution and appears under **Admin → Failures**.

## Structure

```
src/
  app/App.tsx               hash router + guards
  data/mock.ts              deterministic mock data generator
  stores/                   zenoStore (data + swap commit), auth, toasts
  lib/                      swap rules, billing, formatting, router
  components/               UI kit, icons, battery visuals, timeline
  features/admin/           admin console pages
  features/customer/        RFID + OTP login, rider dashboard
  features/kiosk/           machine visual, screen, swap state machine
```

Use **Admin → Reset demo data** to restore the original mock data.
