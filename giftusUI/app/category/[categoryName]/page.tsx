'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

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
            {products.length} {products.length === 1 ? 'product' : 'products'} available
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-card rounded-lg border border-border overflow-hidden hover:border-foreground/20 transition-all duration-300 hover:shadow-lg"
              >
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden bg-muted">
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

                {/* Product Details */}
                <div className="p-6">
                  {/* Model No */}
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-foreground/80 transition-colors">
                        {product.modelNo}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  {product.shortDescription && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.shortDescription}
                    </p>
                  )}

                  {/* Variants */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Available Sizes:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.slice(0, 3).map((variant) => (
                          <span
                            key={variant.id}
                            className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground"
                          >
                            {variant.variantValue}
                          </span>
                        ))}
                        {product.variants.length > 3 && (
                          <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                            +{product.variants.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price & GST */}
                  <div className="mb-4 pb-4 border-t border-border">
                    {product.variants && product.variants.length > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground mt-2">
                          Starting from:{' '}
                          <span className="text-lg font-semibold text-foreground">
                            ₹{Math.min(...product.variants.map(v => v.price)).toLocaleString('en-IN')}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">
                        Price on request
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      GST: {product.gstPercent}%
                    </p>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/product/${product.id}`}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      </main>
      <Footer />
    </div>
  )
}
