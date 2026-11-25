# Leafline Environment & Weather Service — update status

## Included in this update
- Existing Open-Meteo seven-day Alternaria forecast route is retained.
- Added a separate sensor-only Alternaria assessment endpoint (`POST /api/disease-forecast/calculate-sensor`).
- Manual sensor refresh uses the latest single sensor reading.
- 15-hour scheduled sensor assessment uses readings in the previous 15-hour window, mean temperature/RH and summed recorded rainfall.
- Sensor assessments are persisted separately and exposed through `/api/disease-forecast/sensor-history/{field_id}`.
- Admin can enable/disable a 15-hour schedule through `/api/disease-forecast/sensor-schedule`.
- Added an in-process APScheduler job. Run exactly one Uvicorn worker for this scheduler.
- Domain registration API accepts organisation type, purpose, service/domain details and requested scopes. Admin approval can grant a subset; rejection is supported.
- Added OAuth2 client-credentials token issuance at `/api/domains/token`; credentials are only issued after approval.
- Existing SQLite database file is retained in this package. Startup applies additive columns only; it does not drop tables or delete rows.

## Important limitations — not yet complete
- The React UI has source selection, manual sensor refresh, automatic 15-hour toggle, and sensor assessment display/history.
- The domain registration and review APIs exist, but the full separate registration portal and admin approval/rejection screens are not yet implemented in React.
- The OAuth token contains approved scopes, but every protected data endpoint still needs route-by-route scope enforcement before this can be treated as a secure production domain gateway.
- Scheduler is in-process; use one Uvicorn worker and keep the backend running. For multi-worker or production deployment, move scheduling to a dedicated worker/queue.
- The automatic schedule requires a valid growth stage at enable time. PDI is taken from the latest saved field observation; it is not fabricated.
- Sensor point temperature is used for both temperature bounds because the sensor schema contains one temperature value, not max/min values.
- Rainfall aggregation assumes each submitted rainfall value is a non-overlapping interval amount. Confirm this sensor convention before relying on 15-hour totals.
- Full end-to-end testing against the user's active database and live sensor devices remains necessary.

## Start
Backend: `pip install -r requirements.txt` then `python -m uvicorn app.main:app --reload --port 8001`
Frontend: `npm install` then `npm run dev`
