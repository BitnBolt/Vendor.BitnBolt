'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

type Summary = {
  totalOrders: number;
  totalRevenue: number;
  totalItems: number;
  averageOrderValue: number;
};

type StatusBreakdown = Record<string, number>;

type TrendPoint = {
  date: string;
  revenue: number;
  orders: number;
};

type TopProduct = {
  productId: string;
  name: string;
  slug: string;
  image?: string;
  revenue: number;
  unitsSold: number;
};

type RecentOrder = {
  orderId: string;
  status: string;
  createdAt: string;
  paymentStatus?: string;
  totalAmount?: number;
  items: Array<{
    productId: string;
    quantity: number;
    finalPrice: number;
  }>;
};

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last 12 months' },
];

export default function AnalyticsPage() {
  const { isAuthenticated, loading: authLoading, makeAuthenticatedRequest } = useAuth();
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<Summary>({
    totalOrders: 0,
    totalRevenue: 0,
    totalItems: 0,
    averageOrderValue: 0,
  });
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown>({});
  const [revenueTrend, setRevenueTrend] = useState<TrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0,
      }),
    []
  );

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

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await makeAuthenticatedRequest(`/api/vendor/analytics/summary?range=${range}`);
        if (!res.ok) {
          throw new Error('Failed to load analytics');
        }
        const data = await res.json();

        setSummary(data.summary);
        setStatusBreakdown(data.statusBreakdown || {});
        setRevenueTrend(data.revenueTrend || []);
        setTopProducts(data.topProducts || []);
        setRecentOrders(data.recentOrders || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated, makeAuthenticatedRequest, range]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
          <p className="text-gray-500">Monitor your store performance and recent activity</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="range" className="text-sm text-gray-500">
            Date Range
          </label>
          <select
            id="range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Revenue" value={currencyFormatter.format(summary.totalRevenue)} accent="bg-indigo-100 text-indigo-700" />
            <SummaryCard title="Total Orders" value={numberFormatter.format(summary.totalOrders)} accent="bg-green-100 text-green-700" />
            <SummaryCard title="Items Sold" value={numberFormatter.format(summary.totalItems)} accent="bg-blue-100 text-blue-700" />
            <SummaryCard title="Avg. Order Value" value={currencyFormatter.format(summary.averageOrderValue)} accent="bg-amber-100 text-amber-700" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend */}
            <div className="bg-white rounded-xl shadow border border-gray-100 p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
                  <p className="text-sm text-gray-500">Daily revenue and order volume</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  {revenueTrend.length} data points
                </span>
              </div>
              <TrendChart data={revenueTrend} currencyFormatter={currencyFormatter} />
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
              {Object.keys(statusBreakdown).length === 0 ? (
                <p className="text-sm text-gray-500">No orders in this range.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(statusBreakdown).map(([status, count]) => (
                    <StatusRow key={status} status={status} count={count} total={summary.totalOrders} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top products */}
            <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h2>
              {topProducts.length === 0 ? (
                <p className="text-sm text-gray-500">Not enough data to rank products.</p>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product) => (
                    <div key={product.productId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">Units sold: {numberFormatter.format(product.unitsSold)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-indigo-600">
                          {currencyFormatter.format(product.revenue)}
                        </p>
                        <p className="text-xs text-gray-400">SKU {product.productId.slice(-6)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500">No recent orders in this range.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <div key={order.orderId} className="py-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">#{order.orderId}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} items
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                        <span>Payment: {order.paymentStatus || 'N/A'}</span>
                        <span className="font-semibold">
                          {currencyFormatter.format(order.totalAmount || order.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

function StatusRow({ status, count, total }: { status: string; count: number; total: number }) {
  const percentage = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span className="capitalize">{status}</span>
        <span>
          {count} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function TrendChart({ data, currencyFormatter }: { data: TrendPoint[]; currencyFormatter: Intl.NumberFormat }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No revenue data for this range.</p>;
  }

  const maxRevenue = Math.max(...data.map((point) => point.revenue));

  return (
    <div className="space-y-2">
      {data.map((point) => (
        <div key={point.date} className="flex items-center gap-3">
          <span className="w-20 text-xs font-medium text-gray-500">{point.date}</span>
          <div className="flex-1 h-8 bg-gray-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              style={{
                width: `${maxRevenue === 0 ? 0 : Math.max((point.revenue / maxRevenue) * 100, 6)}%`,
              }}
            />
          </div>
          <div className="w-28 text-right">
            <p className="text-sm font-semibold text-indigo-600">{currencyFormatter.format(point.revenue)}</p>
            <p className="text-xs text-gray-400">{point.orders} orders</p>
          </div>
        </div>
      ))}
    </div>
  );
}