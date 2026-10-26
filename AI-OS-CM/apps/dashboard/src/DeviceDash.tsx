import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, Bluetooth, Box, Check, ChevronDown, CircleAlert, Cloud, Compass, Copy, Cpu, Database, ExternalLink, Globe2, HardDrive, LockKeyhole, Network, Radio, RefreshCw, Router, Satellite, Search, ShieldCheck, Smartphone, Wifi, Zap } from 'lucide-react';
import './device.css';

type Category = 'All layers' | 'Transport' | 'Device' | 'Spatial' | 'Compute';
type Capability = { name: string; category: Exclude<Category, 'All layers'>; scope: string; description: string; access: string; icon: typeof Wifi };
type ConnectionInfo = EventTarget & { effectiveType?: string; type?: string; downlink?: number; rtt?: number; saveData?: boolean };
type BrowserNavigator = Navigator & { connection?: ConnectionInfo; mozConnection?: ConnectionInfo; webkitConnection?: ConnectionInfo; deviceMemory?: number; bluetooth?: { getAvailability: () => Promise<boolean> } };
type Snapshot = { online: boolean; effective: string | null; type: string | null; downlink: number | null; rtt: number | null; saveData: boolean | null; cores: number | null; memory: number | null; secure: boolean; bluetoothApi: boolean; storageUsage: number | null; storageQuota: number | null; checkedAt: string };
type RepoResult = { name: string; state: 'idle' | 'loading' | 'available' | 'error'; updatedAt?: string; branch?: string; size?: number; error?: string };

const capabilities: Capability[] = [
  { name: 'Wi-Fi / Ethernet', category: 'Transport', scope: 'Native bridge', description: 'Inspect active network transport and validation with Android ConnectivityManager.', access: 'ACCESS_NETWORK_STATE; never infer Wi-Fi from browser effectiveType.', icon: Wifi },
  { name: 'DNS / ISP', category: 'Transport', scope: 'Native bridge', description: 'Review link DNS and routes on device; ISP attribution requires an authorized provider.', access: 'LinkProperties for DNS. Do not expose private addresses by default.', icon: Globe2 },
  { name: 'VPN / Proxy', category: 'Transport', scope: 'Native bridge', description: 'Report VPN transport and configured proxy without changing device routing.', access: 'NetworkCapabilities and LinkProperties; read-only.', icon: ShieldCheck },
  { name: 'LTE / RAN / Google Fi', category: 'Transport', scope: 'Carrier or native', description: 'Cellular transport can be observed natively; carrier and RAN telemetry need provider access.', access: 'Permission and carrier policy required for granular radio data.', icon: Radio },
  { name: 'Li-Fi / LoRaWAN / RF', category: 'Transport', scope: 'External adapter', description: 'Specialist radios are not visible to a standard browser or generic Android app.', access: 'Requires supported hardware gateway and explicit pairing.', icon: Zap },
  { name: 'TCP / UDP / WebSockets', category: 'Transport', scope: 'Gateway', description: 'Browser supports HTTPS and WebSockets; raw TCP and UDP need a broker or native app.', access: 'Use origin allowlists, TLS, and bounded connection budgets.', icon: Network },
  { name: 'Bluetooth LE', category: 'Device', scope: 'Permissioned', description: 'Web Bluetooth is limited; Android BLE scans and connections need runtime consent.', access: 'BLUETOOTH_SCAN / CONNECT on supported Android versions.', icon: Bluetooth },
  { name: 'SmartThings / sensors', category: 'Device', scope: 'Provider API', description: 'Connect approved smart devices through scoped OAuth and a server-side adapter.', access: 'Never store SmartThings tokens in this browser.', icon: Smartphone },
  { name: 'Samsung DeX / VM', category: 'Device', scope: 'Native companion', description: 'Desktop mode and virtual machines require an OS-level bridge to report state.', access: 'No browser-level control of the host or guest OS.', icon: Box },
  { name: 'Maps / LiDAR', category: 'Spatial', scope: 'Provider API', description: 'Display authorized map layers or sensor-derived point clouds with provenance.', access: 'Location and camera require separate, explicit user consent.', icon: Compass },
  { name: 'Satellite / mobility', category: 'Spatial', scope: 'Public feeds', description: 'Overlay sourced orbital, transport, or electric mobility feeds with timestamps.', access: 'Observational only; not for navigation or safety decisions.', icon: Satellite },
  { name: 'Storage / migration', category: 'Compute', scope: 'Browser + native', description: 'Estimate this origin’s storage here; device migration needs a verified backup path.', access: 'WorkManager + encrypted storage in a future Android companion.', icon: HardDrive },
  { name: 'JEPA knowledge lab', category: 'Compute', scope: 'Local sandbox', description: 'Train paired views in an isolated Python sandbox, then register reviewed embeddings.', access: 'No training runs in this browser; no automatic model download.', icon: Cpu },
  { name: 'Data center / MCP', category: 'Compute', scope: 'Server adapter', description: 'Read incidents and service context through a least-privilege MCP gateway.', access: 'Rootly credentials and writes remain server-side and human-gated.', icon: Cloud },
];

const repoNames = ['engineering-intelligence', 'rootly-mcp-server', 'gods-eye-view'];
const categories: Category[] = ['All layers', 'Transport', 'Device', 'Spatial', 'Compute'];
const formatBytes = (bytes: number | null) => bytes == null ? 'Unavailable' : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;

function readBrowser(): Snapshot {
  const nav = navigator as BrowserNavigator;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  return { online: navigator.onLine, effective: connection?.effectiveType ?? null, type: connection?.type ?? null, downlink: connection?.downlink ?? null, rtt: connection?.rtt ?? null, saveData: connection?.saveData ?? null, cores: navigator.hardwareConcurrency ?? null, memory: nav.deviceMemory ?? null, secure: window.isSecureContext, bluetoothApi: Boolean(nav.bluetooth), storageUsage: null, storageQuota: null, checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
}

export default function DeviceDash() {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => readBrowser());
  const [category, setCategory] = useState<Category>('All layers');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Capability>(capabilities[0]);
  const [probe, setProbe] = useState<'idle' | 'checking' | 'reachable' | 'failed'>('idle');
  const [probeTime, setProbeTime] = useState<number | null>(null);
  const [repos, setRepos] = useState<RepoResult[]>(repoNames.map(name => ({ name, state: 'idle' })));
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const next = readBrowser();
    try {
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        next.storageUsage = estimate.usage ?? null;
        next.storageQuota = estimate.quota ?? null;
      }
    } catch { /* Storage estimate is optional and browser dependent. */ }
    setSnapshot(next);
  }, []);

  useEffect(() => {
    void refresh();
    const nav = navigator as BrowserNavigator;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    connection?.addEventListener?.('change', refresh);
    return () => { window.removeEventListener('online', refresh); window.removeEventListener('offline', refresh); connection?.removeEventListener?.('change', refresh); };
  }, [refresh]);

  async function checkOrigin() {
    setProbe('checking'); setProbeTime(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    const start = performance.now();
    try {
      const url = new URL(window.location.pathname, window.location.origin);
      url.searchParams.set('orb_probe', Date.now().toString());
      const response = await fetch(url, { method: 'HEAD', cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
      setProbe(response.ok ? 'reachable' : 'failed');
      if (response.ok) setProbeTime(Math.round(performance.now() - start));
    } catch { setProbe('failed'); }
    finally { window.clearTimeout(timeout); void refresh(); }
  }

  async function fetchRepos() {
    setRepos(repoNames.map(name => ({ name, state: 'loading' })));
    const results = await Promise.all(repoNames.map(async (name): Promise<RepoResult> => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 7000);
      try {
        const response = await fetch(`https://api.github.com/repos/lifestyle3nergy-web/${name}`, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 403 ? 'Rate limited' : response.status === 404 ? 'Not public' : `HTTP ${response.status}`);
        const data: { updated_at?: string; default_branch?: string; size?: number } = await response.json();
        return { name, state: 'available', updatedAt: data.updated_at, branch: data.default_branch, size: data.size };
      } catch (error) { return { name, state: 'error', error: error instanceof Error ? error.message : 'Unavailable' }; }
      finally { window.clearTimeout(timer); }
    }));
    setRepos(results);
  }

  const visible = useMemo(() => capabilities.filter(c => (category === 'All layers' || c.category === category) && `${c.name} ${c.description}`.toLowerCase().includes(search.toLowerCase())), [category, search]);
  const storagePercent = snapshot.storageUsage != null && snapshot.storageQuota ? Math.min(100, (snapshot.storageUsage / snapshot.storageQuota) * 100) : 0;
  const summary = [
    { icon: Wifi, label: 'BROWSER NETWORK HINT', value: snapshot.online ? 'Online hint' : 'Offline hint', detail: 'Not proof of internet access', color: snapshot.online ? 'teal' : 'rose' },
    { icon: Activity, label: 'EFFECTIVE CONNECTION', value: snapshot.effective?.toUpperCase() || 'Not exposed', detail: snapshot.downlink != null ? `Estimated ${snapshot.downlink} Mb/s downlink` : 'Browser API varies by device', color: 'blue' },
    { icon: HardDrive, label: 'ORIGIN STORAGE', value: formatBytes(snapshot.storageUsage), detail: snapshot.storageQuota != null ? `of approx. ${formatBytes(snapshot.storageQuota)} quota` : 'Estimate unavailable', color: 'purple' },
    { icon: Cpu, label: 'LOGICAL CORES', value: snapshot.cores?.toString() || 'Not exposed', detail: snapshot.memory ? `Approx. ${snapshot.memory} GB device memory` : 'Hardware detail limited', color: 'gold' },
  ];

  return <section className="device-section" id="device-networx" aria-labelledby="device-title">
    <div className="section-heading device-heading"><div><div className="section-kicker">DEVICE DASH / NETWORX</div><h2 id="device-title">The connectivity layer<span className="device-title-dot">.</span></h2><p>See what this browser can actually observe, then map what a permissioned native bridge could add.</p></div><span className="device-boundary"><LockKeyhole size={14} /> READ-ONLY BY DESIGN</span></div>

    <div className="device-summary" aria-label="Browser diagnostics">{summary.map(item => <div className="device-signal" key={item.label}><div className="device-signal-label"><item.icon size={16} className={`device-icon-${item.color}`} /><span>{item.label}</span></div><strong>{item.value}</strong><small>{item.detail}</small></div>)}</div>

    <div className="device-layout"><div className="device-topology"><div className="device-panel-head"><div><span className="device-overline">BOUNDARY MAP / CURRENT SESSION</span><h3>From device to upstream</h3></div><span className="device-observed"><i /> Browser observed</span></div><div className="device-route" aria-label="Connectivity architecture"><div className="route-node active"><span className="route-icon"><Smartphone size={23} /></span><b>THIS DEVICE</b><small>Browser context</small></div><span className="route-line active" /><div className="route-node active"><span className="route-icon"><Globe2 size={23} /></span><b>WEB ORIGIN</b><small>HTTPS / WebSocket</small></div><span className="route-line" /><div className="route-node"><span className="route-icon"><Router size={23} /></span><b>NATIVE BRIDGE</b><small>Permissioned adapter</small></div><span className="route-line" /><div className="route-node"><span className="route-icon"><Cloud size={23} /></span><b>UPSTREAM</b><small>Scoped services</small></div></div><div className="device-route-note"><CircleAlert size={15} /><span>The browser cannot reveal your ISP, DNS servers, VPN state, cellular radio, or nearby devices without separate supported APIs and permissions.</span></div><div className="device-probe"><div><b>Same-origin reachability</b><small>{probe === 'idle' ? 'Not tested. Probe runs only when you ask.' : probe === 'checking' ? 'Checking this site...' : probe === 'reachable' ? `HTTP response received in ${probeTime} ms. Not an ISP or DNS test.` : 'Could not reach this site. This does not identify the cause.'}</small></div><button onClick={checkOrigin} disabled={probe === 'checking'}><RefreshCw size={14} className={probe === 'checking' ? 'spin' : ''} /> Run safe probe</button></div></div>
      <div className="device-context"><div className="device-panel-head"><div><span className="device-overline">CAPABILITY / BROWSER</span><h3>Local context</h3></div><Database size={17} /></div><div className="context-row"><span>Secure context</span><b className={snapshot.secure ? 'context-good' : 'context-warn'}>{snapshot.secure ? 'Yes / HTTPS or localhost' : 'No'}</b></div><div className="context-row"><span>Web Bluetooth API</span><b>{snapshot.bluetoothApi ? 'Exposed, not paired' : 'Not exposed'}</b></div><div className="context-row"><span>Connection class</span><b>{snapshot.type || 'Not exposed'}</b></div><div className="context-row"><span>Estimated RTT</span><b>{snapshot.rtt == null ? 'Not exposed' : `${snapshot.rtt} ms`}</b></div><div className="context-row"><span>Data saver</span><b>{snapshot.saveData == null ? 'Not exposed' : snapshot.saveData ? 'Enabled' : 'Off'}</b></div><div className="context-row"><span>Last observed</span><b>{snapshot.checkedAt}</b></div><div className="device-storage"><div><span>Origin storage estimate</span><b>{snapshot.storageUsage == null ? 'Unavailable' : `${storagePercent.toFixed(1)}%`}</b></div><div className="device-storage-track"><i style={{ width: `${storagePercent}%` }} /></div><small>Approximate quota for this site, not total device storage.</small></div><button className="device-refresh" onClick={() => void refresh()}><RefreshCw size={14} /> Refresh browser snapshot</button></div></div>

    <div className="device-catalog-heading"><div><span className="device-overline">ADAPTER REGISTRY / PROPOSED</span><h3>Superpower interfaces</h3><p>Every layer shows its access boundary. Selecting one reveals its integration contract.</p></div><div className="device-catalog-tools"><label className="device-search"><Search size={15} /><input aria-label="Search capabilities" placeholder="Find a capability" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="device-select"><select aria-label="Filter capability layer" value={category} onChange={e => setCategory(e.target.value as Category)}>{categories.map(c => <option key={c}>{c}</option>)}</select><ChevronDown size={14} /></label></div></div>
    <div className="device-catalog"><div className="capability-list" role="list" aria-label="Capability interfaces">{visible.length ? visible.map(item => <button key={item.name} className={`capability-item ${selected.name === item.name ? 'selected' : ''}`} onClick={() => setSelected(item)}><span className="capability-icon"><item.icon size={17} /></span><span className="capability-name"><b>{item.name}</b><small>{item.category}</small></span><span className="capability-scope">{item.scope}</span><ArrowRight size={15} /></button>) : <div className="capability-empty">No capability matches this search.</div>}</div><div className="capability-detail"><span className="device-overline">SELECTED CONTRACT</span><div className="capability-large-icon"><selected.icon size={25} /></div><h3>{selected.name}</h3><p>{selected.description}</p><div className="capability-detail-row"><span>Surface</span><b>{selected.category}</b></div><div className="capability-detail-row"><span>Availability</span><b>{selected.scope}</b></div><div className="capability-access"><LockKeyhole size={15} /><span>{selected.access}</span></div><span className="contract-caption">TASKCONTRACT-POINT-AUTOSYNC / PROPOSAL ONLY</span></div></div>

    <div className="device-bottom-grid"><div className="device-repos"><div className="device-panel-head"><div><span className="device-overline">PUBLIC SOURCE REFERENCES</span><h3>Upstream repository pulse</h3></div><button onClick={() => void fetchRepos()} disabled={repos.some(r => r.state === 'loading')}><RefreshCw size={14} className={repos.some(r => r.state === 'loading') ? 'spin' : ''} /> Fetch public metadata</button></div><p>Opt-in, read-only requests to GitHub's public API. Private repositories and files are never requested.</p><div className="repo-list">{repos.map(repo => <div className="repo-line" key={repo.name}><span className="repo-glyph"><Network size={16} /></span><div><a href={`https://github.com/lifestyle3nergy-web/${repo.name}`} target="_blank" rel="noreferrer">{repo.name} <ExternalLink size={11} /></a><small>{repo.state === 'available' ? `Default: ${repo.branch || 'unknown'} · Updated ${repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString() : 'unknown'}` : repo.state === 'error' ? `Unavailable: ${repo.error}` : repo.state === 'loading' ? 'Requesting public metadata...' : 'Reference only · not fetched'}</small></div><span className={`repo-state ${repo.state}`}>{repo.state === 'available' ? 'PUBLIC' : repo.state === 'loading' ? 'WAIT' : repo.state === 'error' ? 'ERROR' : 'IDLE'}</span></div>)}</div></div><div className="device-knowledge"><div className="device-panel-head"><div><span className="device-overline">LOCAL INTELLIGENCE / LAB</span><h3>JEPA knowledge sandbox</h3></div><Cpu size={18} /></div><p>Paired image views, an EMA target encoder, and a variance guard form a reviewable training pipeline. Training never starts from this dashboard.</p><div className="knowledge-flow"><span>DATASET</span><ArrowRight size={14} /><span>PAIRED VIEWS</span><ArrowRight size={14} /><span>EMA ENCODER</span></div><div className="knowledge-footer"><span><Check size={13} /> Local-only design</span><button onClick={async () => { try { await navigator.clipboard.writeText('packages/knowledge/knowledge_library.py'); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); } }}><Copy size={13} /> {copied ? 'Copied' : 'Copy module path'}</button></div></div></div>
    <div className="device-disclaimer"><ShieldCheck size={16} /><span>Observed values are browser hints, not a diagnosis. Native, radio, map, and cloud interfaces above are architectural proposals, not active connections.</span></div>
  </section>;
}