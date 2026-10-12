import { describe, expect, test } from "vitest";
import { heatmapGrid } from "./heatmap-grid";

// Every expected date and weekday below is read from the calendar:
// 2026-10-10 is a Saturday, 2026-10-11 a Sunday, 2026-10-12 a Monday.

describe("the range of the grid", () => {
  test("has 53 weeks", () => {
    const weeks = heatmapGrid([], "2026-10-10");

    expect(weeks.length).toBe(53);
  });

  test("starts on the Sunday before the day 364 days before today", () => {
    // 364 days before Saturday 2026-10-10 is Saturday 2025-10-11.
    const weeks = heatmapGrid([], "2026-10-10");

    expect(weeks[0].days[0]).toEqual({ date: "2025-10-05", count: 0, tier: 0 });
  });

  test("starts on the day 364 days before today when that day is a Sunday", () => {
    const weeks = heatmapGrid([], "2026-10-11");

    expect(weeks[0].days[0]).toEqual({ date: "2025-10-12", count: 0, tier: 0 });
  });

  test("ends on today", () => {
    const weeks = heatmapGrid([], "2026-10-10");

    expect(weeks[52].days[6]).toEqual({ date: "2026-10-10", count: 0, tier: 0 });
  });

  test("gives a week its seven days in order, Sunday first", () => {
    const weeks = heatmapGrid([], "2026-10-10");

    expect(weeks[0].days).toEqual([
      { date: "2025-10-05", count: 0, tier: 0 },
      { date: "2025-10-06", count: 0, tier: 0 },
      { date: "2025-10-07", count: 0, tier: 0 },
      { date: "2025-10-08", count: 0, tier: 0 },
      { date: "2025-10-09", count: 0, tier: 0 },
      { date: "2025-10-10", count: 0, tier: 0 },
      { date: "2025-10-11", count: 0, tier: 0 },
    ]);
  });

  test("leaves the places after today empty in the last week", () => {
    const weeks = heatmapGrid([], "2026-10-12");

    expect(weeks[52].days).toEqual([
      { date: "2026-10-11", count: 0, tier: 0 },
      { date: "2026-10-12", count: 0, tier: 0 },
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  test("still has 53 weeks when today is a Sunday", () => {
    const weeks = heatmapGrid([], "2026-10-11");

    expect(weeks.length).toBe(53);
  });

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

  test("holds 29 February when the range crosses one", () => {
    // 364 days before Tuesday 2024-12-31 is Tuesday 2024-01-02, so the grid starts on
    // Sunday 2023-12-31. Thursday 2024-02-29 is 60 days later: week 8, place 4.
    const weeks = heatmapGrid([], "2024-12-31");

    expect(weeks[8].days[4]).toEqual({ date: "2024-02-29", count: 0, tier: 0 });
  });
});

describe("the count of a day", () => {
  test("is 0 for a day with no entry", () => {
    const weeks = heatmapGrid([{ date: "2026-10-09", count: 4 }], "2026-10-10");

    expect(weeks[52].days[6]).toEqual({ date: "2026-10-10", count: 0, tier: 0 });
  });

  test("is the count of the entry for that day", () => {
    const weeks = heatmapGrid([{ date: "2026-10-07", count: 4 }], "2026-10-10");

    expect(weeks[52].days[3]).toEqual({ date: "2026-10-07", count: 4, tier: 2 });
  });

  test("does not depend on the order of the entries", () => {
    const weeks = heatmapGrid(
      [
        { date: "2026-10-10", count: 1 },
        { date: "2025-10-05", count: 7 },
        { date: "2026-10-07", count: 4 },
      ],
      "2026-10-10",
    );

    expect(weeks[0].days[0]).toEqual({ date: "2025-10-05", count: 7, tier: 3 });
    expect(weeks[52].days[3]).toEqual({ date: "2026-10-07", count: 4, tier: 2 });
    expect(weeks[52].days[6]).toEqual({ date: "2026-10-10", count: 1, tier: 1 });
  });

  test("leaves out an entry from before the first day", () => {
    const weeks = heatmapGrid([{ date: "2025-10-04", count: 7 }], "2026-10-10");

    expect(weeks.length).toBe(53);
    expect(weeks[0].days[0]).toEqual({ date: "2025-10-05", count: 0, tier: 0 });
  });

  test("leaves out an entry from after today", () => {
    const weeks = heatmapGrid([{ date: "2026-10-12", count: 7 }], "2026-10-11");

    expect(weeks.length).toBe(53);
    expect(weeks[52].days[1]).toBeNull();
  });
});

describe("the tier of a day", () => {
  test("is 0 for a count of 0", () => {
    const weeks = heatmapGrid([{ date: "2026-10-10", count: 0 }], "2026-10-10");

    expect(weeks[52].days[6]).toEqual({ date: "2026-10-10", count: 0, tier: 0 });
  });

  test("is 1 for a count from 1 to 2", () => {
    const weeks = heatmapGrid(
      [
        { date: "2026-10-09", count: 1 },
        { date: "2026-10-10", count: 2 },
      ],
      "2026-10-10",
    );

    expect(weeks[52].days[5]).toEqual({ date: "2026-10-09", count: 1, tier: 1 });
    expect(weeks[52].days[6]).toEqual({ date: "2026-10-10", count: 2, tier: 1 });
  });

  test("is 2 for a count from 3 to 5", () => {
    const weeks = heatmapGrid(
      [
        { date: "2026-10-09", count: 3 },
        { date: "2026-10-10", count: 5 },
      ],
      "2026-10-10",
    );

    expect(weeks[52].days[5]).toEqual({ date: "2026-10-09", count: 3, tier: 2 });
    expect(weeks[52].days[6]).toEqual({ date: "2026-10-10", count: 5, tier: 2 });
  });

  test("is 3 for a count from 6 to 9", () => {
    const weeks = heatmapGrid(
      [
        { date: "2026-10-09", count: 6 },
        { date: "2026-10-10", count: 9 },
      ],
      "2026-10-10",
    );

    expect(weeks[52].days[5]).toEqual({ date: "2026-10-09", count: 6, tier: 3 });
    expect(weeks[52].days[6]).toEqual({ date: "2026-10-10", count: 9, tier: 3 });
  });

  test("is 4 for a count of 10 or more", () => {
    const weeks = heatmapGrid(
      [
        { date: "2026-10-09", count: 10 },
        { date: "2026-10-10", count: 250 },
      ],
      "2026-10-10",
    );

    expect(weeks[52].days[5]).toEqual({ date: "2026-10-09", count: 10, tier: 4 });
    expect(weeks[52].days[6]).toEqual({ date: "2026-10-10", count: 250, tier: 4 });
  });
});

describe("the month label of a week", () => {
  test("is the month of its Sunday, for the first week", () => {
    const weeks = heatmapGrid([], "2026-10-10");

    expect(weeks[0].monthLabel).toBe("Oct");
  });

  test("is empty when its Sunday is in the same month as the Sunday before", () => {
    // Week 1 starts on Sunday 2025-10-12; week 0 on Sunday 2025-10-05.
    const weeks = heatmapGrid([], "2026-10-10");

    expect(weeks[1].monthLabel).toBeNull();
  });

  test("names a month that starts midweek on the first week whose Sunday is in it", () => {
    // Saturday 2025-11-01 is the last day of week 3. Week 4 starts on Sunday 2025-11-02.
    const weeks = heatmapGrid([], "2026-10-10");

    expect(weeks[3].monthLabel).toBeNull();
    expect(weeks[4].monthLabel).toBe("Nov");
  });

  test("names a month that starts on a Sunday on the week of that Sunday", () => {
    // Week 17 starts on Sunday 2026-02-01.
    const weeks = heatmapGrid([], "2026-10-10");

    expect(weeks[16].monthLabel).toBeNull();
    expect(weeks[17].monthLabel).toBe("Feb");
  });

  test("names the same month twice when the grid starts and ends in it", () => {
    // Week 0 starts on Sunday 2025-10-05 and week 52 on Sunday 2026-10-04.
    const weeks = heatmapGrid([], "2026-10-10");

    expect(weeks[0].monthLabel).toBe("Oct");
    expect(weeks[52].monthLabel).toBe("Oct");
  });

  test("names two weeks in a row when the first week is the last of its month", () => {
    // 364 days before Sunday 2026-10-25 is Sunday 2025-10-26. Week 1 starts on 2025-11-02.
    const weeks = heatmapGrid([], "2026-10-25");

    expect(weeks[0].monthLabel).toBe("Oct");
    expect(weeks[1].monthLabel).toBe("Nov");
  });

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
