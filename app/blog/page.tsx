import Link from 'next/link';

const notes = [
  {
    title: 'README and reproducible demo',
    description: 'Project overview, verified scope, local setup, and CI smoke path.',
    href: 'https://github.com/abhisek343/AIScrape#readme',
  },
  {
    title: 'System design',
    description: 'Queue semantics, execution planning, persistence, browser safety, and scaling boundaries.',
    href: 'https://github.com/abhisek343/AIScrape/blob/master/SYSTEM_DESIGN.md',
  },
  {
    title: 'Operations',
    description: 'Compose runtime, queue behavior, deployment notes, rollback, and target policy.',
    href: 'https://github.com/abhisek343/AIScrape/blob/master/docs/OPERATIONS.md',
  },
  {
    title: 'Development notes',
    description: 'How workflow tasks and parameter types are extended and verified.',
    href: 'https://github.com/abhisek343/AIScrape/blob/master/docs/DEVELOPMENT.md',
  },
];

export default function Blog() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 max-w-screen-2xl">
          <Link href="/" className="text-2xl font-bold text-primary">AIScrape</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">&larr; Back to Home</Link>
        </div>
      </header>
      <main className="container py-12 md:py-20 max-w-4xl">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">Engineering notes</h1>
        <p className="text-muted-foreground mb-10">
          Technical documentation for the implementation and its reproducible execution path.
        </p>
        <div className="grid gap-4">
          {notes.map((note) => (
            <Link
              key={note.title}
              href={note.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border p-6 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <h2 className="text-xl font-semibold">{note.title}</h2>
              <p className="mt-2 text-muted-foreground">{note.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
