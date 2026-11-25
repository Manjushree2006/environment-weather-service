# Alternaria Disease-Risk Forecasting extension

This update adds the rule-based Sunflower Alternaria Leaf Blight forecasting module to the existing Environment & Weather microservice. It does not add a microservice and does not remove or rename the existing modules or tables.

## New API routes

All routes require the existing Bearer JWT authentication.

- `GET /api/disease-forecast/growth-stages` — supported crop stages and scores.
- `GET /api/disease-forecast/configuration` — weights, growth-stage scores and risk bands.
- `POST /api/disease-forecast/observations` — save a field PDI observation.
- `POST /api/disease-forecast/calculate` — fetch up to seven days from Open-Meteo, calculate EDPS for each day, and persist the forecast and daily results.
- `GET /api/disease-forecast/history/{forecast_id}` — retrieve saved daily results.

### Example: save PDI

```json
{
  "field_id": "field-demo",
  "pdi": 12.5,
  "source": "field_observation"
}
```

### Example: calculate seven-day risk forecast

```json
{
  "field_id": "field-demo",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "growth_stage": "flowering",
  "days": 7
}
```

If `pdi` is omitted from the calculation request, the latest saved PDI for that field is used. If no PDI exists, submit one first. The current Open-Meteo forecast response must contain daily maximum/minimum temperature, mean relative humidity and rainfall for every requested day; missing weather inputs cause the calculation to fail without saving a partial forecast.

## Database changes

On backend startup, the existing `Base.metadata.create_all()` creates these new tables without dropping existing tables or records:

- `disease_observations`
- `crop_growth_stages`
- `scoring_rules`
- `parameter_weights`
- `disease_forecasts`
- `forecast_daily_results`

The engine currently reads the version 1.0 scoring configuration from `alternaria_engine.py`. The `crop_growth_stages`, `scoring_rules`, and `parameter_weights` tables are schema foundations for database-managed configuration; this initial update does not seed or dynamically load those tables. The API `/configuration` exposes the active implemented configuration. Do not edit scoring bands in the database expecting them to change runtime calculations yet.

## Run locally (Windows CMD)

```cmd
cd /d "F:\SAD\Final_project\Envirnoment\Weather_Service\Leafline_Environment_Weather_Service_Full\backend"
venv\Scripts\activate.bat
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8001
```

Open `http://127.0.0.1:8001/docs`, obtain a development token using the existing `/api/dev/token` endpoint, click **Authorize**, and test the new disease-forecast routes.

## Scientific qualification

This implements the proposed Version 1.0 deterministic rules from the supplied specification. Scores and risk bands are not validated disease-incidence probabilities. Field validation and calibration are required. The service does not automatically prescribe fungicide. Missing inputs are not silently assigned zero.

## Frontend status

This update adds the backend API and database support. It does not yet add a Disease-Risk Forecasting screen to the React frontend; that should be integrated after the backend endpoints are verified in Swagger.
