"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

const sliderImages = [
  {
    src: "/images/hero-awards.jpg",
    alt: "Premium collection of golden trophies and crystal awards",
  },
  {
    src: "/images/slider-crystal.jpg",
    alt: "Elegant crystal glass awards and plaques",
  },
  {
    src: "/images/slider-sports.jpg",
    alt: "Sports trophies and medals for competitions",
  },
  {
    src: "/images/slider-corporate.jpg",
    alt: "Corporate gifts and personalized awards",
  },
]

export function Hero() {
  return (
    <section className="relative px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 bg-background">
      {/* Slider with padding */}
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {sliderImages.map((image, index) => (
            <CarouselItem key={index} className="pl-0">
              <div className="relative h-[60vh] min-h-[450px] max-h-[700px] w-full rounded-xl overflow-hidden">
                <Image
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-foreground/50" />
                
                {/* Content overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="mx-auto max-w-4xl px-6 text-center">
                    <p className="text-sm font-medium tracking-wider text-background/80 uppercase mb-4">
                      India&apos;s Trusted Awards Partner
                    </p>
                    <h1 className="text-4xl font-semibold tracking-tight text-background sm:text-5xl lg:text-6xl xl:text-7xl text-balance leading-tight">
                      Custom Trophies & Awards for Every Achievement
                    </h1>
                    <p className="mt-6 text-lg leading-relaxed text-background/90 max-w-2xl mx-auto">
                      From corporate recognitions to school ceremonies, we craft premium quality 
                      trophies and awards that celebrate excellence.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                      <Button size="lg" className="gap-2 bg-background text-foreground hover:bg-background/90">
                        Explore Products
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="lg" className="border-background text-background hover:bg-background/10 bg-transparent">
                        Request Bulk Quote
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 sm:left-8 bg-background/80 hover:bg-background border-0 h-10 w-10 sm:h-12 sm:w-12" />
        <CarouselNext className="right-4 sm:right-8 bg-background/80 hover:bg-background border-0 h-10 w-10 sm:h-12 sm:w-12" />
      </Carousel>

      {/* Trust indicators bar */}
      <div className="bg-secondary border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-xl">500+</span>
              <span>Happy Clients</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-xl">15+</span>
              <span>Years Experience</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-xl">50K+</span>
              <span>Awards Delivered</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
