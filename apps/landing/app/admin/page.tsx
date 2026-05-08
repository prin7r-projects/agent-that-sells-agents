"use client";

import { useState, useEffect, useCallback } from "react";

/* ---------------------------------------------------------------------------
   Admin Dashboard — Phase 5 (docs/13 §Phase 5)
   Read-only view of orders, licenses, and rev-share accruals.
   Auth: admin enters their ADMIN_API_KEY into localStorage for the session.
   --------------------------------------------------------------------------- */

type Order = {
  orderId: string;
  tier: string;
  agentLot?: string;
  status: "pending" | "paid" | "refunded" | "expired";
  priceAmountUsd: number;
  referralCode?: string;
  upgradeFrom?: string;
  customerEmail?: string;
  invoiceId?: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
};

type License = {
  orderId: string;
  customerEmail: string;
  agentId: string;
  tier: string;
  validUntil: string;
  revokedAt?: string;
  issuedAt: string;
};

type RevShareEntry = {
  orderId: string;
  referralCode: string;
  amountUsd: number;
  bps: number;
  createdAt: string;
};

type Tab = "orders" | "licenses" | "rev-share";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-ash/20 text-graphite",
  paid: "bg-azure/10 text-azure",
  refunded: "bg-vermilion/10 text-vermilion",
  expired: "bg-ash/20 text-ash",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("orders");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [licenseStats, setLicenseStats] = useState<any>(null);
  const [revShare, setRevShare] = useState<RevShareEntry[]>([]);
  const [revShareStats, setRevShareStats] = useState<any>(null);

  // Load key from localStorage on mount
  useEffect(() => {
    const k = localStorage.getItem("sa_admin_key");
    if (k) setStoredKey(k);
  }, []);

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${storedKey}` }),
    [storedKey],
  );

  const fetchAll = useCallback(async () => {
    if (!storedKey) return;
    setLoading(true);
    setError(null);
    try {
      const [oRes, lRes, rRes] = await Promise.all([
        fetch("/api/admin/orders", { headers: authHeaders() }),
        fetch("/api/admin/licenses", { headers: authHeaders() }),
        fetch("/api/admin/rev-share", { headers: authHeaders() }),
      ]);

      if (oRes.status === 401 || lRes.status === 401 || rRes.status === 401) {
        setError("Invalid admin key. Please re-authenticate.");
        localStorage.removeItem("sa_admin_key");
        setStoredKey(null);
        setLoading(false);
        return;
      }

      const oData = await oRes.json();
      const lData = await lRes.json();
      const rData = await rRes.json();

      if (oData.orders) {
        setOrders(oData.orders);
        setOrderStats(oData.stats);
      }
      if (lData.licenses) {
        setLicenses(lData.licenses);
        setLicenseStats(lData.stats);
      }
      if (rData.entries) {
        setRevShare(rData.entries);
        setRevShareStats(rData.stats);
      }
    } catch (e) {
      setError("Network error fetching admin data.");
    } finally {
      setLoading(false);
    }
  }, [storedKey, authHeaders]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("sa_admin_key", apiKey.trim());
    setStoredKey(apiKey.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem("sa_admin_key");
    setStoredKey(null);
    setApiKey("");
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm(`Refund order ${orderId}? This revokes the license and reverses rev-share.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { ...authHeaders(), "content-type": "application/json" },
        body: JSON.stringify({ reason: "admin_refund" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Refund failed");
      } else {
        await fetchAll();
      }
    } catch {
      setError("Refund request failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!storedKey) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-canvas px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-apple-heading font-semibold tracking-tightest text-ink mb-2">
              StampedAgents
            </h1>
            <p className="text-graphite text-sm">Admin Dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-key" className="block text-xs font-medium text-graphite mb-1 uppercase tracking-wider">
                Admin API Key
              </label>
              <input
                id="admin-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-lg border border-silver-mist bg-white px-3 py-2 text-sm text-ink placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-azure"
                placeholder="Bearer token"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-azure px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Sign in
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <header className="border-b border-silver-mist/60 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-content px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">StampedAgents Admin</h1>
            <p className="text-xs text-graphite">Operations dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-graphite hover:text-ink transition-colors px-3 py-1.5 rounded-lg border border-silver-mist"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-content px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-vermilion/30 bg-vermilion/5 px-4 py-3 text-sm text-vermilion">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Orders" value={orderStats?.total ?? 0} />
          <StatCard label="Revenue" value={formatCurrency(orderStats?.revenueUsd ?? 0)} />
          <StatCard label="Active Licenses" value={licenseStats?.active ?? 0} />
          <StatCard label="Rev-Share Accrued" value={formatCurrency(revShareStats?.totalAccruedUsd ?? 0)} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-silver-mist/60">
          {(["orders", "licenses", "rev-share"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-azure text-azure"
                  : "border-transparent text-graphite hover:text-ink"
              }`}
            >
              {t === "orders" && "Orders"}
              {t === "licenses" && "Licenses"}
              {t === "rev-share" && "Rev-Share"}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-sm text-graphite py-8">Loading…</div>
        )}

        {!loading && tab === "orders" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver-mist text-left text-xs uppercase tracking-wider text-graphite">
                  <th className="pb-3 pr-4 font-medium">Order ID</th>
                  <th className="pb-3 pr-4 font-medium">Tier</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Created</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver-mist/40">
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-graphite">
                      No orders yet.
                    </td>
                  </tr>
                )}
                {orders.map((o) => (
                  <tr key={o.orderId} className="group">
                    <td className="py-3 pr-4 font-mono text-xs">{o.orderId}</td>
                    <td className="py-3 pr-4 capitalize">{o.tier}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status] ?? "bg-ash/20 text-ash"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{formatCurrency(o.priceAmountUsd)}</td>
                    <td className="py-3 pr-4 text-graphite">{formatDate(o.createdAt)}</td>
                    <td className="py-3 text-right">
                      {o.status === "paid" && (
                        <button
                          onClick={() => handleRefund(o.orderId)}
                          className="text-xs text-vermilion hover:underline"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tab === "licenses" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver-mist text-left text-xs uppercase tracking-wider text-graphite">
                  <th className="pb-3 pr-4 font-medium">Agent</th>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Tier</th>
                  <th className="pb-3 pr-4 font-medium">Valid Until</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver-mist/40">
                {licenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-graphite">
                      No licenses issued yet.
                    </td>
                  </tr>
                )}
                {licenses.map((l, i) => {
                  const isRevoked = !!l.revokedAt;
                  const isExpired = new Date(l.validUntil) < new Date();
                  return (
                    <tr key={`${l.orderId}-${i}`}>
                      <td className="py-3 pr-4 font-mono text-xs">{l.agentId}</td>
                      <td className="py-3 pr-4">{l.customerEmail}</td>
                      <td className="py-3 pr-4 capitalize">{l.tier}</td>
                      <td className="py-3 pr-4 text-graphite">{formatDate(l.validUntil)}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          isRevoked
                            ? "bg-vermilion/10 text-vermilion"
                            : isExpired
                            ? "bg-ash/20 text-ash"
                            : "bg-azure/10 text-azure"
                        }`}>
                          {isRevoked ? "Revoked" : isExpired ? "Expired" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tab === "rev-share" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver-mist text-left text-xs uppercase tracking-wider text-graphite">
                  <th className="pb-3 pr-4 font-medium">Order</th>
                  <th className="pb-3 pr-4 font-medium">Partner Code</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Rate</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver-mist/40">
                {revShare.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-graphite">
                      No rev-share entries yet.
                    </td>
                  </tr>
                )}
                {revShare.map((r, i) => (
                  <tr key={`${r.orderId}-${i}`}>
                    <td className="py-3 pr-4 font-mono text-xs">{r.orderId}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{r.referralCode}</td>
                    <td className={`py-3 pr-4 font-medium ${r.amountUsd < 0 ? "text-vermilion" : "text-ink"}`}>
                      {formatCurrency(r.amountUsd)}
                    </td>
                    <td className="py-3 pr-4 text-graphite">{r.bps / 100}%</td>
                    <td className="py-3 text-graphite">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-silver-mist bg-white p-4">
      <p className="text-xs uppercase tracking-wider text-graphite mb-1">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}
