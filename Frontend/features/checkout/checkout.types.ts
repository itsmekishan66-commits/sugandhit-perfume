export interface AddressForm {
  firstName: string;
  lastName: string;
  email: string;
  location: string;
  city: string;
  district: string;
  phone: string;
}

export interface OrderItemInput {
  id: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

export interface OrderPlacePayload {
  address: AddressForm;
  items: OrderItemInput[];
  amount: number;
}