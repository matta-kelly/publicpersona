import { isDeepStrictEqual } from "node:util";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fetchActivity } from "./github";
import activity from "./github-captured/activity.json";
import noSuchUser from "./github-captured/no-such-user.json";
import wrongToken from "./github-captured/wrong-token.json";

// The token the tests give the client. It is no token of GitHub: every answer is a captured one.
const TOKEN = "the-token-of-the-tests";

// The captured answers were asked for the commits since 2025-10-13T00:00:00.000Z.
// That is 365 days before this moment, so the tests stop the clock here.
const NOW = "2026-10-13T00:00:00.000Z";

// One call to the live GitHub and its answer, as a file under github-captured/ holds it.
// The token was never written: the call is held with no header.
interface Captured {
  request: {
    method: string;
    url: string;
    query: string;
    variables: Record<string, string>;
  };
  response: { status: number; headers: Record<string, string>; body: unknown };
}

// The calls of the client that no captured answer is for.
let unanswered: string[];

// A GraphQL document means the same with any run of white space as one space.
function oneSpace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// Puts a captured answer in the place of GitHub. A call gets it only when it has the method,
// the address and the document of the captured call, the variables given here, and the token.
function githubAnswers(captured: Captured, variables = captured.request.variables) {
  vi.stubGlobal("fetch", async (input: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const sent = JSON.parse(String(init?.body ?? "{}"));
    const asked =
      init?.method === captured.request.method &&
      input === captured.request.url &&
      headers.get("authorization") === `bearer ${TOKEN}` &&
      headers.get("content-type") === "application/json" &&
      oneSpace(String(sent.query)) === oneSpace(captured.request.query) &&
      isDeepStrictEqual(sent.variables, variables);
    if (!asked) {
      unanswered.push(`${init?.method ?? "GET"} ${input} ${JSON.stringify(sent.variables)}`);
      throw new TypeError("no captured answer for this call");
    }
    const { status, headers: answered, body } = captured.response;
    return new Response(JSON.stringify(body), { status, headers: answered });
  });
}

beforeEach(() => {
  unanswered = [];
  vi.stubEnv("GITHUB_API_TOKEN", TOKEN);
  // Only the clock is stopped; a promise still settles by itself.
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(NOW) });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("the activity of the account", () => {
  test("has one entry for each day with a contribution, at midnight UTC of that day, with the count GitHub gave", async () => {
    githubAnswers(activity);

    const { contributions } = await fetchActivity();

    // The captured calendar holds its last two weeks: 4 to 12 October 2026.
    // Five of those days have no contribution, and none of them is here.
    expect(contributions).toEqual([
      { timestamp: 1791504000, count: 27 }, // 2026-10-09
      { timestamp: 1791590400, count: 22 }, // 2026-10-10
      { timestamp: 1791676800, count: 6 }, // 2026-10-11
      { timestamp: 1791763200, count: 60 }, // 2026-10-12
    ]);
    expect(unanswered).toEqual([]);
  });

  test("has of each repo the name, description, address, date of creation, bytes of each language and commits since 365 days ago, in the order GitHub gave", async () => {
    githubAnswers(activity);

    const { repos } = await fetchActivity();

    // The captured answer holds three of the repos.
    expect(repos).toEqual([
      {
        name: "que",
        description:
          "A generic agent harness: capabilities are drop-in packages, mounted per user. LangChain, LangGraph, Next.js, Odoo.",
        htmlUrl: "https://github.com/matta-kelly/que",
        createdAt: "2026-10-10T17:14:18Z",
        languageBytes: {
          Dockerfile: 252,
          TypeScript: 303438,
          Just: 5264,
          Shell: 7739,
          CSS: 5386,
          JavaScript: 133,
        },
        commitsLast12mo: 26,
      },
      {
        name: "publicpersona",
        description: "My personal site: who I am, what I have built, and how I think.",
        htmlUrl: "https://github.com/matta-kelly/publicpersona",
        createdAt: "2026-10-09T23:41:28Z",
        languageBytes: {
          Shell: 2946,
          Dockerfile: 1950,
          JavaScript: 439,
          TypeScript: 115788,
          CSS: 1040,
        },
        commitsLast12mo: 44,
      },
      {
        name: "stateball",
        description:
          "Public Non Maintained verison of the stateball repo I maintain on my own infrastructure. This repo is for public documentation purposes only  ",
        htmlUrl: "https://github.com/matta-kelly/stateball",
        createdAt: "2026-05-01T19:45:31Z",
        languageBytes: { Python: 20249, Just: 776, Shell: 3976 },
        commitsLast12mo: 6,
      },
    ]);
    expect(unanswered).toEqual([]);
  });

  test("fails with the call and the status, and nothing else, when GitHub answers with a failure", async () => {
    // GitHub answers 401 to a token it does not know.
    githubAnswers(wrongToken);

    await expect(fetchActivity()).rejects.toThrow(new Error("GitHub /graphql: 401"));
    expect(unanswered).toEqual([]);
  });

  test("fails with the message of GitHub when the answer has status 200 and holds errors", async () => {
    // GitHub was asked for a login that no user has, which the client never asks for.
    // The answer has the form of every failure of a GraphQL query: status 200, and a list of errors.
    // So it is given here for the call the client does make.
    githubAnswers(noSuchUser, activity.request.variables);

    await expect(fetchActivity()).rejects.toThrow(
      new Error(
        "GitHub /graphql: Could not resolve to a User with the login of 'matta-kelly-no-such-user'.",
      ),
    );
    expect(unanswered).toEqual([]);
  });

  test("fails with the name of the missing value, and calls nothing, when the site has no token", async () => {
    vi.stubEnv("GITHUB_API_TOKEN", "");
    githubAnswers(activity);
    const calls = vi.spyOn(globalThis, "fetch");

    await expect(fetchActivity()).rejects.toThrow(new Error("GITHUB_API_TOKEN is not set"));
    expect(calls).not.toHaveBeenCalled();
  });
});
