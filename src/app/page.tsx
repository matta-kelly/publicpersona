import Image from "next/image";

export default function HomePage() {
  return (
    <section className="flow-root">
      <Image
        src="/profile-picture.jpg"
        alt="Matthew Kelly"
        width={2316}
        height={3088}
        priority
        className="mb-6 h-auto w-56 rounded-md md:float-right md:mb-2 md:ml-6"
      />
      <div className="text-muted space-y-4 leading-relaxed">
        <p>
          In first grade I knew I was going to play baseball for a living and by third grade I knew
          that wouldn&apos;t quite pan out&hellip;turns out I was a bit better with the box score
          anyway. This sparked a lifelong curiosity of the stories numbers tell and an itch for what
          they don&apos;t. These days that curiosity lives at Lotus and Luna, an eCommerce business
          in San Diego, where I run data and operations: the pipelines and dashboards, the systems
          underneath them, the slow work of figuring out what makes the place go.
        </p>
        <p>
          In my spare time I like to explore the world by &ldquo;solving&rdquo; my
          &ldquo;problems&rdquo; with software, resulting in permanent servitude to the problems
          which arise from deploying &amp; orchestrating said software across machines I own and
          ones I rent from a large corporation in the sky, all for myself and a few family members
          who didn&apos;t ask for any of it.
        </p>
        <p>Mostly I like the question more than the answer.</p>
      </div>
    </section>
  );
}
