"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { isActiveLink } from "@/lib/nav";
import { twMerge } from "tailwind-merge";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/code", label: "Code" },
  { href: "/photos", label: "Photos" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black/5 dark:border-white/10">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 text-sm">
        <Link href="/" className="font-medium">
          Matthew Kelly
        </Link>
        <ul className="text-muted order-3 flex w-full gap-4 sm:order-none sm:ml-auto sm:w-auto sm:gap-6">
          {links.map((l) => {
            const active = isActiveLink(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={twMerge(
                    "hover:text-foreground",
                    active && "text-foreground underline underline-offset-4",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <ThemeToggle />
      </nav>
    </header>
  );
}
