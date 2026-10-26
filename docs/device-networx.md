# Device DASH NetworX: integration boundaries

The dashboard is a browser application, not an Android system service. Its **observed** diagnostics come from `navigator.onLine`, optional Network Information fields, `navigator.storage.estimate()`, hardware concurrency, secure-context status, and a user-triggered `HEAD` request to its own origin. Online is a hint, not proof of internet access; the origin probe is not a DNS, ISP, VPN, or throughput test. The public GitHub metadata button performs three bounded read-only requests and requires no token. Private repositories cannot be discovered by this path.

## Capability ladder

| Surface | Proposed path | Boundary |
| --- | --- | --- |
| Wi-Fi, cellular, VPN, DNS, proxy | Android `ConnectivityManager`, `NetworkCapabilities`, `LinkProperties`, `NetworkCallback` | Companion app with manifest permissions. Read only, unregister callbacks, minimize exposure of routes and addresses. |
| BLE, nearby smart devices | Android BLE or limited Web Bluetooth | Explicit runtime permission and a user gesture. Do not scan in background by default. |
| Li-Fi, LoRaWAN, RF, LiDAR | Hardware or provider adapter | No generic browser API. Obtain hardware-specific SDK and user consent. |
| TCP, UDP, WebSockets | HTTPS/WebSocket gateway; native socket only if necessary | Do not open raw network access from a dashboard. Enforce origin allowlist, TLS, authentication, timeouts, and quotas. |
| Satellite, maps, mobility | Authorized public or licensed feeds | Preserve source, timestamp, attribution, license, and uncertainty. Never use this dashboard for safety-critical navigation. |
| Device context and backup | AndroidX DataStore or Room, WorkManager with constraints | Local encrypted storage, explicit retention, verified remote acknowledgment. Browser localStorage is not a device backup. |
| Rootly MCP | Server-side OAuth or scoped token, read-only allowlist | Do not embed credentials or enable write tools in the frontend. Human approval for operational actions. |

Android connectivity documentation: https://developer.android.com/develop/connectivity/network-ops/reading-network-state

Android Bluetooth permissions: https://developer.android.com/develop/connectivity/bluetooth/bt-permissions

WorkManager: https://developer.android.com/reference/androidx/work/WorkManager

Browser storage estimates: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate

Network Information API limitations: https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API

## Referenced repositories

Public documentation was inspected, but no repository content was cloned or executed. `engineering-intelligence` identifies itself as an evidence atlas and ADR registry, not an execution service. `rootly-mcp-server` documents Streamable HTTP and server-side credentials. `gods-eye-view` documents a public-feed globe with separate data provenance, license, and security boundaries. These are references, not automatically admitted integrations.

The suggested `gh repo list` command requires a locally authenticated GitHub CLI to include private repositories. No authenticated CLI was available here. For a read-only recovery inventory, inspect a cloned tree without running any found scripts. The supplied `find` expression for JS/MJS needs parentheses: `find . -type f -not -path './.git/*' \( -name '*.js' -o -name '*.mjs' \) | wc -l`. Avoid using a placeholder `<repo>` literally, and separate `jq ...` and `cd ...` with a newline or `&&`.

Before proposing changes to the upstream evidence atlas, check its centralized `governance/adr-registry.json` and policy. Prototype documents here do not allocate upstream ADR numbers, assert `EXECUTED`, or authorize admission.