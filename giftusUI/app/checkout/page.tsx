'use client';

import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartContext, CartItem } from '@/lib/cartContext';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const cartContext = useContext(CartContext);
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!cartContext) {
    return <div>Loading...</div>;
  }

  const { items: cartItems, getTotalPrice } = cartContext;

  // Redirect to cart if empty on initial mount only
  useEffect(() => {
    if (cartItems.length === 0 && !loading) {
      const timer = setTimeout(() => {
        router.push('/cart');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const calculateTotals = () => {
    const subtotal = getTotalPrice() || 0;
    const shippingCost = 50;
    const gstRate = 18;
    // Ensure subtotal is a number before calculating
    const numSubtotal = typeof subtotal === 'string' ? parseFloat(subtotal) : subtotal;
    const gstAmount = isNaN(numSubtotal) ? 0 : (numSubtotal * gstRate) / 100;
    const totalAmount = numSubtotal + shippingCost + gstAmount;

    return {
      subtotal: numSubtotal,
      shippingCost,
      gstAmount,
      gstRate,
      totalAmount
    };
  };

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.customerEmail.trim() || !formData.customerEmail.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.customerPhone.trim() || formData.customerPhone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    if (!formData.deliveryAddress.trim()) {
      setError('Please enter your delivery address');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create order request
      const orderRequest = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        deliveryAddress: formData.deliveryAddress,
        shippingCost: 50,
        discountAmount: 0,
        items: cartItems.map((item: CartItem) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          modelNo: item.modelNo || '',
          variantValue: item.variantValue || '',
          price: item.price,
          quantity: item.quantity,
          gstRate: 18,
          notes: ''
        }))
      };

      // Call backend API to create order
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderResponse = await response.json();

      // Redirect to payment page instead of Razorpay
      router.push(`/payment?orderId=${orderResponse.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-xl font-semibold mb-6 text-gray-900">Delivery Information</h2>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <Input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      placeholder="Enter your 10-digit phone number"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <textarea
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleInputChange}
                      placeholder="Enter your complete delivery address"
                      rows={4}
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <h2 className="text-xl font-semibold mt-8 mb-6 text-gray-900">Order Items</h2>
                <div className="space-y-4">
                  {cartItems.map((item: CartItem) => (
                    <div key={item.id} className="flex justify-between items-center py-4 border-b">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Product #{item.productId}</h3>
                        {item.variantValue && (
                          <p className="text-sm text-gray-500">Variant: {item.variantValue}</p>
                        )}
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <h3 className="text-lg font-semibold mb-6 text-gray-900">Order Summary</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">₹{totals.shippingCost}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">GST ({totals.gstRate}%)</span>
                    <span className="font-medium text-gray-900">₹{Math.round(totals.gstAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-blue-600">₹{Math.round(totals.totalAmount).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={loading || cartItems.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4"
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </Button>

                <Link href="/cart" className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Back to Cart
                </Link>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    Choose your preferred payment method on the next page.
                  </p>
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
