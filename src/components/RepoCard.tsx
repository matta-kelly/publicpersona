import type { RepoSummary } from "@/lib/forgejo";

const LANG_COLORS: Record<string, string> = {
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

function langColor(name: string): string {
  return LANG_COLORS[name] ?? "#9ca3af";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function RepoCard({ repo }: { repo: RepoSummary }) {
  return (
    <li className="rounded-md border border-black/5 p-5 dark:border-white/10">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {repo.name}
          </a>
        </h3>
        <span className="text-muted text-sm whitespace-nowrap">
          {repo.commitsLast12mo.toLocaleString()} commits
        </span>
      </div>

      {repo.description && <p className="text-muted mt-2 text-sm">{repo.description}</p>}

      <p className="text-muted mt-3 text-xs">Created {formatDate(repo.createdAt)}</p>

      {repo.languages.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            {repo.languages.map((l) => (
              <div
                key={l.name}
                style={{
                  width: `${(l.pct * 100).toFixed(2)}%`,
                  backgroundColor: langColor(l.name),
                }}
                title={`${l.name} ${(l.pct * 100).toFixed(1)}%`}
              />
            ))}
          </div>
          <ul className="text-muted flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {repo.languages.map((l) => (
              <li key={l.name} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: langColor(l.name) }}
                />
                <span>
                  {l.name} {(l.pct * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
