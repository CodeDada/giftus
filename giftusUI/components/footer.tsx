import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

const navigation = {
  products: [
    { name: "Trophies", href: "/?category=trophies" },
    { name: "Awards", href: "/?category=awards" },
    { name: "Corporate Gifts", href: "/?category=corporate-gifts" },
    { name: "Medals", href: "/?category=medals" },
    { name: "Plaques", href: "/?category=plaques" },
  ],
  company: [
    { name: "About Us", href: "/#about" },
    { name: "Our Process", href: "/#about" },
    { name: "Bulk Orders", href: "/admin/bulk-upload" },
    { name: "Testimonials", href: "/#why-us" },
    { name: "Contact", href: "/#contact" },
  ],
  support: [
    { name: "Help Center", href: "/#contact" },
    { name: "Shipping Info", href: "/#about" },
    { name: "Returns", href: "/#about" },
    { name: "FAQs", href: "/#about" },
  ],
}

export function Footer() {
  return (
    <footer id="contact" className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand & Contact */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-semibold tracking-tight">
                TrophyBazaar
              </span>
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/70 max-w-xs leading-relaxed">
              India&apos;s trusted partner for premium custom trophies, awards, 
              and corporate gifts since 2008.
            </p>
            
            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <a
                href="tel:+919876543210"
                className="flex items-center gap-3 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                +91 98765 43210
              </a>
              <a
                href="mailto:hello@trophybazaar.in"
                className="flex items-center gap-3 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                hello@trophybazaar.in
              </a>
              <div className="flex items-start gap-3 text-sm text-primary-foreground/70">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  123 Industrial Area, Phase 2<br />
                  New Delhi, 110020
                </span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-semibold">Products</h3>
            <ul role="list" className="mt-4 space-y-3">
              {navigation.products.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul role="list" className="mt-4 space-y-3">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold">Support</h3>
            <ul role="list" className="mt-4 space-y-3">
              {navigation.support.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/50">
              &copy; {new Date().getFullYear()} TrophyBazaar. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-primary-foreground/50">
              <Link href="#" className="hover:text-primary-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-primary-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
