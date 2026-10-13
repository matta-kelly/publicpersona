"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { isActiveLink } from "@/lib/nav";
import { twMerge } from "tailwind-merge";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/photos", label: "Photos" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black/5 dark:border-white/10">
      <nav className="column flex flex-wrap items-center gap-x-6 py-3 text-sm">
        <Link href="/" className="tap mr-auto font-medium">
          Matthew Kelly
        </Link>
        <ul className="text-muted order-last -mx-3 flex w-full sm:order-none sm:w-auto">
          {links.map((l) => {
            const active = isActiveLink(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={twMerge(
                    "tap hover:text-foreground px-3",
                    active && "text-foreground underline underline-offset-4",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex">
          <a
            href="https://github.com/matta-kelly"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="tap text-muted hover:text-foreground justify-center rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <GitHubIcon />
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

function GitHubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}
