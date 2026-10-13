import type { ActivitySource, ContributionEntry, RepoSource } from "./activity";

const FORGEJO_BASE = "https://forgejo.monk3y.xyz/api/v1";
const USER = "mkultra";
const REVALIDATE_SECONDS = 600;

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

async function fetchContributions(): Promise<ContributionEntry[]> {
  const raw = await api<ForgejoHeatmapEntry[]>(`/users/${USER}/heatmap`);
  return raw.map((d) => ({ timestamp: d.timestamp, count: d.contributions }));
}

async function fetchCommitCountSince(repo: string, sinceISO: string): Promise<number> {
  const headers = await apiHead(
    `/repos/${USER}/${repo}/commits?since=${encodeURIComponent(sinceISO)}&limit=1`,
  );
  const total = headers.get("x-total-count");
  return total ? parseInt(total, 10) : 0;
}

async function fetchRepos(): Promise<RepoSource[]> {
  const repos = await api<ForgejoRepo[]>(`/users/${USER}/repos?limit=50`);
  const since = new Date(Date.now() - 365 * 86400 * 1000).toISOString();
  return Promise.all(
    repos.map(async (r) => {
      const [languageBytes, commitsLast12mo] = await Promise.all([
        api<Record<string, number>>(`/repos/${USER}/${r.name}/languages`),
        fetchCommitCountSince(r.name, since),
      ]);
      return {
        name: r.name,
        description: r.description ?? "",
        htmlUrl: r.html_url,
        createdAt: r.created_at,
        languageBytes,
        commitsLast12mo,
      };
    }),
  );
}

export async function fetchActivity(): Promise<ActivitySource> {
  const [contributions, repos] = await Promise.all([fetchContributions(), fetchRepos()]);
  return { contributions, repos };
}
