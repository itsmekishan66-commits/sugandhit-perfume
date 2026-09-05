import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { backendUrl, currency } from "../config";
import { toast } from "react-toastify";

const NotePills = ({ title, notes }) => (
  <div className="mb-2">
    <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">{title}</p>
    <div className="flex flex-wrap gap-1">
      {notes.map((n, i) => (
        <span key={i} className="text-[11px] bg-gradient-to-r from-[#fdf6ef] to-[#f7e8ef] border border-orange-100 rounded-full px-2.5 py-1 text-[#7c2d12]">
          {n}
        </span>
      ))}
    </div>
  </div>
);

NotePills.propTypes = {
  title: PropTypes.string,
  notes: PropTypes.array
};

const CustomOrders = ({ token }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(backendUrl + "/api/custom-order/list", {
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
      toast.error(error.message);
    }
  }, [token]);

  const statusHandler = async (event, orderId) => {
    try {
      const response = await fetch(backendUrl + '/api/custom-order/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ orderId, status: event.target.value })
      });
      if (response.data.success) {
        await fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || error?.response?.data?.message);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  return (
    <div className="bg-white rounded-2xl p-8 border border-orange-100 shadow-sm">
      <h3 className="text-xl font-semibold text-[#7c2d12] mb-1">Custom Perfume Orders ({orders.length})</h3>
      <p className="text-xs text-gray-400 mb-4">Customized signature scents ordered by customers</p>
      <div>
        {orders.length === 0 && <p className="text-center text-gray-400 py-8">No custom orders yet.</p>}
        {orders.map((order) => (
          <div key={order._id} className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-start border border-orange-100 p-6 my-3 text-sm text-gray-700 rounded-2xl shadow-sm bg-gradient-to-br from-white to-[#fdf6ef]/40">
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-[#7c2d12]">✨ {order.name || 'Custom Perfume'}</p>
                <span className="text-[11px] bg-[#7c2d12] text-white rounded-full px-2.5 py-1">{order.bottleSize}</span>
              </div>
              <NotePills title="Top Notes" notes={order.topNotes} />
              <NotePills title="Heart Notes" notes={order.heartNotes} />
              <NotePills title="Base Notes" notes={order.baseNotes} />
              <p className="text-xs mt-2">🫧 Base: <span className="text-gray-800 font-medium">{order.perfumeBase}</span> · {order.strengthName || order.strength}</p>
              {order.customLabel && <p className="text-xs mt-1">🏷️ Label: <span className="text-gray-800 font-medium">{order.customLabel}</span></p>}
              <p className="font-semibold mt-3 text-gray-800">
                {order.address.firstName} {order.address.lastName}
              </p>
              <p className="text-gray-500 text-xs">{order.address.location}, {order.address.city}, {order.address.district} · {order.address.phone}</p>
              <p className="text-gray-400 text-xs mt-1">📅 {new Date(order.date).toLocaleDateString()} · {order.paymentMethod}</p>
            </div>

            <div className="flex flex-col gap-3 items-start lg:items-end">
              <p className="font-semibold text-[#7c2d12] text-lg">{currency} {order.amount}</p>
              <select onChange={(event) => statusHandler(event, order._id)} className="border border-orange-200 bg-orange-50 text-[#7c2d12] rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#C586A5] cursor-pointer text-xs" value={order.status}>
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

CustomOrders.propTypes = {
  token: PropTypes.string
};

export default CustomOrders;