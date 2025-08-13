import nextDynamic from 'next/dynamic';

export const dynamic = 'force-static';

const Header = nextDynamic(() => import('@/components/landing/header'));
const Hero = nextDynamic(() => import('@/components/landing/hero'));
// Below-the-fold sections are dynamically imported to reduce initial payload
const BrandLogos = nextDynamic(() => import('@/components/landing/brand-logos'), { ssr: false });
const Features = nextDynamic(() => import('@/components/landing/features'), { ssr: false });
const UseCases = nextDynamic(() => import('@/components/landing/use-cases'), { ssr: false });
const Showcase = nextDynamic(() => import('@/components/landing/showcase'), { ssr: false });
const CodePreview = nextDynamic(() => import('@/components/landing/code-preview'), { ssr: false });
const HowItWorks = nextDynamic(() => import('@/components/landing/how-it-works'), { ssr: false });
const FAQ = nextDynamic(() => import('@/components/landing/faq'), { ssr: false });
const CTA = nextDynamic(() => import('@/components/landing/cta'), { ssr: false });
const Footer = nextDynamic(() => import('@/components/landing/footer'));

export default function LandingPage() {
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
