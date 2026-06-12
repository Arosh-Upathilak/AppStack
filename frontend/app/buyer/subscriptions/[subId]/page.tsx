import SubscriptionDetail from '@/screens/SubscriptionDetail';

export default async function Page({ params }: { params: Promise<{ subId: string }> }) {
  const { subId } = await params;
  return <SubscriptionDetail subId={subId} />;
}
