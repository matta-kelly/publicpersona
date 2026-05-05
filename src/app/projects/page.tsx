import Link from "next/link";

const PROJECTS = [
  {
    slug: "stateball",
    name: "Stateball",
    description: "Live MLB win-probability engine.",
  },
  {
    slug: "dazoo",
    name: "Dazoo",
    description: "Self-hosted infrastructure platform.",
  },
  {
    slug: "sabermetric-networks",
    name: "Sabermetric Networks",
    description:
      "MLB pitcher-batter matchups as a bipartite network, ranked by competition.",
  },
];

export default function ProjectsPage() {
  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {PROJECTS.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/projects/${p.slug}`}
              className="block rounded-md border border-black/5 p-5 transition-colors hover:border-black/20 dark:border-white/10 dark:hover:border-white/30"
            >
              <h2 className="text-lg font-semibold tracking-tight">{p.name}</h2>
              <p className="mt-2 text-sm text-muted">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
