import PublicNav from '@/components/public/PublicNav';
import PublicFooterSlot from '@/components/public/PublicFooterSlot';
import RevealObserver from '@/components/public/RevealObserver';
import MetaPixel from '@/components/MetaPixel';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="psite-shell">
      <MetaPixel />
      <PublicNav />
      <main className="psite-main">
        <RevealObserver />
        {children}
      </main>
      <PublicFooterSlot />
    </div>
  );
}
