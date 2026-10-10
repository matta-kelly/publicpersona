import Link from "next/link";

export const metadata = {
  title: "Dazoo · Matthew Kelly",
  description:
    "A tour of my self-hosted infrastructure: cloud anchors, two Talos clusters, and the workstation that ties the loop closed.",
};

export default function DazooPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <Link href="/projects" className="text-muted hover:text-foreground text-sm">
          &larr; Projects
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Dazoo</h1>
        <p className="text-muted leading-relaxed">
          A tour of the self-hosted platform that runs my photos, my media, some work pipelines, and
          (increasingly) the laptop I&apos;m typing this on.
        </p>
      </header>

      <Topology />

      <Section title="Why I built this">
        <p>
          The pitch is boring on purpose: declarative everything, one repo, rebuildable from git at
          every layer. If a machine catches fire I want to be able to point at a commit hash and
          walk away. The reward for boring is that the interesting stuff (the apps, the data, the
          photos) gets to stay interesting.
        </p>
        <p>
          The repo is called <span className="font-mono text-sm">dazoo</span>. It declares three
          things: a handful of cloud VPSes, two Kubernetes clusters, and a workstation. Three
          deployment mechanisms, one source of truth.
        </p>
      </Section>

      <Section title="The always-on layer">
        <p>
          A small set of cloud nodes that have to stay up no matter what else is happening. They run
          the mesh coordinator, self-hosted git, the secrets vault, and the front door (DNS, TLS,
          tunnels). Everything else in the system depends on them, so they get to be simple and
          unglamorous: Fedora CoreOS, containers as systemd units, no orchestrator.
        </p>
        <p>
          Choosing CoreOS here was deliberate. These nodes don&apos;t need a scheduler, they need to
          come back up the same way they went down. Auto-updating, immutable, configured from a
          single Butane file in the repo.
        </p>
      </Section>

      <Section title="The work cluster">
        <p>
          Real Kubernetes for the things that actually want it: data ingestion, app workloads with
          their own deploy cadence, anything that benefits from auto-healing and zero-downtime
          rollouts. Talos for the OS (no SSH, no shell, configured from yaml) and Flux for the
          GitOps loop.
        </p>
        <p>
          The shape of a deploy is the satisfying part. I push code, the app&apos;s own CI builds an
          image and bumps a tag in its <span className="font-mono text-sm">deploy/</span> directory,
          Flux notices, and the cluster converges. I don&apos;t touch prod. If I find myself running{" "}
          <span className="font-mono text-sm">kubectl apply</span> something has gone wrong upstream
          and that&apos;s the bug to fix.
        </p>
        <GitOpsFlow />
      </Section>

      <Section title="The personal cluster">
        <p>
          Same pattern, different priorities. The work cluster optimizes for &ldquo;quietly
          correct.&rdquo; This one optimizes for &ldquo;mine.&rdquo; It runs Immich for photos, the
          usual media stack (Jellyfin, the *arrs, qBittorrent behind a VPN gateway), and a homepage
          that pulls everything together.
        </p>
        <p>
          It&apos;s storage-heavy and latency-tolerant in ways the work cluster isn&apos;t, which
          lets it be a good place to try things. Most of what eventually graduates to the work
          cluster gets its first real test here.
        </p>
      </Section>

      <Section title="Monkey works">
        <p>
          The workstation is where the same idea lands at the desk. Fedora Sway Atomic for the base,
          a custom OCI image layered on top for the packages I always want, and chezmoi pulling
          dotfiles from the same git system everything else lives in. The long-term goal is the
          obvious one: laptop, servers, and clusters all the same kind of thing, all rebuildable
          from the same repo on the same afternoon.
        </p>
        <p>
          That last bit is the whole point. The boring infra is the interesting infra. Everything
          else is just what runs on top of it.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="text-muted space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}

function Topology() {
  return (
    <figure
      aria-label="Dazoo topology"
      className="rounded-md border border-black/5 p-6 dark:border-white/10"
    >
      <div className="flex flex-col items-center gap-4">
        <DiagramBox label="dazoo repo" sublabel="Forgejo" emphasis />
        <div aria-hidden className="h-6 w-px bg-black/20 dark:bg-white/20" />
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <Pillar
            heading="Always-on layer"
            via="Butane / Ignition"
            items={["mesh, git, front door", "secrets, observability", "offsite backup"]}
          />
          <Pillar
            heading="Talos clusters"
            via="Flux GitOps"
            items={["work: airbyte, lotus-lake", "home: immich, media, homepage"]}
          />
          <Pillar heading="Workstation" via="OCI image, chezmoi" items={["Fedora Sway Atomic"]} />
        </div>
      </div>
      <figcaption className="text-muted mt-5 text-center text-xs">
        Every layer rebuildable from the same repo. All nodes joined on a Headscale mesh.
      </figcaption>
    </figure>
  );
}

function Pillar({ heading, via, items }: { heading: string; via: string; items: string[] }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-muted font-mono text-[11px] tracking-wide uppercase">via {via}</span>
      <DiagramBox label={heading} />
      <ul className="text-muted mt-1 space-y-1 text-center text-xs">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function GitOpsFlow() {
  const steps = ["git push", "Forgejo", "Flux", "Talos cluster", "running pod"];
  return (
    <figure
      aria-label="GitOps flow"
      className="mt-2 rounded-md border border-black/5 p-5 dark:border-white/10"
    >
      <ol className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span className="rounded-md border border-black/10 px-3 py-1.5 font-mono text-xs dark:border-white/15">
              {step}
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden className="text-muted">
                {i === 1 ? "⇢" : "→"}
              </span>
            )}
          </li>
        ))}
      </ol>
      <figcaption className="text-muted mt-4 text-center text-xs">
        I don&apos;t touch prod. Push to Forgejo, Flux pulls, the cluster converges.
      </figcaption>
    </figure>
  );
}

function DiagramBox({
  label,
  sublabel,
  emphasis,
}: {
  label: string;
  sublabel?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        "rounded-md border px-4 py-2 text-center " +
        (emphasis
          ? "border-black/20 bg-black/[0.03] dark:border-white/30 dark:bg-white/[0.04]"
          : "border-black/10 dark:border-white/15")
      }
    >
      <div className="text-sm font-medium">{label}</div>
      {sublabel && <div className="text-muted font-mono text-[11px]">{sublabel}</div>}
    </div>
  );
}
