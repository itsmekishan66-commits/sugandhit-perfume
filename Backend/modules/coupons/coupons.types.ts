export interface SerializedCoupon {
  id: number;
  _id: string;
  code: string;
  title: string;
  description: string;
  image: string;
  discountType: string;
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  validFrom: number;
  validTill: number;
  active: boolean;
  createdAt: number;
}

export interface CouponInput {
  code: string;
  title: string;
  description?: string;
  image?: string;
  discountType: string;
  discountValue: number | string;
  minPurchase?: number | string;
  maxDiscount?: number | string | null;
  validTill: number;
}

export interface CouponUpdateInput extends Partial<CouponInput> {
  active?: boolean;
}
