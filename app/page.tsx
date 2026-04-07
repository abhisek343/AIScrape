import ScrollProgress from '@/components/landing/scroll-progress';
import NoiseTexture from '@/components/landing/noise-texture';
import Header from '@/components/landing/header';
import Hero from '@/components/landing/hero';
import BrandLogos from '@/components/landing/brand-logos';
import Features from '@/components/landing/features';
import UseCases from '@/components/landing/use-cases';
import Showcase from '@/components/landing/showcase';
import CodePreview from '@/components/landing/code-preview';
import HowItWorks from '@/components/landing/how-it-works';
import Testimonials from '@/components/landing/testimonials';
import FAQ from '@/components/landing/faq';
import CTA from '@/components/landing/cta';
import Footer from '@/components/landing/footer';
import DiagonalDivider from '@/components/landing/diagonal-divider';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <ScrollProgress />
      <NoiseTexture />
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <BrandLogos />
          <DiagonalDivider />
          <Features />
          <DiagonalDivider flip />
          <Showcase />
          <DiagonalDivider />
          <UseCases />
          <DiagonalDivider flip />
          <CodePreview />
          <HowItWorks />
          <Testimonials />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
