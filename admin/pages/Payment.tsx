import { useEffect, useState } from "react";
import { backendUrl } from "../config";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
}

const Payment = ({ token }: { token: string }) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    fetch(backendUrl + "/api/payment", { headers: { token } })
      .then((res) => res.json())
      .then((data) => setMethods(data.methods || []));
  }, [token]);

  return (
    <div className="p-8 bg-white/70 rounded-2xl border border-gold/15 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-ink mb-4">Payment Methods</h1>
      <p className="text-ink-soft mb-6">Payment gateway configuration and management.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {methods.map((m) => (
          <div key={m.id} className="rounded-2xl border border-gold/15 p-4 bg-cream">
            <h3 className="font-display text-lg font-semibold text-ink">{m.name}</h3>
            <p className="text-ink-soft">{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Payment;