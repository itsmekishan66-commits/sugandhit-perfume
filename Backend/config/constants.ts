export const APP_NAME = 'Sugandhit';

// Hard cap applied to ?limit= by the pagination middleware; clients cannot request
// more than this many records per page. Internal exports pass larger limits
// straight to services and are unaffected.
export const MAX_PAGE_SIZE = 250;
export const DEFAULT_PAGE_SIZE = 60;

export const ORDER_STATUSES = [
  'Order Placed',
  'Packing',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Cancelled',
] as const;

export const CLOUDINARY_FOLDER = 'sugandhit';
