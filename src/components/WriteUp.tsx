import Image from "next/image";
import Link from "next/link";

/** The frame of a project write-up: the way back, the title, the link to the repo, the first lines. */
export function WriteUp({
  title,
  repo,
  lede,
  children,
}: {
  title: string;
  /** The address of the repo with no scheme, as the page shows it. */
  repo?: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="space-y-10">
      <header className="flex flex-col gap-4">
        {/* The box is 44 tall and the line in it 20: the margin takes the 12 above and below back. */}
        <Link href="/projects" className="tap text-muted hover:text-foreground -my-3 text-sm">
          &larr; Projects
        </Link>
        <h1>{title}</h1>
        {repo && (
          <p className="text-sm">
            <a href={`https://${repo}`} target="_blank" rel="noreferrer" className="link">
              {repo}
            </a>
          </p>
        )}
        {lede && <p className="text-muted leading-relaxed">{lede}</p>}
      </header>
      {children}
    </article>
  );
}

/** A run of paragraphs and figures, under a heading when it has one. */
export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
      <div className="text-muted space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}

/** A picture as wide as the column, with a line under it. The line is `alt` when no caption is given. */
export function Figure({
  src,
  alt,
  width,
  height,
  caption = alt,
  onWhite = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  /** For a picture with a clear background that was drawn for a white page. */
  onWhite?: boolean;
}) {
  return (
    <figure className="space-y-2">
      <div
        className={
          "overflow-hidden rounded-md border border-black/5 dark:border-white/10" +
          (onWhite ? " bg-white" : "")
        }
      >
        <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full" />
      </div>
      <figcaption className="text-muted text-center text-xs">{caption}</figcaption>
    </figure>
  );
}
