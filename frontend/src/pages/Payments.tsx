import React, { useEffect, useState } from "react";
import api from "../api";
import BackButton from "../components/BackButton";

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    api.get("/payments/").then((res) => setPayments(res.data));
  }, []);

  const handlePay = async () => {
    // create a simple payment for demo
    const resp = await api.post("/payments/", {
      amount: "100.00",
      reference: `ref-${Date.now()}`,
      status: "pending",
    });
    if (resp.data.paystack_response?.data?.authorization_url) {
      window.location.href = resp.data.paystack_response.data.authorization_url;
    }
  };

  return (
    <div>
      <div className="mb-4">
        <BackButton />
      </div>
      <h2 className="text-2xl font-bold">Payments</h2>
      <button
        onClick={handlePay}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
      >
        Pay 100
      </button>
      <ul className="mt-4 space-y-2">
        {payments.map((p) => (
          <li key={p.id}>
            {p.amount} - {p.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Payments;
