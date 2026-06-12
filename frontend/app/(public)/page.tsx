import type { Metadata } from 'next';
import Hero from '@/components/public/Hero';
import LogoMarquee from '@/components/public/LogoMarquee';
import StatsBand from '@/components/public/StatsBand';
import FeatureRows from '@/components/public/FeatureRows';
import SubFeatures from '@/components/public/SubFeatures';
import StepsRail from '@/components/public/StepsRail';
import Testimonials from '@/components/public/Testimonials';
import CtaBlock from '@/components/public/CtaBlock';

export const metadata: Metadata = {
  title: 'AppStack — All your SaaS subscriptions in one dashboard',
  description: 'Discover SaaS products, subscribe in a click, and manage every plan, payment and invoice from one place. For sellers: list products and integrate via REST API & webhooks.',
  openGraph: {
    title: 'AppStack — All your SaaS subscriptions in one dashboard',
    description: 'Discover, subscribe to and manage SaaS products from one dashboard. Sellers integrate via REST API and webhooks.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <StatsBand />
     {/* <FeatureRows /> */}
      <SubFeatures />
      <StepsRail />
      <Testimonials />
      <CtaBlock />
    </>
  );
}
