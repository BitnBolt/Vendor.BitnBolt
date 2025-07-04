export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to your Vendor Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <div className="text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold">123</div>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <div className="text-gray-500">Pending Orders</div>
          <div className="text-2xl font-bold">8</div>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <div className="text-gray-500">Revenue</div>
          <div className="text-2xl font-bold">₹12,300</div>
        </div>
      </div>
    </div>
  );
}
