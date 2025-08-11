import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Header from '@/components/landing/header';
import Hero from '@/components/landing/hero';
import BrandLogos from '@/components/landing/brand-logos';
import Features from '@/components/landing/features';
import UseCases from '@/components/landing/use-cases';
import Showcase from '@/components/landing/showcase';
import CodePreview from '@/components/landing/code-preview';
import HowItWorks from '@/components/landing/how-it-works';
import FAQ from '@/components/landing/faq';
import CTA from '@/components/landing/cta';
import Footer from '@/components/landing/footer';

export default function LandingPage() {
  const { userId } = auth();

  if (userId) {
    redirect('/workflows');
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        <Hero />
        <BrandLogos />
        <Features />
        <Showcase />
        <UseCases />
        <CodePreview />
        <HowItWorks />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
