import type { HeatmapDay } from "@/lib/activity";
import { heatmapGrid } from "@/lib/heatmap-grid";

const TIER_BG = [
  "bg-neutral-200 dark:bg-neutral-800",
  "bg-blue-200 dark:bg-blue-900",
  "bg-blue-400 dark:bg-blue-700",
  "bg-blue-500 dark:bg-blue-500",
  "bg-blue-700 dark:bg-blue-300",
];

export default function Heatmap({ days, total }: { days: HeatmapDay[]; total: number }) {
  const weeks = heatmapGrid(days, new Date().toISOString().slice(0, 10));

  return (
    <figure>
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* month labels row */}
          <div
            className="text-muted mb-1 grid gap-[3px] text-xs"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
          >
            {weeks.map((week, col) => (
              <div key={col} className="h-3 leading-none">
                {week.monthLabel ?? ""}
              </div>
            ))}
          </div>

          {/* heatmap grid */}
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
          >
            {weeks.map((week, col) => (
              <div key={col} className="grid grid-rows-7 gap-[3px]">
                {week.days.map((day, dow) => {
                  if (!day) {
                    return <div key={dow} className="h-3 w-3" />;
                  }
                  return (
                    <div
                      key={dow}
                      className={`h-3 w-3 rounded-sm ${TIER_BG[day.tier]}`}
                      title={`${day.date}: ${day.count} contributions`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="text-muted mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
        <span>{total.toLocaleString()} contributions in the last 12 months</span>
        <span className="flex items-center gap-1">
          <span>Less</span>
          {TIER_BG.map((cls, i) => (
            <span key={i} className={`h-3 w-3 rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </span>
      </figcaption>
    </figure>
  );
}
