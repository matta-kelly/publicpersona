import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Stateball · Matthew Kelly",
  description:
    "A matchup-aware Monte Carlo on top of win expectancy: 24-state Markov chain, pitch-grain warehouse, calibrated estimator, and where the sim beats the table.",
};

export default function StateballPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <Link
          href="/projects"
          className="text-sm text-muted hover:text-foreground"
        >
          &larr; Projects
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Stateball: a matchup-aware Monte Carlo on top of win expectancy
        </h1>
        <p className="text-sm">
          <a
            href="https://github.com/matta-kelly/stateball"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            github.com/matta-kelly/stateball
          </a>
        </p>
        <p className="text-muted leading-relaxed">
          A live MLB win-probability engine. The build, end to end: the
          warehouse, the model, the simulator, the calibration, and what it
          actually does on real games.
        </p>
      </header>

      <Section title="1. The baseline: what raw win expectancy gives you">
        <p>
          Baseball is a discrete game wrapped around a chaotic core. One
          batter, one pitcher, a finite state board, a century of recorded
          transitions, ten years of every pitch tracked. Win expectancy
          tables are the natural distillation: collapse the game to (inning,
          outs, bases, run diff), look up the historical home-win rate, and
          you get the number sitting on every live game card in my schedule
          view.
        </p>
        <Figure
          src="/posts/stateball/schedule-cards.png"
          alt="Three live game cards with the WE Table win probability under each home team"
          width={1011}
          height={447}
        />
        <p>
          The table doesn&apos;t see the matchup. Every batter-pitcher pair
          in a given state averages into one number. What follows is the
          build that tries to put them back: a pitch-grain warehouse, a
          plate-appearance model, a sim that stitches them into games, and
          what came out the other end.
        </p>
      </Section>

      <Section title="2. A baseball game as a Markov chain">
        <p>
          A half-inning has 24 states: 8 baserunner configurations across 3
          out counts. Every plate appearance is a transition between two of
          those states, or the third out that ends the half and resets the
          board. An inning is a tree of transitions for each side; a game
          is nine of those, with the score and the pitcher state riding
          alongside.
        </p>
        <Figure
          src="/posts/stateball/state_diagram.png"
          alt="24-state base/out grid with sample transitions from one out, runner on first"
          width={2226}
          height={1087}
        />
        <p>
          That&apos;s the inner loop. What sits on top is everything that
          makes one PA different from another: which batter, which pitcher,
          how the pitcher has been working tonight, which platoon split
          applies, who is on the bench. The discrete state board is the
          easy part. The transition probabilities are the hard part.
          They&apos;re not constants, they&apos;re a function of the
          matchup at that PA.
        </p>
        <p>
          None of the framing here is new. George Lindsey (1963,{" "}
          <em>Operations Research</em>) first formalized the 24-state board
          and computed run expectancies from major-league play-by-play.
          Bukiet, Harold, and Palacios (1997) extended it into an explicit
          Markov-chain treatment for run distributions and game outcomes.
          Tango, Lichtman, and Dolphin&apos;s <em>The Book</em> (2007)
          standardized the run-expectancy and win-expectancy tables that
          the public-facing WE numbers descend from.
        </p>
        <p>
          WE tables answer &ldquo;what fraction of games has the home team
          won from this state, historically?&rdquo; The sim answers
          &ldquo;given who is about to come up against who is currently
          throwing, what does the rest of this game look like?&rdquo; Same
          board, different transition function.
        </p>
        <p>
          A couple of pieces ride along that I&apos;m not going to dwell
          on: a baserunning sub-model (when does a runner go first-to-third
          on a single, when does the catcher&apos;s throw retire him), and
          a pitcher-exit model that handles the bullpen. Both feed into the
          same PA-level transitions.
        </p>
      </Section>

      <Section title="3. Data foundation: pitch-grain warehouse">
        <p>
          Pitch-level data is the unit. Not plate appearance. Not at-bat.
          Pitch. Every Statcast pitch since 2015 has its release point,
          velocity, spin, location, and what happened. That granularity
          matters because the matchup conditioning the sim wants is built
          from how batters and pitchers actually behave at the pitch level:
          chase rates, whiff rates by zone, exit velocity on contact.
        </p>
        <p>
          Even before you condition on the matchup, the count is doing most
          of the work. Baseball Bits&apos;{" "}
          <a
            href="https://youtu.be/5Y84765tWGo"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted underline-offset-4 hover:decoration-foreground"
          >
            The Only Thing That Matters in Baseball
          </a>{" "}
          puts a number on it: the worst hitters in baseball at 3-1
          outperform the best hitters down 0-2. Same hitter, two different
          planets, depending on the count alone. The count state only
          exists if you&apos;re tracking every pitch.
        </p>
        <p>
          The warehouse is DuckDB + DuckLake (Postgres metadata, S3
          storage), dbt for transforms, Dagster for orchestration. The dbt
          project takes raw event data and walks it through intermediate
          models that resolve player references, build pitcher arsenals,
          compute batter platoon profiles, and finally assemble the feature
          vectors the model trains on.
        </p>
        <Figure
          src="/posts/stateball/mlb-dagster-flow.png"
          alt="Dagster asset graph: raw events flowing through dbt intermediates into feature vectors and training assets"
          width={1335}
          height={797}
        />
        <p>
          The asset graph has one job: turn ten years of pitch records into
          ~150 static features per batter-pitcher matchup, plus ~22 dynamic
          features per PA (count, score, base-out state, pitcher pitch
          count). The static features split by handedness (L/R batter
          against L/R pitcher, switch hitters resolved to the
          pitcher&apos;s opposite hand) and by horizon (season-to-date and
          career-to-date), all maintained at daily grain so that for any
          game on any date the features reflect only data through that
          day. No leakage from later games into earlier ones. Static
          features are pre-computed and cached; dynamic features fill in
          at sim time.
        </p>
        <p>
          The same warehouse exposes the data as a queryable product:
          every player&apos;s season splits behind a stats view that
          mirrors what FanGraphs or Baseball Reference would show, except
          it&apos;s built from the same lake the model trains on.
        </p>
        <Figure
          src="/posts/stateball/batter-stats-cards.png"
          alt="Player stats table with batter splits, served from the warehouse"
          width={1860}
          height={575}
        />
        <p>
          Two things follow from this. One, the sim and the dashboard read
          from the same source of truth, so a stats discrepancy is a data
          bug, not a model-versus-display mismatch. Two, the same DuckDB
          engine that runs my analytic queries also runs the model&apos;s
          feature lookups at inference time, with DuckLake managing
          transactions across both.
        </p>
      </Section>

      <Section title="4. The pitch-to-PA model: 22 classes, calibrated">
        <p>
          The model is a 22-class classifier over plate appearance
          outcomes: single, double, triple, home run, walk, hit-by-pitch,
          strikeout, ground-out, fly-out, and the rarer ones (sac fly,
          fielder&apos;s choice, GIDP, sac bunt, catcher interference).
          XGBoost on a vector of ~172 features per PA, with isotonic
          calibration applied on top of the raw probabilities.
        </p>
        <p>
          The training is straightforward. The interesting decision was
          prioritizing calibration over accuracy. A 22-class model that
          picks the correct outcome 50% of the time is fine; one that says
          &ldquo;30% chance of strikeout, 25% single, 15% walk&rdquo; and
          is right about those frequencies in aggregate is far more useful
          downstream. The sim averages over thousands of simulated PAs per
          game; what matters is that the marginal distributions over
          outcomes are correct, not that any single PA&apos;s most-likely
          class lines up with the actual outcome.
        </p>
        <Figure
          src="/posts/stateball/model-selection-cards.png"
          alt="Artifact registry workshop view with model, table, and calibration cards"
          width={1195}
          height={772}
        />
        <p>
          Everything above is a registered artifact. The model, the
          calibration table, the baserunning lookups, the WE table; each
          lives in the workshop view above with its own slot (prod, test,
          candidate, archived) and metrics. Promoting a new XGBoost run to
          prod is a single update, and the sim picks it up on the next
          inference. Eval results stay tied to the slot configuration that
          produced them, so when I look back at &ldquo;the prod accuracy
          in March,&rdquo; I know exactly which model + baserunning table
          + WE table produced it.
        </p>
      </Section>

      <Section title="5. Monte Carlo at scale">
        <p>
          Turning a per-PA outcome model into a game-level win probability
          means projecting forward. Each plate appearance is a probabilistic
          step; the rest of the game is a tree of those steps. Monte Carlo
          just means sampling that tree: draw an outcome for the next PA,
          advance the state, repeat until the game ends. Do that many times
          and the fraction of paths where the home team wins is your win
          probability estimate.
        </p>
        <p>
          Each path is a sample of how the rest of the game might play out.
          More paths, more information, tighter estimate. But each path is
          also expensive: sixty-some sequential model calls per simulated
          game. So the real question is information per compute. How long
          does each path need to be? How many paths do we need? And does
          either of those answers change with the situation?
        </p>

        <h3 className="text-base font-semibold tracking-tight">
          How long does each path need to be?
        </h3>
        <p>
          The matchup edge decays with horizon. Past a few PAs the lineup
          turns over, the bullpen comes in, and whatever advantage the sim
          had over the WE table dissolves into noise. So instead of running
          paths to the end of the game, the estimator samples one
          half-inning forward, reads the WE table at the boundary, and
          treats that as the value of everything past the lookahead. The
          weights on those readings are calibrated per state via Markowitz
          minimum-variance over the WE-error covariance, with horizons
          gated to zero where the sim&apos;s Brier doesn&apos;t beat the
          entry baseline. About half the states find no horizon with an
          edge; for those the estimator returns WE directly without
          sampling.
        </p>

        <h3 className="text-base font-semibold tracking-tight">
          How many paths do we need?
        </h3>
        <p>
          The variance of a Monte Carlo estimator shrinks as σ²/N (law of
          large numbers, 1/√N standard error). The wrinkle is that σ
          depends on the state we&apos;re starting from. A fixed N
          overspends on easy states (where p is near 0 or 1 and the
          variance is small) and underspends on hard ones (close games,
          where p is near 0.5 and σ is largest).
        </p>
        <p>
          Two steps set the per-state count. First, an empirical
          convergence study: run the sim at N = 25, 50, 100, 200, 500 and
          watch the standard deviation of the estimate stop dropping. The
          smallest N at which it levels off is what the state actually
          needs. Second, a target-SE floor: from the standard
          sample-proportion formula sqrt(p(1-p)/N), pick the smallest N
          that gets SE ≤ 0.02 at the state&apos;s win-prob magnitude. The
          per-state path count is the max of the two.
        </p>
        <p>
          High-leverage states get more paths. Decisive states get few.
          Same target precision across the board, compute spent where it
          actually buys it.
        </p>

        <h3 className="text-base font-semibold tracking-tight">
          Can the paths run in parallel?
        </h3>
        <p>
          Yes. All paths for a given state advance one PA together as
          NumPy arrays, and the model fires a single batched ONNX call
          instead of one call per path. XGBoost batched inference ends up
          faster than per-row even when the micro-benchmarks look
          identical.
        </p>

        <p>
          End to end, two orders of magnitude faster than the naive Python
          loop, with the compute concentrated on the states where matchup
          detail actually moves the answer.
        </p>
        <Figure
          src="/posts/stateball/perf_engine_evolution.png"
          alt="Three-bar perf chart: scalar 12.10s, batch 3.15s, truncated and pruned 103ms"
          width={1400}
          height={840}
        />
        <Figure
          src="/posts/stateball/in-game-card.png"
          alt="Live game card with sim line, market line, CI band, and swing range readout"
          width={1125}
          height={866}
        />
        <p>
          What comes out is a distribution: the dashboard shows the mean,
          the CI band from the sims, and the predicted swing range. None
          of that follows from a single WE-table number.
        </p>
      </Section>

      <Section title="6. Did we beat raw WE?">
        <p>
          The eval samples 494 games across 9 entry-point innings (4446
          starting states), runs the sim from each, and compares predicted
          P(home_win) and predicted final scores to actuals.
        </p>
        <p>
          Overall accuracy: 84.7% on win/loss prediction. That number
          alone doesn&apos;t say much. It conflates trivial states
          (9th-inning blowouts, where the WE table is also right) with
          hard ones. The breakdown by entry inning is more honest:
        </p>
        <Figure
          src="/posts/stateball/accuracy_by_inning.png"
          alt="Bar chart: sim accuracy by entry-point inning, climbing from 80% to 94%"
          width={1540}
          height={840}
        />
        <p>
          Accuracy starts around 80% for first-inning starts and climbs to
          94% by the ninth. That climb is the truncated MC short-circuit
          at work. As the game progresses, more starting states are
          decisive enough that the sim defers to the WE table, and on
          those states the WE table is essentially perfect.
        </p>
        <p>Score prediction is where the sim looks worst.</p>
        <Figure
          src="/posts/stateball/score_bias.png"
          alt="Histogram of predicted minus actual final score, home and away, both centered around -3"
          width={1540}
          height={840}
        />
        <p>
          The histogram is predicted final score minus actual, for every
          entry where the sim ran (the 51% that didn&apos;t short-circuit).
          Mean home bias: -3.4 runs. Mean away bias: -3.3. The sim
          systematically under-predicts how many runs each side ends up
          scoring. That&apos;s a real, large gap.
        </p>
        <p>
          Most of it is the truncation. When the sim early-stops on a
          state that has converged in win-probability terms, the score
          state at the moment of truncation locks in. Late-inning offense
          that would have happened anyway doesn&apos;t get counted. A
          close game that the sim correctly calls 60/40 home but ends 8-7
          instead of 4-3 looks like a perfect win prediction and a bad
          score prediction at the same time.
        </p>
        <p>
          Whether that bothers you depends on what you&apos;re using the
          output for. For win probability, the score bias washes out. For
          anything that consumes the predicted run distribution directly,
          it doesn&apos;t.
        </p>
        <p>
          The cleaner sim-vs-WE comparison (calibration or Brier delta on
          the 51% MC-run subset) isn&apos;t built yet. The eval pairs each
          entry&apos;s sim P(home_win) with the WE baseline, so the data
          is in place.
        </p>
      </Section>

      <Section title="7. What's next">
        <p>A handful of things on the list, none of them rebuilds.</p>
        <p>
          <strong>Score distribution.</strong> The estimator stops
          sampling after the bootstrap horizon, so predicted final scores
          sit ~3 below actual on MC-run entries (section 6). Win-probability
          is unaffected, but anyone consuming the run distribution
          downstream would want the sim continued past the WE-bootstrap
          point at extra compute cost.
        </p>
        <p>
          <strong>Rao-Blackwellization.</strong> Replace some of the Monte
          Carlo with closed-form expectation where the math is cheap. For
          late-inning states where the remaining outcome distribution is
          small enough to enumerate, you can integrate over it analytically
          and skip the Monte Carlo step entirely. Cleaner output, fewer
          sims.
        </p>
        <p>
          <strong>Pitcher fatigue beyond what&apos;s currently modeled.</strong>{" "}
          The pitcher arsenal features capture how a pitcher pitches; they
          don&apos;t capture how he pitches in his 90th pitch of the night
          versus his 30th. A real signal, a known gap.
        </p>
        <p>
          None of these are blockers. The sim works, the dashboard works,
          the numbers in this post are honest. They&apos;re just where
          I&apos;d push next.
        </p>
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-4 text-muted leading-relaxed">{children}</div>
    </section>
  );
}

function Figure({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <figure className="space-y-2">
      <div className="overflow-hidden rounded-md border border-black/5 dark:border-white/10">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-auto w-full"
        />
      </div>
      <figcaption className="text-center text-xs text-muted">
        {alt}
      </figcaption>
    </figure>
  );
}
