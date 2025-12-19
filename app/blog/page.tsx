import Link from 'next/link';

export default function Blog() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 max-w-screen-2xl">
          <Link href="/" className="text-2xl font-bold text-primary">
            AIScrape
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            &larr; Back to Home
          </Link>
        </div>
      </header>
      <main className="container py-12 md:py-20">
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Blog</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>
            Welcome to the AIScrape blog! Check back soon for articles, tutorials, and updates on our latest features.
          </p>
        </div>
      </main>
    </div>
  );
}
