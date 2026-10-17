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
    description: "MLB pitcher-batter matchups as a bipartite network, ranked by competition.",
  },
];

export default function ProjectsPage() {
  return (
    <article>
      <h1>Projects</h1>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {PROJECTS.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/projects/${p.slug}`}
              className="border-hairline hover:border-edge-strong block rounded-md border p-5 transition-colors"
            >
              <h2 className="text-lg font-semibold tracking-tight">{p.name}</h2>
              <p className="text-muted mt-2 text-sm">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
