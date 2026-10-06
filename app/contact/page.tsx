import Link from 'next/link';

export default function Contact() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 max-w-screen-2xl">
          <Link href="/" className="text-2xl font-bold text-primary">AIScrape</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">&larr; Back to Home</Link>
        </div>
      </header>
      <main className="container py-12 md:py-20 max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Project contact</h1>
        <div className="rounded-xl border p-6 bg-muted/20">
          <p className="text-muted-foreground">
            AIScrape is maintained as a public engineering project. For reproducible bugs, implementation questions, or repository feedback, use GitHub Issues so the discussion can stay attached to the code and relevant commit.
          </p>
          <Link
            href="https://github.com/abhisek343/AIScrape/issues"
            target="_blank"
            rel="noreferrer"
            className="inline-flex mt-5 font-medium text-primary hover:underline"
          >
            Open GitHub Issues &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
