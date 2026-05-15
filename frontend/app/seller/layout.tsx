import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import DashboardChrome from '@/components/DashboardChrome';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.roles.includes('SELLER')) {
    // Don't redirect if already on the onboarding page
    const headerStore = await headers();
    const pathname = headerStore.get('x-pathname') ?? headerStore.get('x-invoke-path') ?? '';
    if (!pathname.includes('/seller/onboarding')) {
      const profile = await prisma.sellerProfile.findUnique({
        where: { userId: session.user.id },
        select: { companyName: true },
      });
      if (profile && !profile.companyName) {
        redirect('/seller/onboarding');
      }
    }
  }

  return <DashboardChrome role="seller">{children}</DashboardChrome>;
}
