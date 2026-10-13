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

describe("the day of a contribution", () => {
  test("is the UTC date of its timestamp, in the first second of that day", () => {
    // 2026-10-10T00:00:00Z. In San Diego it is still the afternoon of 9 October.
    const summary = activitySummary({
      contributions: [{ timestamp: 1791590400, count: 1 }],
      repos: [],
    });

    expect(summary.heatmap).toEqual([{ date: "2026-10-10", count: 1 }]);
  });

  test("is the UTC date of its timestamp, in the last second of that day", () => {
    // 2026-10-10T23:59:59Z.
    const summary = activitySummary({
      contributions: [{ timestamp: 1791676799, count: 1 }],
      repos: [],
    });

    expect(summary.heatmap).toEqual([{ date: "2026-10-10", count: 1 }]);
  });

  test("is the next date from midnight UTC", () => {
    // 2026-10-11T00:00:00Z.
    const summary = activitySummary({
      contributions: [{ timestamp: 1791676800, count: 1 }],
      repos: [],
    });

    expect(summary.heatmap).toEqual([{ date: "2026-10-11", count: 1 }]);
  });
});

describe("the count of a day", () => {
  test("is the count of the entry, for a day with one entry", () => {
    // 2026-10-10T09:00:00Z.
    const summary = activitySummary({
      contributions: [{ timestamp: 1791622800, count: 3 }],
      repos: [],
    });

    expect(summary.heatmap).toEqual([{ date: "2026-10-10", count: 3 }]);
  });

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

  test("does not depend on the order of the entries", () => {
    // The same three entries, the latest first.
    const summary = activitySummary({
      contributions: [
        { timestamp: 1791668700, count: 4 },
        { timestamp: 1791622800, count: 2 },
        { timestamp: 1791623700, count: 3 },
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

describe("the days of the heatmap", () => {
  test("has no day when the host gives no entry", () => {
    const summary = activitySummary({ contributions: [], repos: [] });

    expect(summary.heatmap).toEqual([]);
  });

  test("has no entry for a day with no contribution", () => {
    // 2026-10-10T09:00:00Z and 2026-10-12T10:00:00Z. Nothing on 11 October.
    const summary = activitySummary({
      contributions: [
        { timestamp: 1791622800, count: 2 },
        { timestamp: 1791799200, count: 6 },
      ],
      repos: [],
    });

    expect(summary.heatmap).toEqual([
      { date: "2026-10-10", count: 2 },
      { date: "2026-10-12", count: 6 },
    ]);
  });

  test("gives the days oldest first, whatever the order of the entries", () => {
    // 2026-10-12T10:00:00Z, then 2026-10-10T09:00:00Z, then 2026-10-11T12:00:00Z.
    const summary = activitySummary({
      contributions: [
        { timestamp: 1791799200, count: 6 },
        { timestamp: 1791622800, count: 2 },
        { timestamp: 1791720000, count: 1 },
      ],
      repos: [],
    });

    expect(summary.heatmap).toEqual([
      { date: "2026-10-10", count: 2 },
      { date: "2026-10-11", count: 1 },
      { date: "2026-10-12", count: 6 },
    ]);
  });
});

describe("the total", () => {
  test("is 0 when the host gives no entry", () => {
    const summary = activitySummary({ contributions: [], repos: [] });

    expect(summary.totalContributionsLast12mo).toBe(0);
  });

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

  test("counts an entry however old it is", () => {
    // 2020-01-01T00:00:00Z is 1577836800: more than six years before the other entry.
    const summary = activitySummary({
      contributions: [
        { timestamp: 1577836800, count: 7 },
        { timestamp: 1791622800, count: 1 },
      ],
      repos: [],
    });

    expect(summary.totalContributionsLast12mo).toBe(8);
  });
});

describe("the languages of a repo", () => {
  test("gives each language its share of the bytes of the repo", () => {
    // 750 of 1000 bytes is 0.75; 250 of 1000 is 0.25.
    const summary = activitySummary({
      contributions: [],
      repos: [{ ...repo, languageBytes: { TypeScript: 750, CSS: 250 } }],
    });

    expect(summary.repos[0].languages).toEqual([
      { name: "TypeScript", bytes: 750, pct: 0.75 },
      { name: "CSS", bytes: 250, pct: 0.25 },
    ]);
  });

  test("gives the only language of a repo a share of 1", () => {
    const summary = activitySummary({
      contributions: [],
      repos: [{ ...repo, languageBytes: { Go: 42 } }],
    });

    expect(summary.repos[0].languages).toEqual([{ name: "Go", bytes: 42, pct: 1 }]);
  });

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

  test("keeps the order the host gave for languages with equal bytes", () => {
    const summary = activitySummary({
      contributions: [],
      repos: [{ ...repo, languageBytes: { Shell: 100, Go: 100, Python: 200 } }],
    });

    expect(summary.repos[0].languages).toEqual([
      { name: "Python", bytes: 200, pct: 0.5 },
      { name: "Shell", bytes: 100, pct: 0.25 },
      { name: "Go", bytes: 100, pct: 0.25 },
    ]);
  });

  test("is an empty list for a repo with no language", () => {
    const summary = activitySummary({
      contributions: [],
      repos: [{ ...repo, languageBytes: {} }],
    });

    expect(summary.repos[0].languages).toEqual([]);
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

  test("keeps the order the host gave for repos with equal commits", () => {
    const summary = activitySummary({
      contributions: [],
      repos: [
        { ...repo, name: "notes", commitsLast12mo: 4 },
        { ...repo, name: "infra", commitsLast12mo: 4 },
        { ...repo, name: "site", commitsLast12mo: 9 },
      ],
    });

    expect(summary.repos.map((r) => r.name)).toEqual(["site", "notes", "infra"]);
  });

  test("keeps a repo with no commits, after the others", () => {
    const summary = activitySummary({
      contributions: [],
      repos: [
        { ...repo, name: "old", commitsLast12mo: 0 },
        { ...repo, name: "site", commitsLast12mo: 2 },
      ],
    });

    expect(summary.repos.map((r) => r.name)).toEqual(["site", "old"]);
  });

  test("gives the name, description, link, creation date and commits of a repo as the host gave them", () => {
    const summary = activitySummary({
      contributions: [],
      repos: [
        {
          name: "dazoo",
          description: "The nodes, and what runs on them",
          htmlUrl: "https://git.example/mk/dazoo",
          createdAt: "2024-06-02T17:30:00Z",
          languageBytes: { Shell: 400 },
          commitsLast12mo: 31,
        },
      ],
    });

    expect(summary.repos).toEqual([
      {
        name: "dazoo",
        description: "The nodes, and what runs on them",
        htmlUrl: "https://git.example/mk/dazoo",
        createdAt: "2024-06-02T17:30:00Z",
        languages: [{ name: "Shell", bytes: 400, pct: 1 }],
        commitsLast12mo: 31,
      },
    ]);
  });
});
