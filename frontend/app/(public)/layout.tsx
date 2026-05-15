import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import RevealObserver from '@/components/public/RevealObserver';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="psite-main">
        <RevealObserver />
        {children}
      </main>
      <PublicFooter />
    </>
  );
}
