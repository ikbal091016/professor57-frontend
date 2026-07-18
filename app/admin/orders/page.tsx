"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchOrders, refundOrder, AdminOrder } from "@/lib/admin-api";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-leaf/10 text-leaf",
  pending: "bg-lime/10 text-lime-dark",
  refunded: "bg-forest/10 text-forest/50",
  expired: "bg-forest/10 text-forest/40",
  failed: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState("");
  const [refundingId, setRefundingId] = useState<string | null>(null);

  function load() {
    fetchOrders(status || undefined, accessToken).then((res) => setOrders(res.orders));
  }

  useEffect(load, [accessToken, status]);

  async function handleRefund(orderId: string) {
    if (!confirm("Issue a refund for this order? This revokes the buyer's access immediately.")) return;
    setRefundingId(orderId);
    try {
      await refundOrder(orderId, accessToken);
      load();
    } finally {
      setRefundingId(null);
    }
  }

  return (
    <main className="p-10">
      <h1 className="font-display text-2xl text-forest">Orders</h1>

      <div className="mt-4 flex gap-2">
        {["", "paid", "pending", "refunded", "expired", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs ${status === s ? "bg-forest text-paper" : "border border-rule text-forest/60"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-rule bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-rule bg-paper text-left text-xs uppercase tracking-wide text-forest/40">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Courses</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {orders.map((o) => (
              <tr key={o._id}>
                <td className="px-4 py-3">
                  <p className="text-forest">{o.userId?.name || "—"}</p>
                  <p className="text-xs text-forest/40">{o.userId?.email}</p>
                </td>
                <td className="px-4 py-3 text-forest/60">{o.courseIds.map((c) => c.title).join(", ")}</td>
                <td className="px-4 py-3 text-forest/60">${(o.amountCents / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-forest/40">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {o.status === "paid" && (
                    <button
                      onClick={() => handleRefund(o._id)}
                      disabled={refundingId === o._id}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      {refundingId === o._id ? "Refunding…" : "Refund"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-forest/40">
                  No orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
