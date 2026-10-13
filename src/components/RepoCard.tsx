import type { RepoSummary } from "@/lib/activity";
import { repoCardView } from "@/lib/repo-card";

export default function RepoCard({ repo }: { repo: RepoSummary }) {
  const view = repoCardView(repo);

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
        <span className="text-muted text-sm whitespace-nowrap">{view.commits}</span>
      </div>

      {repo.description && <p className="text-muted mt-2 text-sm">{repo.description}</p>}

      <p className="text-muted mt-3 text-xs">{view.created}</p>

      {view.languages.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            {view.languages.map((l) => (
              <div
                key={l.name}
                style={{ width: l.width, backgroundColor: l.color }}
                title={l.label}
              />
            ))}
          </div>
          <ul className="text-muted flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {view.languages.map((l) => (
              <li key={l.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                <span>{l.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
