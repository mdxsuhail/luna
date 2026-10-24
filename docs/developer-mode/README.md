# LUNA Developer Mode

Developer Mode is a local development area for tuning frontend settings and running safe maintenance actions.

## Access code

The requested local developer code is:

`123456789`

The code is checked by the FastAPI backend at `POST /api/dev/login`; it is not embedded in the frontend bundle. The backend issues a signed token that expires after one hour. Use Developer Mode only with LUNA running locally on your own computer. Do not expose the local backend to your network or the public internet while using this shared development code.

To override the default on your own machine, set `LUNA_DEV_CODE` and `LUNA_DEV_TOKEN_SECRET` in `backend/.env`. Keep that file private and never commit it.

## Current controls

- Application theme (system, light, dark)
- PDF reader theme and font size
- Text-to-speech playback speed
- Refresh library data from the backend
- Open Settings, Library, and About pages
- Reset appearance/reader preferences without deleting PDFs or SQLite records
- Lock Developer Mode for the current browser session

## Deferred

ESP32/device integration is intentionally deferred. The Developer Mode roadmap lists it as a future module; this dashboard does not attempt to connect to hardware.
