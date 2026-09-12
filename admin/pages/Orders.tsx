import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { backendUrl, currency } from "../config";
import { toast } from "react-toastify";
import { orderStatusSchema } from "../validate/schemas";

interface OrderItem {
  name: string;
  quantity: number;
  subCategory?: string;
  price: string | number;
  image?: string[];
}

interface Address {
  firstName: string;
  lastName: string;
  location: string;
  city: string;
  district: string;
  phone: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  address: Address;
  date: string | number;
  paymentMethod: string;
  payment?: boolean;
  amount: string | number;
  status: string;
}

interface OrdersProps {
  token: string;
}

const Orders = ({ token }: OrdersProps) => {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchAllOrders = async () => {
    if (!token) return;

    try {
      const response = await fetch(backendUrl + "/api/order/list", {
        method: 'POST',
        headers: { token }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const statusHandler = async (event: ChangeEvent<HTMLSelectElement>, orderId: string | number) => {
    const parsed = orderStatusSchema.safeParse({ orderId, status: event.target.value });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      const response = await fetch(backendUrl + '/api/order/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(parsed.data)
      });
      const data = await response.json();
      if (data.success) {
        await fetchAllOrders();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    fetch(backendUrl + "/api/order/list", {
      method: 'POST',
      headers: { token }
    })
      .then((response) => response.json())
      .then((data) => {
        if (ignore) return;
        if (data.success) {
          setOrders(data.orders);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => toast.error((error as Error).message));
    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <div className="bg-white rounded-2xl p-8 border border-orange-100 shadow-sm">
      <h3 className="text-xl font-semibold text-[#7c2d12] mb-4">Perfume Orders ({orders.length})</h3>
      <div>
        {orders.length === 0 && <p className="text-center text-gray-400 py-8">No orders yet.</p>}
        {orders.map((order) => (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 items-start border border-orange-100 p-6 my-3 text-sm text-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white"
            key={order._id}
          >
            <div>
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 mb-2">
                  {item.image && item.image[0] && (
                    <img src={item.image[0]} className="w-10 h-10 object-cover rounded-lg" alt="" />
                  )}
                  <div>
                    <p className="flex items-center gap-2">
                      {item.name} <span className="text-xs text-gray-400">x {item.quantity}</span>
                    </p>
                    <p className="text-xs text-gray-400">{item.subCategory} · {currency}{item.price}</p>
                  </div>
                </div>
              ))}
              <p className="font-semibold mt-3 text-gray-800">
                {order.address.firstName} {order.address.lastName}
              </p>
              <p className="text-gray-500 text-xs">{order.address.location}, {order.address.city}, {order.address.district}</p>
              <p className="text-gray-500 text-xs">{order.address.phone}</p>
            </div>

            <div className="text-xs">
              <p className="mb-1">🛒 Items: {order.items.length}</p>
              <p className="mb-1">💳 {order.paymentMethod}</p>
              <p className="mb-1">💰 {order.payment ? "Paid" : "Cash on Delivery"}</p>
              <p>📅 {new Date(order.date).toLocaleDateString()}</p>
            </div>

            <p className="font-semibold text-[#7c2d12]">
              {currency} {order.amount}
            </p>

            <select
              onChange={(event) => statusHandler(event, order._id)}
              className="border border-orange-200 bg-orange-50 text-[#7c2d12] rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#C586A5] cursor-pointer text-xs"
              value={order.status}
            >
              <option value="Order Placed">Order Placed</option>
              <option value="Packing">Packing</option>
              <option value="Shipped">Shipped</option>
              <option value="Out For Delivery">Out For Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;