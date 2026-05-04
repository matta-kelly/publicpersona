import type { HeatmapDay } from "@/lib/forgejo";

function tier(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

const TIER_BG = [
  "bg-neutral-200 dark:bg-neutral-800",
  "bg-blue-200 dark:bg-blue-900",
  "bg-blue-400 dark:bg-blue-700",
  "bg-blue-500 dark:bg-blue-500",
  "bg-blue-700 dark:bg-blue-300",
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Heatmap({ days, total }: { days: HeatmapDay[]; total: number }) {
  // Forgejo returns sparse list (only days with contributions). Fill in gaps.
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const today = new Date();
  const start = new Date(today.getTime() - 364 * 86400 * 1000);
  // Snap start to previous Sunday so the grid columns align as full weeks.
  const startDow = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - startDow);

  const filled: { date: string; count: number; dow: number; month: number }[] = [];
  for (let i = 0; i < 53 * 7; i++) {
    const d = new Date(start.getTime() + i * 86400 * 1000);
    if (d > today) break;
    const date = d.toISOString().slice(0, 10);
    filled.push({
      date,
      count: byDate.get(date) ?? 0,
      dow: d.getUTCDay(),
      month: d.getUTCMonth(),
    });
  }

  // Group into weeks (columns).
  const weeks: { date: string; count: number; dow: number; month: number }[][] = [];
  let week: typeof filled = [];
  for (const day of filled) {
    if (day.dow === 0 && week.length) {
      weeks.push(week);
      week = [];
    }
    week.push(day);
  }
  if (week.length) weeks.push(week);

  // Month label positions: place a label on the first week where a new month starts.
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, col) => {
    const firstDay = w[0];
    if (firstDay.month !== lastMonth) {
      monthLabels.push({ col, label: MONTHS[firstDay.month] });
      lastMonth = firstDay.month;
    }
  });

  return (
    <figure>
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* month labels row */}
          <div
            className="grid gap-[3px] text-xs text-muted mb-1"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
          >
            {weeks.map((_, col) => {
              const label = monthLabels.find((m) => m.col === col);
              return (
                <div key={col} className="h-3 leading-none">
                  {label?.label ?? ""}
                </div>
              );
            })}
          </div>

          {/* heatmap grid */}
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
          >
            {weeks.map((w, col) => (
              <div key={col} className="grid grid-rows-7 gap-[3px]">
                {Array.from({ length: 7 }).map((_, dow) => {
                  const day = w.find((d) => d.dow === dow);
                  if (!day) {
                    return <div key={dow} className="h-3 w-3" />;
                  }
                  return (
                    <div
                      key={dow}
                      className={`h-3 w-3 rounded-sm ${TIER_BG[tier(day.count)]}`}
                      title={`${day.date}: ${day.count} contributions`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted">
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
