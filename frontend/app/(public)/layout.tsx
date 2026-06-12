import PublicNav from '@/components/public/PublicNav';
import PublicFooterSlot from '@/components/public/PublicFooterSlot';
import RevealObserver from '@/components/public/RevealObserver';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="psite-shell">
      <PublicNav />
      <main className="psite-main">
        <RevealObserver />
        {children}
      </main>
      <PublicFooterSlot />
    </div>
  );
}
