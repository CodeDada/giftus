'use client';

import React, { useState, useEffect, Suspense, useContext } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CartContext } from '@/lib/cartContext';

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  subtotal: number;
  shippingCost: number;
  gstAmount: number;
  discountAmount: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{
    productId: number;
    productName: string;
    modelNo: string;
    variantValue: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cartContext = useContext(CartContext);
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | null>(null);
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError('Order ID not found');
      setLoading(false);
      return;
    }

    // Fetch order details
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        const orderData = await response.json();
        setOrder(orderData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleCODPayment = async () => {
    if (!order) return;

    setProcessing(true);
    try {
      // Update order payment status to COD (Cash on Delivery)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${order.id}/update-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: 'Cash on Delivery',
          paymentStatus: 'Pending'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process order');
      }

      // Clear cart from context
      if (cartContext?.clearCart) {
        cartContext.clearCart();
      }

      router.push(`/order-confirmation?orderId=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      setProcessing(false);
    }
  };

  const handleUPIPayment = async () => {
    if (!order || !upiId.trim()) {
      setError('Please enter a UPI ID');
      return;
    }

    // Validate UPI ID format
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiRegex.test(upiId)) {
      setError('Please enter a valid UPI ID (e.g., yourname@bankname)');
      return;
    }

    setProcessing(true);
    try {
      // Update order with UPI details
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${order.id}/update-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: 'UPI',
          upiId: upiId,
          paymentStatus: 'Pending'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process UPI payment');
      }

      // In a real scenario, you would integrate with a UPI payment gateway here
      // For now, we'll show a success message
      alert(`Please pay ₹${order.totalAmount} to UPI: ${upiId}\n\nAfter payment, your order will be confirmed.`);
      
      // Clear cart from context
      if (cartContext?.clearCart) {
        cartContext.clearCart();
      }

      router.push(`/order-confirmation?orderId=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process UPI payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <h2 className="text-xl font-semibold text-red-900 mb-4">Error</h2>
              <p className="text-red-700 mb-6">{error || 'Order not found'}</p>
              <Link href="/cart">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Back to Cart
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">Payment</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Methods */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-xl font-semibold mb-6 text-gray-900">Select Payment Method</h2>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Cash on Delivery Option */}
                  <div
                    onClick={() => {
                      setPaymentMethod('cod');
                      setError('');
                    }}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition ${
                      paymentMethod === 'cod'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'cod' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'cod' && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Cash on Delivery (COD)</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Pay when your order arrives at your doorstep
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* UPI Option */}
                  <div
                    onClick={() => {
                      setPaymentMethod('upi');
                      setError('');
                    }}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition ${
                      paymentMethod === 'upi'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'upi' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {paymentMethod === 'upi' && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Direct UPI Transfer</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Transfer payment directly to our UPI ID
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Razorpay Option (Coming Soon) */}
                  <div
                    className="p-6 border-2 border-gray-200 rounded-lg opacity-60 cursor-not-allowed relative"
                  >
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                      Coming Soon
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-500">Razorpay</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Online payment through Razorpay (Coming soon)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* UPI Input Field */}
                  {paymentMethod === 'upi' && (
                    <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Our UPI ID
                      </label>
                      <div className="p-3 bg-white border border-gray-300 rounded-lg text-center font-mono text-lg text-gray-900 mb-4 select-all">
                        trophybazaar@upi
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Please transfer ₹{order.totalAmount} to the UPI ID above and enter your UPI ID below for confirmation
                      </p>
                      <Input
                        type="text"
                        placeholder="Your UPI ID (e.g., yourname@bankname)"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        disabled={processing}
                        className="mb-2"
                      />
                      <p className="text-xs text-gray-500">
                        Enter your UPI ID so we can verify your payment
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Button */}
                <div className="mt-8">
                  <Button
                    onClick={paymentMethod === 'cod' ? handleCODPayment : handleUPIPayment}
                    disabled={!paymentMethod || processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold"
                  >
                    {processing ? 'Processing...' : `Complete Order ${paymentMethod ? '' : '(Select a payment method)'}`}
                  </Button>
                </div>

                <Link href={`/checkout?orderId=${order.id}`}>
                  <button className="w-full mt-3 text-blue-600 hover:text-blue-700 font-medium py-2">
                    Back to Checkout
                  </button>
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Order Summary</h3>

                <div className="space-y-2 text-sm mb-4 max-h-48 overflow-y-auto">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-gray-600">
                      <span>{item.quantity}x {item.productName || `Product ${item.productId}`}</span>
                      <span>₹{item.subtotal}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">₹{order.shippingCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (GST)</span>
                    <span className="font-medium">₹{Math.round(order.gstAmount)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">₹{Math.round(order.totalAmount)}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                  <p className="font-semibold mb-1">Order Number</p>
                  <p className="font-mono break-all">{order.orderNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
