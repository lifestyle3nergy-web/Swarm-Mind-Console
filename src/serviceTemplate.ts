import type { AppEntry } from './appCatalog';

export function adapterRoutes(app: AppEntry) {
  return ['/health', '/v1/capabilities', `/v1/adapters/${app.id}/status`];
}

export function buildServiceTemplate(app: AppEntry): Record<string, string> {
  const slug = `orb-adapter-${app.id}`;
  const adapter = { id: app.id, name: app.name, group: app.group, state: 'not_configured', boundary: app.boundary, referenceRepo: app.repo || null };
  const routes = adapterRoutes(app);
  const server = `import { createServer as httpServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const adapter = ${JSON.stringify(adapter, null, 2)};
const routes = ${JSON.stringify(routes, null, 2)};

function respond(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(body));
}

export function createServer() {
  return httpServer((req, res) => {
    const path = new URL(req.url || '/', 'http://localhost').pathname;
    if (req.method !== 'GET') {
      respond(res, 405, { error: 'method_not_allowed' });
      return;
    }
    if (path === '/health') {
      respond(res, 200, { status: 'ok', scope: 'local-template-only' });
    } else if (path === '/v1/capabilities') {
      respond(res, 200, { adapter, routes, note: 'No upstream provider is connected.' });
    } else if (path === '/v1/adapters/' + adapter.id + '/status') {
      respond(res, 200, { adapter: adapter.id, state: 'not_configured', upstream: false });
    } else {
      respond(res, 404, { error: 'not_found' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 8787);
  createServer().listen(port, host, () => {
    console.log('Adapter template listening on ' + host + ':' + port);
  });
}
`;
  return {
    'package.json': JSON.stringify({ name: slug, version: '0.1.0', private: true, type: 'module', engines: { node: '>=20' }, scripts: { start: 'node src/server.mjs', test: 'node --test' } }, null, 2) + '\n',
    'src/server.mjs': server,
    'test/server.test.mjs': `import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.mjs';

test('read-only adapter contract', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const base = 'http://127.0.0.1:' + address.port;
  try {
    const health = await fetch(base + '/health');
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'ok');
    const capabilities = await fetch(base + '/v1/capabilities');
    assert.equal((await capabilities.json()).adapter.state, 'not_configured');
    const status = await fetch(base + '/v1/adapters/${app.id}/status');
    assert.equal((await status.json()).upstream, false);
    assert.equal((await fetch(base + '/v1/capabilities', { method: 'POST' })).status, 405);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
`,
    'contracts/adapter.json': JSON.stringify({ ...adapter, routes, taskContract: 'TASKCONTRACT-POINT-AUTOSYNC', evidenceClass: 'ACTION', admission: 'not_requested' }, null, 2) + '\n',
    'Dockerfile': `FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
USER node
EXPOSE 8787
CMD ["node", "src/server.mjs"]
`,
    'compose.yaml': `services:
  adapter:
    build: .
    environment:
      HOST: 0.0.0.0
      PORT: 8787
    ports:
      - "127.0.0.1:8787:8787"
    read_only: true
    cap_drop: [ALL]
    security_opt: [no-new-privileges:true]
    mem_limit: 128m
`,
    '.github/workflows/ci.yml': `name: Adapter checks
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm test
`,
    '.gitignore': `node_modules/
.env
.env.*
!.env.example
coverage/
`,
    'docs/architecture.md': `# ${app.name} adapter architecture

Browser UI -> authenticated gateway (future) -> read-only adapter -> official provider (future).

This generated service has no upstream connector. It exposes only local metadata and health endpoints. Do not add provider credentials to the browser bundle, contract JSON, logs, or Git history. For private data, add authentication, authorization, rate limits, schema validation, request budgets, and human review before deployment.

Endpoint contract:
${routes.map(route => `- GET ${route}`).join('\n')}

Integration boundary: ${app.boundary}
`,
    'README.md': `# ${slug}

Read-only local template for the ${app.name} workspace surface. This is a generated starting point, not a live integration and not a clone of any existing repository.

## Run

Requires Node.js 20+. From this folder, run \`npm test\` and then \`npm start\`. Open \`http://127.0.0.1:8787/health\`.

## Endpoints

${routes.map(route => `- \`GET ${route}\``).join('\n')}

The adapter reports \`not_configured\` until a reviewed provider implementation is added. It does not connect to ${app.name}, scan apps, execute commands, or handle tokens. Docker Compose binds to host loopback only; review the security model before any wider exposure.

## Git boundary

Use a feature branch and a pull request. Keep commits evidence-classed, run \`npm test\`, and require human review. Do not push directly to protected main. Check the authoritative organization ADR registry before allocating any ADR number.
`,
  };
}