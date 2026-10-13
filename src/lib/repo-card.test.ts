import { describe, expect, test } from "vitest";
import type { RepoSummary } from "./activity";
import { repoCardView } from "./repo-card";

// A repo with nothing in it. A test names only the fields its promise is about.
const repo: RepoSummary = {
  name: "site",
  description: "",
  htmlUrl: "https://git.example/mk/site",
  createdAt: "2025-03-01T08:00:00Z",
  languages: [],
  commitsLast12mo: 0,
};

describe("the commits of a repo", () => {
  test("are written as 0 commits for a repo with none", () => {
    expect(repoCardView({ ...repo, commitsLast12mo: 0 }).commits).toBe("0 commits");
  });

  test("are written as 1 commit for a repo with one", () => {
    expect(repoCardView({ ...repo, commitsLast12mo: 1 }).commits).toBe("1 commit");
  });

  test("are written as 2 commits for a repo with two", () => {
    expect(repoCardView({ ...repo, commitsLast12mo: 2 }).commits).toBe("2 commits");
  });

  test("have no comma below a thousand", () => {
    expect(repoCardView({ ...repo, commitsLast12mo: 999 }).commits).toBe("999 commits");
  });

  test("have a comma after the thousands", () => {
    expect(repoCardView({ ...repo, commitsLast12mo: 1000 }).commits).toBe("1,000 commits");
  });

  test("have a comma after the millions also", () => {
    expect(repoCardView({ ...repo, commitsLast12mo: 1234567 }).commits).toBe("1,234,567 commits");
  });
});

describe("the creation date of a repo", () => {
  test("is written as the word Created, the month in three letters, the day and the year", () => {
    expect(repoCardView({ ...repo, createdAt: "2025-03-01T08:00:00Z" }).created).toBe(
      "Created Mar 1, 2025",
    );
  });

  test("has a day of two digits written in full", () => {
    expect(repoCardView({ ...repo, createdAt: "2024-11-23T12:00:00Z" }).created).toBe(
      "Created Nov 23, 2024",
    );
  });

  test("names May, June, July and September in three letters, with no full stop", () => {
    expect(repoCardView({ ...repo, createdAt: "2025-05-15T12:00:00Z" }).created).toBe(
      "Created May 15, 2025",
    );
    expect(repoCardView({ ...repo, createdAt: "2025-06-15T12:00:00Z" }).created).toBe(
      "Created Jun 15, 2025",
    );
    expect(repoCardView({ ...repo, createdAt: "2025-07-15T12:00:00Z" }).created).toBe(
      "Created Jul 15, 2025",
    );
    expect(repoCardView({ ...repo, createdAt: "2025-09-15T12:00:00Z" }).created).toBe(
      "Created Sep 15, 2025",
    );
  });

  test("is the UTC date, in the first second of that day", () => {
    // In San Diego it is still 16:00 on 1 March.
    expect(repoCardView({ ...repo, createdAt: "2025-03-02T00:00:00Z" }).created).toBe(
      "Created Mar 2, 2025",
    );
  });

  test("is the UTC date, in the last second of that day", () => {
    // In Berlin it is already 00:59 on 2 March.
    expect(repoCardView({ ...repo, createdAt: "2025-03-01T23:59:59Z" }).created).toBe(
      "Created Mar 1, 2025",
    );
  });

  test("is the UTC date when the host writes the moment with an offset behind UTC", () => {
    // 17:00 on 1 March at 8 hours behind UTC is 01:00 on 2 March in UTC.
    expect(repoCardView({ ...repo, createdAt: "2025-03-01T17:00:00-08:00" }).created).toBe(
      "Created Mar 2, 2025",
    );
  });

  test("is the UTC date when the host writes the moment with an offset ahead of UTC", () => {
    // 08:00 on 2 March at 9 hours ahead of UTC is 23:00 on 1 March in UTC.
    expect(repoCardView({ ...repo, createdAt: "2025-03-02T08:00:00+09:00" }).created).toBe(
      "Created Mar 1, 2025",
    );
  });

  test("is in the old year in the last second of 31 December UTC", () => {
    expect(repoCardView({ ...repo, createdAt: "2025-12-31T23:59:59Z" }).created).toBe(
      "Created Dec 31, 2025",
    );
  });

  test("is in the new year from midnight UTC on 1 January", () => {
    expect(repoCardView({ ...repo, createdAt: "2026-01-01T00:00:00Z" }).created).toBe(
      "Created Jan 1, 2026",
    );
  });

  test("is 29 February for a repo made on the leap day", () => {
    expect(repoCardView({ ...repo, createdAt: "2024-02-29T12:00:00Z" }).created).toBe(
      "Created Feb 29, 2024",
    );
  });
});

describe("the languages of a card", () => {
  test("are an empty list for a repo with no language", () => {
    expect(repoCardView({ ...repo, languages: [] }).languages).toEqual([]);
  });

  test("are one for each language of the repo, in the order of the repo", () => {
    const view = repoCardView({
      ...repo,
      languages: [
        { name: "TypeScript", bytes: 750, pct: 0.75 },
        { name: "CSS", bytes: 200, pct: 0.2 },
        { name: "Shell", bytes: 50, pct: 0.05 },
      ],
    });

    expect(view.languages.map((language) => language.name)).toEqual(["TypeScript", "CSS", "Shell"]);
  });
});

describe("the label of a language", () => {
  test("is its name, a space, and its share as a percentage with one decimal", () => {
    // 750 of 1000 bytes.
    const view = repoCardView({
      ...repo,
      languages: [{ name: "TypeScript", bytes: 750, pct: 0.75 }],
    });

    expect(view.languages[0].label).toBe("TypeScript 75.0%");
  });

  test("says 100.0% for the only language of a repo", () => {
    const view = repoCardView({ ...repo, languages: [{ name: "Go", bytes: 420, pct: 1 }] });

    expect(view.languages[0].label).toBe("Go 100.0%");
  });

  test("rounds a third down and two thirds up", () => {
    const view = repoCardView({
      ...repo,
      languages: [
        { name: "Python", bytes: 200, pct: 2 / 3 },
        { name: "Shell", bytes: 100, pct: 1 / 3 },
      ],
    });

    expect(view.languages[0].label).toBe("Python 66.7%");
    expect(view.languages[1].label).toBe("Shell 33.3%");
  });

  test("rounds a share that is exactly halfway up", () => {
    // 1 of 16 bytes is 6.25%.
    const view = repoCardView({ ...repo, languages: [{ name: "SQL", bytes: 1, pct: 1 / 16 }] });

    expect(view.languages[0].label).toBe("SQL 6.3%");
  });

  test("says 0.0% for a share below a twentieth of a percent", () => {
    // 4 of 10000 bytes is 0.04%.
    const view = repoCardView({
      ...repo,
      languages: [{ name: "Dockerfile", bytes: 4, pct: 0.0004 }],
    });

    expect(view.languages[0].label).toBe("Dockerfile 0.0%");
  });
});

describe("the width of a language in the bar", () => {
  test("is its share as a percentage with two decimals", () => {
    const view = repoCardView({
      ...repo,
      languages: [{ name: "TypeScript", bytes: 750, pct: 0.75 }],
    });

    expect(view.languages[0].width).toBe("75.00%");
  });

  test("is 100.00% for the only language of a repo", () => {
    const view = repoCardView({ ...repo, languages: [{ name: "Go", bytes: 420, pct: 1 }] });

    expect(view.languages[0].width).toBe("100.00%");
  });

  test("keeps the hundredths of a third and of two thirds", () => {
    const view = repoCardView({
      ...repo,
      languages: [
        { name: "Python", bytes: 200, pct: 2 / 3 },
        { name: "Shell", bytes: 100, pct: 1 / 3 },
      ],
    });

    expect(view.languages[0].width).toBe("66.67%");
    expect(view.languages[1].width).toBe("33.33%");
  });

  test("is not 0 for a share that the label writes as 0.0%", () => {
    // 4 of 10000 bytes is 0.04%.
    const view = repoCardView({
      ...repo,
      languages: [{ name: "Dockerfile", bytes: 4, pct: 0.0004 }],
    });

    expect(view.languages[0].width).toBe("0.04%");
  });
});

describe("the colour of a language", () => {
  test("is the one the table gives, for each language of the table", () => {
    const names = [
      "TypeScript",
      "JavaScript",
      "Python",
      "Go",
      "Rust",
      "YAML",
      "Shell",
      "SQL",
      "CSS",
      "HTML",
      "Dockerfile",
      "Butane",
      "Markdown",
    ];
    const view = repoCardView({
      ...repo,
      languages: names.map((name) => ({ name, bytes: 1, pct: 1 / 13 })),
    });

    expect(view.languages.map((language) => [language.name, language.color])).toEqual([
      ["TypeScript", "#3178c6"],
      ["JavaScript", "#f1e05a"],
      ["Python", "#3572A5"],
      ["Go", "#00ADD8"],
      ["Rust", "#dea584"],
      ["YAML", "#cb171e"],
      ["Shell", "#89e051"],
      ["SQL", "#e38c00"],
      ["CSS", "#563d7c"],
      ["HTML", "#e34c26"],
      ["Dockerfile", "#384d54"],
      ["Butane", "#cccccc"],
      ["Markdown", "#083fa1"],
    ]);
  });

  test("is grey for a language that is not in the table", () => {
    const view = repoCardView({ ...repo, languages: [{ name: "Nix", bytes: 1, pct: 1 }] });

    expect(view.languages[0].color).toBe("#9ca3af");
  });

  test("is grey for a language of the table written in another case", () => {
    const view = repoCardView({ ...repo, languages: [{ name: "typescript", bytes: 1, pct: 1 }] });

    expect(view.languages[0].color).toBe("#9ca3af");
  });

  test("is grey for a language with the name of something every object has", () => {
    const view = repoCardView({ ...repo, languages: [{ name: "constructor", bytes: 1, pct: 1 }] });

    expect(view.languages[0].color).toBe("#9ca3af");
  });
});
