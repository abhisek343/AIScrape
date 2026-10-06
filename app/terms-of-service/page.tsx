import Link from 'next/link';

export default function ResponsibleUse() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 max-w-screen-2xl">
          <Link href="/" className="text-2xl font-bold text-primary">AIScrape</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">&larr; Back to Home</Link>
        </div>
      </header>
      <main className="container py-12 md:py-20 max-w-4xl">
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Responsible use & project scope</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>
            This page documents the intended use of the reference implementation; it is not a commercial subscription agreement.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">Authorized targets only</h2>
          <p>
            Use browser automation only on targets you are authorized to access and automate. Respect applicable law, site terms, robots directives, authentication boundaries, rate limits, and requests to stop automation.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">Do not bypass access controls</h2>
          <p>
            AIScrape should not be used to evade authentication, CAPTCHAs, paywalls, authorization checks, or other access controls.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">No SLA or capacity guarantee</h2>
          <p>
            The repository verifies a local queue-to-browser execution path. It does not promise uptime, production capacity, provider availability, or compatibility with arbitrary websites.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">Deployments</h2>
          <p>
            Operators are responsible for their own security review, secrets management, observability, privacy disclosures, provider terms, and production testing.
          </p>
        </div>
      </main>
    </div>
  );
}
