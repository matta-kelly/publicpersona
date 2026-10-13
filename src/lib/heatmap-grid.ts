import type { HeatmapDay } from "./activity";

export interface HeatmapCell {
  date: string;
  count: number;
  tier: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapWeek {
  monthLabel: string | null;
  days: (HeatmapCell | null)[];
}

const DAY_MS = 86400 * 1000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function tier(count: number): HeatmapCell["tier"] {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

export function heatmapGrid(days: HeatmapDay[], today: string): HeatmapWeek[] {
  // The entries are sparse: a day with no contribution has none.
  const countByDate = new Map(days.map((day) => [day.date, day.count]));
  // A date is a calendar day, so it is read in UTC: a local time would move it with the time zone.
  const last = Date.parse(today + "T00:00:00Z");
  const yearBefore = new Date(last - 364 * DAY_MS);
  // The grid starts on a Sunday, so every column is a whole week.
  const first = yearBefore.getTime() - yearBefore.getUTCDay() * DAY_MS;

  const weeks: HeatmapWeek[] = [];
  let monthBefore = -1;
  for (let sunday = first; sunday <= last; sunday += 7 * DAY_MS) {
    const month = new Date(sunday).getUTCMonth();
    weeks.push({
      monthLabel: month === monthBefore ? null : MONTHS[month],
      days: Array.from({ length: 7 }, (_, place) => {
        const time = sunday + place * DAY_MS;
        if (time > last) return null;
        const date = new Date(time).toISOString().slice(0, 10);
        const count = countByDate.get(date) ?? 0;
        return { date, count, tier: tier(count) };
      }),
    });
    monthBefore = month;
  }
  return weeks;
}
