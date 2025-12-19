import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Contact() {
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
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Contact Us</h1>
        <div className="max-w-xl mx-auto">
          <p className="text-muted-foreground mb-8">
            Have a question, feedback, or need support? We're here to help! Fill out the form below, or reach out to us directly through the contact details provided. We aim to respond to all inquiries within 24-48 business hours.
          </p>
          <div className="mb-8 p-6 border rounded-lg bg-muted/30">
            <h2 className="text-xl font-semibold mb-3">Our Contact Information</h2>
            <p className="text-muted-foreground mb-1"><strong>Email:</strong> support@aiscrape-example.com</p>
            <p className="text-muted-foreground mb-1"><strong>Phone:</strong> +1 (555) 123-4567 (Mon-Fri, 9 AM - 5 PM PST)</p>
            <p className="text-muted-foreground"><strong>Address:</strong> 123 Innovation Drive, Tech City, CA 90210, USA</p>
            <p className="text-xs text-muted-foreground mt-2">(Please note: Address and phone are for illustrative purposes.)</p>
          </div>
          <h2 className="text-xl font-semibold mb-3">Send Us a Message</h2>
          <form className="space-y-4">
            <Input type="text" placeholder="Your Name" required />
            <Input type="email" placeholder="Your Email" required />
            <Textarea placeholder="Your Message" rows={5} required />
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        </div>
      </main>
    </div>
  );
}
