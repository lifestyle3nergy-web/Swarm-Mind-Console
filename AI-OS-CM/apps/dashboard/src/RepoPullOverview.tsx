import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, CircleAlert, Download, ExternalLink, GitPullRequest, RefreshCw, Search } from 'lucide-react';
import './repoPullOverview.css';

type PullState = 'Open' | 'Closed' | 'Merged' | 'None' | 'Not checked' | 'Unavailable';
type RecentPull = { number: number; title: string; url: string; state: PullState; updatedAt: string };
type RepoEntry = { name: string; family: string; url: string };
type RepoResult = { pull?: RecentPull; state: PullState; error?: string };
type SortKey = 'priority' | 'name' | 'family' | 'state' | 'updated';

// Prioritize the four named governance repositories, then the earliest
// workspace references from the supplied repository inventory.
export const trackedRepos: RepoEntry[] = [
  { name: 'TWGT-', family: 'Governance', url: 'https://github.com/lifestyle3nergy-web/TWGT-' },
  { name: 'twgt-bridge', family: 'Evidence bridge', url: 'https://github.com/lifestyle3nergy-web/twgt-bridge' },
  { name: 'twgt-schema-gate', family: 'Schema gate', url: 'https://github.com/lifestyle3nergy-web/twgt-schema-gate' },
  { name: 'engineering-intelligence', family: 'Registry', url: 'https://github.com/lifestyle3nergy-web/engineering-intelligence' },
  { name: 'rootly-mcp-server', family: 'Integration', url: 'https://github.com/lifestyle3nergy-web/rootly-mcp-server' },
  { name: 'Swarm-Mind-Console', family: 'Application', url: 'https://github.com/lifestyle3nergy-web/Swarm-Mind-Console' },
  { name: 'caddy', family: 'Infrastructure', url: 'https://github.com/lifestyle3nergy-web/caddy' },
  { name: 'sanitizers', family: 'Security', url: 'https://github.com/lifestyle3nergy-web/sanitizers' },
  { name: 'plugins', family: 'Tooling', url: 'https://github.com/lifestyle3nergy-web/plugins' },
  { name: 'router-cli', family: 'Tooling', url: 'https://github.com/lifestyle3nergy-web/router-cli' },
  { name: 'all-in-one', family: 'Tooling', url: 'https://github.com/lifestyle3nergy-web/all-in-one' },
  { name: 'gods-eye-view', family: 'Research', url: 'https://github.com/lifestyle3nergy-web/gods-eye-view' },
];

const filters = ['All states', 'Open', 'Closed', 'Merged', 'None', 'Not checked', 'Unavailable'] as const;

export default function RepoPullOverview() {
  const [results, setResults] = useState<Record<string, RepoResult>>({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<(typeof filters)[number]>('All states');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('priority');
  const [ascending, setAscending] = useState(true);
  const [message, setMessage] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const rows = useMemo(() => trackedRepos.filter(repo => {
    const state = results[repo.name]?.state || 'Not checked';
    return (filter === 'All states' || state === filter) && `${repo.name} ${repo.family}`.toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => {
    if (sort === 'priority') return trackedRepos.indexOf(a) - trackedRepos.indexOf(b);
    const aResult = results[a.name], bResult = results[b.name];
    const left = sort === 'name' ? a.name : sort === 'family' ? a.family : sort === 'state' ? aResult?.state || 'Not checked' : aResult?.pull?.updatedAt || '';
    const right = sort === 'name' ? b.name : sort === 'family' ? b.family : sort === 'state' ? bResult?.state || 'Not checked' : bResult?.pull?.updatedAt || '';
    return (ascending ? 1 : -1) * left.localeCompare(right);
  }), [results, filter, search, sort, ascending]);

  function changeSort(key: SortKey) { if (sort === key) setAscending(!ascending); else { setSort(key); setAscending(true); } }

  async function checkPublicPulls() {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    setLoading(true); setMessage('Checking public PR metadata only. No credentials are sent.');
    const timeout = window.setTimeout(() => current.abort(), 12000);
    try {
      const entries = await Promise.all(trackedRepos.map(async (repo): Promise<[string, RepoResult]> => {
        try {
          const response = await fetch(`https://api.github.com/repos/lifestyle3nergy-web/${encodeURIComponent(repo.name)}/pulls?state=all&sort=updated&direction=desc&per_page=1`, {
            headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit', signal: current.signal,
          });
          if (!response.ok) throw new Error(response.status === 403 ? 'Rate limited' : response.status === 404 ? 'Not public' : `HTTP ${response.status}`);
          const data: Array<{ number: number; title: string; html_url: string; state: string; merged_at: string | null; updated_at: string }> = await response.json();
          if (!Array.isArray(data)) throw new Error('Unexpected response');
          if (!data.length) return [repo.name, { state: 'None' }];
          const item = data[0];
          const state: PullState = item.merged_at ? 'Merged' : item.state === 'open' ? 'Open' : 'Closed';
          return [repo.name, { state, pull: { number: item.number, title: item.title, url: item.html_url, state, updatedAt: item.updated_at } }];
        } catch (error) { return [repo.name, { state: 'Unavailable', error: error instanceof Error ? error.message : 'Request failed' }]; }
      }));
      setResults(Object.fromEntries(entries));
      const failed = entries.filter(([, result]) => result.state === 'Unavailable').length;
      setMessage(failed ? `${entries.length - failed} checked; ${failed} unavailable or rate limited. Results are not CI evidence.` : 'Public PR metadata loaded. Checks and git scores are not inferred.');
    } finally { window.clearTimeout(timeout); setLoading(false); }
  }

  function exportCsv() {
    const records = [['Repository', 'Family', 'Latest PR', 'State', 'Updated', 'Source'], ...rows.map(repo => {
      const result = results[repo.name];
      return [repo.name, repo.family, result?.pull ? `#${result.pull.number} ${result.pull.title}` : '', result?.state || 'Not checked', result?.pull?.updatedAt || '', repo.url];
    })];
    const csv = records.map(record => record.map(value => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a'); link.href = url; link.download = 'orb-tracked-repositories.csv'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  const checked = Object.keys(results).length;
  return <section className="table-section tracked-section" id="pull-requests" aria-labelledby="tracked-title">
    <div className="section-heading table-section-heading"><div><div className="section-kicker">MERGE INTELLIGENCE / REAL REPOSITORIES</div><h2 id="tracked-title">Pull request overview <span className="title-count">{trackedRepos.length}</span></h2><p>Twelve repositories from your inventory. PR state appears only after a public read-only check.</p></div><div className="table-actions"><button className="subtle-button" onClick={() => void checkPublicPulls()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> {loading ? 'Checking...' : 'Check public PRs'}</button><button className="subtle-button" onClick={exportCsv}><Download size={15} /> Export</button></div></div>
    <div className="tracked-controls"><label><Search size={15} /><input aria-label="Search tracked repositories" placeholder="Find repository..." value={search} onChange={event => setSearch(event.target.value)} /></label><label><select aria-label="Filter PR state" value={filter} onChange={event => setFilter(event.target.value as typeof filter)}>{filters.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label><span>{checked ? `${checked} of ${trackedRepos.length} checked` : 'Inventory only / not checked'}</span></div>
    {message && <div className="tracked-message" role="status"><CircleAlert size={14} />{message}</div>}
    <div className="table-wrap tracked-table"><table><thead><tr><th><button className="sort-button" onClick={() => changeSort('name')}>REPOSITORY {sort === 'name' ? ascending ? '↑' : '↓' : '↕'}</button></th><th><button className="sort-button" onClick={() => changeSort('family')}>ROLE {sort === 'family' ? ascending ? '↑' : '↓' : '↕'}</button></th><th>LATEST PUBLIC PR</th><th><button className="sort-button" onClick={() => changeSort('state')}>STATE {sort === 'state' ? ascending ? '↑' : '↓' : '↕'}</button></th><th>CHECKS / SCORE</th><th><button className="sort-button" onClick={() => changeSort('updated')}>UPDATED {sort === 'updated' ? ascending ? '↑' : '↓' : '↕'}</button></th><th>SOURCE</th></tr></thead><tbody>{rows.length ? rows.map(repo => { const result = results[repo.name]; const state = result?.state || 'Not checked'; return <tr key={repo.name}><td><div className="tracked-name"><GitPullRequest size={17} /><strong>{repo.name}</strong></div></td><td>{repo.family}</td><td className="tracked-pr-cell">{result?.pull ? <a href={result.pull.url} target="_blank" rel="noopener noreferrer">#{result.pull.number} {result.pull.title} <ArrowUpRight size={12} /></a> : <span>{state === 'None' ? 'No public PR found' : state === 'Unavailable' ? result?.error : 'Check to load latest PR'}</span>}</td><td><span className={`tracked-status ${state.toLowerCase().replace(' ', '-')}`}>{state}</span></td><td className="tracked-muted">Not verified</td><td className="tracked-muted">{result?.pull?.updatedAt ? new Date(result.pull.updatedAt).toLocaleDateString() : '—'}</td><td><a className="tracked-source" href={repo.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${repo.name} on GitHub`}><ExternalLink size={15} /></a></td></tr>; }) : <tr><td colSpan={7} className="empty-table">No repositories match this search and state filter.</td></tr>}</tbody></table><div className="table-footer"><span>Showing {rows.length} of {trackedRepos.length} tracked repositories</span><span>Public metadata only; no private access or merge action</span></div></div>
  </section>;
}