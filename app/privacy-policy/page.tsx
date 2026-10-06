import Link from 'next/link';

export default function PrivacyNote() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 max-w-screen-2xl">
          <Link href="/" className="text-2xl font-bold text-primary">AIScrape</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">&larr; Back to Home</Link>
        </div>
      </header>
      <main className="container py-12 md:py-20 max-w-4xl">
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Demo privacy note</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>
            AIScrape is a reference implementation, not a published privacy policy for a commercial hosted service. Data handling depends on the operator and configuration of a deployed instance.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">Local demo</h2>
          <p>
            The Docker Compose demo uses local PostgreSQL, Redis, and Chromium. The checked-in environment file contains non-secret placeholders. Do not place production credentials in source control.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">Optional providers</h2>
          <p>
            Deployments may connect Clerk for authentication, Stripe for billing, Google Gemini for AI features, or a remote browser provider. Those services have their own data-handling terms and should be configured with deployment-owned credentials.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">Operator responsibility</h2>
          <p>
            Anyone deploying AIScrape for real users is responsible for defining an accurate privacy notice for that deployment, including retention, logging, provider use, legal basis, and user rights applicable to their jurisdiction.
          </p>
        </div>
      </main>
    </div>
  );
}
