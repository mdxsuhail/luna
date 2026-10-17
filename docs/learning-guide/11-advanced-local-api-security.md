# Advanced Local API Security Hardening

This guide records the security controls and regression tests added after reviewing the local FastAPI API.

## Findings addressed

1. **Host header accepted unexpected ports** — checking only the parsed hostname could accept a request with an unexpected port. The middleware now validates the complete Host header and allows only localhost/127.0.0.1 with the default API port 8000 (or the host without an explicit port).
2. **State-changing requests without an Origin header** — previously, a missing Origin bypassed the origin allowlist. POST/PUT/PATCH/DELETE requests now require one of the two exact local frontend origins.
3. **Oversized multipart request parsed before upload handler checks file size** — when Content-Length is present, the middleware rejects import requests above the 50 MiB file allowance plus 1 MiB for multipart framing before FastAPI parses the upload.
4. **Unbounded display metadata** — imported PDF titles and stored original filenames are limited to 300 characters.
5. **Regression coverage** — tests cover unexpected Host ports, missing/untrusted Origin, invalid/oversized Content-Length, allowed local requests, and extracted-text limits.

## Security boundary and limitations

- LUNA is designed to bind to 127.0.0.1, not to a LAN or public interface. Keep the Uvicorn host at 127.0.0.1.
- The Content-Length guard only works when clients send that header. The endpoint's streamed 50 MiB file limit remains necessary; this is not a complete request-rate or concurrency limit.
- A PDF page-count limit is checked after pypdf opens the document. It does not guarantee protection against every malformed-PDF CPU or memory exhaustion case.
- These changes are regression-tested hardening, not a formal penetration test or a guarantee that all vulnerabilities are absent.
- Do not expose this unauthenticated local API to other devices or the internet.
