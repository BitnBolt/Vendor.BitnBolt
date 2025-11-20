'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

type PaymentSummary = {
  totalGross: number;
  released: number;
  pending: number;
  refunds: number;
  codAmount: number;
  prepaidAmount: number;
};

type PayableRow = {
  orderId: string;
  status: string;
  paymentMethod: string;
  amount: number;
  updatedAt?: string;
  deliveredAt?: string;
};

export default function PaymentsPage() {
  const { isAuthenticated, loading: authLoading, makeAuthenticatedRequest } = useAuth();
  const [summary, setSummary] = useState<PaymentSummary>({
    totalGross: 0,
    released: 0,
    pending: 0,
    refunds: 0,
    codAmount: 0,
    prepaidAmount: 0,
  });
  const [receivables, setReceivables] = useState<PayableRow[]>([]);
  const [settlements, setSettlements] = useState<PayableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }),
    []
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await makeAuthenticatedRequest('/api/vendor/payments/summary');
        if (!res.ok) {
          throw new Error('Failed to load payout data');
        }
        const data = await res.json();
        setSummary(data.summary);
        setReceivables(data.receivables || []);
        setSettlements(data.settlements || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payout data');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [isAuthenticated, makeAuthenticatedRequest]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments & Payouts</h1>
          <p className="text-gray-500">Track settlements, receivables, and payment mix</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition">
          Download Statement
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">Loading payouts...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Gross Sales" value={currencyFormatter.format(summary.totalGross)} accent="bg-indigo-100 text-indigo-700" />
            <SummaryCard title="Released" value={currencyFormatter.format(summary.released)} accent="bg-green-100 text-green-700" />
            <SummaryCard title="Pending" value={currencyFormatter.format(summary.pending)} accent="bg-amber-100 text-amber-700" />
            <SummaryCard title="Refunds/Returns" value={currencyFormatter.format(summary.refunds)} accent="bg-rose-100 text-rose-700" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment Mix</h2>
              <p className="text-sm text-gray-500 mb-4">COD vs prepaid breakdown</p>
              <div className="space-y-4">
                <MixRow label="Prepaid" amount={summary.prepaidAmount} total={summary.totalGross} color="bg-green-500" currencyFormatter={currencyFormatter} />
                <MixRow label="Cash on Delivery" amount={summary.codAmount} total={summary.totalGross} color="bg-indigo-500" currencyFormatter={currencyFormatter} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Settlement Health</h2>
              <p className="text-sm text-gray-500 mb-4">Quick glance metrics</p>
              <div className="grid grid-cols-2 gap-4">
                <HealthCard label="Receivables" value={receivables.length} helper="Orders awaiting settlement" />
                <HealthCard label="Settled Orders" value={settlements.length} helper="Last 10 delivered orders" />
                <HealthCard label="Pending %" value={percentage(summary.pending, summary.totalGross)} helper="Pending / Gross" />
                <HealthCard label="COD %" value={percentage(summary.codAmount, summary.totalGross)} helper="COD / Gross" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TableCard title="Receivables" subtitle="Orders yet to settle" rows={receivables} currencyFormatter={currencyFormatter} empty="All clear – no pending payouts." />
            <TableCard title="Recent Settlements" subtitle="Delivered orders" rows={settlements} currencyFormatter={currencyFormatter} empty="No settled orders recorded yet." />
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value, accent }: { title: string; value: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-5 space-y-2">
      <span className={`inline-flex text-xs font-semibold px-2 py-1 rounded-full ${accent}`}>{title}</span>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function MixRow({
  label,
  amount,
  total,
  color,
  currencyFormatter,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
  currencyFormatter: Intl.NumberFormat;
}) {
  const pct = total === 0 ? 0 : Math.round((amount / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        <span>
          {currencyFormatter.format(amount)} ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function HealthCard({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value ?? 0}</p>
      <p className="text-xs text-gray-400">{helper}</p>
    </div>
  );
}

function percentage(amount: number, total: number) {
  if (!total) return 0;
  return Math.round((amount / total) * 100);
}

function TableCard({
  title,
  subtitle,
  rows,
  currencyFormatter,
  empty,
}: {
  title: string;
  subtitle: string;
  rows: PayableRow[];
  currencyFormatter: Intl.NumberFormat;
  empty: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <button className="text-xs text-indigo-600 hover:text-indigo-700">View all</button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{empty}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.orderId} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">#{row.orderId}</p>
                  <p className="text-xs text-gray-400">
                    {row.updatedAt || row.deliveredAt
                      ? new Date(row.updatedAt || row.deliveredAt || '').toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                  {row.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Method: <span className="font-semibold text-gray-700">{row.paymentMethod?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="text-sm font-bold text-indigo-600">{currencyFormatter.format(row.amount)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}