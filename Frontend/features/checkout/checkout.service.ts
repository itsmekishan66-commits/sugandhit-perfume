import { api, apiFetch } from '@/services/api';
import type { CartItems } from '@/types/common';
import type { Product } from '@/types/product';
import type { OrderItemInput, OrderPlacePayload } from './checkout.types';

export function buildOrderItems(cartItems: CartItems, products: Product[]): OrderItemInput[] {
  const orderItems: OrderItemInput[] = [];
  for (const items in cartItems) {
    for (const item in cartItems[items]) {
      if (cartItems[items][item] > 0) {
        const itemInfo = structuredClone(
          products.find((product) => product._id === items)
        ) as (Product & { colors?: string; quantity?: number }) | undefined;
        if (itemInfo) {
          const variant = (itemInfo.variants || []).find((v) => v.name === item);
          const unitPrice = variant ? Number(variant.price) || Number(itemInfo.price) : Number(itemInfo.price);
          orderItems.push({
            id: itemInfo._id,
            name: itemInfo.name,
            price: unitPrice,
            size: item,
            quantity: cartItems[items][item],
            image: (itemInfo.image || [])[0] || '',
          });
        }
      }
    }
  }
  return orderItems;
}

export async function placeOrder(
  token: string,
  payload: OrderPlacePayload
): Promise<{ success: boolean; message?: string }> {
  const { data, success } = await apiFetch<{ success: boolean; message?: string }>(
    api('/api/order/place'),
    { method: 'POST', body: payload },
    token
  );
  return { success: success && !!data.success, message: data.message };
}