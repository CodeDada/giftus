'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useCart, CartItem } from '@/lib/cartContext'

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="bg-gradient-to-b from-background to-secondary/30 py-12">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <p className="text-muted-foreground">Loading cart...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const totalPrice = getTotalPrice()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-b from-background to-secondary/30 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/* Back Button */}
            <Link 
              href="/#products"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>

            <h1 className="text-4xl font-bold text-foreground mb-8">Shopping Cart</h1>

            {items.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">Your cart is empty</p>
                <Link 
                  href="/#products"
                  className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <CartItemRow 
                        key={item.id}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                    <h2 className="text-2xl font-bold text-foreground mb-6">Order Summary</h2>

                    {/* Totals */}
                    <div className="space-y-3 border-b border-border pb-4 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium text-foreground">
                          ₹{totalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping:</span>
                        <span className="font-medium text-foreground">Free</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (estimated):</span>
                        <span className="font-medium text-foreground">
                          ₹{Math.round(totalPrice * 0.18).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between text-lg font-bold text-foreground mb-6">
                      <span>Total:</span>
                      <span>
                        ₹{Math.round(totalPrice * 1.18).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Checkout Button */}
                    <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold mb-3">
                      Proceed to Checkout
                    </button>

                    {/* Continue Shopping */}
                    <Link
                      href="/#products"
                      className="block w-full text-center border border-border text-foreground py-3 rounded-lg hover:bg-secondary transition-colors font-medium"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function CartItemRow({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}: { 
  item: CartItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex gap-4">
      {/* Product Image */}
      <div className="w-24 h-24 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {item.baseImageUrl ? (
          <Image
            src={item.baseImageUrl}
            alt={item.modelNo}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <span className="text-xs text-muted-foreground text-center px-2">No image</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-foreground">{item.modelNo}</p>
            <p className="text-sm text-muted-foreground">Size: {item.variantValue}</p>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="p-1 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        {/* Price and Quantity */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Unit Price: ₹{item.price.toLocaleString('en-IN')}</p>
            <p className="font-semibold text-foreground">
              Total: ₹{(item.price * item.quantity).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center border border-border rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="p-1 hover:bg-secondary transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
              className="w-10 text-center border-0 bg-transparent font-medium focus:outline-none"
            />
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="p-1 hover:bg-secondary transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
