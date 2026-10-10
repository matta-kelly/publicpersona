const FORGEJO_BASE = "https://forgejo.monk3y.xyz/api/v1";
const USER = "mkultra";
const REVALIDATE_SECONDS = 600;

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface RepoLanguage {
  name: string;
  bytes: number;
  pct: number;
}

export interface RepoSummary {
  name: string;
  description: string;
  htmlUrl: string;
  createdAt: string;
  languages: RepoLanguage[];
  commitsLast12mo: number;
}

export interface ActivitySummary {
  totalContributionsLast12mo: number;
  heatmap: HeatmapDay[];
  repos: RepoSummary[];
}

function getToken(): string {
  const t = process.env.FORGEJO_API_TOKEN;
  if (!t) throw new Error("FORGEJO_API_TOKEN is not set");
  return t;
}

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${FORGEJO_BASE}${path}`, {
    headers: {
      Authorization: `token ${getToken()}`,
      Accept: "application/json",
    },
    next: { revalidate: REVALIDATE_SECONDS, tags: ["forgejo"] },
  });
  if (!res.ok) throw new Error(`Forgejo ${path}: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function apiHead(path: string): Promise<Headers> {
  const res = await fetch(`${FORGEJO_BASE}${path}`, {
    headers: {
      Authorization: `token ${getToken()}`,
      Accept: "application/json",
    },
    next: { revalidate: REVALIDATE_SECONDS, tags: ["forgejo"] },
  });
  if (!res.ok) throw new Error(`Forgejo ${path}: ${res.status} ${res.statusText}`);
  return res.headers;
}

interface ForgejoHeatmapEntry {
  timestamp: number;
  contributions: number;
}

interface ForgejoRepo {
  name: string;
  description: string | null;
  html_url: string;
  created_at: string;
}

async function fetchHeatmap(): Promise<HeatmapDay[]> {
  const raw = await api<ForgejoHeatmapEntry[]>(`/users/${USER}/heatmap`);
  return raw.map((d) => ({
    date: new Date(d.timestamp * 1000).toISOString().slice(0, 10),
    count: d.contributions,
  }));
}

async function fetchRepoLanguages(repo: string): Promise<RepoLanguage[]> {
  const obj = await api<Record<string, number>>(`/repos/${USER}/${repo}/languages`);
  const total = Object.values(obj).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(obj)
    .map(([name, bytes]) => ({ name, bytes, pct: bytes / total }))
    .sort((a, b) => b.bytes - a.bytes);
}

async function fetchCommitCountSince(repo: string, sinceISO: string): Promise<number> {
  const headers = await apiHead(
    `/repos/${USER}/${repo}/commits?since=${encodeURIComponent(sinceISO)}&limit=1`,
  );
  const total = headers.get("x-total-count");
  return total ? parseInt(total, 10) : 0;
}

async function fetchRepos(): Promise<RepoSummary[]> {
  const repos = await api<ForgejoRepo[]>(`/users/${USER}/repos?limit=50`);
  const since = new Date(Date.now() - 365 * 86400 * 1000).toISOString();
  const enhanced = await Promise.all(
    repos.map(async (r) => {
      const [languages, commitsLast12mo] = await Promise.all([
        fetchRepoLanguages(r.name),
        fetchCommitCountSince(r.name, since),
      ]);
      return {
        name: r.name,
        description: r.description ?? "",
        htmlUrl: r.html_url,
        createdAt: r.created_at,
        languages,
        commitsLast12mo,
      };
    }),
  );
  return enhanced.sort((a, b) => b.commitsLast12mo - a.commitsLast12mo);
}

export async function getActivity(): Promise<ActivitySummary> {
  const [heatmap, repos] = await Promise.all([fetchHeatmap(), fetchRepos()]);
  const totalContributionsLast12mo = heatmap.reduce((sum, d) => sum + d.count, 0);
  return { totalContributionsLast12mo, heatmap, repos };
}

export const broken: any = 1;
