import { describe, expect, test } from "vitest";
import { activitySummary, type RepoSource } from "./activity";

// A timestamp is in seconds since 1970-01-01T00:00:00Z. Each one below is worked out by hand:
// 2026-10-10T00:00:00Z is 1791590400, a day is 86400 seconds, a quarter of an hour is 900.

// A repo with nothing in it. A test names only the fields its promise is about.
const repo: RepoSource = {
  name: "site",
  description: "",
  htmlUrl: "https://git.example/mk/site",
  createdAt: "2025-03-01T08:00:00Z",
  languageBytes: {},
  commitsLast12mo: 0,
};

describe("the count of a day", () => {
  test("is the sum of the entries of that day", () => {
    // Three quarters of an hour of 2026-10-10: 09:00, 09:15 and 21:45, UTC.
    const summary = activitySummary({
      contributions: [
        { timestamp: 1791622800, count: 2 },
        { timestamp: 1791623700, count: 3 },
        { timestamp: 1791668700, count: 4 },
      ],
      repos: [],
    });

    expect(summary.heatmap).toEqual([{ date: "2026-10-10", count: 9 }]);
  });

  test("keeps two days apart at midnight UTC", () => {
    // 2026-10-10T23:45:00Z, and the quarter of an hour after it, 2026-10-11T00:00:00Z.
    const summary = activitySummary({
      contributions: [
        { timestamp: 1791675900, count: 1 },
        { timestamp: 1791676800, count: 5 },
      ],
      repos: [],
    });

    expect(summary.heatmap).toEqual([
      { date: "2026-10-10", count: 1 },
      { date: "2026-10-11", count: 5 },
    ]);
  });
});

describe("the total", () => {
  test("is the sum of every entry", () => {
    // Two entries on 2026-10-10 and one on 2026-10-12: 2 + 3 + 6.
    const summary = activitySummary({
      contributions: [
        { timestamp: 1791622800, count: 2 },
        { timestamp: 1791623700, count: 3 },
        { timestamp: 1791799200, count: 6 },
      ],
      repos: [],
    });

    expect(summary.totalContributionsLast12mo).toBe(11);
  });
});

describe("the languages of a repo", () => {
  test("puts the language with the most bytes first", () => {
    const summary = activitySummary({
      contributions: [],
      repos: [{ ...repo, languageBytes: { CSS: 250, Shell: 50, TypeScript: 700 } }],
    });

    expect(summary.repos[0].languages).toEqual([
      { name: "TypeScript", bytes: 700, pct: 0.7 },
      { name: "CSS", bytes: 250, pct: 0.25 },
      { name: "Shell", bytes: 50, pct: 0.05 },
    ]);
  });
});

describe("the repos", () => {
  test("puts the repo with the most commits first", () => {
    const summary = activitySummary({
      contributions: [],
      repos: [
        { ...repo, name: "notes", commitsLast12mo: 3 },
        { ...repo, name: "site", commitsLast12mo: 12 },
        { ...repo, name: "infra", commitsLast12mo: 7 },
      ],
    });

    expect(summary.repos.map((r) => r.name)).toEqual(["site", "infra", "notes"]);
  });
});
