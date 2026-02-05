import { Shield, Truck, Clock, BadgeCheck, Users, Headphones } from "lucide-react"

const features = [
  {
    name: "Premium Quality",
    description: "Finest materials and craftsmanship ensuring long-lasting products.",
    icon: BadgeCheck,
  },
  {
    name: "Custom Designs",
    description: "Tailored solutions to match your brand and vision perfectly.",
    icon: Shield,
  },
  {
    name: "Fast Delivery",
    description: "Quick turnaround times with reliable pan-India shipping.",
    icon: Truck,
  },
  {
    name: "On-Time Guarantee",
    description: "We understand deadlines. Your orders delivered when promised.",
    icon: Clock,
  },
  {
    name: "Bulk Order Experts",
    description: "Seamless handling of large corporate and institutional orders.",
    icon: Users,
  },
  {
    name: "Dedicated Support",
    description: "Expert guidance from design to delivery, every step of the way.",
    icon: Headphones,
  },
]

const clients = [
  "Tata Group",
  "Infosys",
  "HDFC Bank",
  "IIM Ahmedabad",
  "Delhi Public School",
  "Wipro",
]

export function WhyChoose() {
  return (
    <section id="why-us" className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 lg:mb-16">
          <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase mb-3">
            Why TrophyBazaar
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Trusted by India&apos;s Leading Organizations
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We combine quality, reliability, and exceptional service to deliver awards 
            that truly honor achievement.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {features.map((feature) => (
            <div key={feature.name} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <feature.icon className="h-5 w-5 text-foreground" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {feature.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Client Logos */}
        <div className="mt-16 pt-16 border-t border-border">
          <p className="text-sm font-medium text-muted-foreground text-center mb-8">
            Trusted by leading corporates and institutions
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-6">
            {clients.map((client) => (
              <span
                key={client}
                className="text-sm font-medium text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                {client}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
