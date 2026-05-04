import Link from "next/link";

export default function StateballPage() {
  return (
    <article>
      <Link
        href="/projects"
        className="text-sm text-muted hover:text-foreground"
      >
        &larr; Projects
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Stateball</h1>
      <p className="mt-4 text-muted">Live MLB win-probability engine. Writeup coming.</p>
    </article>
  );
}
