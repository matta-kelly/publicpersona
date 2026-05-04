import Link from "next/link";
import Heatmap from "@/components/Heatmap";
import RepoCard from "@/components/RepoCard";
import { getActivity } from "@/lib/forgejo";

export const dynamic = "force-dynamic";

export default async function CodePage() {
  let activity;
  try {
    activity = await getActivity();
  } catch (err) {
    console.error("forgejo activity fetch failed", err);
    return (
      <article>
        <h1 className="text-3xl font-semibold tracking-tight">Code</h1>
        <p className="mt-4 text-muted">Activity unavailable right now. Try again later.</p>
      </article>
    );
  }

  return (
    <article>
      <header className="space-y-3 text-muted leading-relaxed">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Code</h1>
        <p>
          None of this is on GitHub. My code lives on my own Forgejo instance,
          hosted on{" "}
          <Link href="/projects/dazoo" className="italic underline hover:text-foreground">
            dazoo
          </Link>
          : a small self-managed platform spread across a few nodes in San
          Diego, Germany, and an offsite backup at my dad&apos;s house.
          Mesh-networked with Headscale, reconciled by GitOps.
        </p>
        <p>
          The repos themselves stay private. What&apos;s on this page is just
          the activity signal: pushes, repo metadata, languages.
        </p>
      </header>

      <section className="mt-8">
        <Heatmap days={activity.heatmap} total={activity.totalContributionsLast12mo} />
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Repos</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {activity.repos.map((r) => (
            <RepoCard key={r.name} repo={r} />
          ))}
        </ul>
      </section>
    </article>
  );
}
