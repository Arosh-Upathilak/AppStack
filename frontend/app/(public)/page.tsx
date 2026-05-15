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
  title: 'AppStack — Subscription infrastructure for modern software teams',
  description: 'AppStack centralises every SaaS licence, invoice and renewal in one calm dashboard — so finance, IT and engineering all work from the same source of truth.',
  openGraph: {
    title: 'AppStack — Subscription infrastructure for modern software teams',
    description: 'Centralise every SaaS licence, invoice and renewal in one calm dashboard.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <StatsBand />
      <FeatureRows />
      <SubFeatures />
      <StepsRail />
      <Testimonials />
      <CtaBlock />
    </>
  );
}
