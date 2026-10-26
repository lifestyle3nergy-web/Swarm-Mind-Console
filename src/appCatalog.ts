export type AppGroup = 'Workspace' | 'Developer' | 'Device' | 'Research';
export type AppEntry = {
  id: string;
  name: string;
  mark: string;
  color: string;
  group: AppGroup;
  role: string;
  boundary: string;
  website?: string;
  repo?: string;
};

// A curated launcher map, not an inventory of installed Android applications.
export const appCatalog: AppEntry[] = [
  { id: 'files', name: 'My Files', mark: 'F', color: 'amber', group: 'Device', role: 'User-selected local documents and project exports.', boundary: 'Android Storage Access Framework; explicit file picker only.' },
  { id: 'keep', name: 'Keep Notes', mark: 'K', color: 'yellow', group: 'Workspace', role: 'Capture brief requests and handoff notes.', boundary: 'No automatic note access from this browser.', website: 'https://keep.google.com/' },
  { id: 'drive', name: 'Drive', mark: 'D', color: 'green', group: 'Workspace', role: 'Reviewed artifact and document handoff.', boundary: 'Scoped OAuth through a future server adapter.', website: 'https://drive.google.com/' },
  { id: 'gmail', name: 'Gmail', mark: 'M', color: 'red', group: 'Workspace', role: 'Notifications and approval communication.', boundary: 'No inbox reading or sending without explicit OAuth consent.', website: 'https://mail.google.com/' },
  { id: 'whatsapp', name: 'WhatsApp', mark: 'W', color: 'green', group: 'Workspace', role: 'Human conversation and task coordination.', boundary: 'No device message access; use official business APIs if authorized.', website: 'https://web.whatsapp.com/' },
  { id: 'notes', name: 'Notes', mark: 'N', color: 'red', group: 'Workspace', role: 'Local working context and decision memos.', boundary: 'App-private notes are not readable by a web page.' },
  { id: 'calendar', name: 'Calendar', mark: '24', color: 'teal', group: 'Workspace', role: 'Review windows and maintenance schedules.', boundary: 'Scoped calendar provider adapter; no background reads by default.', website: 'https://calendar.google.com/' },
  { id: 'gitlab', name: 'GitLab', mark: 'GL', color: 'orange', group: 'Developer', role: 'Merge requests, CI status, and code review.', boundary: 'Server-side token, least-privilege read scope, human merge gate.', website: 'https://gitlab.com/' },
  { id: 'github', name: 'GitHub', mark: 'GH', color: 'slate', group: 'Developer', role: 'Repositories, pull requests, actions, and evidence.', boundary: 'Public metadata can be read; private access needs a scoped backend.', website: 'https://github.com/lifestyle3nergy-web', repo: 'engineering-intelligence' },
  { id: 'termux', name: 'Termux', mark: '>_', color: 'slate', group: 'Developer', role: 'On-device shell and local development.', boundary: 'Never execute shell commands from a dashboard tile.', website: 'https://termux.dev/' },
  { id: 'vercel', name: 'Vercel', mark: 'V', color: 'slate', group: 'Developer', role: 'Static preview and deployment status.', boundary: 'Deployment automation requires a protected server integration.', website: 'https://vercel.com/' },
  { id: 'browser', name: 'Browser', mark: 'WEB', color: 'indigo', group: 'Research', role: 'Open sources and review web-based workspaces.', boundary: 'Browser tab history is not accessible to this dashboard.' },
  { id: 'chrome', name: 'Chrome', mark: 'C', color: 'blue', group: 'Research', role: 'Web inspection and standards-based apps.', boundary: 'No cross-app tabs, bookmarks, or browsing history access.', website: 'https://www.google.com/chrome/' },
  { id: 'edge', name: 'Edge', mark: 'E', color: 'teal', group: 'Research', role: 'Browser-based research and developer tooling.', boundary: 'Browser profile data remains outside this origin.', website: 'https://www.microsoft.com/edge' },
  { id: 'duckduckgo', name: 'DuckDuckGo', mark: 'DD', color: 'orange', group: 'Research', role: 'Privacy-oriented source discovery.', boundary: 'Search queries are user-initiated; no silent scraping.', website: 'https://duckduckgo.com/' },
  { id: 'bing', name: 'Bing', mark: 'B', color: 'blue', group: 'Research', role: 'Research and public source discovery.', boundary: 'Search APIs require their own terms and credentials.', website: 'https://www.bing.com/' },
  { id: 'camera', name: 'Camera', mark: 'CAM', color: 'slate', group: 'Device', role: 'Capture evidence with the user present.', boundary: 'Permissioned browser or native camera access; no silent capture.' },
  { id: 'gallery', name: 'Gallery', mark: 'GAL', color: 'purple', group: 'Device', role: 'User-selected images for datasets and reviews.', boundary: 'File picker or platform photo picker; no gallery scan.' },
  { id: 'settings', name: 'Settings', mark: 'SET', color: 'slate', group: 'Device', role: 'User-managed device configuration.', boundary: 'A web app cannot change system settings or read private app state.' },
  { id: 'airdroid', name: 'AirDroid', mark: 'AD', color: 'blue', group: 'Device', role: 'Optional device file handoff.', boundary: 'Requires a separate user-authorized service session.', website: 'https://www.airdroid.com/' },
  { id: 'networx', name: 'NetworX', mark: 'NX', color: 'cyan', group: 'Device', role: 'Connectivity observation and adapter boundaries.', boundary: 'Only browser hints are live; radio and VPN need a native bridge.', repo: 'engineering-intelligence' },
  { id: 'samsung', name: 'Samsung', mark: 'S', color: 'blue', group: 'Device', role: 'DeX device workspace and local files.', boundary: 'No Samsung device API is connected in this prototype.' },
  { id: 'google', name: 'Google', mark: 'G', color: 'blue', group: 'Workspace', role: 'Docs, Drive, Calendar, and account services.', boundary: 'Each provider needs its own explicitly scoped adapter.', website: 'https://www.google.com/' },
  { id: 'microsoft', name: 'Microsoft', mark: 'MS', color: 'blue', group: 'Workspace', role: 'Developer, document, and cloud ecosystem.', boundary: 'Use delegated OAuth with minimum permissions.', website: 'https://www.microsoft.com/' },
  { id: 'ai', name: 'AI tools', mark: 'AI', color: 'purple', group: 'Research', role: 'Reviewable model-assisted analysis.', boundary: 'No prompt, private context, or credential is sent automatically.' },
  { id: 'rootly-mcp', name: 'Rootly MCP', mark: 'RM', color: 'purple', group: 'Developer', role: 'Incident and service context through a constrained MCP gateway.', boundary: 'Read-only server-side tool allowlist; tokens never enter the browser.', website: 'https://github.com/lifestyle3nergy-web/rootly-mcp-server', repo: 'rootly-mcp-server' },
  { id: 'gods-eye-view', name: "God's Eye View", mark: 'GE', color: 'cyan', group: 'Research', role: 'Public spatial context with attributed, timestamped data layers.', boundary: 'Respect provider licenses, rate limits, and non-safety-critical use.', website: 'https://github.com/lifestyle3nergy-web/gods-eye-view', repo: 'gods-eye-view' },
];

export const appGroups: Array<'All apps' | AppGroup> = ['All apps', 'Workspace', 'Developer', 'Device', 'Research'];