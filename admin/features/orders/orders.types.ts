// Types local to the orders feature.
// Props interfaces stay inline in their component files.

export interface OrderItem {
  name: string;
  quantity: number;
  subCategory?: string;
  price: string | number;
  image?: string[];
}

export interface OrderAddress {
  firstName: string;
  lastName: string;
  location: string;
  city: string;
  district: string;
  phone: string;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  address: OrderAddress;
  date: string | number;
  paymentMethod: string;
  payment?: boolean;
  amount: string | number;
  status: string;
}
