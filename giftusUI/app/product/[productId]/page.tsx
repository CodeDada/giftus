'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, ShoppingCart, Share2, Heart, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useCart } from '@/lib/cartContext'

interface ProductVariant {
  id: number
  variantName: string
  variantValue: string
  price: number
  stockQty: number
}

interface Product {
  id: number
  modelNo: string
  name: string
  shortDescription: string
  baseImageUrl: string
  gstPercent: number
  isCustomizable: boolean
  isActive: boolean
  variants: ProductVariant[]
  videoUrl?: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const { addToCart } = useCart()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(0)
  const [cartItems, setCartItems] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        
        // Determine API URL based on environment
        const apiUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5056'
          : (process.env.NEXT_PUBLIC_API_URL || '');
        
        const response = await fetch(
          `${apiUrl}/api/products/${productId}`
        )
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.statusText}`)
        }
        
        const data = await response.json()
        setProduct(data)
        
        // Set first variant as selected by default
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0])
        }
        
        setError(null)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleAddToCart = () => {
    if (!selectedVariant || !product || quantity <= 0) return

    const cartItemId = `${product.id}-${selectedVariant.id}`
    
    addToCart({
      id: cartItemId,
      productId: product.id,
      variantId: selectedVariant.id,
      modelNo: product.modelNo,
      variantValue: selectedVariant.variantValue,
      price: selectedVariant.price,
      quantity: quantity,
      baseImageUrl: product.baseImageUrl,
    })
    
    // Reset quantity
    setQuantity(0)
  }

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 0) return
    setQuantity(newQty)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading product details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="bg-gradient-to-b from-background to-secondary/30 py-12">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <Link 
                href="/#products"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-destructive">{error || 'Product not found'}</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

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
              Back to Products
            </Link>

            {/* Product Detail Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Section */}
              <div className="flex flex-col gap-4">
                <div className="aspect-square relative overflow-hidden bg-muted rounded-lg border border-border">
                  {product.baseImageUrl ? (
                    <Image
                      src={product.baseImageUrl}
                      alt={product.modelNo}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <span className="text-muted-foreground">No image available</span>
                    </div>
                  )}
                </div>
                
                {/* Video Link (if available) */}
                {product.videoUrl && (
                  <a 
                    href={product.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 p-3 bg-secondary hover:bg-secondary/80 rounded-lg text-foreground transition-colors"
                  >
                    <span>📹 View Product Video</span>
                  </a>
                )}
              </div>

              {/* Details Section */}
              <div className="flex flex-col gap-6">
                {/* Title & Model */}
                <div>
                  <p className="text-sm font-medium text-primary mb-2">Model: {product.modelNo}</p>
                  <h1 className="text-4xl font-bold text-foreground mb-2">{product.name}</h1>
                  {product.shortDescription && (
                    <p className="text-lg text-muted-foreground">{product.shortDescription}</p>
                  )}
                </div>

                {/* Variants/Sizes Section */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Available Sizes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {product.variants && product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedVariant?.id === variant.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-foreground/20'
                        }`}
                      >
                        <div className="text-sm font-medium text-foreground">{variant.variantValue}</div>
                        <div className="text-lg font-bold text-primary">₹{variant.price.toLocaleString('en-IN')}</div>
                        <div className={`text-xs mt-1 ${variant.stockQty > 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {variant.stockQty > 0 ? `${variant.stockQty} in stock` : 'Out of stock'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Variant Details */}
                {selectedVariant && (
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Size</p>
                        <p className="text-lg font-semibold text-foreground">{selectedVariant.variantValue}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Price</p>
                        <p className="text-lg font-semibold text-foreground">₹{selectedVariant.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                )}



                {/* Product Info */}
                <div className="border-t border-border pt-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">GST Rate</p>
                      <p className="text-lg font-semibold text-foreground">{product.gstPercent}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Customizable</p>
                      <p className="text-lg font-semibold text-foreground">{product.isCustomizable ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  {quantity > 0 ? (
                    <>
                      <div className="flex-1 flex items-center border border-border rounded-lg bg-primary/5">
                        <button
                          onClick={() => {
                            const newQty = quantity - 1
                            if (newQty <= 0) {
                              handleQuantityChange(0)
                            } else {
                              const variant = selectedVariant
                              if (variant) {
                                addToCart({
                                  id: `${product.id}-${variant.id}`,
                                  productId: product.id,
                                  variantId: variant.id,
                                  modelNo: product.modelNo,
                                  variantValue: variant.variantValue,
                                  price: variant.price,
                                  quantity: -1,
                                  baseImageUrl: product.baseImageUrl,
                                })
                              }
                              handleQuantityChange(newQty)
                            }
                          }}
                          className="px-3 py-2 hover:bg-secondary transition-colors rounded-l-lg"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="flex-1 text-center font-semibold text-primary">
                          {quantity}
                        </span>
                        <button
                          onClick={() => {
                            const newQty = quantity + 1
                            const variant = selectedVariant
                            if (variant) {
                              addToCart({
                                id: `${product.id}-${variant.id}`,
                                productId: product.id,
                                variantId: variant.id,
                                modelNo: product.modelNo,
                                variantValue: variant.variantValue,
                                price: variant.price,
                                quantity: 1,
                                baseImageUrl: product.baseImageUrl,
                              })
                            }
                            handleQuantityChange(newQty)
                          }}
                          className="px-3 py-2 hover:bg-secondary transition-colors rounded-r-lg"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => router.push('/cart')}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      >
                        Proceed to Checkout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          handleQuantityChange(1)
                          const variant = selectedVariant
                          if (variant) {
                            addToCart({
                              id: `${product.id}-${variant.id}`,
                              productId: product.id,
                              variantId: variant.id,
                              modelNo: product.modelNo,
                              variantValue: variant.variantValue,
                              price: variant.price,
                              quantity: 1,
                              baseImageUrl: product.baseImageUrl,
                            })
                          }
                        }}
                        disabled={!selectedVariant || selectedVariant.stockQty <= 0}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        Add to Cart
                      </button>
                      <button className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-secondary transition-colors">
                        <Heart className="h-5 w-5" />
                      </button>
                      <button className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-secondary transition-colors">
                        <Share2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Additional Info Section - Placeholder */}
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Additional Information</h3>
                  <div className="space-y-3 text-muted-foreground text-sm">
                    <p>• Premium quality craftsmanship</p>
                    <p>• Durable and long-lasting materials</p>
                    <p>• Perfect for corporate gifting</p>
                    <p className="text-xs italic">More details to be finalized...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
