export default function Footer() {
  return (
    <footer className="mt-12 border-t border-black/5 dark:border-white/10">
      <div className="column text-muted flex items-center justify-between py-3 text-sm">
        <span>© Matthew Kelly</span>
        <ul className="-mr-2 flex">
          <li>
            <a href="mailto:mattakellyy@gmail.com" className="tap hover:text-foreground px-2">
              email
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/matthew-kelly-profile/"
              className="tap hover:text-foreground px-2"
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
