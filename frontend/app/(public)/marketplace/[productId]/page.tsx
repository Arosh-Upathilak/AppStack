import type { Metadata } from 'next';
import { getProduct } from '@/lib/api/products';
import ProductDetail from '@/screens/ProductDetail';

export async function generateMetadata({ params }: { params: Promise<{ productId: string }> }): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) return { title: 'Product · AppStack' };
  return {
    title: `${product.name} · AppStack`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} · AppStack`,
      description: product.shortDescription,
      type: 'website',
    },
  };
}

export default async function PublicProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <ProductDetail productId={productId} mode="public" />;
}
