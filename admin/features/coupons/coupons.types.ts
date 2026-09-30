// Types local to the coupons feature.
// Props interfaces stay inline in their component files.

export interface Coupon {
  _id: string;
  code: string;
  title: string;
  description: string;
  image: string;
  discountType:'percent' |'flat';
  discountValue: number | string;
  minPurchase: number | string;
  active: boolean;
  validTill: number;
}
