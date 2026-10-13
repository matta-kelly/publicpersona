import { describe, expect, test } from "vitest";
import { heatmapGrid } from "./heatmap-grid";

// Every expected date and weekday below is read from the calendar:
// 2026-10-10 is a Saturday, 2026-10-11 a Sunday, 2026-10-12 a Monday.

describe("the range of the grid", () => {
  test("has only today in the last week when today is a Sunday", () => {
    const weeks = heatmapGrid([], "2026-10-11");

    expect(weeks[52].days).toEqual([
      { date: "2026-10-11", count: 0, tier: 0 },
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });
});

describe("the tier of a day", () => {
  test("is 1 for a count from 1 to 2, 2 from 3 to 5, 3 from 6 to 9, and 4 for 10 or more", () => {
    // The last week of the grid: Sunday 2026-10-04 to Saturday 2026-10-10.
    const weeks = heatmapGrid(
      [
        { date: "2026-10-04", count: 1 },
        { date: "2026-10-05", count: 2 },
        { date: "2026-10-06", count: 3 },
        { date: "2026-10-07", count: 5 },
        { date: "2026-10-08", count: 6 },
        { date: "2026-10-09", count: 9 },
        { date: "2026-10-10", count: 10 },
      ],
      "2026-10-10",
    );

    expect(weeks[52].days).toEqual([
      { date: "2026-10-04", count: 1, tier: 1 },
      { date: "2026-10-05", count: 2, tier: 1 },
      { date: "2026-10-06", count: 3, tier: 2 },
      { date: "2026-10-07", count: 5, tier: 2 },
      { date: "2026-10-08", count: 6, tier: 3 },
      { date: "2026-10-09", count: 9, tier: 3 },
      { date: "2026-10-10", count: 10, tier: 4 },
    ]);
  });
});

describe("the month label of a week", () => {
  test("names each month of a year in three letters, in calendar order", () => {
    // The Sundays that open a month in this grid, from 2025-10-05: 2025-11-02 (week 4),
    // 2025-12-07 (9), 2026-01-04 (13), 02-01 (17), 03-01 (21), 04-05 (26), 05-03 (30),
    // 06-07 (35), 07-05 (39), 08-02 (43), 09-06 (48), 10-04 (52).
    const weeks = heatmapGrid([], "2026-10-10");

    expect(weeks.map((week) => week.monthLabel)).toEqual([
      "Oct",
      null,
      null,
      null,
      "Nov",
      null,
      null,
      null,
      null,
      "Dec",
      null,
      null,
      null,
      "Jan",
      null,
      null,
      null,
      "Feb",
      null,
      null,
      null,
      "Mar",
      null,
      null,
      null,
      null,
      "Apr",
      null,
      null,
      null,
      "May",
      null,
      null,
      null,
      null,
      "Jun",
      null,
      null,
      null,
      "Jul",
      null,
      null,
      null,
      "Aug",
      null,
      null,
      null,
      null,
      "Sep",
      null,
      null,
      null,
      "Oct",
    ]);
  });
});
