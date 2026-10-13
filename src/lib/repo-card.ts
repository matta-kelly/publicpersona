import type { RepoSummary } from "./activity";

/** One language of a repo, as its card shows it. */
export interface RepoCardLanguage {
  name: string;
  /** The name and the share, as text. */
  label: string;
  /** A CSS colour. */
  color: string;
  /** A CSS width: the language's piece of the bar. */
  width: string;
}

/** The texts of a repo's card that are made from its numbers and its date. */
export interface RepoCardView {
  commits: string;
  created: string;
  languages: RepoCardLanguage[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  YAML: "#cb171e",
  Shell: "#89e051",
  SQL: "#e38c00",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Dockerfile: "#384d54",
  Butane: "#cccccc",
  Markdown: "#083fa1",
};

const OTHER_LANGUAGE_COLOR = "#9ca3af";

// The locale and the time zone are named, so the card reads the same wherever the server runs.
const WHOLE_NUMBER = new Intl.NumberFormat("en-US");
const DAY = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function repoCardView(repo: RepoSummary): RepoCardView {
  const commits = repo.commitsLast12mo;
  return {
    commits: `${WHOLE_NUMBER.format(commits)} ${commits === 1 ? "commit" : "commits"}`,
    created: `Created ${DAY.format(new Date(repo.createdAt))}`,
    languages: repo.languages.map((language) => ({
      name: language.name,
      label: `${language.name} ${(language.pct * 100).toFixed(1)}%`,
      color: LANGUAGE_COLORS[language.name] ?? OTHER_LANGUAGE_COLOR,
      width: `${(language.pct * 100).toFixed(2)}%`,
    })),
  };
}
