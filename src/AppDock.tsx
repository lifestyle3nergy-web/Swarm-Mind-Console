import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import JSZip from 'jszip';
import { ArrowRight, Box, Check, ChevronRight, Code2, Download, ExternalLink, FolderGit2, GitBranch, LockKeyhole, Pin, Search, Server, Settings2, ShieldCheck, X } from 'lucide-react';
import { appCatalog, appGroups, type AppGroup } from './appCatalog';
import { adapterRoutes, buildServiceTemplate } from './serviceTemplate';
import './appDock.css';

type Props = {
  open: boolean;
  onClose: () => void;
  initialAppId: string;
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
};

export default function AppDock({ open, onClose, initialAppId, pinnedIds, onTogglePin }: Props) {
  const [group, setGroup] = useState<'All apps' | AppGroup>('All apps');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(initialAppId);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = appCatalog.find(app => app.id === selectedId) || appCatalog[0];
  const filtered = useMemo(() => appCatalog.filter(app =>
    (group === 'All apps' || app.group === group) &&
    `${app.name} ${app.role} ${app.group}`.toLowerCase().includes(query.toLowerCase())
  ), [group, query]);
  const template = useMemo(() => buildServiceTemplate(selected), [selected]);

  useEffect(() => { setSelectedId(initialAppId); }, [initialAppId]);
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => searchRef.current?.focus(), 200);
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => { window.clearTimeout(timer); document.body.style.overflow = before; window.removeEventListener('keydown', handleKey); };
  }, [open, onClose]);

  async function downloadTemplate() {
    setDownloading(true); setError('');
    try {
      const zip = new JSZip();
      Object.entries(template).forEach(([path, content]) => zip.file(path, content));
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orb-adapter-${selected.id}.zip`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { setError('Could not prepare the template. Try again.'); }
    finally { setDownloading(false); }
  }

  async function copyRoute() {
    try {
      await navigator.clipboard.writeText(adapterRoutes(selected)[2]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setError('Clipboard unavailable. Select the route text to copy it.'); }
  }

  return <AnimatePresence>{open && <>
    <motion.div className="dock-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.aside className="dock-drawer" role="dialog" aria-modal="true" aria-labelledby="dock-title" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 270 }}>
      <header className="dock-header"><div className="dock-header-brand"><span className="dock-header-icon"><Box size={19} /></span><div><strong id="dock-title">App dock</strong><small>WORKSPACE / CONNECTORS / TEMPLATES</small></div></div><div className="dock-header-right"><span><span className="pulse-dot" /> LOCAL CATALOG</span><button className="icon-button" onClick={onClose} aria-label="Close app dock"><X size={19} /></button></div></header>
      <div className="dock-scroll"><div className="dock-intro"><span className="dock-overline">YOUR WORKSPACE, ONE PLACE</span><h2>Tools in your orbit<span>.</span></h2><p>Pin the apps you reach for most. Define a safe middleware boundary before connecting any service.</p></div>
        <div className="dock-toolbar"><label className="dock-search"><Search size={16} /><input ref={searchRef} aria-label="Search app catalog" placeholder="Search apps and roles..." value={query} onChange={e => setQuery(e.target.value)} /></label><span className="dock-total">{filtered.length} apps</span></div>
        <div className="dock-groups" aria-label="Filter app groups">{appGroups.map(item => <button key={item} className={group === item ? 'active' : ''} aria-pressed={group === item} onClick={() => setGroup(item)}>{item}</button>)}</div>
        <div className="dock-main"><div className="dock-apps" aria-label="App catalog">{filtered.length ? filtered.map(app => <button key={app.id} className={`dock-app ${selected.id === app.id ? 'selected' : ''}`} onClick={() => { setSelectedId(app.id); setError(''); }} aria-pressed={selected.id === app.id}><span className={`dock-app-icon ${app.color}`}>{app.mark}</span><span className="dock-app-name">{app.name}</span>{pinnedIds.includes(app.id) && <Pin className="dock-pin-indicator" size={11} fill="currentColor" />}</button>) : <div className="dock-empty">No apps match that search. Try another group or term.</div>}</div>
          <div className="dock-detail"><div className="dock-detail-top"><span className="dock-overline">SELECTED APP / {selected.group.toUpperCase()}</span><button className={`dock-pin-button ${pinnedIds.includes(selected.id) ? 'pinned' : ''}`} onClick={() => onTogglePin(selected.id)} aria-label={pinnedIds.includes(selected.id) ? `Unpin ${selected.name}` : `Pin ${selected.name}`}><Pin size={15} fill={pinnedIds.includes(selected.id) ? 'currentColor' : 'none'} />{pinnedIds.includes(selected.id) ? 'Pinned' : 'Pin'}</button></div><div className="dock-selected-app"><span className={`dock-app-icon ${selected.color}`}>{selected.mark}</span><div><h3>{selected.name}</h3><span>{selected.group} surface</span></div></div><p>{selected.role}</p><div className="dock-boundary"><LockKeyhole size={16} /><span>{selected.boundary}</span></div><div className="dock-detail-row"><span>Adapter status</span><strong className="dock-awaiting">Not configured</strong></div><div className="dock-detail-row"><span>Service name</span><code>orb-adapter-{selected.id}</code></div><div className="dock-detail-row"><span>Reference repo</span>{selected.repo ? <a className="dock-repo-link" href={`https://github.com/lifestyle3nergy-web/${selected.repo}`} target="_blank" rel="noopener noreferrer">{selected.repo} <ExternalLink size={12} /></a> : <strong>None linked</strong>}</div><div className="dock-detail-row"><span>Proposed endpoint</span><button className="dock-route-copy" onClick={copyRoute} title="Copy proposed endpoint"><code>{adapterRoutes(selected)[2]}</code>{copied ? <Check size={13} /> : <Code2 size={13} />}</button></div><div className="dock-detail-actions">{selected.website ? <a href={selected.website} target="_blank" rel="noopener noreferrer">Open official website <ExternalLink size={14} /></a> : <span>No web launcher available</span>}{selected.id === 'networx' && <a href="#device-networx" onClick={onClose}>Open NetworX <ArrowRight size={14} /></a>}</div></div></div>

        <section className="dock-blueprint" aria-labelledby="blueprint-heading"><div className="dock-blueprint-head"><div><span className="dock-overline">ARCHITECTURE / READ-ONLY STARTER</span><h3 id="blueprint-heading">Build the boundary, not a shortcut.</h3><p>Generate a small service template for {selected.name}. It includes no credentials, upstream calls, or write actions.</p></div><Server size={19} /></div><div className="dock-chain"><span><Box size={16} /> App dock</span><ChevronRight size={15} /><span><ShieldCheck size={16} /> Approval gateway</span><ChevronRight size={15} /><span><Server size={16} /> Adapter service</span><ChevronRight size={15} /><span><FolderGit2 size={16} /> Upstream repo</span></div><div className="dock-blueprint-bottom"><div className="dock-file-list"><span><GitBranch size={14} /> {Object.keys(template).length} files in template</span><small>Node HTTP API / contract / tests / Docker / CI / docs</small></div><button className="dock-download" disabled={downloading} onClick={() => void downloadTemplate()}><Download size={16} /> {downloading ? 'Preparing ZIP...' : 'Download service template'}</button></div>{error && <div className="dock-error" role="alert">{error}</div>}</section>
        <div className="dock-footnote"><Settings2 size={15} /><span>This is a curated app map, not an inventory of installed apps. Pins stay in this browser only. A downloaded template must be reviewed before deployment.</span></div>
      </div>
    </motion.aside>
  </>}</AnimatePresence>;
}