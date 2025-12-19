import Link from 'next/link';

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>
            Your privacy is important to us. It is AIScrape's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.
          </p>
          <p>
            {`The information we collect may include your name, email address, payment information, and how you use our services. We use this information to create and manage your account, provide customer support, and improve our services.`}
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect in various ways, including to:
          </p>
          <ul>
            <li>Provide, operate, and maintain our website</li>
            <li>Improve, personalize, and expand our website</li>
            <li>Understand and analyze how you use our website</li>
            <li>Develop new products, services, features, and functionality</li>
            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
            <li>Process your transactions</li>
            <li>Find and prevent fraud</li>
          </ul>
          <h2 className="text-2xl font-bold mt-8 mb-4">3. Security</h2>
          <p>
            We are committed to protecting your personal information and have implemented appropriate technical and organizational measures to ensure its security. However, no method of transmission over the Internet or method of electronic storage is 100% secure, and we cannot guarantee its absolute security.
          </p>
          <h2 className="text-2xl font-bold mt-8 mb-4">4. Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
          </p>
          <p>
            This policy is effective as of 7 June 2025.
          </p>
        </div>
      </main>
    </div>
  );
}
