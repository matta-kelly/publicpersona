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
  test("are written as 1 commit for a repo with one", () => {
    expect(repoCardView({ ...repo, commitsLast12mo: 1 }).commits).toBe("1 commit");
  });

  test("have a comma after the thousands", () => {
    expect(repoCardView({ ...repo, commitsLast12mo: 1000 }).commits).toBe("1,000 commits");
  });
});

describe("the creation date of a repo", () => {
  test("is the UTC date when the host writes the moment with an offset behind UTC", () => {
    // 17:00 on 1 March at 8 hours behind UTC is 01:00 on 2 March in UTC.
    expect(repoCardView({ ...repo, createdAt: "2025-03-01T17:00:00-08:00" }).created).toBe(
      "Created Mar 2, 2025",
    );
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
});

describe("the width of a language in the bar", () => {
  test("is its share as a percentage with two decimals", () => {
    const view = repoCardView({
      ...repo,
      languages: [{ name: "TypeScript", bytes: 750, pct: 0.75 }],
    });

    expect(view.languages[0].width).toBe("75.00%");
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
});
