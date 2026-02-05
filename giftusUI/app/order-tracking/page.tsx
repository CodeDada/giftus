'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

interface OrderTracking {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderStatus: string;
  paymentStatus: string;
  deliveryAddress: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  statusHistory: Array<{
    id: number;
    previousStatus: string | null;
    newStatus: string;
    changedAt: string;
    notes?: string;
  }>;
}

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId.trim()) {
      setError('Please enter an Order ID');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Order not found. Please check your Order ID.');
      }

      const orderData = await response.json();
      setOrder(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusStep = (status: string): number => {
    const steps: { [key: string]: number } = {
      'pending': 0,
      'confirmed': 1,
      'shipped': 2,
      'delivered': 3,
      'cancelled': -1
    };
    return steps[status?.toLowerCase()] ?? 0;
  };

  const statuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];
  const currentStep = order ? getStatusStep(order.orderStatus) : -1;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Track Your Order</h1>
          <p className="text-gray-600 mb-8">Enter your Order ID to see the status and tracking information</p>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order ID
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter your Order ID (e.g., 123)"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 px-8"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && searched && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to find order</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Order Found Message */}
          {searched && !error && !order && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <p className="text-yellow-700">Searching for order...</p>
            </div>
          )}

          {/* Order Tracking Information */}
          {order && (
            <div className="space-y-8">
              {/* Order Header */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">ORDER ID</p>
                    <p className="text-2xl font-bold text-gray-900">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">ORDER NUMBER</p>
                    <p className="text-lg font-mono text-gray-900 break-all">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">ORDER DATE</p>
                    <p className="text-lg text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">TOTAL AMOUNT</p>
                    <p className="text-2xl font-bold text-blue-600">₹{Math.round(order.totalAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-8">Order Status</h2>

                {/* Status Progress Bar */}
                {order.orderStatus !== 'Cancelled' && (
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      {statuses.map((status, index) => (
                        <div key={status} className="flex items-center flex-1">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                              index <= currentStep
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}
                          >
                            {index < currentStep ? '✓' : index + 1}
                          </div>
                          {index < statuses.length - 1 && (
                            <div
                              className={`flex-1 h-1 mx-2 ${
                                index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 font-medium">
                      {statuses.map((status) => (
                        <span key={status}>{status}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status History */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Status Timeline</h3>
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    <div className="space-y-3">
                      {order.statusHistory.map((history, index) => (
                        <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                              ✓
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {history.newStatus || 'Status Updated'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(history.changedAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {history.notes && (
                              <p className="text-sm text-gray-700 mt-1">{history.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No status updates yet.</p>
                  )}
                </div>

                {/* Current Status Badge */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium mb-2">CURRENT STATUS</p>
                  <div className="flex items-center justify-between">
                    <span className={`inline-block px-4 py-2 rounded-full font-semibold text-sm border ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                    <span className={`inline-block px-4 py-2 rounded-full font-semibold text-sm border ${getStatusColor(order.paymentStatus)}`}>
                      Payment: {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer & Delivery Information */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Customer Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-600">Name:</span> <span className="text-gray-900 font-medium">{order.customerName}</span></p>
                      <p><span className="text-gray-600">Email:</span> <span className="text-gray-900 font-medium">{order.customerEmail}</span></p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Delivery Address</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{order.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items ({order.items.length})</h2>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Product ID: {item.productId}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                        <p className="text-sm text-gray-600">₹{item.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 flex-wrap">
                <Link href="/">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Continue Shopping
                  </Button>
                </Link>
                <button
                  onClick={() => {
                    setOrderId('');
                    setOrder(null);
                    setError('');
                    setSearched(false);
                  }}
                  className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                >
                  Track Another Order
                </button>
              </div>
            </div>
          )}

          {/* No Search Yet */}
          {!searched && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2m4-4l2 2M9 5a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
              <p className="text-gray-600 text-lg">Enter your Order ID above to get started</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
