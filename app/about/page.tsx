import Link from 'next/link';

export default function AboutUs() {
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
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">About Us</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>
            Welcome to AIScrape, your go-to solution for automated data extraction. Our mission is to simplify web scraping by providing a powerful, intuitive platform that enables you to build, manage, and scale complex workflows with ease.
          </p>
          <p>
            At AIScrape, we believe that data is the key to unlocking insights and driving innovation. That's why we've developed a suite of tools that empower you to collect data efficiently and securely. Whether you're a developer, a data analyst, or a business owner, our platform is designed to meet your needs.
          </p>
          <p>
            Our team is passionate about technology and dedicated to providing our users with the best possible experience. We are constantly working to improve our platform and add new features to help you stay ahead of the curve.
          </p>
        </div>
      </main>
    </div>
  );
}
