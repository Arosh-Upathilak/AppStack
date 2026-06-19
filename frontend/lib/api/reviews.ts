import { delay } from './client';
import type { Review } from './types';

export async function createReview(
  _productId: string,
  _data: Pick<Review, 'rating' | 'body'>
): Promise<Review> {
  return delay({
    id: 'new-' + Date.now(),
    productId: _productId,
    authorName: 'You',
    authorRole: 'Verified buyer',
    rating: _data.rating,
    body: _data.body,
    createdAt: new Date().toISOString().slice(0, 10),
  });
}
