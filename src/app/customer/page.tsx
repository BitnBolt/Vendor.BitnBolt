'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

type Customer = {
  userId: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  orderCount: number;
  lastOrderDate: string;
  totalSpent: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export default function CustomerPage() {
  const { isAuthenticated, loading: authLoading, makeAuthenticatedRequest } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 1 });
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

  const loadCustomers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await makeAuthenticatedRequest(`/api/vendor/customers?page=${page}&limit=${pagination.limit}`);
      if (!res.ok) {
        throw new Error('Failed to load customers');
      }
      const data = await res.json();
      setCustomers(data.customers || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">See who buys from you and how often they return</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Export CSV</button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700">Send Campaign</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">
          No customers found. Start selling to build your customer base.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <Th label="Customer" />
                  <Th label="Orders" />
                  <Th label="Total Spent" />
                  <Th label="Last Order" />
                  <Th label="Contact" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.userId}>
                    <Td>
                      <div>
                        <p className="font-semibold text-gray-900">{customer.name || 'Customer'}</p>
                        <p className="text-xs text-gray-400">ID: {customer.userId.slice(-6)}</p>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-sm font-semibold text-gray-900">{customer.orderCount}</p>
                    </Td>
                    <Td>
                      <p className="text-sm font-semibold text-indigo-600">{currencyFormatter.format(customer.totalSpent)}</p>
                    </Td>
                    <Td>
                      <p className="text-sm text-gray-600">
                        {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '—'}
                      </p>
                    </Td>
                    <Td>
                      <div className="text-sm text-gray-600">
                        <p>{customer.email || '—'}</p>
                        <p>{customer.phoneNumber || '—'}</p>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => loadCustomers(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => loadCustomers(Math.min(pagination.pages, pagination.page + 1))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ label }: { label: string }) {
  return (
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {label}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{children}</td>;
}