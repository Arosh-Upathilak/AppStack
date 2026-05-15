import ProductDetail from '@/screens/ProductDetail';

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <ProductDetail productId={productId} mode="buyer" />;
}
