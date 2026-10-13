/** Whether the link to `href` is the active one on the page at `pathname`. */
export function isActiveLink(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
