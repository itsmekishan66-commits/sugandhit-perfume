// Types local to the custom-orders feature.
// Props interfaces stay inline in their component files.

export interface CustomOrderAddress {
  firstName?: string;
  lastName?: string;
  location?: string;
  city?: string;
  district?: string;
  phone?: string;
}

export interface CustomOrder {
  _id: string;
  name?: string;
  bottleSize?: string;
  bottleType?: string;
  topNotes?: { name?: string; icon?: string }[];
  heartNotes?: { name?: string; icon?: string }[];
  baseNotes?: { name?: string; icon?: string }[];
  perfumeBase?: string;
  strengthName?: string;
  strength?: string;
  customLabel?: string;
  address: CustomOrderAddress;
  date: string | number;
  paymentMethod: string;
  amount: number | string;
  status: string;
}
