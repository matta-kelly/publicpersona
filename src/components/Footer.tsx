export default function Footer() {
  return (
    <footer className="border-t border-black/5 dark:border-white/10 mt-12">
      <div className="mx-auto max-w-3xl px-6 py-6 flex items-center justify-between text-sm text-muted">
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
