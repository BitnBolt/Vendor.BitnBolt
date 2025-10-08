'use client'
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Image from 'next/image';

type OrderItem = {
  productId: {
    _id: string;
    name: string;
    images: string[];
    slug: string;
    description: string;
  };
  vendorId: {
    _id: string;
    businessName: string;
    email: string;
    phone: string;
  };
  quantity: number;
  basePrice: number;
  profitMargin: number;
  discount: number;
  finalPrice: number;
};

type Order = {
  _id: string;
  orderId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  billingAddress: {
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  paymentDetails: {
    method: 'cod' | 'online';
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    transactionId?: string;
    paidAt?: Date;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
  orderSummary: {
    itemsTotal: number;
    shippingCharge: number;
    tax: number;
    totalAmount: number;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  statusHistory: Array<{
    status: string;
    comment?: string;
    updatedBy?: string;
    timestamp: Date;
  }>;
  deliveryDetails: {
    provider?: string;
    trackingId?: string;
    awbCode?: string;
    courierName?: string;
    shiprocketOrderId?: string;
    shiprocketShipmentId?: string;
    shiprocketStatus?: string;
    totalShippingCost?: number;
    vendorShipments?: Array<{
      vendorId: string;
      shiprocketOrderId?: string;
      shiprocketShipmentId?: string;
      awbCode?: string;
      courierName?: string;
      courierCompanyId?: string;
      shiprocketStatus?: string;
      createdAt?: Date;
      updatedAt?: Date;
    }>;
  };
  createdAt: Date;
  vendorSubtotal: number;
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [generatingAWB, setGeneratingAWB] = useState(false);
  const [availableCouriers, setAvailableCouriers] = useState<Array<{
    courierId: number;
    courierName: string;
    rate: number;
    estimatedDays: number;
    isRecommended: boolean;
  }>>([]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentVendorId, setCurrentVendorId] = useState<string>('');
  const [documents, setDocuments] = useState<{
    documents: {
      label?: { url: string };
      invoice?: { url: string };
      awb?: { code: string; trackUrl: string };
      manifest?: { url: string };
    };
  } | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      router.push('/auth/signin');
    } else {
      // Decode token to get vendor ID
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentVendorId(payload.vendorId || '');
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
      setIsAuthenticated(true);
    }
  }, [router]);

  // Check if this vendor has a shipment
  const hasVendorShipment = order?.deliveryDetails?.vendorShipments?.some(
    (shipment: { vendorId: string }) => String(shipment.vendorId) === String(currentVendorId)
  );

  // Get current vendor's shipment
  const currentVendorShipment = order?.deliveryDetails?.vendorShipments?.find(
    (shipment: { vendorId: string }) => String(shipment.vendorId) === String(currentVendorId)
  );

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('vendorToken');
      if (!token) {
        router.push('/auth/signin');
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/vendor/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('vendorToken');
          router.push('/auth/signin');
          return;
        }
        throw new Error('Failed to load order details');
      }
      
      const data = await res.json();
      setOrder(data.order);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);
  // Fetch order details
  useEffect(() => {
    if (isAuthenticated && orderId) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, orderId, fetchOrderDetails]);


  const updateOrderStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      setError(null);
      
      const token = localStorage.getItem('vendorToken');
      if (!token) {
        router.push('/auth/signin');
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/vendor/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          comment: `Status updated to ${newStatus} by vendor`
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('vendorToken');
          router.push('/auth/signin');
          return;
        }
        const errorData = await res.json();
        console.error('Update order error:', errorData);
        throw new Error(errorData.message || `Failed to update order (Status: ${res.status})`);
      }

      // Refresh order details
      await fetchOrderDetails();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const createShiprocketShipment = async () => {
    try {
      setCreatingShipment(true);
      setError(null);
      
      const token = localStorage.getItem('vendorToken');
      if (!token) {
        router.push('/auth/signin');
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/vendor/orders/${orderId}/shiprocket`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('vendorToken');
          router.push('/auth/signin');
          return;
        }
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create Shiprocket shipment');
      }

      const data = await res.json();
      
      // Refresh order details
      await fetchOrderDetails();
      
      // Show success message
      alert(`Shiprocket shipment created successfully! Shipment ID: ${data.shipmentId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create Shiprocket shipment');
    } finally {
      setCreatingShipment(false);
    }
  };

  const fetchAvailableCouriers = async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      if (!token) {
        router.push('/auth/signin');
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/vendor/orders/${orderId}/couriers`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('vendorToken');
          router.push('/auth/signin');
          return;
        }
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch available couriers');
      }

      const data = await res.json();
      setAvailableCouriers(data.couriers || []);
      
      // Auto-select recommended courier
      if (data.couriers && data.couriers.length > 0) {
        const recommended = data.couriers.find((c: { isRecommended: boolean }) => c.isRecommended);
        if (recommended) {
          setSelectedCourier(recommended.courierId.toString());
        } else {
          setSelectedCourier(data.couriers[0].courierId.toString());
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch available couriers');
    }
  };

  const generateAWB = async () => {
    if (!selectedCourier) {
      setError('Please select a courier');
      return;
    }

    try {
      setGeneratingAWB(true);
      setError(null);
      
      const token = localStorage.getItem('vendorToken');
      if (!token) {
        router.push('/auth/signin');
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/vendor/orders/${orderId}/awb`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ courierId: selectedCourier }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('vendorToken');
          router.push('/auth/signin');
          return;
        }
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to generate AWB');
      }

      const data = await res.json();
      
      // Refresh order details
      await fetchOrderDetails();
      
      // Show success message
      alert(`AWB generated successfully! AWB Code: ${data.awbCode}\nCourier: ${data.courierName}\nTrack URL: ${data.trackUrl}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate AWB');
    } finally {
      setGeneratingAWB(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      setError(null);
      
      const token = localStorage.getItem('vendorToken');
      if (!token) {
        router.push('/auth/signin');
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/vendor/orders/${orderId}/documents`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('vendorToken');
          router.push('/auth/signin');
          return;
        }
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch documents');
      }

      const data = await res.json();
      setDocuments(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch documents');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Order not found</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-gray-500">Order #{order.orderId}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{order.userId.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{order.userId.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{order.userId.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            <div className="space-y-2">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p>{order.shippingAddress.addressLine2}</p>
              )}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              {order.shippingAddress.landmark && (
                <p className="text-sm text-gray-500">Landmark: {order.shippingAddress.landmark}</p>
              )}
              <p className="text-sm text-gray-500">Phone: {order.shippingAddress.phoneNumber}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Image
                    src={item.productId.images?.[0] || '/next.svg'}
                    alt={item.productId.name}
                    width={80}
                    height={80}
                    className="rounded object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.productId.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{item.productId.description}</p>
                    <div className="flex gap-4 text-sm">
                      <span>Qty: {item.quantity}</span>
                      <span>Base Price: ₹{item.basePrice}</span>
                      <span>Final Price: ₹{item.finalPrice}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">₹{(item.finalPrice * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Status History</h2>
            <div className="space-y-3">
              {order.statusHistory.map((history, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(history.status).replace('bg-', 'bg-').replace('text-', '')}`}></div>
                  <div className="flex-1">
                    <p className="font-medium">{history.status.charAt(0).toUpperCase() + history.status.slice(1)}</p>
                    {history.comment && <p className="text-sm text-gray-500">{history.comment}</p>}
                    {history.updatedBy && <p className="text-xs text-gray-400">Updated by: {history.updatedBy}</p>}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(history.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.orderSummary.itemsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.orderSummary.shippingCharge === 0 ? 'Free' : `₹${order.orderSummary.shippingCharge.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST)</span>
                <span>₹{order.orderSummary.tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{order.orderSummary.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="font-medium">{order.paymentDetails.method.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.paymentDetails.status)}`}>
                  {order.paymentDetails.status.charAt(0).toUpperCase() + order.paymentDetails.status.slice(1)}
                </span>
              </div>
              {order.paymentDetails.transactionId && (
                <div className="flex justify-between">
                  <span>Transaction ID</span>
                  <span className="text-sm font-mono">{order.paymentDetails.transactionId}</span>
                </div>
              )}
              {order.paymentDetails.paidAt && (
                <div className="flex justify-between">
                  <span>Paid At</span>
                  <span className="text-sm">{new Date(order.paymentDetails.paidAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Information */}
          {order.deliveryDetails.provider && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Delivery Information</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Provider</span>
                  <span className="font-medium">{order.deliveryDetails.provider}</span>
                </div>
                {order.deliveryDetails.shiprocketOrderId && (
                  <div className="flex justify-between">
                    <span>Shiprocket Order ID</span>
                    <span className="font-mono text-sm">{order.deliveryDetails.shiprocketOrderId}</span>
                  </div>
                )}
                {order.deliveryDetails.shiprocketShipmentId && (
                  <div className="flex justify-between">
                    <span>Shiprocket Shipment ID</span>
                    <span className="font-mono text-sm">{order.deliveryDetails.shiprocketShipmentId}</span>
                  </div>
                )}
                {order.deliveryDetails.shiprocketStatus && (
                  <div className="flex justify-between">
                    <span>Shiprocket Status</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.deliveryDetails.shiprocketStatus === 'created' ? 'bg-green-100 text-green-800' :
                      order.deliveryDetails.shiprocketStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.deliveryDetails.shiprocketStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.deliveryDetails.shiprocketStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.deliveryDetails.shiprocketStatus.charAt(0).toUpperCase() + order.deliveryDetails.shiprocketStatus.slice(1)}
                    </span>
                  </div>
                )}
                {order.deliveryDetails.awbCode && (
                  <div className="flex justify-between">
                    <span>AWB Code</span>
                    <span className="font-mono text-sm">{order.deliveryDetails.awbCode}</span>
                  </div>
                )}
                {order.deliveryDetails.trackingId && (
                  <div className="flex justify-between">
                    <span>Tracking ID</span>
                    <span className="font-mono text-sm">{order.deliveryDetails.trackingId}</span>
                  </div>
                )}
                {order.deliveryDetails.courierName && (
                  <div className="flex justify-between">
                    <span>Courier</span>
                    <span className="font-medium">{order.deliveryDetails.courierName}</span>
                  </div>
                )}
                {order.deliveryDetails.totalShippingCost && (
                  <div className="flex justify-between">
                    <span>Shipping Cost</span>
                    <span className="font-medium">₹{order.deliveryDetails.totalShippingCost.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              {/* Shiprocket Shipment Button */}
              {order.status === 'confirmed' && !hasVendorShipment && (
                <button
                  onClick={createShiprocketShipment}
                  disabled={creatingShipment}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {creatingShipment ? 'Creating Shipment...' : 'Create Shiprocket Shipment'}
                </button>
              )}

              {/* Shiprocket Status */}
              {currentVendorShipment && !currentVendorShipment.awbCode && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">Shiprocket Shipment Created</p>
                    <p className="text-xs text-green-600">Order ID: {currentVendorShipment.shiprocketOrderId}</p>
                    {currentVendorShipment.shiprocketShipmentId && (
                      <p className="text-xs text-green-600">Shipment ID: {currentVendorShipment.shiprocketShipmentId}</p>
                    )}
                  </div>
                  
                  <button
                    onClick={fetchAvailableCouriers}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Available Couriers
                  </button>
                  
                  {availableCouriers.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Courier:
                      </label>
                      <select
                        value={selectedCourier}
                        onChange={(e) => setSelectedCourier(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {availableCouriers.map((courier) => (
                          <option key={courier.courierId} value={courier.courierId}>
                            {courier.courierName} - ₹{courier.rate} ({courier.estimatedDays} days) {courier.isRecommended ? '⭐ Recommended' : ''}
                          </option>
                        ))}
                      </select>
                      
                      <button
                        onClick={generateAWB}
                        disabled={generatingAWB || !selectedCourier}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {generatingAWB ? 'Generating AWB...' : 'Generate AWB'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* AWB Generated Status */}
              {currentVendorShipment?.awbCode && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">AWB Generated</p>
                  <p className="text-xs text-blue-600">AWB Code: {currentVendorShipment.awbCode}</p>
                  {currentVendorShipment.courierName && (
                    <p className="text-xs text-blue-600">Courier: {currentVendorShipment.courierName}</p>
                  )}
                  <a
                    href={`https://shiprocket.co/tracking/${currentVendorShipment.awbCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Track Package
                  </a>
                </div>
              )}

              {/* Documents Section */}
              {currentVendorShipment?.awbCode && (
                <div className="space-y-3">
                  <button
                    onClick={fetchDocuments}
                    disabled={loadingDocuments}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {loadingDocuments ? 'Loading Documents...' : 'Get Shipping Documents'}
                  </button>

                  {documents && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="text-sm font-medium text-green-800 mb-3">📦 Shipping Documents Ready</h3>
                      
                      <div className="space-y-3">
                        {documents.documents?.label && (
                          <div className="flex items-center justify-between p-2 bg-white rounded border">
                            <div>
                              <p className="text-sm font-medium">🏷️ Shipping Label</p>
                              <p className="text-xs text-gray-600">Paste this on your package</p>
                            </div>
                            <a
                              href={documents.documents.label.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Download
                            </a>
                          </div>
                        )}

                        {documents.documents?.invoice && (
                          <div className="flex items-center justify-between p-2 bg-white rounded border">
                            <div>
                              <p className="text-sm font-medium">🧾 Invoice</p>
                              <p className="text-xs text-gray-600">Include this inside the package</p>
                            </div>
                            <a
                              href={documents.documents.invoice.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Download
                            </a>
                          </div>
                        )}

                        {documents.documents?.awb && (
                          <div className="flex items-center justify-between p-2 bg-white rounded border">
                            <div>
                              <p className="text-sm font-medium">📋 AWB Code</p>
                              <p className="text-xs text-gray-600">Tracking: {documents.documents.awb.code}</p>
                            </div>
                            <a
                              href={documents.documents.awb.trackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                            >
                              Track
                            </a>
                          </div>
                        )}

                        {documents.documents?.manifest && (
                          <div className="flex items-center justify-between p-2 bg-white rounded border">
                            <div>
                              <p className="text-sm font-medium">📄 Manifest</p>
                              <p className="text-xs text-gray-600">For courier pickup</p>
                            </div>
                            <a
                              href={documents.documents.manifest.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                            >
                              Download
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800 font-medium">📝 Instructions:</p>
                        <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                          <li>• Print and paste the shipping label on the package</li>
                          <li>• Include the invoice inside the package for the customer</li>
                          <li>• Use the AWB code for tracking the shipment</li>
                          <li>• Print the manifest for courier pickup (if available)</li>
                          <li>• Ensure proper packaging and secure the label properly</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {order.status === 'pending' && (
                <button
                  onClick={() => updateOrderStatus('confirmed')}
                  disabled={updatingStatus}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Confirm Order'}
                </button>
              )}

              {order.status === 'confirmed' && (
                <button
                  onClick={() => updateOrderStatus('processing')}
                  disabled={updatingStatus}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Start Processing'}
                </button>
              )}
              
              {order.status === 'processing' && (
                <button
                  onClick={() => updateOrderStatus('shipped')}
                  disabled={updatingStatus}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Mark as Shipped'}
                </button>
              )}
              
              {order.status === 'shipped' && (
                <button
                  onClick={() => updateOrderStatus('delivered')}
                  disabled={updatingStatus}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Mark as Delivered'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 