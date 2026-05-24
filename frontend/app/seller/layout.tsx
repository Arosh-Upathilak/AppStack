import { requireSeller } from "@/utils/SellerAuth";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSeller();

  return <>{children}</>;
}
