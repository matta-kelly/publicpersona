export default function Footer() {
  return (
    <footer className="mt-12 border-t border-black/5 dark:border-white/10">
      <div className="text-muted mx-auto flex max-w-3xl items-center justify-between px-6 py-6 text-sm">
        <span>© Matthew Kelly</span>
        <ul className="flex gap-4">
          <li>
            <a href="mailto:mattakellyy@gmail.com" className="hover:text-foreground">
              email
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/matthew-kelly-profile/"
              className="hover:text-foreground"
              rel="noreferrer"
              target="_blank"
            >
              linkedin
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
