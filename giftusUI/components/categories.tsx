import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const categories = [
  {
    name: "WOODEN_METAL_TROPHY",
    displayName: "Wooden & Metal Trophies",
    description: "Classic cups, figurines, and custom designs for sports, corporate events, and competitions.",
    image: "/images/trophy.jpg",
    count: "120+ designs",
  },
  {
    name: "CRYSTAL_TROPHY",
    displayName: "Crystal Trophy",
    description: "Crystal, acrylic, and wooden plaques for employee recognition and special achievements.",
    image: "/images/award.jpg",
    count: "85+ designs",
  },
  {
    name: "MEDALS",
    displayName: "Medals",
    description: "Personalized corporate gifts, medals, and mementos for every occasion.",
    image: "/images/gifts.jpg",
    count: "200+ items",
  },
]

export function Categories() {
  return (
    <section id="products" className="bg-secondary/50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase mb-3">
            Our Products
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Explore Our Categories
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Premium quality products crafted with precision and care for every celebration.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/category/${encodeURIComponent(category.name)}`}
              className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-foreground/20 transition-all duration-300"
            >
              {/* Image */}
              <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.displayName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-foreground/80 transition-colors">
                      {category.displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.count}
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
