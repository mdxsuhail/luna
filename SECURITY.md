# Security Policy

## Supported version

Security work targets the current default branch of this student-built, local-first prototype.

## Reporting a vulnerability

Please do not publish exploit details, private documents, tokens, or other sensitive information in a public issue. Contact the repository owner privately through GitHub's profile/contact options and include:
- a concise description and impact;
- the affected endpoint/file and steps to reproduce using a harmless test file;
- any suggested mitigation.

Do not include real personal documents or private data in a report.

## Security scope and limitations

LUNA is intended for local single-user use. It does not currently provide login/authentication or a network deployment security model. Keep the API bound to `127.0.0.1`; do not expose it to a LAN or the public internet.

Current defenses include local Host/Origin allowlists, restricted CORS, upload request/file limits, PDF header and parser checks, path-containment checks for stored PDFs, parameterized SQL, and automated dependency audits. These are defense-in-depth measures, not a guarantee that malicious PDFs cannot cause resource exhaustion.

See [Security & Limitations in the README](README.md#security--limitations) and the [security learning guide](docs/learning-guide/07-security-fixes-and-tests.md).
