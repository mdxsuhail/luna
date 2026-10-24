# LUNA Developer Mode

Developer Mode is reserved for technical inspection and troubleshooting. Ordinary app preferences (appearance, PDF reader options, text-to-speech settings, and general project information) belong in the normal user interface.

## Access code

The requested local developer code is:

`123456789`

The code is checked by the FastAPI backend at `POST /api/dev/login`; it is not embedded in the frontend bundle. The backend issues a signed token that expires after one hour. Use Developer Mode only with LUNA running locally on your own computer. Do not expose the local backend to your network or the public internet while using this shared development code.

To override the default on your own machine, set `LUNA_DEV_CODE` and `LUNA_DEV_TOKEN_SECRET` in `backend/.env`. Keep that file private and never commit it.

## Developer-only tools

- Run diagnostic checks for browser connectivity, speech API support, local storage, backend health, and library request state.
- Inspect backend endpoint reachability, library record counts, and the latest API error.
- Retry backend/library loading while troubleshooting.
- Export or copy a JSON diagnostics report for bug investigation.
- Lock Developer Mode when finished.

Diagnostic reports contain technical browser/app state and record counts, not PDF contents. Review a report before sharing it because it includes browser and runtime details.

## Deferred

ESP32/device integration is intentionally deferred. It is listed as a future roadmap item only; this dashboard does not attempt to connect to hardware.
