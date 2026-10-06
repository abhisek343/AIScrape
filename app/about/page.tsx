import Link from 'next/link';

export default function About() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 max-w-screen-2xl">
          <Link href="/" className="text-2xl font-bold text-primary">AIScrape</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">&larr; Back to Home</Link>
        </div>
      </header>
      <main className="container py-12 md:py-20 max-w-4xl">
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">About AIScrape</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>
            AIScrape is a portfolio/reference implementation of a visual browser-automation system. It combines a Next.js workflow editor with PostgreSQL persistence, Redis/BullMQ job execution, and Chromium/Puppeteer workers.
          </p>
          <p>
            The repository focuses on engineering concerns that matter once browser automation moves beyond a single request: persisted execution plans, retries and dead-letter handling, run history, target validation, robots-policy checks, per-host pacing, and a reproducible Docker Compose smoke path.
          </p>
          <p>
            Authentication, AI, billing, and remote-browser integrations are optional provider-backed paths. The checked-in CI deliberately verifies the credential-free core separately from those external services.
          </p>
          <p>
            For architecture, setup, and verification details, see the{' '}
            <Link className="text-primary hover:underline" href="https://github.com/abhisek343/AIScrape" target="_blank" rel="noreferrer">
              source repository
            </Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
