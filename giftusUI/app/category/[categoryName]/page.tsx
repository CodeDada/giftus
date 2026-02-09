'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react'
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
}

export default function CategoryPage() {
  const params = useParams()
  const categoryName = params.categoryName as string
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})
  const { addToCart, items: cartItems } = useCart()

  // Initialize quantities from cart on component mount
  useEffect(() => {
    const initialQuantities: { [key: number]: number } = {}
    cartItems.forEach((cartItem) => {
      initialQuantities[cartItem.productId] = cartItem.quantity
    })
    setQuantities(initialQuantities)
  }, [cartItems])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        
        // Determine API URL based on environment
        const apiUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5056'
          : (process.env.NEXT_PUBLIC_API_URL || '');
        
        const response = await fetch(
          `${apiUrl}/api/products/category-by-name/${encodeURIComponent(categoryName)}`
        )
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`)
        }
        
        const data = await response.json()
        setProducts(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    if (categoryName) {
      fetchProducts()
    }
  }, [categoryName])

  // Separate products into in-stock and out-of-stock
  const inStockProducts = products.filter(p => 
    p.variants && p.variants.some(v => v.stockQty > 0)
  )
  const outOfStockProducts = products.filter(p => 
    !p.variants || p.variants.every(v => v.stockQty <= 0)
  )
  const sortedProducts = [...inStockProducts, ...outOfStockProducts]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-b from-background to-secondary/30 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/#products"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Link>
          
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {decodeURIComponent(categoryName)}
          </h1>
          <p className="text-lg text-muted-foreground">
            {inStockProducts.length} in stock, {outOfStockProducts.length} out of stock
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Products Grid */}
        {sortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedProducts.map((product) => {
              const hasStock = product.variants && product.variants.some(v => v.stockQty > 0)
              const minPrice = product.variants && product.variants.length > 0 
                ? Math.min(...product.variants.map(v => v.price)) 
                : 0
              const firstSize = product.variants && product.variants.length > 0 
                ? product.variants[0].variantValue 
                : 'N/A'
              
              return (
              <div
                key={product.id}
                className={`group bg-card rounded-lg border border-border overflow-hidden transition-all duration-300 ${
                  hasStock 
                    ? 'hover:border-foreground/20 hover:shadow-lg' 
                    : 'opacity-60'
                }`}
              >
                {/* Out of Stock Badge */}
                {!hasStock && (
                  <div className="absolute top-3 right-3 z-10 bg-destructive text-white text-xs font-bold px-3 py-1 rounded">
                    Out of Stock
                  </div>
                )}

                {/* Product Image - Clickable */}
                <Link href={`/product/${product.id}`}>
                  <div className="aspect-square relative overflow-hidden bg-muted cursor-pointer">
                    {product.baseImageUrl ? (
                      <Image
                        src={product.baseImageUrl}
                        alt={product.modelNo}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <span className="text-muted-foreground">No image</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Details */}
                <div className="p-4">
                  {/* Compact Info: Model No (Left) | Size (Right) */}
                  <div className="flex justify-between items-baseline gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {product.modelNo}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Size: {firstSize}
                    </span>
                  </div>
                  
                  {/* Price Line */}
                  <div className="mb-4">
                    <span className="text-sm font-bold text-primary">
                      ₹{minPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {!hasStock && (
                    <p className="text-xs text-destructive font-medium mb-3">No variants in stock</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {quantities[product.id] ? (
                      <div className="flex-1 flex items-center border border-border rounded-lg bg-primary/5">
                        <button
                          onClick={() => {
                            const newQty = quantities[product.id] - 1
                            const variant = product.variants && product.variants[0]
                            if (newQty <= 0) {
                              setQuantities({ ...quantities, [product.id]: 0 })
                            } else {
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
                              setQuantities({ ...quantities, [product.id]: newQty })
                            }
                          }}
                          className="px-2 py-1 hover:bg-secondary transition-colors rounded-l-lg"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="flex-1 text-center font-semibold text-primary text-sm">
                          {quantities[product.id]}
                        </span>
                        <button
                          onClick={() => {
                            const newQty = quantities[product.id] + 1
                            const variant = product.variants && product.variants[0]
                            if (variant && newQty <= variant.stockQty) {
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
                              setQuantities({ ...quantities, [product.id]: newQty })
                            }
                          }}
                          className="px-2 py-1 hover:bg-secondary transition-colors rounded-r-lg"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setQuantities({ ...quantities, [product.id]: 1 })
                          const variant = product.variants && product.variants[0]
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
                        disabled={!hasStock}
                        className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </button>
                    )}

                    <Link
                      href={`/product/${product.id}`}
                      className="flex-1 flex items-center justify-center gap-1 bg-secondary text-foreground py-2 rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}
        </div>
      </div>
      </main>
      <Footer />
    </div>
  )
}
