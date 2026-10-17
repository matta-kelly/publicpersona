import { Section, WriteUp } from "@/app/projects/WriteUp";

export const metadata = {
  title: "Dazoo · Matthew Kelly",
  description:
    "A tour of my self-hosted infrastructure: cloud anchors, two Talos clusters, and the workstation that ties the loop closed.",
};

export default function DazooPage() {
  return (
    <WriteUp
      title="Dazoo"
      lede="A tour of the self-hosted platform that runs my photos, my media, some work pipelines, and (increasingly) the laptop I'm typing this on."
    >
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
          the mesh coordinator, the secrets vault, and the front door (DNS, TLS, tunnels).
          Everything else in the system depends on them, so they get to be simple and unglamorous:
          Fedora CoreOS, containers as systemd units, no orchestrator.
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
    </WriteUp>
  );
}

function Topology() {
  return (
    <figure aria-label="Dazoo topology" className="border-hairline rounded-md border p-6">
      <div className="flex flex-col items-center gap-4">
        <DiagramBox label="dazoo repo" sublabel="GitHub" emphasis />
        <div aria-hidden className="bg-connector h-6 w-px" />
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <Pillar
            heading="Always-on layer"
            via="Butane / Ignition"
            items={["mesh, front door", "secrets, observability", "offsite backup"]}
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
      <span className="text-muted font-mono text-xs tracking-wide uppercase">via {via}</span>
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
  const steps = ["git push", "GitHub", "Flux", "Talos cluster", "running pod"];
  return (
    <figure aria-label="GitOps flow" className="border-hairline mt-2 rounded-md border p-5">
      <ol className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span className="border-edge rounded-md border px-3 py-1.5 font-mono text-xs">
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
        I don&apos;t touch prod. Push to GitHub, Flux pulls, the cluster converges.
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
        (emphasis ? "border-edge-strong bg-emphasis" : "border-edge")
      }
    >
      <div className="text-sm font-medium">{label}</div>
      {sublabel && <div className="text-muted font-mono text-xs">{sublabel}</div>}
    </div>
  );
}
