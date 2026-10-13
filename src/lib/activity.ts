/** One count from the host, at one moment. */
export interface ContributionEntry {
  /** Seconds since 1970-01-01T00:00:00Z. */
  timestamp: number;
  count: number;
}

/** One repo, as the host gives it. */
export interface RepoSource {
  name: string;
  description: string;
  htmlUrl: string;
  createdAt: string;
  /** Bytes of code for each language name. */
  languageBytes: Record<string, number>;
  commitsLast12mo: number;
}

/** What a git host gives, before any rule. */
export interface ActivitySource {
  contributions: ContributionEntry[];
  repos: RepoSource[];
}

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

// toISOString is always UTC, so the day does not depend on where the code runs.
function utcDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function heatmapDays(contributions: ContributionEntry[]): HeatmapDay[] {
  return contributions.map((entry) => ({ date: utcDate(entry.timestamp), count: entry.count }));
}

function repoLanguages(languageBytes: Record<string, number>): RepoLanguage[] {
  const total = Object.values(languageBytes).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(languageBytes)
    .map(([name, bytes]) => ({ name, bytes, pct: bytes / total }))
    .sort((a, b) => b.bytes - a.bytes);
}

function repoSummary(repo: RepoSource): RepoSummary {
  return {
    name: repo.name,
    description: repo.description,
    htmlUrl: repo.htmlUrl,
    createdAt: repo.createdAt,
    languages: repoLanguages(repo.languageBytes),
    commitsLast12mo: repo.commitsLast12mo,
  };
}

export function activitySummary(source: ActivitySource): ActivitySummary {
  return {
    totalContributionsLast12mo: source.contributions.reduce((sum, entry) => sum + entry.count, 0),
    heatmap: heatmapDays(source.contributions),
    repos: source.repos.map(repoSummary).sort((a, b) => b.commitsLast12mo - a.commitsLast12mo),
  };
}
