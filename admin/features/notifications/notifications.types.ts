// Types local to the notifications feature.
// Props interfaces stay inline in their component files.

export interface Notification {
  _id: string;
  userId?: number | null;
  type:'order' |'promo' |'sale' |'system';
  title: string;
  message: string;
  link?: string;
  createdAt: number;
}
