# AI-OS-CM
AI Operating System  with a Cognitive  Metabolism 

## Engineering intelligence dashboard

The browser dashboard is available in [`apps/dashboard/`](apps/dashboard/README.md). It includes a twelve-repository pull-request intake for TWGT-, twgt-bridge, twgt-schema-gate, engineering-intelligence, and eight additional references from the supplied inventory. Rows are visible offline; selecting **Check public PRs** loads the latest public PR metadata without a token. CI checks and git scores are never inferred from that request.

Run it locally with `cd apps/dashboard && npm ci && npm run dev`. Build with `npm run build`. The dashboard is an independent frontend; it does not start or claim to implement the metabolism API described below.

See [`DASHBOARD.md`](DASHBOARD.md) for the data and security boundaries.

# AI-OS-CM (AI-OS Cognitive Metabolism) — Phase 1

This repository contains a Phase 1 scaffold for AI-OS Cognitive Metabolism:
- OPA/Regulator integration with Rego policies
- OPA client wrapper (env-configurable)
- FastAPI MVP for knowledge objects (capture/classify/promote/experiment/metrics)
- In-memory MemoryStore (swapable via repository pattern)
- Experiment runner (MVT simulation)
- Integration & unit tests
- GitHub Actions workflow that launches OPA and runs tests with coverage

Quick start (local)
1. Create and activate a virtualenv:
   python3 -m venv .venv
   source .venv/bin/activate

2. Install dependencies:
   pip install -r requirements.txt

3. Run API:
   uvicorn packages.metabolism.api.main:app --reload --port 8000

4. Run demo (in another terminal):
   python demos/demo_end_to_end.py

5. Run tests (unit only, OPA not required):
   pytest -q -m unit

Run OPA locally (for integration tests)
```bash
docker run -d --name opa -p 8181:8181 -v "$(pwd)/packages/metabolism/policies":/policies openpolicyagent/opa:0.56.0 run --server /policies
# then run integration tests:
pytest -q -m integration
