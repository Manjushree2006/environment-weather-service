# Leafline – Weather Service (Full-Stack Implementation)

An independently runnable Leafline microservice providing weather observations, multi-day predictive forecasts, field sensor telemetry intake, comparative weather analysis, and organization compliance reporting with verifiable PDF exports.

---

## 1. Architecture & Included Modules

1. **Weather Data & Forecasting**: Live provider observation (Open-Meteo) and stored snapshot fallback for 1 to 16-day daily forecasts (temperature, relative humidity, precipitation, wind speed).
2. **Three-Tier Role-Based Authentication**:
   - **Administrator**: Full system visibility, sensor registration, organization approval/rejection workflow, audit logging.
   - **Individual User (Farmer)**: Registration with unique User ID (e.g. `USR1`), farm profile, personal sensor registration, and strict user-level data isolation.
   - **Organization**: Registration assigning unique Request ID (e.g. `RQ1`), public status tracking (Pending, Accepted, Rejected), admin approval assigning Organization ID (e.g. `ORG1`), and organization-level data access.
3. **Sensor Management & Telemetry Intake**:
   - Supports user-owned physical hardware: DHT22, Capacitive Soil Moisture, Soil pH probes, Rain Gauges, and Anemometers.
   - Direct IoT HTTP intake using `X-Sensor-Key` header and authenticated dashboard submission.
4. **Weather Analysis Dashboard**:
   - Simultaneous visual presentation of predictive **"FORECAST"** data and actual field **"SENSOR DATA"** in distinct, clearly labeled rectangular cards.
5. **Historical Records & Role-Level Isolation**:
   - Multi-parameter historical filtering by user, sensor, measurement type, and date range.
   - Strict backend database query isolation: users cannot access other farmers' telemetry; organizations can only access affiliated farmers.
6. **Data Export & Verifiable PDF Reports**:
   - Dedicated organization reporting dashboard with date range, user, sensor, and parameter filters.
   - Live data preview table and statistics calculation.
   - Pure-Python vector PDF generator (zero external C dependencies) producing branded reports titled **Leafline – Weather Service**.

---

## 2. Requirements

- Python 3.10, 3.11, or 3.12
- Node.js 18 or newer and npm
- Internet access from backend for live `https://api.open-meteo.com` queries (cached snapshots are used automatically when offline).

---

## 3. Windows CMD Commands to Run the Backend

Open a Command Prompt (`cmd.exe`) in the `backend` directory:

```cmd
cd /d F:\Leafline\Envirnoment\Leafline_Environment_Weather_Service_Implemented\backend
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Or run the batch script directly from the project root:

```cmd
START_BACKEND.bat
```

### Backend URLs:
- **Swagger / OpenAPI Documentation**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8001/redoc](http://127.0.0.1:8001/redoc)
- **Health Check**: [http://127.0.0.1:8001/api/health](http://127.0.0.1:8001/api/health)

---

## 4. Windows CMD Commands to Run the Frontend

Open a second Command Prompt (`cmd.exe`) in the `frontend` directory:

```cmd
cd /d F:\Leafline\Envirnoment\Leafline_Environment_Weather_Service_Implemented\frontend
npm install
npm run dev
```

Or run the batch script directly from the project root:

```cmd
START_FRONTEND.bat
```

Open the frontend URL printed by Vite (typically [http://localhost:5173](http://localhost:5173)).

---

## 5. Default Demonstration Credentials

| Role | Username / Identifier | Password / Key | Description |
|---|---|---|---|
| **Administrator** | Administrator Key | `Leafline@123` | Full access to all users, orgs, sensors, and audit logs |
| **Individual User 1** | `ramesh.kumar@leafline.ag` (or `USR1`) | `password123` | Surya Sunflower Farm (Dharwad Field A) |
| **Individual User 2** | `priya.sharma@leafline.ag` (or `USR2`) | `password123` | Golden Bloom Fields (Chitradurga East) |
| **Organization (Accepted)** | `agritech@karnataka.gov.in` (or `ORG1` / `RQ1`) | `password123` | Karnataka AgriTech Research Institute |
| **Organization (Pending)** | `contact@apexbio.org` (or `RQ2`) | `password123` | Apex BioLabs (Test blocked login) |
| **Organization (Rejected)** | `info@globaltrade.net` (or `RQ3`) | `password123` | Global Trade Exporters (Test rejected block) |

---

## 6. Organization Approval Workflow

1. **Submission**: Organization registers on the landing page and receives a Request ID (e.g. `RQ1`, `RQ2`). Status starts as `Pending`.
2. **Status Tracking**: The organization can enter their Request ID under "Track Organization Status" on the landing page to check real-time review progress.
3. **Login Protection**: Backend APIs strictly deny authentication for organizations with `Pending` or `Rejected` statuses (HTTP 403 Forbidden).
4. **Administrator Review**: Logged-in Administrator opens the **Administration** dashboard, reviews organization details, and clicks **Accept** or **Reject**.
5. **Approval**: Upon acceptance, status changes to `Accepted`, an Organization ID (e.g. `ORG1`) is assigned, and organization login is enabled.

---

## 7. API Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check returning service name and status |
| `POST` | `/api/auth/admin-login` | Administrator access key authentication |
| `POST` | `/api/auth/user/register` | Farmer registration; generates unique User ID |
| `POST` | `/api/auth/user/login` | Individual user authentication |
| `POST` | `/api/auth/org/register` | Organization onboarding; generates Request ID (`RQ1`, etc.) |
| `GET` | `/api/auth/org/status/{req_id}` | Public organization application status lookup |
| `POST` | `/api/auth/org/login` | Organization login (enforces approval verification) |
| `GET` | `/api/auth/me` | Current authenticated profile details |
| `GET` | `/api/weather/current` | Current weather observation from Open-Meteo |
| `GET` | `/api/weather/forecast` | 1–16 day daily weather forecast |
| `GET` | `/api/weather/analysis` | Combined forecast cards + role-scoped sensor cards |
| `POST` | `/api/sensors/register` | Register sensor with complete manufacturer/model metadata |
| `GET` | `/api/sensors` | List registered sensors (scoped by caller's role) |
| `POST` | `/api/sensor-data` | IoT device telemetry intake using `X-Sensor-Key` |
| `POST` | `/api/sensor-data/submit` | Authenticated dashboard reading intake |
| `GET` | `/api/sensor-data/readings` | Recent sensor readings (isolated by user/org) |
| `GET` | `/api/environmental-data/history`| Historical sensor/weather records with filters |
| `GET` | `/api/admin/users` | List all registered individual users (admin only) |
| `GET` | `/api/admin/organizations` | List all organization requests (admin only) |
| `POST` | `/api/admin/organizations/{id}/accept` | Approve organization application |
| `POST` | `/api/admin/organizations/{id}/reject` | Reject organization application |
| `GET` | `/api/admin/stats` | Aggregated system overview statistics |
| `GET` | `/api/reports/preview` | Preview filtered records & stats for PDF report |
| `GET` | `/api/reports/pdf` | Generate and download branded Leafline PDF report |


## Additional targeted updates (existing UI preserved)

This update keeps the existing Leafline landing page, sidebar, colors, typography, and dashboard layout. Only the requested controls, data panels, and backend workflows were extended.

### Current location
- Individual users can explicitly select **Fetch My Current Location** on Overview.
- Browser geolocation obtains coordinates only after permission.
- `/api/weather/reverse-geocode` resolves coordinates through OpenStreetMap Nominatim.
- Current weather and forecast are then fetched through the existing Open-Meteo integration.
- **Use Farm Location** restores the registered farm coordinates.

### Historical data
- `/api/environmental-data/history` now returns stored forecast snapshots separately as `type=forecast`, actual weather observations as `type=weather`, and sensor readings as `type=sensor`.
- Forecast records retain `fetched_at`, forecast date, coordinates, temperature, humidity, rainfall, rainfall probability and wind speed.
- SQLite startup migration adds forecast probability and location-name columns without deleting existing records.
- Forecast refreshes reuse a matching snapshot captured in the previous five minutes to avoid unnecessary duplicate snapshots.
- Historical Data fetches again when opened and includes a manual Refresh action and last-refreshed timestamp.

### Organization sensor visibility
- Organization sensor and reading queries remain restricted to users whose `organization_id` matches the authenticated organization.
- Organization Sensor Data now has a read-only readings table with user, sensor, measurement and timestamp details.
- Weather Analysis sensor cards include available user name, sensor type and manufacturer metadata.

### Data exports
- `/api/reports/export?format=pdf|csv|xlsx&dataScope=forecast|sensor|both` performs server-side scope filtering.
- CSV supports unified combined records with a `record_type` field.
- XLSX uses separate Forecast Data and Sensor Data sheets for combined exports.
- PDF retains Leafline report branding and labels forecast rows distinctly.
- Existing User Scope and Measurement Parameter controls are retained.

### Dependencies
Install backend dependencies using `python -m pip install -r requirements.txt`. APScheduler and openpyxl are included in the requirements.

### External service notes
- Reverse geocoding requires internet access to OpenStreetMap Nominatim and is subject to its service policy/rate limits.
- Weather fetching requires internet access to Open-Meteo.
- Historical forecast snapshots accumulate from the point forecasts are fetched; older snapshots are not fabricated.


## Latest targeted updates – Organization exports and historical forecast visibility

- Organization Data Export now previews records according to the selected Forecast, Sensor, or Both scope.
- PDF, CSV, and XLSX downloads use the same backend scope and role-isolation filters.
- Combined PDF reports contain separate Forecast Data and Sensor Data sections.
- Forecast snapshots now retain their owning user or organization when fetched from an authenticated dashboard. Additive SQLite migration adds these ownership columns without deleting existing snapshots.
- Historical Data includes stored forecast snapshots and sorts them using the snapshot retrieval timestamp, separately from actual weather observations.
- Existing administrator Sensor Data restrictions remain: administrators can view the registered sensor list and details, but cannot register sensors or submit manual readings from that dashboard.
