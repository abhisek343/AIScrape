import Link from 'next/link';

export default function TermsOfService() {
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
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Terms of Service</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>
            By using AIScrape, you are agreeing to be bound by the following terms and conditions.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">1. Account Terms</h2>
          <p>
            You must be 18 years or older to use this Service. You must provide your legal full name, a valid email address, and any other information requested in order to complete the signup process. You are responsible for maintaining the security of your account and password. AIScrape cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">2. Service Usage</h2>
          <p>
            You may not use the Service for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws). We reserve the right to refuse service to anyone for any reason at any time.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">3. Payment and Refunds</h2>
          <p>
            A valid credit card is required for paying accounts. The Service is billed in advance on a monthly basis and is non-refundable. There will be no refunds or credits for partial months of service, upgrade/downgrade refunds, or refunds for months unused with an open account.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">4. Modifications to the Service and Prices</h2>
          <p>
            AIScrape reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. Prices of all Services, including but not limited to monthly subscription plan fees to the Service, are subject to change upon 30 days notice from us.
          </p>
          <p>
            These terms are effective as of 7 June 2025.
          </p>
        </div>
      </main>
    </div>
  );
}
